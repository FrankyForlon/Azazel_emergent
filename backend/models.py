from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

class JobSource(str, Enum):
    FLEXJOBS = "flexjobs"
    REMOTIVE = "remotive"
    WEWORKREMOTELY = "weworkremotely"
    REMOTE_CO = "remote_co"
    CONTRA = "contra"
    TOPTAL = "toptal"
    UPWORK = "upwork"
    INDEED = "indeed"
    ZIPRECRUITER = "ziprecruiter"
    WELLFOUND = "wellfound"
    LINKEDIN = "linkedin"
    MANUAL = "manual"

class ApplicationStatus(str, Enum):
    PENDING = "pending"
    APPLIED = "applied"
    INTERVIEWING = "interviewing"
    REJECTED = "rejected"
    OFFERED = "offered"
    ACCEPTED = "accepted"

class UserProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    full_name: str
    email: EmailStr
    phone: Optional[str] = ""
    location: Optional[str] = ""
    bio: str
    skills: List[str] = []
    experience: List[str] = []
    education: List[str] = []
    languages: List[str] = []
    preferred_job_types: List[str] = []
    target_keywords: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class JobCreate(BaseModel):
    title: str
    company: str
    description: str
    location: Optional[str] = ""
    salary: Optional[str] = ""
    job_type: Optional[str] = ""
    source: JobSource = JobSource.MANUAL
    url: Optional[str] = ""
    requirements: List[str] = []
    benefits: List[str] = []

class Job(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    company: str
    description: str
    location: Optional[str] = ""
    salary: Optional[str] = ""
    job_type: Optional[str] = ""
    source: JobSource
    url: Optional[str] = ""
    requirements: List[str] = []
    benefits: List[str] = []
    keywords_matched: List[str] = []
    relevance_score: float = 0.0
    discovered_at: datetime = Field(default_factory=datetime.utcnow)
    applied: bool = False
    applied_at: Optional[datetime] = None

class ApplicationCreate(BaseModel):
    job_id: str
    cover_letter_id: Optional[str] = None
    notes: Optional[str] = ""
    application_method: str = "email"  # email, website, portal, etc.

class Application(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    job_id: str
    cover_letter_id: Optional[str] = None
    status: ApplicationStatus = ApplicationStatus.PENDING
    applied_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = ""
    application_method: str = "email"
    follow_up_date: Optional[datetime] = None
    interview_date: Optional[datetime] = None

class CoverLetterCreate(BaseModel):
    job_id: str
    custom_prompt: Optional[str] = ""

class CoverLetter(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    job_id: str
    content: str
    job_title: str
    company: str
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    customizations: Optional[str] = ""

class EmailLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    recipient_email: str
    subject: str
    content: str
    application_id: Optional[str] = None
    sent_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = "sent"  # sent, failed, pending
    error_message: Optional[str] = None

class JobSearchRequest(BaseModel):
    keywords: List[str]
    location: Optional[str] = ""
    job_type: Optional[str] = ""
    platforms: Optional[List[JobSource]] = None
    max_results_per_platform: int = 50
