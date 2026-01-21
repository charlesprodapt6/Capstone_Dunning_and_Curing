"""
Custom Exception Classes for Dunning and Curing System
"""

class CustomerNotFoundException(Exception):
    """Raised when customer is not found"""
    def __init__(self, customer_id: int):
        self.customer_id = customer_id
        super().__init__(f"Customer with ID {customer_id} not found")

class PaymentNotFoundException(Exception):
    """Raised when payment is not found"""
    def __init__(self, payment_id: int):
        self.payment_id = payment_id
        super().__init__(f"Payment with ID {payment_id} not found")

class AlreadyCuredException(Exception):
    """Raised when customer is already cured"""
    def __init__(self, customer_id: int):
        self.customer_id = customer_id
        super().__init__(f"Customer {customer_id} is already in ACTIVE status (already cured)")

class InvalidPaymentException(Exception):
    """Raised when payment data is invalid"""
    def __init__(self, message: str):
        super().__init__(f"Invalid payment: {message}")

class NotificationFailedException(Exception):
    """Raised when notification sending fails"""
    def __init__(self, channel: str, customer_id: int):
        self.channel = channel
        self.customer_id = customer_id
        super().__init__(f"Failed to send {channel} notification to customer {customer_id}")

class DunningRuleNotFoundException(Exception):
    """Raised when no dunning rule is found"""
    def __init__(self, customer_type: str, overdue_days: int):
        super().__init__(f"No dunning rule found for {customer_type} customer with {overdue_days} days overdue")
