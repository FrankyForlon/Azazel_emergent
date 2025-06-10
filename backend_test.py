import requests
import unittest
import json
import time
from datetime import datetime

class JobSearchAgentAPITest(unittest.TestCase):
    def setUp(self):
        self.base_url = "https://73f109e4-52b9-4461-92fe-f2944df98f52.preview.emergentagent.com/api"
        self.job_id = None
        self.cover_letter_id = None
        self.application_id = None

    def test_01_health_check(self):
        """Test the health check endpoint"""
        print("\n🔍 Testing health check endpoint...")
        response = requests.get(f"{self.base_url}/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("services", data)
        print("✅ Health check endpoint is working")

    def test_02_get_profile(self):
        """Test getting user profile"""
        print("\n🔍 Testing get profile endpoint...")
        response = requests.get(f"{self.base_url}/profile")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["full_name"], "Peter Golub")
        self.assertEqual(data["email"], "peter.golub@gmail.com")
        print("✅ Get profile endpoint is working")

    def test_03_update_profile(self):
        """Test updating user profile"""
        print("\n🔍 Testing update profile endpoint...")
        # First get the current profile
        response = requests.get(f"{self.base_url}/profile")
        self.assertEqual(response.status_code, 200)
        profile = response.json()
        
        # Update a field
        original_location = profile["location"]
        profile["location"] = "Test Location"
        
        # Send the update
        response = requests.put(f"{self.base_url}/profile", json=profile)
        self.assertEqual(response.status_code, 200)
        updated_profile = response.json()
        self.assertEqual(updated_profile["location"], "Test Location")
        
        # Restore original value
        profile["location"] = original_location
        requests.put(f"{self.base_url}/profile", json=profile)
        print("✅ Update profile endpoint is working")

    def test_04_search_jobs(self):
        """Test job search initiation"""
        print("\n🔍 Testing job search endpoint...")
        search_data = {
            "keywords": ["machine learning", "AI", "translation"],
            "job_type": "remote",
            "platforms": ["remotive", "weworkremotely"],
            "max_results_per_platform": 10
        }
        response = requests.post(f"{self.base_url}/jobs/search", json=search_data)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("message", data)
        self.assertIn("search_id", data)
        self.assertIn("platforms", data)
        print("✅ Job search endpoint is working")

    def test_05_get_jobs(self):
        """Test getting jobs"""
        print("\n🔍 Testing get jobs endpoint...")
        # Wait a bit for jobs to be scraped
        time.sleep(2)
        
        response = requests.get(f"{self.base_url}/jobs?limit=10")
        self.assertEqual(response.status_code, 200)
        jobs = response.json()
        
        # There might not be jobs yet, but the endpoint should work
        self.assertIsInstance(jobs, list)
        
        if jobs:
            # Save a job ID for later tests
            self.__class__.job_id = jobs[0]["id"]
            print(f"Found {len(jobs)} jobs, saved job_id: {self.__class__.job_id}")
        else:
            print("No jobs found, creating a manual job for testing")
            self.test_06_create_job()
            
        print("✅ Get jobs endpoint is working")

    def test_06_create_job(self):
        """Test creating a job manually"""
        print("\n🔍 Testing create job endpoint...")
        job_data = {
            "title": "Test AI Translator",
            "company": "Test Company",
            "description": "This is a test job for machine learning and translation.",
            "location": "Remote",
            "job_type": "remote",
            "source": "manual",
            "url": "https://example.com/job",
            "requirements": ["Machine learning", "Translation"],
            "benefits": ["Remote work", "Flexible hours"]
        }
        response = requests.post(f"{self.base_url}/jobs", json=job_data)
        self.assertEqual(response.status_code, 200)
        job = response.json()
        self.__class__.job_id = job["id"]
        print(f"✅ Create job endpoint is working, created job_id: {self.__class__.job_id}")

    def test_07_get_specific_job(self):
        """Test getting a specific job"""
        if not hasattr(self.__class__, 'job_id') or not self.__class__.job_id:
            self.test_06_create_job()
            
        print(f"\n🔍 Testing get specific job endpoint for job_id: {self.__class__.job_id}...")
        response = requests.get(f"{self.base_url}/jobs/{self.__class__.job_id}")
        self.assertEqual(response.status_code, 200)
        job = response.json()
        self.assertEqual(job["id"], self.__class__.job_id)
        print("✅ Get specific job endpoint is working")

    def test_08_generate_cover_letter(self):
        """Test generating a cover letter"""
        if not hasattr(self.__class__, 'job_id') or not self.__class__.job_id:
            self.test_06_create_job()
            
        print(f"\n🔍 Testing generate cover letter endpoint for job_id: {self.__class__.job_id}...")
        data = {
            "job_id": self.__class__.job_id
        }
        response = requests.post(f"{self.base_url}/cover-letters/generate", json=data)
        self.assertEqual(response.status_code, 200)
        cover_letter = response.json()
        self.__class__.cover_letter_id = cover_letter["id"]
        self.assertEqual(cover_letter["job_id"], self.__class__.job_id)
        self.assertIn("content", cover_letter)
        print(f"✅ Generate cover letter endpoint is working, created cover_letter_id: {self.__class__.cover_letter_id}")

    def test_09_get_cover_letters(self):
        """Test getting cover letters"""
        print("\n🔍 Testing get cover letters endpoint...")
        response = requests.get(f"{self.base_url}/cover-letters")
        self.assertEqual(response.status_code, 200)
        cover_letters = response.json()
        self.assertIsInstance(cover_letters, list)
        print(f"Found {len(cover_letters)} cover letters")
        print("✅ Get cover letters endpoint is working")

    def test_10_get_specific_cover_letter(self):
        """Test getting a specific cover letter"""
        if not hasattr(self.__class__, 'cover_letter_id') or not self.__class__.cover_letter_id:
            self.test_08_generate_cover_letter()
            
        print(f"\n🔍 Testing get specific cover letter endpoint for cover_letter_id: {self.__class__.cover_letter_id}...")
        response = requests.get(f"{self.base_url}/cover-letters/{self.__class__.cover_letter_id}")
        self.assertEqual(response.status_code, 200)
        cover_letter = response.json()
        self.assertEqual(cover_letter["id"], self.__class__.cover_letter_id)
        print("✅ Get specific cover letter endpoint is working")

    def test_11_create_application(self):
        """Test creating an application"""
        if not hasattr(self.__class__, 'job_id') or not self.__class__.job_id:
            self.test_06_create_job()
        if not hasattr(self.__class__, 'cover_letter_id') or not self.__class__.cover_letter_id:
            self.test_08_generate_cover_letter()
            
        print(f"\n🔍 Testing create application endpoint...")
        data = {
            "job_id": self.__class__.job_id,
            "cover_letter_id": self.__class__.cover_letter_id,
            "notes": "Test application",
            "application_method": "email"
        }
        response = requests.post(f"{self.base_url}/applications", json=data)
        self.assertEqual(response.status_code, 200)
        application = response.json()
        self.__class__.application_id = application["id"]
        self.assertEqual(application["job_id"], self.__class__.job_id)
        self.assertEqual(application["cover_letter_id"], self.__class__.cover_letter_id)
        print(f"✅ Create application endpoint is working, created application_id: {self.__class__.application_id}")

    def test_12_get_applications(self):
        """Test getting applications"""
        print("\n🔍 Testing get applications endpoint...")
        response = requests.get(f"{self.base_url}/applications")
        self.assertEqual(response.status_code, 200)
        applications = response.json()
        self.assertIsInstance(applications, list)
        print(f"Found {len(applications)} applications")
        print("✅ Get applications endpoint is working")

    def test_13_update_application_status(self):
        """Test updating application status"""
        if not hasattr(self.__class__, 'application_id') or not self.__class__.application_id:
            self.test_11_create_application()
            
        print(f"\n🔍 Testing update application status endpoint for application_id: {self.__class__.application_id}...")
        response = requests.put(f"{self.base_url}/applications/{self.__class__.application_id}/status", params={"status": "interviewing"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("message", data)
        
        # Verify the status was updated
        response = requests.get(f"{self.base_url}/applications")
        applications = response.json()
        for app in applications:
            if app["id"] == self.__class__.application_id:
                self.assertEqual(app["status"], "interviewing")
                break
        print("✅ Update application status endpoint is working")

    def test_14_send_application_email(self):
        """Test sending application email"""
        if not hasattr(self.__class__, 'application_id') or not self.__class__.application_id:
            self.test_11_create_application()
            
        print(f"\n🔍 Testing send application email endpoint for application_id: {self.__class__.application_id}...")
        response = requests.post(f"{self.base_url}/emails/send-application", params={"application_id": self.__class__.application_id})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("message", data)
        print("✅ Send application email endpoint is working")

    def test_15_get_email_logs(self):
        """Test getting email logs"""
        print("\n🔍 Testing get email logs endpoint...")
        response = requests.get(f"{self.base_url}/emails/logs")
        self.assertEqual(response.status_code, 200)
        logs = response.json()
        self.assertIsInstance(logs, list)
        print(f"Found {len(logs)} email logs")
        print("✅ Get email logs endpoint is working")

    def test_16_get_analytics(self):
        """Test getting analytics"""
        print("\n🔍 Testing get analytics endpoint...")
        response = requests.get(f"{self.base_url}/analytics/dashboard")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("metrics", data)
        self.assertIn("recent_jobs", data)
        self.assertIn("recent_applications", data)
        print("✅ Get analytics endpoint is working")

    def test_17_delete_job(self):
        """Test deleting a job"""
        if not hasattr(self.__class__, 'job_id') or not self.__class__.job_id:
            self.test_06_create_job()
            
        print(f"\n🔍 Testing delete job endpoint for job_id: {self.__class__.job_id}...")
        response = requests.delete(f"{self.base_url}/jobs/{self.__class__.job_id}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("message", data)
        print("✅ Delete job endpoint is working")

if __name__ == "__main__":
    # Run tests in order
    test_suite = unittest.TestSuite()
    test_suite.addTest(JobSearchAgentAPITest('test_01_health_check'))
    test_suite.addTest(JobSearchAgentAPITest('test_02_get_profile'))
    test_suite.addTest(JobSearchAgentAPITest('test_03_update_profile'))
    test_suite.addTest(JobSearchAgentAPITest('test_04_search_jobs'))
    test_suite.addTest(JobSearchAgentAPITest('test_05_get_jobs'))
    test_suite.addTest(JobSearchAgentAPITest('test_06_create_job'))
    test_suite.addTest(JobSearchAgentAPITest('test_07_get_specific_job'))
    test_suite.addTest(JobSearchAgentAPITest('test_08_generate_cover_letter'))
    test_suite.addTest(JobSearchAgentAPITest('test_09_get_cover_letters'))
    test_suite.addTest(JobSearchAgentAPITest('test_10_get_specific_cover_letter'))
    test_suite.addTest(JobSearchAgentAPITest('test_11_create_application'))
    test_suite.addTest(JobSearchAgentAPITest('test_12_get_applications'))
    test_suite.addTest(JobSearchAgentAPITest('test_13_update_application_status'))
    test_suite.addTest(JobSearchAgentAPITest('test_14_send_application_email'))
    test_suite.addTest(JobSearchAgentAPITest('test_15_get_email_logs'))
    test_suite.addTest(JobSearchAgentAPITest('test_16_get_analytics'))
    test_suite.addTest(JobSearchAgentAPITest('test_17_delete_job'))
    
    runner = unittest.TextTestRunner(verbosity=2)
    runner.run(test_suite)
