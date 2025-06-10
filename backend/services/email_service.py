import sendgrid
from sendgrid.helpers.mail import Mail
import logging
from typing import Dict, Any
import os
from datetime import datetime

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self, api_key: str, sender_email: str):
        self.api_key = api_key
        self.sender_email = sender_email
        self.sg = sendgrid.SendGridAPIClient(api_key=api_key)
    
    async def send_application_email(
        self, 
        application: Dict[str, Any], 
        job: Dict[str, Any], 
        cover_letter: Dict[str, Any]
    ) -> bool:
        """Send job application email with cover letter"""
        
        try:
            # Extract job contact email (this would come from job posting)
            # For now, we'll use a placeholder - in real implementation, 
            # you'd extract this from the job posting or use the company's careers email
            recipient_email = job.get("contact_email", "hr@example.com")
            
            subject = f"Application for {job['title']} Position - {application.get('applicant_name', 'Peter Golub')}"
            
            # Create HTML email content
            html_content = f"""
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #2c3e50;">Job Application: {job['title']}</h2>
                        
                        <p>Dear Hiring Manager,</p>
                        
                        <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #007bff; margin: 20px 0;">
                            {cover_letter['content'].replace('\\n', '<br>')}
                        </div>
                        
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                            <p><strong>Application Details:</strong></p>
                            <ul>
                                <li><strong>Position:</strong> {job['title']}</li>
                                <li><strong>Company:</strong> {job['company']}</li>
                                <li><strong>Applied via:</strong> {application.get('application_method', 'email')}</li>
                                <li><strong>Date:</strong> {application.get('applied_at', datetime.utcnow()).strftime('%B %d, %Y')}</li>
                            </ul>
                        </div>
                        
                        <div style="margin-top: 30px; padding: 15px; background-color: #e9ecef; border-radius: 5px;">
                            <p style="margin: 0;"><strong>Contact Information:</strong></p>
                            <p style="margin: 5px 0;">Email: {self.sender_email}</p>
                            <p style="margin: 5px 0;">Best regards,<br>Peter Golub</p>
                        </div>
                    </div>
                </body>
            </html>
            """
            
            # Create email
            message = Mail(
                from_email=self.sender_email,
                to_emails=recipient_email,
                subject=subject,
                html_content=html_content
            )
            
            # Send email
            response = self.sg.send(message)
            
            # Log the email
            await self._log_email(
                recipient_email=recipient_email,
                subject=subject,
                content=html_content,
                application_id=application.get('id'),
                status="sent" if response.status_code == 202 else "failed"
            )
            
            logger.info(f"Application email sent successfully to {recipient_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send application email: {str(e)}")
            
            # Log the failed attempt
            await self._log_email(
                recipient_email=recipient_email if 'recipient_email' in locals() else "unknown",
                subject=subject if 'subject' in locals() else "Application Email",
                content="",
                application_id=application.get('id'),
                status="failed",
                error_message=str(e)
            )
            
            return False
    
    async def send_follow_up_email(self, application: Dict[str, Any], job: Dict[str, Any]) -> bool:
        """Send follow-up email for an application"""
        
        try:
            recipient_email = job.get("contact_email", "hr@example.com")
            subject = f"Following up on {job['title']} Application - Peter Golub"
            
            html_content = f"""
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #2c3e50;">Follow-up: {job['title']} Application</h2>
                        
                        <p>Dear Hiring Manager,</p>
                        
                        <p>I hope this email finds you well. I wanted to follow up on my application for the {job['title']} position at {job['company']} that I submitted on {application.get('applied_at', datetime.utcnow()).strftime('%B %d, %Y')}.</p>
                        
                        <p>I remain very interested in this opportunity and would welcome the chance to discuss how my experience in linguistic analysis, quality assessment, and content evaluation could contribute to your team's success.</p>
                        
                        <p>If you need any additional information or would like to schedule a conversation, please don't hesitate to reach out. I look forward to hearing from you.</p>
                        
                        <div style="margin-top: 30px; padding: 15px; background-color: #e9ecef; border-radius: 5px;">
                            <p style="margin: 0;">Best regards,<br>Peter Golub</p>
                            <p style="margin: 5px 0;">Email: {self.sender_email}</p>
                        </div>
                    </div>
                </body>
            </html>
            """
            
            message = Mail(
                from_email=self.sender_email,
                to_emails=recipient_email,
                subject=subject,
                html_content=html_content
            )
            
            response = self.sg.send(message)
            
            await self._log_email(
                recipient_email=recipient_email,
                subject=subject,
                content=html_content,
                application_id=application.get('id'),
                status="sent" if response.status_code == 202 else "failed"
            )
            
            logger.info(f"Follow-up email sent successfully to {recipient_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send follow-up email: {str(e)}")
            return False
    
    async def _log_email(
        self, 
        recipient_email: str, 
        subject: str, 
        content: str, 
        application_id: str = None,
        status: str = "sent",
        error_message: str = None
    ):
        """Log email sending attempt to database"""
        from motor.motor_asyncio import AsyncIOMotorClient
        
        # Note: In a real application, you'd inject the database connection
        # For now, we'll create a new connection (not ideal for production)
        try:
            client = AsyncIOMotorClient(os.environ['MONGO_URL'])
            db = client[os.environ['DB_NAME']]
            
            email_log = {
                "id": str(__import__('uuid').uuid4()),
                "recipient_email": recipient_email,
                "subject": subject,
                "content": content,
                "application_id": application_id,
                "sent_at": datetime.utcnow(),
                "status": status,
                "error_message": error_message
            }
            
            await db.email_logs.insert_one(email_log)
            client.close()
            
        except Exception as e:
            logger.error(f"Failed to log email: {str(e)}")
