"""
Enhanced Notification Service - Sprint 2
Handles sending notifications via different channels with templates and retry logic
"""
import logging
from datetime import datetime
from typing import List, Optional, Dict
from sqlalchemy.orm import Session
from app.models.notification import Notification
from app.models.customer import Customer
from app.utils.enums import NotificationChannel, NotificationStatus
from app.utils.exceptions import CustomerNotFoundException, NotificationFailedException

logger = logging.getLogger(__name__)

class NotificationService:
    """
    Enhanced service for sending notifications with templates and error handling
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.max_retries = 3
    
    def get_notification_template(self, template_type: str, **kwargs) -> str:
        """
        Generate notification message from templates
        """
        templates = {
            "payment_reminder": (
                "Dear {name}, your bill of ₹{amount:.2f} is overdue by {days} days. "
                "Please pay to avoid service disruption. Due date: {due_date}"
            ),
            "data_throttle": (
                "Dear {name}, due to payment delay of {days} days, your data speed has been reduced. "
                "Outstanding: ₹{amount:.2f}. Pay now to restore full speed."
            ),
            "service_barred": (
                "URGENT: {name}, your outgoing services have been barred due to {days} days overdue payment. "
                "Amount: ₹{amount:.2f}. Pay immediately to restore services."
            ),
            "final_notice": (
                "FINAL NOTICE: {name}, your service will be suspended. "
                "Outstanding: ₹{amount:.2f} for {days} days. Immediate payment required."
            ),
            "payment_success": (
                "Dear {name}, thank you for your payment of ₹{amount:.2f}. "
                "{message}"
            ),
            "service_restored": (
                "Dear {name}, your payment of ₹{amount:.2f} has been received. "
                "All services have been restored. Thank you!"
            )
        }
        
        template = templates.get(template_type, "Notification: {message}")
        try:
            return template.format(**kwargs)
        except KeyError as e:
            logger.error(f"Missing template parameter: {e}")
            return f"Notification message for {kwargs.get('name', 'customer')}"
    
    def send_sms(self, phone: str, message: str, retry: int = 0) -> bool:
        """
        Simulate sending SMS with retry logic
        """
        try:
            logger.info(f"[SMS] Attempt {retry + 1}/{self.max_retries} - Sending to {phone}")
            logger.info(f"[SMS] Message: {message}")
            
            # Simulate SMS gateway call
            # In production: integrate with Twilio, AWS SNS, etc.
            # response = sms_gateway.send(phone, message)
            
            return True
        except Exception as e:
            logger.error(f"[SMS] Failed to send to {phone}: {str(e)}")
            if retry < self.max_retries - 1:
                return self.send_sms(phone, message, retry + 1)
            return False
    
    def send_email(self, email: str, subject: str, message: str, retry: int = 0) -> bool:
        """
        Simulate sending email with retry logic
        """
        try:
            logger.info(f"[EMAIL] Attempt {retry + 1}/{self.max_retries} - Sending to {email}")
            logger.info(f"[EMAIL] Subject: {subject}")
            logger.info(f"[EMAIL] Message: {message}")
            
            # Simulate email service call
            # In production: integrate with SendGrid, AWS SES, etc.
            # response = email_service.send(email, subject, message)
            
            return True
        except Exception as e:
            logger.error(f"[EMAIL] Failed to send to {email}: {str(e)}")
            if retry < self.max_retries - 1:
                return self.send_email(email, subject, message, retry + 1)
            return False
    
    def send_app_notification(self, customer_id: int, message: str, retry: int = 0) -> bool:
        """
        Simulate sending in-app notification with retry logic
        """
        try:
            logger.info(f"[APP] Attempt {retry + 1}/{self.max_retries} - Sending to customer {customer_id}")
            logger.info(f"[APP] Message: {message}")
            
            # Simulate push notification service
            # In production: integrate with Firebase, OneSignal, etc.
            # response = push_service.send(customer_id, message)
            
            return True
        except Exception as e:
            logger.error(f"[APP] Failed to send to customer {customer_id}: {str(e)}")
            if retry < self.max_retries - 1:
                return self.send_app_notification(customer_id, message, retry + 1)
            return False
    
    def create_and_send_notification(
        self,
        customer_id: int,
        channel: NotificationChannel,
        message: str,
        rule_id: Optional[int] = None
    ) -> Notification:
        """
        Create notification record and send it via specified channel with error handling
        """
        # Get customer details with error handling
        customer = self.db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            raise CustomerNotFoundException(customer_id)
        
        # Create notification record
        notification = Notification(
            customer_id=customer_id,
            rule_id=rule_id,
            channel=channel.value,
            message=message,
            status=NotificationStatus.PENDING.value
        )
        self.db.add(notification)
        self.db.flush()
        
        # Send notification based on channel
        success = False
        try:
            if channel == NotificationChannel.SMS:
                success = self.send_sms(customer.phone, message)
            elif channel == NotificationChannel.EMAIL:
                subject = "Payment Reminder - Dunning Notice"
                success = self.send_email(customer.email, subject, message)
            elif channel == NotificationChannel.APP:
                success = self.send_app_notification(customer_id, message)
            elif channel == NotificationChannel.ALL:
                # Send via all channels
                sms_success = self.send_sms(customer.phone, message)
                email_success = self.send_email(customer.email, "Payment Reminder", message)
                app_success = self.send_app_notification(customer_id, message)
                success = sms_success and email_success and app_success
            
            # Update notification status
            if success:
                notification.status = NotificationStatus.DELIVERED.value
                notification.sent_at = datetime.now()
                logger.info(f"✅ Notification sent successfully via {channel.value} to customer {customer_id}")
            else:
                notification.status = NotificationStatus.FAILED.value
                logger.warning(f"❌ Notification failed via {channel.value} to customer {customer_id}")
                
        except Exception as e:
            notification.status = NotificationStatus.FAILED.value
            logger.error(f"Exception in notification sending: {str(e)}")
            raise NotificationFailedException(channel.value, customer_id)
        
        self.db.commit()
        self.db.refresh(notification)
        
        return notification
    
    def send_payment_confirmation(
        self,
        customer: Customer,
        payment_amount: float,
        remaining_balance: float
    ) -> Dict[str, int]:
        """
        Send payment confirmation notifications via all channels
        """
        if remaining_balance > 0:
            message = self.get_notification_template(
                "payment_success",
                name=customer.name,
                amount=payment_amount,
                message=f"Remaining balance: ₹{remaining_balance:.2f}. Please clear to avoid future disruptions."
            )
        else:
            message = self.get_notification_template(
                "service_restored",
                name=customer.name,
                amount=payment_amount
            )
        
        notifications_sent = {"sms": 0, "email": 0, "app": 0}
        
        for channel in [NotificationChannel.SMS, NotificationChannel.EMAIL, NotificationChannel.APP]:
            try:
                self.create_and_send_notification(
                    customer_id=customer.id,
                    channel=channel,
                    message=message
                )
                notifications_sent[channel.value.lower()] = 1
            except Exception as e:
                logger.error(f"Failed to send {channel.value} confirmation: {str(e)}")
        
        return notifications_sent
