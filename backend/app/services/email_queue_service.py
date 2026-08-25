"""Email queue service - publishes email jobs to Supabase email_job_queue."""
import json
from typing import Any, Optional
from uuid import UUID

from app.database import get_supabase


def enqueue_job(
    payload: dict[str, Any],
    max_attempts: int = 3,
    scheduled_at: Optional[str] = None
) -> Optional[str]:
    """
    Publish an email job to the queue.
    
    Args:
        payload: Job payload (contains notification_type, booking_id, recipient_id, etc.)
        max_attempts: Maximum retry attempts (default: 3)
        scheduled_at: ISO timestamp for when to process (default: now)
    
    Returns:
        Job ID (uuid string) if successful, None if failed
    """
    db = get_supabase()
    
    try:
        result = db.table("email_job_queue").insert({
            "payload": payload,
            "status": "pending",
            "max_attempts": max_attempts,
            "scheduled_at": scheduled_at,
        }).execute()
        
        if result.data and len(result.data) > 0:
            return result.data[0]["id"]
        return None
    except Exception as e:
        print(f"[email_queue] Failed to enqueue job: {e}")
        return None


def get_queue_stats() -> dict[str, Any]:
    """
    Get queue statistics (admin).
    
    Returns:
        Dict with counts by status
    """
    db = get_supabase()
    
    try:
        result = db.rpc("get_email_queue_stats").execute()
        return result.data or {}
    except Exception as e:
        print(f"[email_queue] Failed to get stats: {e}")
        return {}


def requeue_dead_letter_jobs(max_jobs: int = 100) -> int:
    """
    Requeue dead letter jobs (admin action).
    
    Args:
        max_jobs: Maximum number of jobs to requeue
    
    Returns:
        Number of jobs requeued
    """
    db = get_supabase()
    
    try:
        result = db.rpc("requeue_dead_letter_jobs", {"max_jobs": max_jobs}).execute()
        return result.data if result.data else 0
    except Exception as e:
        print(f"[email_queue] Failed to requeue dead letter jobs: {e}")
        return 0


def cleanup_old_jobs(retention_days: int = 30) -> int:
    """
    Clean up old completed/dead letter jobs (admin action).
    
    Args:
        retention_days: Keep jobs newer than this many days
    
    Returns:
        Number of jobs deleted
    """
    db = get_supabase()
    
    try:
        result = db.rpc("cleanup_email_jobs", {"retention_days": retention_days}).execute()
        return result.data if result.data else 0
    except Exception as e:
        print(f"[email_queue] Failed to cleanup old jobs: {e}")
        return 0
