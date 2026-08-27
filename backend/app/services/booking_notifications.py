"""Booking notification service - builds emails and enqueues to Supabase Queue."""
import json
from datetime import datetime
from typing import Optional
from uuid import UUID

from app.database import get_supabase
from app.services.email_templates import render_template
from app.email import email_service
from app.services.email_queue_service import enqueue_job
from app.config import settings


# Notification type to template mapping
NOTIFICATION_TEMPLATES = {
    "booking_created": {
        "customer": "booking_created",
        "admin": "admin_new_booking",
    },
    "booking_assigned": {
        "customer": "plumber_assigned_customer",
    },
    "plumber_job_assigned": {
        "plumber": "plumber_job_assigned",
    },
    "booking_scheduled": {
        "customer": "booking_scheduled",
        "plumber": "booking_scheduled",
    },
    "booking_rescheduled": {
        "customer": "booking_scheduled",
        "plumber": "booking_scheduled",
    },
    "plumber_accepted": {
        "customer": "plumber_accepted",
    },
    "plumber_en_route": {
        "customer": "plumber_en_route",
    },
    "plumber_arrived": {
        "customer": "plumber_arrived",
    },
    "booking_completed": {
        "customer": "booking_completed",
    },
    "additional_work_requested": {
        "customer": "additional_work_requested",
    },
    "additional_work_approved": {
        "plumber": "additional_work_approved",
    },
    "additional_work_rejected": {
        "plumber": "additional_work_rejected",
    },
}


def _get_priority_color(urgency: str) -> str:
    """Get color for priority badge."""
    colors = {
        "low": "#22c55e",
        "medium": "#3b82f6",
        "high": "#f59e0b",
        "emergency": "#ef4444",
    }
    return colors.get(urgency, "#6b7280")


def _format_datetime(dt: Optional[datetime]) -> tuple[str, str]:
    """Format datetime for display. Returns (date_str, time_str)."""
    if not dt:
        return "TBD", "TBD"
    return dt.strftime("%b %d, %Y"), dt.strftime("%I:%M %p")


def _build_booking_created_context(booking: dict, customer: dict, is_admin: bool = False) -> dict:
    """Build context for booking_created notification."""
    pref_date = booking.get("preferred_date")
    pref_start = booking.get("preferred_start_time")
    pref_end = booking.get("preferred_end_time")

    requested_date = "Not specified"
    requested_time = "Not specified"
    if pref_date and pref_start:
        try:
            d = datetime.fromisoformat(str(pref_date)).strftime("%b %d, %Y")
            s = str(pref_start)[:5]
            e = str(pref_end)[:5] if pref_end else ""
            requested_date = d
            requested_time = f"{s} - {e}" if e else s
        except Exception:
            pass

    ai_diag = booking.get("ai_diagnosis") or {}
    ai_summary = ai_diag.get("summary") or ai_diag.get("problem_summary")

    required_skills = ""
    if ai_diag.get("required_skills"):
        required_skills = ", ".join(ai_diag["required_skills"])

    return {
        "booking_id": str(booking["id"]),
        "booking_number": booking.get("booking_number", ""),
        "customer_name": customer.get("name") or "Customer",
        "customer_email": customer.get("email") or "",
        "service_type": booking.get("service_type", ""),
        "problem_description": booking.get("description", "No description provided"),
        "requested_date": requested_date,
        "requested_time": requested_time,
        "address": booking.get("address", "Not specified"),
        "priority": (booking.get("urgency") or "medium").title(),
        "priority_color": _get_priority_color(booking.get("urgency") or "medium"),
        "status": (booking.get("status") or "pending").replace("_", " ").title(),
        "ai_diagnosis_summary": ai_summary,
        "required_skills": required_skills,
    }


def _build_plumber_assigned_context(booking: dict, customer: dict, plumber: dict, start_dt: Optional[datetime], end_dt: Optional[datetime]) -> dict:
    """Build context for plumber assigned notification (customer)."""
    scheduled_date, scheduled_time = _format_datetime(start_dt)
    return {
        "booking_id": str(booking["id"]),
        "booking_number": booking.get("booking_number", ""),
        "customer_name": customer.get("name") or "Customer",
        "plumber_name": plumber.get("name") or "Your Plumber",
        "service_type": booking.get("service_type", ""),
        "scheduled_date": scheduled_date,
        "scheduled_time": scheduled_time,
        "status": "Assigned",
    }


def _build_plumber_job_assigned_context(booking: dict, plumber: dict, customer: dict, work_order: dict, start_dt: Optional[datetime], end_dt: Optional[datetime]) -> dict:
    """Build context for job assigned notification (plumber)."""
    scheduled_date, scheduled_time = _format_datetime(start_dt)
    ai_diag = booking.get("ai_diagnosis") or {}
    required_skills = ""
    if ai_diag.get("required_skills"):
        required_skills = ", ".join(ai_diag["required_skills"])

    return {
        "booking_id": str(booking["id"]),
        "booking_number": booking.get("booking_number", ""),
        "plumber_name": plumber.get("name") or "Plumber",
        "customer_name": customer.get("name") or "Customer",
        "service_type": booking.get("service_type", ""),
        "problem_description": booking.get("description", "No description provided"),
        "address": booking.get("address", "Not specified"),
        "priority": (booking.get("urgency") or "medium").title(),
        "priority_color": _get_priority_color(booking.get("urgency") or "medium"),
        "scheduled_date": scheduled_date,
        "scheduled_time": scheduled_time,
        "required_skills": required_skills,
        "work_info": work_order.get("description") if work_order else None,
    }


def _build_scheduled_context(booking: dict, recipient: dict, start_dt: Optional[datetime], end_dt: Optional[datetime], plumber: Optional[dict], is_reschedule: bool, recipient_type: str) -> dict:
    """Build context for scheduled/rescheduled notification."""
    scheduled_date, scheduled_time = _format_datetime(start_dt)
    action = "Rescheduled" if is_reschedule else "Scheduled"
    action_text = f"Your booking has been {action.lower()}"

    dashboard_path = "account/bookings" if recipient_type == "customer" else "plumber/jobs"

    return {
        "booking_id": str(booking["id"]),
        "booking_number": booking.get("booking_number", ""),
        "recipient_name": recipient.get("name") or "Customer",
        "service_type": booking.get("service_type", ""),
        "action_text": action_text,
        "scheduled_label": f"{action} For",
        "scheduled_date": scheduled_date,
        "scheduled_time": scheduled_time,
        "address": booking.get("address", "Not specified"),
        "plumber_name": plumber.get("name") if plumber else None,
        "dashboard_path": dashboard_path,
    }


def _build_status_context(booking: dict, customer: dict, plumber: dict, start_dt: Optional[datetime], status: str) -> dict:
    """Build context for status notifications (accepted, en_route, arrived)."""
    scheduled_date, scheduled_time = _format_datetime(start_dt)
    return {
        "booking_id": str(booking["id"]),
        "booking_number": booking.get("booking_number", ""),
        "customer_name": customer.get("name") or "Customer",
        "plumber_name": plumber.get("name") or "Your Plumber",
        "service_type": booking.get("service_type", ""),
        "address": booking.get("address", "Not specified"),
        "scheduled_date": scheduled_date,
        "scheduled_time": scheduled_time,
        "status": status.replace("_", " ").title(),
    }


def _build_completed_context(booking: dict, customer: dict, plumber: dict, work_order: dict, completed_dt: Optional[datetime]) -> dict:
    """Build context for booking completed notification."""
    completed_date, completed_time = _format_datetime(completed_dt)

    # Build work summary from work_order
    work_summary = work_order.get("completion_notes") or "Work completed successfully."
    materials = ""
    labor = ""
    total_amount = ""

    if work_order:
        # These would come from the work order detail
        pass

    return {
        "booking_id": str(booking["id"]),
        "booking_number": booking.get("booking_number", ""),
        "customer_name": customer.get("name") or "Customer",
        "plumber_name": plumber.get("name") or "Plumber",
        "service_type": booking.get("service_type", ""),
        "completed_date": completed_date,
        "completed_time": completed_time,
        "status": "Completed",
        "work_summary": work_summary,
        "materials": materials,
        "labor": labor,
        "total_amount": total_amount,
    }


def _build_additional_work_context(booking: dict, customer: dict, plumber: dict, request: dict) -> dict:
    """Build context for additional work requested notification."""
    return {
        "booking_id": str(booking["id"]),
        "booking_number": booking.get("booking_number", ""),
        "customer_name": customer.get("name") or "Customer",
        "plumber_name": plumber.get("name") or "Your Plumber",
        "original_service": booking.get("service_type", ""),
        "additional_work": request.get("description", ""),
        "reason": "Additional work needed to complete the job properly.",
        "materials": "As specified in request",
        "labor": "As specified in request",
        "estimated_total": f"{request.get('estimated_cost', 0):,.2f}",
        "request_id": str(request["id"]),
    }


def _build_additional_work_decision_context(booking: dict, plumber: dict, request: dict, approved: bool, rejection_reason: str = "") -> dict:
    """Build context for additional work approved/rejected notification."""
    return {
        "booking_id": str(booking["id"]),
        "booking_number": booking.get("booking_number", ""),
        "plumber_name": plumber.get("name") or "Plumber",
        "additional_work": request.get("description", ""),
        "approved_amount": f"{request.get('estimated_cost', 0):,.2f}",
        "rejection_reason": rejection_reason,
    }


CONTEXT_BUILDERS = {
    "booking_created": lambda b, c, p, wo, s, e, r, req, is_admin=False: _build_booking_created_context(b, c, is_admin),
    "booking_assigned": lambda b, c, p, wo, s, e, r, req: _build_plumber_assigned_context(b, c, p, s, e),
    "plumber_job_assigned": lambda b, c, p, wo, s, e, r, req: _build_plumber_job_assigned_context(b, p, c, wo, s, e),
    "booking_scheduled": lambda b, c, p, wo, s, e, r, req, is_reschedule=False, recipient_type="customer": _build_scheduled_context(b, r, s, e, p, is_reschedule, recipient_type),
    "booking_rescheduled": lambda b, c, p, wo, s, e, r, req, is_reschedule=True, recipient_type="customer": _build_scheduled_context(b, r, s, e, p, is_reschedule, recipient_type),
    "plumber_accepted": lambda b, c, p, wo, s, e, r, req: _build_status_context(b, c, p, s, "accepted"),
    "plumber_en_route": lambda b, c, p, wo, s, e, r, req: _build_status_context(b, c, p, s, "en_route"),
    "plumber_arrived": lambda b, c, p, wo, s, e, r, req: _build_status_context(b, c, p, s, "arrived"),
    "booking_completed": lambda b, c, p, wo, s, e, r, req: _build_completed_context(b, c, p, wo, e),
    "additional_work_requested": lambda b, c, p, wo, s, e, r, req: _build_additional_work_context(b, c, p, req),
    "additional_work_approved": lambda b, c, p, wo, s, e, r, req: _build_additional_work_decision_context(b, p, req, True),
    "additional_work_rejected": lambda b, c, p, wo, s, e, r, req: _build_additional_work_decision_context(b, p, req, False, req.get("rejection_reason", "")),
}


async def enqueue_notification(
    notification_type: str,
    booking_id: str,
    recipient_type: str,  # "customer", "plumber", "admin"
    recipient_id: str,
    **kwargs
) -> bool:
    """
    Build email and enqueue to Supabase email_job_queue.
    Returns True if enqueued successfully.
    """
    db = get_supabase()

    # Fetch required data
    booking_res = db.table("bookings").select("*").eq("id", booking_id).execute()
    if not booking_res.data:
        return False
    booking = booking_res.data[0]

    # Fetch recipient data based on type
    customer = None
    plumber = None
    work_order = None
    additional_request = None

    if recipient_type == "customer":
        cust_res = db.table("customers").select("*").eq("id", booking["customer_id"]).execute()
        customer = cust_res.data[0] if cust_res.data else {}
        if not customer.get("email"):
            prof = db.table("profiles").select("email,name").eq("id", booking["customer_id"]).single().execute()
            if prof.data:
                customer = {**customer, **prof.data}
    elif recipient_type == "plumber":
        plumb_res = db.table("plumbers").select("*").eq("id", recipient_id).execute()
        plumber = plumb_res.data[0] if plumb_res.data else {}
        if not plumber.get("email"):
            prof = db.table("profiles").select("email,name").eq("id", recipient_id).single().execute()
            if prof.data:
                plumber = {**plumber, **prof.data}
    elif recipient_type == "admin":
        # Admin notifications go to configured admin emails
        pass

    # Fetch work order if needed
    if booking.get("assigned_plumber_id"):
        wo_res = db.table("work_orders").select("*").eq("booking_id", booking_id).execute()
        work_order = wo_res.data[0] if wo_res.data else None

    # Fetch additional work request if needed
    if notification_type in ("additional_work_requested", "additional_work_approved", "additional_work_rejected"):
        req_id = kwargs.get("request_id")
        if req_id:
            req_res = db.table("additional_work_requests").select("*").eq("id", req_id).execute()
            additional_request = req_res.data[0] if req_res.data else None

    # Build context
    builder = CONTEXT_BUILDERS.get(notification_type)
    if not builder:
        return False

    context = builder(
        booking,
        customer or {},
        plumber or {},
        work_order or {},
        kwargs.get("start_dt"),
        kwargs.get("end_dt"),
        kwargs.get("recipient"),
        additional_request or {}
    )

    # Get template name
    template_map = NOTIFICATION_TEMPLATES.get(notification_type, {})
    template_name = template_map.get(recipient_type)
    if not template_name:
        return False

    # Render templates
    try:
        html_content, text_content = render_template(template_name, context)
    except Exception as e:
        print(f"Template render error: {e}")
        return False

    # Determine subject
    subjects = {
        "booking_created": f"Your {settings.email_from_name} booking has been received",
        "admin_new_booking": f"New booking: {booking.get('booking_number', '')}",
        "booking_assigned": f"Your plumber has been assigned - {booking.get('booking_number', '')}",
        "plumber_job_assigned": f"New job assigned - {booking.get('booking_number', '')}",
        "booking_scheduled": f"Visit scheduled - {booking.get('booking_number', '')}",
        "booking_rescheduled": f"Visit rescheduled - {booking.get('booking_number', '')}",
        "plumber_accepted": f"Plumber accepted job - {booking.get('booking_number', '')}",
        "plumber_en_route": f"Your plumber is on the way - {booking.get('booking_number', '')}",
        "plumber_arrived": f"Your plumber has arrived - {booking.get('booking_number', '')}",
        "booking_completed": f"Job completed - {booking.get('booking_number', '')}",
        "additional_work_requested": f"Additional work requested - {booking.get('booking_number', '')}",
        "additional_work_approved": f"Additional work approved - {booking.get('booking_number', '')}",
        "additional_work_rejected": f"Additional work rejected - {booking.get('booking_number', '')}",
    }
    subject = subjects.get(notification_type, f"Notification - {booking.get('booking_number', '')}")

    # Create idempotency record (email_notifications table)
    try:
        notif_data = {
            "booking_id": booking_id,
            "recipient_type": recipient_type,
            "recipient_id": recipient_id,
            "notification_type": notification_type,
            "subject": subject,
            "html_content": html_content,
            "text_content": text_content,
            "provider": settings.email_provider,
            "status": "queued",
        }
        db.table("email_notifications").upsert(notif_data, on_conflict="booking_id,notification_type,recipient_id").execute()
    except Exception as e:
        print(f"Email notification record error: {e}")
        # Continue anyway - queue the job

    # Enqueue job via queue service
    payload = {
        "notification_type": notification_type,
        "booking_id": booking_id,
        "recipient_type": recipient_type,
        "recipient_id": recipient_id,
        "subject": subject,
        "html_content": html_content,
        "text_content": text_content,
        "recipient_email": _get_recipient_email(recipient_type, customer, plumber, booking),
    }

    try:
        job_id = enqueue_job(payload, max_attempts=3)
        return job_id is not None
    except Exception as e:
        print(f"Queue service error: {e}")
        return False


def _get_recipient_email(recipient_type: str, customer: dict, plumber: dict, booking: dict) -> str:
    """Get recipient email address."""
    if recipient_type == "customer":
        return customer.get("email") or ""
    elif recipient_type == "plumber":
        return plumber.get("email") or ""
    elif recipient_type == "admin":
        return settings.admin_notification_email_list[0] if settings.admin_notification_email_list else ""
    return ""


# Convenience functions for each notification type
async def notify_booking_created(booking_id: str) -> bool:
    """Notify customer and admins of new booking."""
    db = get_supabase()
    booking_res = db.table("bookings").select("*").eq("id", booking_id).execute()
    if not booking_res.data:
        return False
    booking = booking_res.data[0]

    # Customer notification
    await enqueue_notification("booking_created", booking_id, "customer", booking["customer_id"])

    # Admin notifications
    for admin_email in settings.admin_notification_email_list:
        await enqueue_notification("booking_created", booking_id, "admin", admin_email)

    return True


async def notify_booking_assigned(booking_id: str, plumber_id: str, start_dt, end_dt) -> bool:
    """Notify customer and plumber of assignment."""
    await enqueue_notification("booking_assigned", booking_id, "customer", booking_id, start_dt=start_dt, end_dt=end_dt)
    await enqueue_notification("plumber_job_assigned", booking_id, "plumber", plumber_id, start_dt=start_dt, end_dt=end_dt)
    return True


async def notify_booking_scheduled(booking_id: str, start_dt, end_dt, is_reschedule: bool = False) -> bool:
    """Notify customer and plumber of scheduling."""
    db = get_supabase()
    booking_res = db.table("bookings").select("*").eq("id", booking_id).execute()
    if not booking_res.data:
        return False
    booking = booking_res.data[0]

    await enqueue_notification(
        "booking_rescheduled" if is_reschedule else "booking_scheduled",
        booking_id, "customer", booking["customer_id"],
        start_dt=start_dt, end_dt=end_dt, is_reschedule=is_reschedule
    )

    if booking.get("assigned_plumber_id"):
        await enqueue_notification(
            "booking_rescheduled" if is_reschedule else "booking_scheduled",
            booking_id, "plumber", booking["assigned_plumber_id"],
            start_dt=start_dt, end_dt=end_dt, is_reschedule=is_reschedule
        )
    return True


async def notify_plumber_accepted(booking_id: str) -> bool:
    """Notify customer plumber accepted."""
    db = get_supabase()
    booking_res = db.table("bookings").select("*").eq("id", booking_id).execute()
    if not booking_res.data:
        return False
    booking = booking_res.data[0]
    await enqueue_notification("plumber_accepted", booking_id, "customer", booking["customer_id"])
    return True


async def notify_plumber_en_route(booking_id: str) -> bool:
    """Notify customer plumber en route."""
    db = get_supabase()
    booking_res = db.table("bookings").select("*").eq("id", booking_id).execute()
    if not booking_res.data:
        return False
    booking = booking_res.data[0]
    await enqueue_notification("plumber_en_route", booking_id, "customer", booking["customer_id"])
    return True


async def notify_plumber_arrived(booking_id: str) -> bool:
    """Notify customer plumber arrived."""
    db = get_supabase()
    booking_res = db.table("bookings").select("*").eq("id", booking_id).execute()
    if not booking_res.data:
        return False
    booking = booking_res.data[0]
    await enqueue_notification("plumber_arrived", booking_id, "customer", booking["customer_id"])
    return True


async def notify_booking_completed(booking_id: str) -> bool:
    """Notify customer job completed."""
    db = get_supabase()
    booking_res = db.table("bookings").select("*").eq("id", booking_id).execute()
    if not booking_res.data:
        return False
    booking = booking_res.data[0]
    await enqueue_notification("booking_completed", booking_id, "customer", booking["customer_id"])
    return True


async def notify_additional_work_requested(booking_id: str, request_id: str) -> bool:
    """Notify customer of additional work request."""
    db = get_supabase()
    booking_res = db.table("bookings").select("*").eq("id", booking_id).execute()
    if not booking_res.data:
        return False
    booking = booking_res.data[0]
    await enqueue_notification("additional_work_requested", booking_id, "customer", booking["customer_id"], request_id=request_id)
    return True


async def notify_additional_work_decision(booking_id: str, request_id: str, approved: bool) -> bool:
    """Notify plumber of additional work decision."""
    db = get_supabase()
    req_res = db.table("additional_work_requests").select("*").eq("id", request_id).execute()
    if not req_res.data:
        return False
    request = req_res.data[0]

    wo_res = db.table("work_orders").select("*").eq("booking_id", booking_id).execute()
    plumber_id = wo_res.data[0]["assigned_plumber_id"] if wo_res.data else None
    if not plumber_id:
        return False

    await enqueue_notification(
        "additional_work_approved" if approved else "additional_work_rejected",
        booking_id, "plumber", plumber_id, request_id=request_id
    )
    return True