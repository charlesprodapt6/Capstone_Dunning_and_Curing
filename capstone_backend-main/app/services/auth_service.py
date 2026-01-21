from sqlalchemy.orm import Session
from app.models.customer import Customer
from typing import Optional, Dict

class AuthService:
    def __init__(self, db: Session):
        self.db = db
    
    def authenticate_user(self, email: str, password: str) -> Optional[Dict]:
        """
        Authenticate user - checks if admin or customer
        Returns user info with role
        """
        # Check admin credentials (hardcoded for demo)
        if email == "admin@dunning.com" and password == "admin123":
            return {
                "id": 0,
                "email": email,
                "name": "Administrator",
                "role": "ADMIN",
                "token": "admin-mock-token-12345"
            }
        
        # Check customer by email (password = phone number for demo)
        customer = self.db.query(Customer).filter(Customer.email == email).first()
        if customer and customer.phone == password:
            return {
                "id": customer.id,
                "email": customer.email,
                "name": customer.name,
                "role": "CUSTOMER",
                "customer_type": customer.customer_type,
                "dunning_status": customer.dunning_status,
                "token": f"customer-mock-token-{customer.id}"
            }
        
        return None
