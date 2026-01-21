"""
Application enums for consistent data types
"""
from enum import Enum

class CustomerType(str, Enum):
    POSTPAID = "POSTPAID"
    PREPAID = "PREPAID"
    ALL = "ALL"

class DunningStatus(str, Enum):
    ACTIVE = "ACTIVE"
    NOTIFIED = "NOTIFIED"
    RESTRICTED = "RESTRICTED"
    BARRED = "BARRED"
    CURED = "CURED"

class ActionType(str, Enum):
    NOTIFY = "NOTIFY"
    THROTTLE = "THROTTLE"
    BAR_OUTGOING = "BAR_OUTGOING"
    DEACTIVATE = "DEACTIVATE"

class NotificationChannel(str, Enum):
    SMS = "SMS"
    EMAIL = "EMAIL"
    APP = "APP"
    ALL = "ALL"

class NotificationStatus(str, Enum):
    PENDING = "PENDING"
    SENT = "SENT"
    FAILED = "FAILED"
    DELIVERED = "DELIVERED"

class PaymentMethod(str, Enum):
    CREDIT_CARD = "CREDIT_CARD"
    DEBIT_CARD = "DEBIT_CARD"
    UPI = "UPI"
    NET_BANKING = "NET_BANKING"
    WALLET = "WALLET"

class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
