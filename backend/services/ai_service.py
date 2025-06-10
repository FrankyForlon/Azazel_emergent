import asyncio
from emergentintegrations.llm.chat import LlmChat, UserMessage
from models import UserProfile
import logging

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.model = "claude-3-5-sonnet-20241022"
        
    async def generate_cover_letter(
        self, 
        job_title: str, 
        company: str, 
        job_description: str, 
        user_profile: UserProfile
    ) -> str:
        """Generate a personalized cover letter using Claude AI"""
        
        try:
            # Create a new chat instance for each request
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"cover_letter_{job_title}_{company}",
                system_message="""You are an expert cover letter writer specializing in creating personalized, professional cover letters for job applications. 

Focus on:
1. Highlighting relevant experience that matches the job requirements
2. Demonstrating understanding of the company and role
3. Showing enthusiasm and cultural fit
4. Maintaining a professional yet engaging tone
5. Keeping the letter concise (3-4 paragraphs)

Generate a complete, ready-to-send cover letter that feels personal and tailored to the specific opportunity."""
            ).with_model("anthropic", self.model)
            
            # Create the prompt with job and profile information
            prompt = f"""Write a personalized cover letter for the following job application:

**Job Title:** {job_title}
**Company:** {company}

**Job Description:**
{job_description}

**Candidate Profile:**
Name: {user_profile.full_name}
Bio: {user_profile.bio}

**Skills:** {', '.join(user_profile.skills)}
**Experience:** {'; '.join(user_profile.experience)}
**Languages:** {', '.join(user_profile.languages)}

**Target Keywords:** {', '.join(user_profile.target_keywords)}

Please write a compelling cover letter that:
1. Opens with enthusiasm for the specific role and company
2. Highlights the most relevant experience and skills from the candidate's background
3. Shows understanding of the job requirements
4. Includes specific examples of relevant work (Netflix, Google, academic experience, etc.)
5. Closes with confidence and next steps

The tone should be professional but engaging, showing both competence and personality. Keep it to 3-4 paragraphs maximum."""

            # Send message and get response
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            
            return response
            
        except Exception as e:
            logger.error(f"Error generating cover letter with Claude: {str(e)}")
            # Fallback template if AI fails
            return self._generate_fallback_cover_letter(job_title, company, user_profile)
    
    def _generate_fallback_cover_letter(self, job_title: str, company: str, user_profile: UserProfile) -> str:
        """Fallback cover letter template if AI service fails"""
        return f"""Dear Hiring Manager,

Having seen your listing for the {job_title} position at {company}, I'd like to submit my application in the hope of not merely finding a new job but working on exciting projects in the burgeoning field of machine learning.

I bring over two decades of experience in teaching, translation, linguistic analysis, quality assessment, and content evaluation. My extensive experience in subtitle annotation, localization, and quality control for major platforms like Netflix, HBO, and Plint demonstrates meticulous attention to detail and the ability to work with complex content guidelines across multiple languages. My experience as a Search Quality Rater for Google/ZeroChaos (2014-2017) taught me how to evaluate search results and online advertisements for accuracy, usefulness, and compliance with policy standards.

I am particularly excited about this opportunity because it aligns with my expertise in language processing and quality assessment, skills that are increasingly valuable in AI and machine learning applications. My background in both academic research and practical application of linguistic principles positions me well to contribute to {company}'s initiatives.

Thank you for considering my application. I look forward to discussing how my combination of linguistic expertise and technical skills can benefit {company}.

Best regards,
{user_profile.full_name}"""
