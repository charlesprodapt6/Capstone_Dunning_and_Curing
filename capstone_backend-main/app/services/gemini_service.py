import google.generativeai as genai
from app.config.settings import Settings
import logging

logger = logging.getLogger(__name__)
settings = Settings()

class GeminiService:
    def __init__(self):
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            logger.warning("GEMINI_API_KEY not set, chatbot will return fallback messages")
            self.model = None
    
    def generate_customer_response(self, query: str, customer_context: dict) -> str:
        """
        Generate AI response based on customer query and their dunning context
        """
        try:
            if not self.model:
                return "Chatbot service is currently unavailable. Please contact customer support for assistance."
            
            # Build context-aware prompt
            prompt = self._build_prompt(query, customer_context)
            
            # Generate response
            response = self.model.generate_content(prompt)
            
            return response.text
        except Exception as e:
            logger.error(f"Gemini API error: {str(e)}")
            return "I'm having trouble processing your request. Please contact customer support."
    
    def _build_prompt(self, query: str, context: dict) -> str:
        """
        Build a context-aware prompt for Gemini
        """
        status = context.get('dunning_status', 'UNKNOWN')
        overdue_days = context.get('overdue_days', 0)
        outstanding = context.get('outstanding_amount', 0)
        customer_type = context.get('customer_type', 'UNKNOWN')
        plan = context.get('plan_type', 'UNKNOWN')
        
        prompt = f"""
You are a helpful customer support assistant for a telecom dunning and curing system.

Customer Information:
- Account Status: {status}
- Overdue Days: {overdue_days}
- Outstanding Balance: ₹{outstanding}
- Customer Type: {customer_type}
- Plan: {plan}

Customer Query: "{query}"

Instructions:
- Be empathetic and professional
- Explain the customer's current status clearly
- If they have overdue payments, explain what restrictions are in place
- Provide actionable steps to resolve the issue
- Keep response under 150 words
- Use simple, non-technical language
- Don't mention technical terms like "dunning status" - use "account status" instead

Status meanings:
- ACTIVE: Account is in good standing, all services available
- NOTIFIED: Payment reminder sent, services active but payment due soon
- RESTRICTED: Some services limited due to overdue payment (reduced data speed)
- BARRED: Outgoing services blocked due to non-payment
- CURED: Account restored after payment

Respond to the customer's query based on their current situation.
"""
        return prompt
