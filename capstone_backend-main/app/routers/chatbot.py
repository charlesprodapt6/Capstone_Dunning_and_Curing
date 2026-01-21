from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.models.customer import Customer
from app.services.gemini_service import GeminiService
from pydantic import BaseModel
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chatbot", tags=["AI Chatbot"])

class ChatRequest(BaseModel):
    customer_id: int
    message: str

class ChatResponse(BaseModel):
    response: str
    success: bool

@router.post("/query", response_model=ChatResponse)
def chat_query(request: ChatRequest, db: Session = Depends(get_db)):
    """
    AI-powered customer query assistant using Gemini
    """
    try:
        # Get customer data
        customer = db.query(Customer).filter(Customer.id == request.customer_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Build context
        customer_context = {
            'dunning_status': customer.dunning_status,
            'overdue_days': customer.overdue_days,
            'outstanding_amount': float(customer.outstanding_amount),
            'customer_type': customer.customer_type,
            'plan_type': customer.plan_type,
        }
        
        # Generate AI response
        gemini_service = GeminiService()
        ai_response = gemini_service.generate_customer_response(
            query=request.message,
            customer_context=customer_context
        )
        
        logger.info(f"Chatbot response for customer {request.customer_id}: {ai_response[:100]}")
        
        return ChatResponse(
            response=ai_response,
            success=True
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chatbot error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")
