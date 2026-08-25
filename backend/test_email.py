from app.services import email_queue_service
payload = {
    'notification_type': 'booking_created',
    'booking_id': '550e8400-e29b-41d4-a716-446655440000',
    'recipient_type': 'customer',
    'recipient_id': '660e8400-e29b-41d4-a716-446655440000',
    'subject': 'Test Booking Confirmation',
    'html_content': '<p>Your booking is confirmed!</p>',
    'text_content': 'Your booking is confirmed!',
    'recipient_email': 'test@example.com'
}
job_id = email_queue_service.enqueue_job(payload)
print(job_id)