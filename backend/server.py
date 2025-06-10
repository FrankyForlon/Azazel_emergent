from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
from enum import Enum
import asyncio

# Import custom modules
from models import (
    UserProfile, Job, JobCreate, Application, ApplicationCreate, 
    CoverLetter, CoverLetterCreate, EmailLog, JobSearchRequest,
    ApplicationStatus, JobSource
)
from services.ai_service import AIService
from services.email_service import EmailService
from services.scraper_service import ScraperService

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Initialize services
ai_service = AIService(api_key=os.environ['CLAUDE_API_KEY'])
email_service = EmailService(
    api_key=os.environ['SENDGRID_API_KEY'],
    sender_email=os.environ['SENDER_EMAIL']
)
scraper_service = ScraperService()

# Create the main app without a prefix
app = FastAPI(title="Job Search Agent API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Basic health check
@api_router.get("/")
async def root():
    return {"message": "Job Search Agent API is running!", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "services": {
            "database": "connected",
            "ai_service": "initialized",
            "email_service": "initialized",
            "scraper_service": "initialized"
        }
    }

# ===== USER PROFILE ENDPOINTS =====

@api_router.get("/profile", response_model=UserProfile)
async def get_user_profile():
    """Get the user profile (Peter Golub's information)"""
    profile = await db.user_profile.find_one()
    if not profile:
        # Create default profile for Peter Golub
        default_profile = UserProfile(
            full_name="Peter Golub",
            email="peter.golub@gmail.com",
            phone="",
            location="",
            bio="""Having seen your listing for this position, I'd like to submit my application in the hope of not merely finding a new job but working on exciting projects in the burgeoning field of machine learning.

I bring over two decades of experience in teaching, translation, linguistic analysis, quality assessment, and content evaluation. My extensive experience in subtitle annotation, localization, and quality control for major platforms like Netflix, HBO, and Plint demonstrates meticulous attention to detail and the ability to work with complex content guidelines across multiple languages. My experience as a Search Quality Rater for Google/ZeroChaos (2014-2017) taught me how to evaluate search results and online advertisements for accuracy, usefulness, and compliance with policy standards. My brother and I are currently in the process of building our own language teaching agent, focusing on the preservation and promotion of endangered and low frequency languages (https://linguabear.org/mountain/).""",
            skills=[
                "English-Russian Translation",
                "Linguistic Analysis", 
                "Quality Assessment",
                "Content Evaluation",
                "Subtitle Annotation",
                "Localization",
                "Search Quality Evaluation",
                "Academic Research",
                "Language Teaching",
                "Machine Learning"
            ],
            experience=[
                "20+ years translation/interpretation/localization for academic publishers (Taylor & Francis) and public relations (Roscongress Foundation)",
                "5 years Netflix subtitle and QA experience",
                "Google Ad and search ranking experience (Zero Chaos, 2014-2017)",
                "20+ years of university teaching (UC Berkeley, UNLV, University of Utah)",
                "13 years of academic study and research in English, Russian, Linguistics, Translation Studies"
            ],
            education=[
                "Academic study and research in English, Russian, Linguistics, Translation Studies (13 years)"
            ],
            languages=["English (Native)", "Russian (Native)"],
            preferred_job_types=["remote", "freelance", "contract", "part-time"],
            target_keywords=[
                "machine learning", "AI", "translation", "linguistic", "quality assessment",
                "content evaluation", "annotation", "localization", "remote", "freelance"
            ]
        )
        await db.user_profile.insert_one(default_profile.dict())
        return default_profile
    
    return UserProfile(**profile)

@api_router.put("/profile", response_model=UserProfile)
async def update_user_profile(profile: UserProfile):
    """Update the user profile"""
    profile_dict = profile.dict()
    await db.user_profile.replace_one({}, profile_dict, upsert=True)
    return profile

# ===== JOB DISCOVERY ENDPOINTS =====

@api_router.post("/jobs/search")
async def search_jobs(search_request: JobSearchRequest, background_tasks: BackgroundTasks):
    """Trigger job search across multiple platforms"""
    background_tasks.add_task(scraper_service.search_all_platforms, search_request)
    return {
        "message": "Job search initiated",
        "search_id": str(uuid.uuid4()),
        "platforms": search_request.platforms if search_request.platforms else [
            "flexjobs", "remotive", "weworkremotely", "remote_co", "contra", "toptal", "upwork"
        ]
    }

@api_router.get("/jobs", response_model=List[Job])
async def get_jobs(
    limit: int = Query(50, le=100),
    skip: int = Query(0, ge=0),
    source: Optional[JobSource] = None,
    applied: Optional[bool] = None
):
    """Get discovered jobs with optional filtering"""
    query = {}
    if source:
        query["source"] = source
    if applied is not None:
        query["applied"] = applied
    
    jobs = await db.jobs.find(query).skip(skip).limit(limit).sort("discovered_at", -1).to_list(limit)
    return [Job(**job) for job in jobs]

@api_router.get("/jobs/{job_id}", response_model=Job)
async def get_job(job_id: str):
    """Get a specific job by ID"""
    job = await db.jobs.find_one({"id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return Job(**job)

@api_router.post("/jobs", response_model=Job)
async def create_job(job_data: JobCreate):
    """Manually add a job"""
    job = Job(**job_data.dict())
    await db.jobs.insert_one(job.dict())
    return job

@api_router.delete("/jobs/{job_id}")
async def delete_job(job_id: str):
    """Delete a job"""
    result = await db.jobs.delete_one({"id": job_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"message": "Job deleted successfully"}

# ===== COVER LETTER ENDPOINTS =====

@api_router.post("/cover-letters/generate", response_model=CoverLetter)
async def generate_cover_letter(request: CoverLetterCreate):
    """Generate a personalized cover letter using AI"""
    try:
        # Get user profile
        profile = await db.user_profile.find_one()
        if not profile:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        # Get job details
        job = await db.jobs.find_one({"id": request.job_id})
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Generate cover letter using AI service
        cover_letter_content = await ai_service.generate_cover_letter(
            job_title=job["title"],
            company=job["company"],
            job_description=job["description"],
            user_profile=UserProfile(**profile)
        )
        
        # Create and save cover letter
        cover_letter = CoverLetter(
            job_id=request.job_id,
            content=cover_letter_content,
            job_title=job["title"],
            company=job["company"]
        )
        
        await db.cover_letters.insert_one(cover_letter.dict())
        return cover_letter
        
    except Exception as e:
        logging.error(f"Error generating cover letter: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate cover letter")

@api_router.get("/cover-letters", response_model=List[CoverLetter])
async def get_cover_letters(limit: int = Query(20, le=50)):
    """Get generated cover letters"""
    cover_letters = await db.cover_letters.find().limit(limit).sort("generated_at", -1).to_list(limit)
    return [CoverLetter(**cl) for cl in cover_letters]

@api_router.get("/cover-letters/{cover_letter_id}", response_model=CoverLetter)
async def get_cover_letter(cover_letter_id: str):
    """Get a specific cover letter"""
    cover_letter = await db.cover_letters.find_one({"id": cover_letter_id})
    if not cover_letter:
        raise HTTPException(status_code=404, detail="Cover letter not found")
    return CoverLetter(**cover_letter)

# ===== APPLICATION ENDPOINTS =====

@api_router.post("/applications", response_model=Application)
async def create_application(app_data: ApplicationCreate):
    """Create a new job application"""
    # Mark job as applied
    await db.jobs.update_one(
        {"id": app_data.job_id},
        {"$set": {"applied": True, "applied_at": datetime.utcnow()}}
    )
    
    # Create application record
    application = Application(**app_data.dict())
    await db.applications.insert_one(application.dict())
    return application

@api_router.get("/applications", response_model=List[Application])
async def get_applications(
    limit: int = Query(50, le=100),
    status: Optional[ApplicationStatus] = None
):
    """Get job applications with optional status filtering"""
    query = {}
    if status:
        query["status"] = status
    
    applications = await db.applications.find(query).limit(limit).sort("applied_at", -1).to_list(limit)
    return [Application(**app) for app in applications]

@api_router.put("/applications/{application_id}/status")
async def update_application_status(application_id: str, status: ApplicationStatus):
    """Update application status"""
    result = await db.applications.update_one(
        {"id": application_id},
        {"$set": {"status": status, "updated_at": datetime.utcnow()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"message": "Status updated successfully"}

# ===== EMAIL ENDPOINTS =====

@api_router.post("/emails/send-application")
async def send_application_email(
    application_id: str,
    background_tasks: BackgroundTasks
):
    """Send application email with cover letter"""
    try:
        # Get application and related data
        application = await db.applications.find_one({"id": application_id})
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")
        
        job = await db.jobs.find_one({"id": application["job_id"]})
        cover_letter = await db.cover_letters.find_one({"job_id": application["job_id"]})
        
        if not job or not cover_letter:
            raise HTTPException(status_code=404, detail="Job or cover letter not found")
        
        # Send email in background
        background_tasks.add_task(
            email_service.send_application_email,
            application, job, cover_letter
        )
        
        return {"message": "Application email queued for sending"}
        
    except Exception as e:
        logging.error(f"Error sending application email: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send application email")

@api_router.get("/emails/logs", response_model=List[EmailLog])
async def get_email_logs(limit: int = Query(20, le=50)):
    """Get email sending logs"""
    logs = await db.email_logs.find().limit(limit).sort("sent_at", -1).to_list(limit)
    return [EmailLog(**log) for log in logs]

# ===== ANALYTICS ENDPOINTS =====

@api_router.get("/analytics/dashboard")
async def get_dashboard_analytics():
    """Get dashboard analytics"""
    # Count various metrics
    total_jobs = await db.jobs.count_documents({})
    jobs_applied = await db.applications.count_documents({})
    jobs_pending = await db.applications.count_documents({"status": "pending"})
    jobs_interviewing = await db.applications.count_documents({"status": "interviewing"})
    jobs_rejected = await db.applications.count_documents({"status": "rejected"})
    
    # Recent activity
    recent_jobs = await db.jobs.find().sort("discovered_at", -1).limit(5).to_list(5)
    recent_applications = await db.applications.find().sort("applied_at", -1).limit(5).to_list(5)
    
    return {
        "metrics": {
            "total_jobs_discovered": total_jobs,
            "total_applications": jobs_applied,
            "pending_applications": jobs_pending,
            "interviewing": jobs_interviewing,
            "rejected": jobs_rejected
        },
        "recent_jobs": [Job(**job) for job in recent_jobs],
        "recent_applications": [Application(**app) for app in recent_applications]
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    """Initialize database indexes and default data"""
    logger.info("Starting Job Search Agent API...")
    
    # Create indexes for better performance
    await db.jobs.create_index("id")
    await db.jobs.create_index("discovered_at")
    await db.applications.create_index("id")
    await db.applications.create_index("applied_at")
    await db.cover_letters.create_index("job_id")
    
    logger.info("Database indexes created successfully")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
