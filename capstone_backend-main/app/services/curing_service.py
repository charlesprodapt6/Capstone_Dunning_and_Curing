"""
Curing Service - Handles service restoration after payment
"""
import logging
from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.customer import Customer
from app.models.payment import Payment
from app.models.curing_action import CuringAction
from app.utils.enums import DunningStatus, PaymentStatus
from app.services.notification_service import NotificationService
from app.utils.exceptions import CustomerNotFoundException, NotificationFailedException

from app.utils.exceptions import (
    CustomerNotFoundException,
    PaymentNotFoundException,
    AlreadyCuredException,
    InvalidPaymentException
)
logger = logging.getLogger(__name__)

class CuringService:
    """
    Service for handling curing workflow:
    1. Receives payment success event
    2. Identifies customer and previous dunning status
    3. Restores services based on previous restrictions
    4. Updates customer status
    5. Sends confirmation notification
    6. Logs curing action
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.notification_service = NotificationService(db)
    
    def validate_payment(self, payment: Payment) -> None:
        """
        Validate payment before curing
        """
        if payment.payment_status != PaymentStatus.SUCCESS:
            raise InvalidPaymentException(
                f"Payment {payment.id} status is {payment.payment_status.value}, not SUCCESS"
            )
        
        if payment.amount <= 0:
            raise InvalidPaymentException(
                f"Payment amount must be positive, got {payment.amount}"
            )
    
    def restore_services(self, customer: Customer, previous_status: DunningStatus) -> List[str]:
        """
        Restore customer services based on previous dunning status
        Returns list of actions taken
        """
        actions = []
        
        if previous_status == DunningStatus.NOTIFIED:
            actions.append("Cleared notification status")
            
        elif previous_status == DunningStatus.RESTRICTED:
            actions.append("Restored full data speed")
            actions.append("Removed throttling restrictions")
            logger.info(f"Customer {customer.id} data speed restored")
            
        elif previous_status == DunningStatus.BARRED:
            actions.append("Restored outgoing call services")
            actions.append("Restored data services")
            actions.append("Removed all bars")
            logger.info(f"Customer {customer.id} services fully restored")
        
        # Always set to ACTIVE regardless of previous status
        customer.dunning_status = DunningStatus.ACTIVE
        actions.append("Updated status to ACTIVE")
        
        return actions
    
    def check_if_already_cured(self, customer: Customer) -> bool:
        """
        Check if customer is already in ACTIVE status
        """
        return customer.dunning_status == DunningStatus.ACTIVE and customer.overdue_days == 0
    
    
    def calculate_remaining_balance(self, customer: Customer, payment_amount: float) -> float:
        """
        Calculate remaining balance after payment
        """
        current_outstanding = float(customer.outstanding_amount)
        remaining = max(0, current_outstanding - payment_amount)
        return remaining
    
    def restore_services(self, customer: Customer, previous_status: DunningStatus) -> List[str]:
        """
        Restore customer services based on previous dunning status
        Returns list of actions taken
        """
        actions = []
        
        try:
            if previous_status == DunningStatus.ACTIVE:
                actions.append("Customer was already active, no restoration needed")
                logger.info(f"Customer {customer.id} was already ACTIVE")
                
            elif previous_status == DunningStatus.NOTIFIED:
                actions.append("Cleared notification status")
                logger.info(f"Customer {customer.id} notification status cleared")
                
            elif previous_status == DunningStatus.RESTRICTED:
                actions.append("Restored full data speed")
                actions.append("Removed throttling restrictions")
                logger.info(f"Customer {customer.id} data speed restored")
                
            elif previous_status == DunningStatus.BARRED:
                actions.append("Restored outgoing call services")
                actions.append("Restored data services")
                actions.append("Removed all service bars")
                logger.info(f"Customer {customer.id} all services restored")
            
            # Always set to ACTIVE regardless of previous status
            customer.dunning_status = DunningStatus.ACTIVE
            actions.append("Updated dunning status to ACTIVE")
            
            return actions
            
        except Exception as e:
            logger.error(f"Error restoring services for customer {customer.id}: {str(e)}")
            raise
    
    
    def generate_curing_notification(
        self,
        customer: Customer,
        payment_amount: float,
        remaining_balance: float
    ) -> str:
        """
        Generate confirmation message for customer
        """
        if remaining_balance > 0:
            message = (
                f"Dear {customer.name}, thank you for your payment of ₹{payment_amount:.2f}. "
                f"Your services have been restored. Remaining balance: ₹{remaining_balance:.2f}. "
                f"Please clear the remaining amount to avoid future disruptions."
            )
        else:
            message = (
                f"Dear {customer.name}, thank you for your payment of ₹{payment_amount:.2f}. "
                f"Your account is now fully paid and all services have been restored. "
                f"We appreciate your prompt payment!"
            )
        
        return message
    
    def execute_curing(self, customer_id: int, payment_id: int) -> Dict[str, Any]:
        """
        Execute complete curing workflow with comprehensive error handling
        """
        try:
            # Step 1: Get customer with validation
            customer = self.db.query(Customer).filter(Customer.id == customer_id).first()
            if not customer:
                raise CustomerNotFoundException(customer_id)
            
            # Step 2: Get payment with validation
            payment = self.db.query(Payment).filter(Payment.id == payment_id).first()
            if not payment:
                raise PaymentNotFoundException(payment_id)
            
            # Step 3: Validate payment
            self.validate_payment(payment)
            
            # Step 4: Check if payment belongs to customer
            if payment.customer_id != customer_id:
                raise InvalidPaymentException(
                    f"Payment {payment_id} does not belong to customer {customer_id}"
                )
            
            # Step 5: Check if already cured
            previous_status = customer.dunning_status
            if self.check_if_already_cured(customer):
                logger.warning(f"Customer {customer_id} is already cured")
                # Don't raise exception, just return success with note
                return {
                    "success": True,
                    "customer_id": customer_id,
                    "customer_name": customer.name,
                    "previous_status": previous_status.value,
                    "new_status": DunningStatus.ACTIVE.value,
                    "payment_amount": float(payment.amount),
                    "remaining_balance": float(customer.outstanding_amount),
                    "actions_taken": ["Customer was already in ACTIVE status"],
                    "notifications_sent": 0,
                    "message": "Customer already cured, no action needed"
                }
            
            # Step 6: Restore services
            actions_taken = self.restore_services(customer, previous_status)
            
            # Step 7: Update financial details
            payment_amount = float(payment.amount)
            remaining_balance = self.calculate_remaining_balance(customer, payment_amount)
            
            customer.outstanding_amount = remaining_balance
            customer.overdue_days = 0
            
            # Step 8: Update due dates if fully paid
            if remaining_balance == 0:
                customer.billing_date = None
                customer.due_date = None
                actions_taken.append("Cleared billing and due dates (fully paid)")
            
            # Step 9: Create curing action record
            action_description = "; ".join(actions_taken)
            curing_action = CuringAction(
                customer_id=customer_id,
                payment_id=payment_id,
                previous_status=previous_status.value,
                action_taken=action_description,
                success_flag=True,
                remarks=f"Payment: ₹{payment_amount:.2f}, Remaining: ₹{remaining_balance:.2f}"
            )
            self.db.add(curing_action)
            
            # Step 10: Send confirmation notifications
            notifications_sent = self.notification_service.send_payment_confirmation(
                customer, payment_amount, remaining_balance
            )
            
            # Step 11: Commit all changes
            self.db.commit()
            self.db.refresh(customer)
            
            logger.info(
                f"✅ Curing completed: Customer {customer_id} | "
                f"Status: {previous_status.value} → {customer.dunning_status.value} | "
                f"Payment: ₹{payment_amount:.2f}"
            )
            
            return {
                "success": True,
                "customer_id": customer_id,
                "customer_name": customer.name,
                "previous_status": previous_status.value,
                "new_status": customer.dunning_status.value,
                "payment_amount": payment_amount,
                "remaining_balance": remaining_balance,
                "actions_taken": actions_taken,
                "notifications_sent": sum(notifications_sent.values()),
                "notification_details": notifications_sent,
                "message": "Service successfully restored"
            }
            
        except (CustomerNotFoundException, PaymentNotFoundException, InvalidPaymentException) as e:
            logger.error(f"Validation error in curing: {str(e)}")
            self.db.rollback()
            return {
                "success": False,
                "customer_id": customer_id,
                "error_type": type(e).__name__,
                "message": str(e)
            }
        except Exception as e:
            logger.error(f"Unexpected error in curing for customer {customer_id}: {str(e)}")
            self.db.rollback()
            return {
                "success": False,
                "customer_id": customer_id,
                "error_type": "UnexpectedError",
                "message": f"Curing failed: {str(e)}"
            }
            
    def process_payment_webhook(self, webhook_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process payment webhook from payment gateway and trigger curing
        """
        try:
            customer_id = webhook_data.get("customer_id")
            amount = webhook_data.get("amount")
            payment_status = webhook_data.get("status", "").lower()
            
            if payment_status != "success":
                return {
                    "success": False,
                    "message": f"Payment status is {payment_status}, not success"
                }
            
            # Find the payment record
            transaction_id = webhook_data.get("transaction_id")
            payment = self.db.query(Payment).filter(
                Payment.transaction_id == transaction_id
            ).first()
            
            if not payment:
                logger.warning(f"Payment {transaction_id} not found, webhook may have arrived before payment creation")
                return {
                    "success": False,
                    "message": "Payment record not found"
                }
            
            # Execute curing
            result = self.execute_curing(customer_id, payment.id)
            
            return result
            
        except Exception as e:
            logger.error(f"Webhook processing failed: {str(e)}")
            return {
                "success": False,
                "message": f"Webhook processing failed: {str(e)}"
            }
