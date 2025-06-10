import asyncio
import aiohttp
from bs4 import BeautifulSoup
import logging
from typing import List, Dict, Any, Optional
from .models import Job, JobSource, JobSearchRequest
from datetime import datetime
import re
import os
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)

class ScraperService:
    def __init__(self):
        self.session = None
        self.user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        
    async def _get_session(self):
        """Get or create aiohttp session"""
        if not self.session:
            self.session = aiohttp.ClientSession(
                headers={"User-Agent": self.user_agent},
                timeout=aiohttp.ClientTimeout(total=30)
            )
        return self.session
    
    async def search_all_platforms(self, search_request: JobSearchRequest):
        """Search for jobs across all specified platforms"""
        platforms = search_request.platforms or [
            JobSource.FLEXJOBS, JobSource.REMOTIVE, JobSource.WEWORKREMOTELY,
            JobSource.REMOTE_CO, JobSource.CONTRA, JobSource.TOPTAL
        ]
        
        all_jobs = []
        
        for platform in platforms:
            try:
                logger.info(f"Searching jobs on {platform}")
                jobs = await self._search_platform(platform, search_request)
                all_jobs.extend(jobs)
                logger.info(f"Found {len(jobs)} jobs on {platform}")
                
                # Add delay between platforms to be respectful
                await asyncio.sleep(2)
                
            except Exception as e:
                logger.error(f"Error searching {platform}: {str(e)}")
                continue
        
        # Save jobs to database
        if all_jobs:
            await self._save_jobs_to_db(all_jobs)
        
        logger.info(f"Total jobs found: {len(all_jobs)}")
        return all_jobs
    
    async def _search_platform(self, platform: JobSource, search_request: JobSearchRequest) -> List[Job]:
        """Search for jobs on a specific platform"""
        if platform == JobSource.REMOTIVE:
            return await self._search_remotive(search_request)
        elif platform == JobSource.WEWORKREMOTELY:
            return await self._search_weworkremotely(search_request)
        elif platform == JobSource.REMOTE_CO:
            return await self._search_remote_co(search_request)
        elif platform == JobSource.FLEXJOBS:
            return await self._search_flexjobs(search_request)
        elif platform == JobSource.CONTRA:
            return await self._search_contra(search_request)
        elif platform == JobSource.TOPTAL:
            return await self._search_toptal(search_request)
        else:
            logger.warning(f"Platform {platform} not implemented yet")
            return []
    
    async def _search_remotive(self, search_request: JobSearchRequest) -> List[Job]:
        """Search Remotive for remote jobs"""
        jobs = []
        try:
            session = await self._get_session()
            
            # Remotive has an API-like structure
            keywords = " ".join(search_request.keywords)
            url = f"https://remotive.io/remote-jobs"
            
            async with session.get(url) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    # Parse job listings from Remotive
                    job_cards = soup.find_all('div', class_='job-tile')
                    
                    for card in job_cards[:search_request.max_results_per_platform]:
                        try:
                            title_elem = card.find('h3')
                            company_elem = card.find('h4')
                            description_elem = card.find('p')
                            link_elem = card.find('a')
                            
                            if title_elem and company_elem:
                                job = Job(
                                    title=title_elem.get_text(strip=True),
                                    company=company_elem.get_text(strip=True),
                                    description=description_elem.get_text(strip=True) if description_elem else "",
                                    location="Remote",
                                    source=JobSource.REMOTIVE,
                                    url=f"https://remotive.io{link_elem.get('href')}" if link_elem else "",
                                    job_type="remote",
                                    keywords_matched=self._find_keyword_matches(
                                        f"{title_elem.get_text()} {description_elem.get_text() if description_elem else ''}",
                                        search_request.keywords
                                    )
                                )
                                job.relevance_score = len(job.keywords_matched) / len(search_request.keywords) if search_request.keywords else 0
                                jobs.append(job)
                                
                        except Exception as e:
                            logger.error(f"Error parsing Remotive job card: {str(e)}")
                            continue
                            
        except Exception as e:
            logger.error(f"Error searching Remotive: {str(e)}")
        
        return jobs
    
    async def _search_weworkremotely(self, search_request: JobSearchRequest) -> List[Job]:
        """Search We Work Remotely"""
        jobs = []
        try:
            session = await self._get_session()
            url = "https://weworkremotely.com/remote-jobs"
            
            async with session.get(url) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    # Parse job listings
                    job_links = soup.find_all('a', class_='feature')
                    
                    for link in job_links[:search_request.max_results_per_platform]:
                        try:
                            title_elem = link.find('span', class_='title')
                            company_elem = link.find('span', class_='company')
                            region_elem = link.find('span', class_='region')
                            
                            if title_elem and company_elem:
                                job = Job(
                                    title=title_elem.get_text(strip=True),
                                    company=company_elem.get_text(strip=True),
                                    description="",  # Would need to fetch job detail page
                                    location=region_elem.get_text(strip=True) if region_elem else "Remote",
                                    source=JobSource.WEWORKREMOTELY,
                                    url=f"https://weworkremotely.com{link.get('href')}",
                                    job_type="remote",
                                    keywords_matched=self._find_keyword_matches(
                                        title_elem.get_text(),
                                        search_request.keywords
                                    )
                                )
                                job.relevance_score = len(job.keywords_matched) / len(search_request.keywords) if search_request.keywords else 0
                                jobs.append(job)
                                
                        except Exception as e:
                            logger.error(f"Error parsing WWR job: {str(e)}")
                            continue
                            
        except Exception as e:
            logger.error(f"Error searching We Work Remotely: {str(e)}")
        
        return jobs
    
    async def _search_remote_co(self, search_request: JobSearchRequest) -> List[Job]:
        """Search Remote.co"""
        jobs = []
        try:
            session = await self._get_session()
            url = "https://remote.co/remote-jobs/"
            
            async with session.get(url) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    # Parse job listings from Remote.co
                    job_cards = soup.find_all('div', class_='job_board_item')
                    
                    for card in job_cards[:search_request.max_results_per_platform]:
                        try:
                            title_link = card.find('a', class_='job_board_link')
                            company_elem = card.find('p', class_='job_board_company')
                            location_elem = card.find('p', class_='job_board_location')
                            
                            if title_link and company_elem:
                                job = Job(
                                    title=title_link.get_text(strip=True),
                                    company=company_elem.get_text(strip=True),
                                    description="",
                                    location=location_elem.get_text(strip=True) if location_elem else "Remote",
                                    source=JobSource.REMOTE_CO,
                                    url=title_link.get('href', ''),
                                    job_type="remote",
                                    keywords_matched=self._find_keyword_matches(
                                        title_link.get_text(),
                                        search_request.keywords
                                    )
                                )
                                job.relevance_score = len(job.keywords_matched) / len(search_request.keywords) if search_request.keywords else 0
                                jobs.append(job)
                                
                        except Exception as e:
                            logger.error(f"Error parsing Remote.co job: {str(e)}")
                            continue
                            
        except Exception as e:
            logger.error(f"Error searching Remote.co: {str(e)}")
        
        return jobs
    
    async def _search_flexjobs(self, search_request: JobSearchRequest) -> List[Job]:
        """Search FlexJobs (note: FlexJobs typically requires subscription)"""
        jobs = []
        try:
            # FlexJobs requires subscription for full access
            # This is a basic implementation that would need authentication
            session = await self._get_session()
            url = "https://www.flexjobs.com/jobs"
            
            async with session.get(url) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    # Basic parsing - would need to handle authentication
                    job_links = soup.find_all('a', href=re.compile(r'/jobs/'))
                    
                    for link in job_links[:10]:  # Limited due to subscription requirement
                        try:
                            title = link.get_text(strip=True)
                            if title and len(title) > 5:  # Basic validation
                                job = Job(
                                    title=title,
                                    company="Various",  # FlexJobs aggregates multiple companies
                                    description="FlexJobs listing - subscription required for details",
                                    location="Remote/Flexible",
                                    source=JobSource.FLEXJOBS,
                                    url=f"https://www.flexjobs.com{link.get('href')}",
                                    job_type="flexible",
                                    keywords_matched=self._find_keyword_matches(
                                        title,
                                        search_request.keywords
                                    )
                                )
                                job.relevance_score = len(job.keywords_matched) / len(search_request.keywords) if search_request.keywords else 0
                                jobs.append(job)
                                
                        except Exception as e:
                            logger.error(f"Error parsing FlexJobs listing: {str(e)}")
                            continue
                            
        except Exception as e:
            logger.error(f"Error searching FlexJobs: {str(e)}")
        
        return jobs
    
    async def _search_contra(self, search_request: JobSearchRequest) -> List[Job]:
        """Search Contra for freelance opportunities"""
        jobs = []
        try:
            session = await self._get_session()
            url = "https://contra.com/search"
            
            # Note: Contra might have anti-scraping measures
            async with session.get(url) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    # This would need to be updated based on Contra's actual structure
                    # Contra uses React, so might need Selenium for dynamic content
                    job_cards = soup.find_all('div', class_='project-card')
                    
                    for card in job_cards[:search_request.max_results_per_platform]:
                        try:
                            # Placeholder parsing - would need actual structure analysis
                            title_elem = card.find('h3') or card.find('h2')
                            description_elem = card.find('p')
                            
                            if title_elem:
                                job = Job(
                                    title=title_elem.get_text(strip=True),
                                    company="Contra Client",
                                    description=description_elem.get_text(strip=True) if description_elem else "",
                                    location="Remote",
                                    source=JobSource.CONTRA,
                                    url="https://contra.com",
                                    job_type="freelance",
                                    keywords_matched=self._find_keyword_matches(
                                        title_elem.get_text(),
                                        search_request.keywords
                                    )
                                )
                                job.relevance_score = len(job.keywords_matched) / len(search_request.keywords) if search_request.keywords else 0
                                jobs.append(job)
                                
                        except Exception as e:
                            logger.error(f"Error parsing Contra job: {str(e)}")
                            continue
                            
        except Exception as e:
            logger.error(f"Error searching Contra: {str(e)}")
        
        return jobs
    
    async def _search_toptal(self, search_request: JobSearchRequest) -> List[Job]:
        """Search Toptal for freelance opportunities"""
        jobs = []
        try:
            # Note: Toptal typically requires application/approval process
            # This is a basic implementation
            session = await self._get_session()
            url = "https://www.toptal.com/freelance-jobs"
            
            async with session.get(url) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    # Basic parsing for Toptal structure
                    job_elements = soup.find_all(['h3', 'h4'], string=re.compile(r'.*developer.*|.*engineer.*|.*analyst.*', re.I))
                    
                    for elem in job_elements[:search_request.max_results_per_platform]:
                        try:
                            title = elem.get_text(strip=True)
                            job = Job(
                                title=title,
                                company="Toptal Client",
                                description="Toptal freelance opportunity - application required",
                                location="Remote",
                                source=JobSource.TOPTAL,
                                url="https://www.toptal.com/freelance-jobs",
                                job_type="freelance",
                                keywords_matched=self._find_keyword_matches(
                                    title,
                                    search_request.keywords
                                )
                            )
                            job.relevance_score = len(job.keywords_matched) / len(search_request.keywords) if search_request.keywords else 0
                            jobs.append(job)
                            
                        except Exception as e:
                            logger.error(f"Error parsing Toptal job: {str(e)}")
                            continue
                            
        except Exception as e:
            logger.error(f"Error searching Toptal: {str(e)}")
        
        return jobs
    
    def _find_keyword_matches(self, text: str, keywords: List[str]) -> List[str]:
        """Find which keywords match in the given text"""
        if not keywords:
            return []
        
        text_lower = text.lower()
        matches = []
        
        for keyword in keywords:
            if keyword.lower() in text_lower:
                matches.append(keyword)
        
        return matches
    
    async def _save_jobs_to_db(self, jobs: List[Job]):
        """Save jobs to MongoDB, avoiding duplicates"""
        try:
            client = AsyncIOMotorClient(os.environ['MONGO_URL'])
            db = client[os.environ['DB_NAME']]
            
            for job in jobs:
                # Check if job already exists (by title, company, and source)
                existing = await db.jobs.find_one({
                    "title": job.title,
                    "company": job.company,
                    "source": job.source
                })
                
                if not existing:
                    await db.jobs.insert_one(job.dict())
                    logger.info(f"Saved new job: {job.title} at {job.company}")
                else:
                    logger.debug(f"Job already exists: {job.title} at {job.company}")
            
            client.close()
            
        except Exception as e:
            logger.error(f"Error saving jobs to database: {str(e)}")
    
    async def close(self):
        """Close the aiohttp session"""
        if self.session:
            await self.session.close()