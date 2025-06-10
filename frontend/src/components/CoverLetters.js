import React, { useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CoverLetters = () => {
  const [coverLetters, setCoverLetters] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [generatingFor, setGeneratingFor] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lettersResponse, jobsResponse] = await Promise.all([
        axios.get(`${API}/cover-letters`),
        axios.get(`${API}/jobs?applied=false&limit=20`)
      ]);
      
      setCoverLetters(lettersResponse.data);
      setJobs(jobsResponse.data);
      setError(null);
    } catch (err) {
      setError("Failed to load cover letters");
      console.error("Cover letters fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateCoverLetter = async (jobId) => {
    try {
      setGeneratingFor(jobId);
      const response = await axios.post(`${API}/cover-letters/generate`, {
        job_id: jobId
      });
      
      setCoverLetters(prev => [response.data, ...prev]);
      setSelectedLetter(response.data);
      alert("Cover letter generated successfully!");
    } catch (error) {
      console.error("Generation error:", error);
      alert("Failed to generate cover letter. Please try again.");
    } finally {
      setGeneratingFor(null);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert("Cover letter copied to clipboard!");
    }).catch(() => {
      alert("Failed to copy to clipboard");
    });
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Cover Letters</h1>
            <p className="text-gray-600">
              AI-generated personalized cover letters for your job applications. {coverLetters.length} cover letters generated.
            </p>
          </div>
          <button
            onClick={fetchData}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
          >
            🔄 Refresh
          </button>
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

      {/* Generate New Cover Letter */}
      {jobs.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Generate New Cover Letter</h2>
          <p className="text-gray-600 mb-4">
            Select a job to generate a personalized cover letter using AI.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.slice(0, 6).map((job) => (
              <div key={job.id} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-1">{job.title}</h3>
                <p className="text-gray-600 text-sm mb-2">{job.company}</p>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    {job.source}
                  </span>
                  <button
                    onClick={() => generateCoverLetter(job.id)}
                    disabled={generatingFor === job.id}
                    className={`px-3 py-1 rounded text-xs font-medium ${
                      generatingFor === job.id
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-green-500 hover:bg-green-600 text-white"
                    }`}
                  >
                    {generatingFor === job.id ? "Generating..." : "Generate"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cover Letters Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cover Letters List */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-gray-900">Generated Cover Letters</h2>
          
          {coverLetters.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">📄</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No cover letters yet</h3>
              <p className="text-gray-600">
                Generate your first cover letter from a job listing above.
              </p>
            </div>
          ) : (
            coverLetters.map((letter) => (
              <div
                key={letter.id}
                className={`bg-white shadow rounded-lg p-6 cursor-pointer transition-colors ${
                  selectedLetter?.id === letter.id ? "ring-2 ring-blue-500" : "hover:bg-gray-50"
                }`}
                onClick={() => setSelectedLetter(letter)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      {letter.job_title}
                    </h3>
                    <p className="text-gray-600">{letter.company}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">
                      {new Date(letter.generated_at).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Job: {letter.job_id.slice(-8)}
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {letter.content.substring(0, 200)}...
                  </p>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">
                    {letter.content.length} characters
                  </span>
                  <span className="text-blue-500 hover:text-blue-600">
                    Click to view full letter →
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cover Letter Details Panel */}
        <div className="sticky top-6">
          {selectedLetter ? (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Cover Letter
                  </h2>
                  <p className="text-gray-600">{selectedLetter.job_title} at {selectedLetter.company}</p>
                </div>
                <button
                  onClick={() => setSelectedLetter(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Letter Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Generated:</span>
                      <div>{new Date(selectedLetter.generated_at).toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Word Count:</span>
                      <div>{selectedLetter.content.split(' ').length} words</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Job ID:</span>
                      <div className="font-mono">{selectedLetter.job_id.slice(-8)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Letter ID:</span>
                      <div className="font-mono">{selectedLetter.id.slice(-8)}</div>
                    </div>
                  </div>
                </div>

                {/* Letter Content */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium text-gray-900">Cover Letter Content</h3>
                    <button
                      onClick={() => copyToClipboard(selectedLetter.content)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                    >
                      📋 Copy
                    </button>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                      {selectedLetter.content}
                    </pre>
                  </div>
                </div>

                {/* Customizations */}
                {selectedLetter.customizations && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Customizations</h3>
                    <div className="bg-yellow-50 rounded-lg p-3 text-sm text-yellow-800">
                      {selectedLetter.customizations}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-3 pt-4 border-t">
                  <button
                    onClick={() => copyToClipboard(selectedLetter.content)}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    📋 Copy to Clipboard
                  </button>
                  
                  <button
                    onClick={() => {
                      const blob = new Blob([selectedLetter.content], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `cover-letter-${selectedLetter.company}-${selectedLetter.job_title}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    💾 Download as Text File
                  </button>

                  <button
                    onClick={() => {
                      const emailBody = encodeURIComponent(selectedLetter.content);
                      const subject = encodeURIComponent(`Application for ${selectedLetter.job_title} position`);
                      window.open(`mailto:?subject=${subject}&body=${emailBody}`);
                    }}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    📧 Open in Email Client
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">👈</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a cover letter</h3>
              <p className="text-gray-600">
                Click on a cover letter from the list to view, copy, or download it.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Cover Letter Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <span className="text-blue-500">💡</span>
              <p>Each cover letter is personalized using AI based on your profile and the job description.</p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-500">💡</span>
              <p>Review and customize the generated content before sending to match your voice.</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <span className="text-blue-500">💡</span>
              <p>Generated letters highlight your relevant experience for each specific role.</p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-500">💡</span>
              <p>Use the copy function to paste into job application forms or email clients.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoverLetters;