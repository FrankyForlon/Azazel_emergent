import React, { useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const JobList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    source: "",
    applied: "",
    limit: 50
  });
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.source) params.append('source', filters.source);
      if (filters.applied !== "") params.append('applied', filters.applied);
      params.append('limit', filters.limit);

      const response = await axios.get(`${API}/jobs?${params}`);
      setJobs(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to load jobs");
      console.error("Jobs fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToJob = async (jobId) => {
    try {
      // First generate cover letter
      const coverLetterResponse = await axios.post(`${API}/cover-letters/generate`, {
        job_id: jobId
      });

      // Then create application
      const applicationResponse = await axios.post(`${API}/applications`, {
        job_id: jobId,
        cover_letter_id: coverLetterResponse.data.id,
        application_method: "email"
      });

      alert("Application created successfully! Cover letter generated.");
      fetchJobs(); // Refresh to show updated applied status
    } catch (error) {
      console.error("Apply error:", error);
      alert("Failed to create application. Please try again.");
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (window.confirm("Are you sure you want to delete this job?")) {
      try {
        await axios.delete(`${API}/jobs/${jobId}`);
        fetchJobs();
        setSelectedJob(null);
      } catch (error) {
        console.error("Delete error:", error);
        alert("Failed to delete job.");
      }
    }
  };

  const getSourceBadgeColor = (source) => {
    const colors = {
      flexjobs: "bg-purple-100 text-purple-800",
      remotive: "bg-blue-100 text-blue-800",
      weworkremotely: "bg-green-100 text-green-800",
      remote_co: "bg-yellow-100 text-yellow-800",
      contra: "bg-pink-100 text-pink-800",
      toptal: "bg-indigo-100 text-indigo-800",
      upwork: "bg-red-100 text-red-800",
      manual: "bg-gray-100 text-gray-800"
    };
    return colors[source] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Job List</h1>
            <p className="text-gray-600">
              Discovered jobs from various platforms. Found {jobs.length} jobs.
            </p>
          </div>
          <button
            onClick={fetchJobs}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Source
            </label>
            <select
              value={filters.source}
              onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">All Sources</option>
              <option value="flexjobs">FlexJobs</option>
              <option value="remotive">Remotive</option>
              <option value="weworkremotely">We Work Remotely</option>
              <option value="remote_co">Remote.co</option>
              <option value="contra">Contra</option>
              <option value="toptal">Toptal</option>
              <option value="upwork">Upwork</option>
              <option value="manual">Manual</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Application Status
            </label>
            <select
              value={filters.applied}
              onChange={(e) => setFilters(prev => ({ ...prev, applied: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">All Jobs</option>
              <option value="false">Not Applied</option>
              <option value="true">Applied</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Results Limit
            </label>
            <select
              value={filters.limit}
              onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value={25}>25 jobs</option>
              <option value={50}>50 jobs</option>
              <option value={100}>100 jobs</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Job List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Jobs Grid */}
        <div className="space-y-4">
          {jobs.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600">
                Try running a job search or adjusting your filters.
              </p>
            </div>
          ) : (
            jobs.map((job) => (
              <div
                key={job.id}
                className={`bg-white shadow rounded-lg p-6 cursor-pointer transition-colors ${
                  selectedJob?.id === job.id ? "ring-2 ring-blue-500" : "hover:bg-gray-50"
                }`}
                onClick={() => setSelectedJob(job)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      {job.title}
                    </h3>
                    <p className="text-gray-600">{job.company}</p>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSourceBadgeColor(job.source)}`}>
                      {job.source}
                    </span>
                    {job.applied && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✅ Applied
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {job.description || "No description available"}
                  </p>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    {job.location && (
                      <span>📍 {job.location}</span>
                    )}
                    {job.job_type && (
                      <span>💼 {job.job_type}</span>
                    )}
                    {job.relevance_score > 0 && (
                      <span>🎯 {Math.round(job.relevance_score * 100)}% match</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(job.discovered_at).toLocaleDateString()}
                  </div>
                </div>

                {job.keywords_matched && job.keywords_matched.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {job.keywords_matched.slice(0, 3).map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-50 text-blue-700"
                      >
                        {keyword}
                      </span>
                    ))}
                    {job.keywords_matched.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{job.keywords_matched.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Job Details Panel */}
        <div className="sticky top-6">
          {selectedJob ? (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {selectedJob.title}
                  </h2>
                  <p className="text-gray-600">{selectedJob.company}</p>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Job Info */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Job Information</h3>
                  <div className="space-y-2 text-sm">
                    {selectedJob.location && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Location:</span>
                        <span>{selectedJob.location}</span>
                      </div>
                    )}
                    {selectedJob.job_type && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Type:</span>
                        <span className="capitalize">{selectedJob.job_type}</span>
                      </div>
                    )}
                    {selectedJob.salary && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Salary:</span>
                        <span>{selectedJob.salary}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Source:</span>
                      <span className="capitalize">{selectedJob.source}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Discovered:</span>
                      <span>{new Date(selectedJob.discovered_at).toLocaleDateString()}</span>
                    </div>
                    {selectedJob.relevance_score > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Match Score:</span>
                        <span>{Math.round(selectedJob.relevance_score * 100)}%</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {selectedJob.description && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Description</h3>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {selectedJob.description}
                    </p>
                  </div>
                )}

                {/* Keywords */}
                {selectedJob.keywords_matched && selectedJob.keywords_matched.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Matched Keywords</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.keywords_matched.map((keyword, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-50 text-blue-700"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-3 pt-4 border-t">
                  {selectedJob.url && (
                    <a
                      href={selectedJob.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium inline-block text-center"
                    >
                      🔗 View Original Job Posting
                    </a>
                  )}
                  
                  {!selectedJob.applied ? (
                    <button
                      onClick={() => handleApplyToJob(selectedJob.id)}
                      className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      📝 Apply to This Job
                    </button>
                  ) : (
                    <div className="w-full bg-green-100 text-green-800 px-4 py-2 rounded-md text-sm font-medium text-center">
                      ✅ Already Applied
                    </div>
                  )}
                  
                  <button
                    onClick={() => handleDeleteJob(selectedJob.id)}
                    className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    🗑️ Delete Job
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">👈</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a job</h3>
              <p className="text-gray-600">
                Click on a job from the list to view details and take actions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobList;