"""
Rule Engine Service - Core dunning logic
Evaluates customers against dunning rules and applies actions
"""
import logging
from datetime import datetime, date
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.customer import Customer
from app.models.dunning_rule import DunningRule
from app.models.dunning_log import DunningLog
from app.utils.enums import CustomerType, ActionType, DunningStatus, NotificationChannel
from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)

class RuleEngine:
    """
    Core dunning rule engine that:
    1. Evaluates customers against dunning rules
    2. Applies appropriate actions based on overdue days
    3. Sends notifications
    4. Updates customer status
    5. Logs all actions
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.notification_service = NotificationService(db)
    
    def calculate_overdue_days(self, customer: Customer) -> int:
        """
        Calculate number of days a customer is overdue
        """
        if not customer.due_date:
            return 0
        
        today = date.today()
        if today > customer.due_date:
            return (today - customer.due_date).days
        return 0
    
    def get_applicable_rules(self, customer: Customer, overdue_days: int) -> List[DunningRule]:
        """
        Get all active dunning rules applicable to this customer
        """
        # Query rules that match customer type (specific or ALL) and trigger day
        rules = self.db.query(DunningRule).filter(
            and_(
                DunningRule.is_active == True,
                DunningRule.trigger_day == overdue_days,
                DunningRule.customer_type.in_([customer.customer_type, CustomerType.ALL])
            )
        ).order_by(DunningRule.priority.desc()).all()
        
        return rules
    
    def apply_action(self, customer: Customer, action: ActionType) -> str:
        """
        Apply dunning action to customer
        Returns: description of action taken
        """
        action_taken = ""
        
        if action == ActionType.NOTIFY:
            # Just notification, no status change
            action_taken = "Notification sent to customer"
            
        elif action == ActionType.THROTTLE:
            # Throttle data speed
            customer.dunning_status = DunningStatus.RESTRICTED
            action_taken = "Data speed throttled to 512 kbps"
            logger.info(f"Customer {customer.id} data throttled")
            
        elif action == ActionType.BAR_OUTGOING:
            # Bar outgoing calls
            customer.dunning_status = DunningStatus.BARRED
            action_taken = "Outgoing calls and data services barred"
            logger.info(f"Customer {customer.id} services barred")
            
        elif action == ActionType.DEACTIVATE:
            # Deactivate service completely
            customer.dunning_status = DunningStatus.BARRED
            action_taken = "Service deactivated - SIM suspended"
            logger.warning(f"Customer {customer.id} service deactivated")
        
        return action_taken
    
    def generate_notification_message(
        self,
        customer: Customer,
        rule: DunningRule,
        overdue_days: int
    ) -> str:
        """
        Generate personalized notification message based on rule and customer
        """
        messages = {
            ActionType.NOTIFY: (
                f"Dear {customer.name}, your bill of ₹{customer.outstanding_amount:.2f} "
                f"is overdue by {overdue_days} days. Please pay to avoid service disruption. "
                f"Due date was: {customer.due_date.strftime('%d %b %Y')}"
            ),
            ActionType.THROTTLE: (
                f"Dear {customer.name}, due to payment delay of {overdue_days} days, "
                f"your data speed has been reduced. Outstanding: ₹{customer.outstanding_amount:.2f}. "
                f"Pay now to restore full speed."
            ),
            ActionType.BAR_OUTGOING: (
                f"URGENT: {customer.name}, your outgoing services have been barred due to "
                f"{overdue_days} days overdue payment of ₹{customer.outstanding_amount:.2f}. "
                f"Pay immediately to restore services."
            ),
            ActionType.DEACTIVATE: (
                f"FINAL NOTICE: {customer.name}, your service has been suspended due to "
                f"non-payment for {overdue_days} days. Outstanding: ₹{customer.outstanding_amount:.2f}. "
                f"Immediate payment required to avoid disconnection."
            )
        }
        
        return messages.get(rule.action_type, f"Payment reminder for ₹{customer.outstanding_amount:.2f}")
    
    def execute_rule(self, customer: Customer, rule: DunningRule, overdue_days: int) -> Dict[str, Any]:
        """
        Execute a single dunning rule for a customer
        Returns: execution result details
        """
        try:
            # Apply the action
            action_taken = self.apply_action(customer, rule.action_type)
            
            # Generate and send notification
            message = self.generate_notification_message(customer, rule, overdue_days)
            
            notification = None
            notification_sent = False
            
            if rule.notification_channel != NotificationChannel.ALL:
                notification = self.notification_service.create_and_send_notification(
                    customer_id=customer.id,
                    channel=rule.notification_channel,
                    message=message,
                    rule_id=rule.id
                )
                notification_sent = True
            else:
                # Send via all channels
                for channel in [NotificationChannel.SMS, NotificationChannel.EMAIL, NotificationChannel.APP]:
                    try:
                        self.notification_service.create_and_send_notification(
                            customer_id=customer.id,
                            channel=channel,
                            message=message,
                            rule_id=rule.id
                        )
                        notification_sent = True
                    except Exception as e:
                        logger.error(f"Failed to send {channel} notification: {str(e)}")
            
            # Update customer overdue days
            customer.overdue_days = overdue_days
            
            # Create dunning log
            log_details = {
                "rule_name": rule.rule_name,
                "action_type": rule.action_type.value,
                "notification_channel": rule.notification_channel.value,
                "overdue_days": overdue_days,
                "outstanding_amount": float(customer.outstanding_amount),
                "action_taken": action_taken,
                "notification_sent": notification_sent
            }
            
            dunning_log = DunningLog(
                customer_id=customer.id,
                rule_id=rule.id,
                action_type=rule.action_type.value,
                status="SUCCESS",
                details=log_details
            )
            self.db.add(dunning_log)
            
            self.db.commit()
            
            return {
                "success": True,
                "rule_id": rule.id,
                "rule_name": rule.rule_name,
                "action_taken": action_taken,
                "notification_sent": notification_sent
            }
            
        except Exception as e:
            logger.error(f"Failed to execute rule {rule.id} for customer {customer.id}: {str(e)}")
            self.db.rollback()
            return {
                "success": False,
                "rule_id": rule.id,
                "rule_name": rule.rule_name,
                "error": str(e)
            }
    
    def process_customer(self, customer_id: int) -> Dict[str, Any]:
        """
        Process a single customer through the dunning engine
        """
        customer = self.db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            return {
                "customer_id": customer_id,
                "status": "FAILED",
                "message": "Customer not found"
            }
        
        # Calculate overdue days
        overdue_days = self.calculate_overdue_days(customer)
        
        if overdue_days == 0:
            return {
                "customer_id": customer_id,
                "customer_name": customer.name,
                "status": "SKIPPED",
                "message": "Customer not overdue"
            }
        
        # Get applicable rules
        rules = self.get_applicable_rules(customer, overdue_days)
        
        if not rules:
            return {
                "customer_id": customer_id,
                "customer_name": customer.name,
                "overdue_days": overdue_days,
                "status": "SKIPPED",
                "message": f"No rules configured for day {overdue_days}"
            }
        
        # Execute all applicable rules
        rules_executed = []
        actions_taken = []
        notifications_sent = 0
        
        for rule in rules:
            result = self.execute_rule(customer, rule, overdue_days)
            rules_executed.append(result)
            
            if result.get("success"):
                actions_taken.append(result.get("action_taken"))
                if result.get("notification_sent"):
                    notifications_sent += 1
        
        return {
            "customer_id": customer_id,
            "customer_name": customer.name,
            "overdue_days": overdue_days,
            "rules_applied": len(rules_executed),
            "actions_taken": actions_taken,
            "notifications_sent": notifications_sent,
            "status": "SUCCESS",
            "message": f"Processed {len(rules_executed)} rules"
        }
    
    def process_all_overdue_customers(self) -> List[Dict[str, Any]]:
        """
        Process all overdue customers through dunning engine
        """
        # Get all customers with outstanding amounts
        customers = self.db.query(Customer).filter(
            Customer.outstanding_amount > 0
        ).all()
        
        results = []
        for customer in customers:
            # Calculate if overdue
            overdue_days = self.calculate_overdue_days(customer)
            if overdue_days > 0:
                result = self.process_customer(customer.id)
                results.append(result)
        
        return results
