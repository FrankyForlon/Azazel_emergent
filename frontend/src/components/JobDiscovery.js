import React, { useState } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const JobDiscovery = () => {
  const [searchParams, setSearchParams] = useState({
    keywords: ["machine learning", "AI", "translation", "linguistic", "quality assessment"],
    location: "",
    jobType: "remote",
    platforms: [],
    maxResultsPerPlatform: 50
  });
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [newKeyword, setNewKeyword] = useState("");

  const platforms = [
    { id: "flexjobs", name: "FlexJobs", icon: "💼" },
    { id: "remotive", name: "Remotive", icon: "🌍" },
    { id: "weworkremotely", name: "We Work Remotely", icon: "💻" },
    { id: "remote_co", name: "Remote.co", icon: "🏠" },
    { id: "contra", name: "Contra", icon: "🎯" },
    { id: "toptal", name: "Toptal", icon: "⭐" },
    { id: "upwork", name: "Upwork", icon: "🔗" }
  ];

  const handleKeywordAdd = () => {
    if (newKeyword.trim() && !searchParams.keywords.includes(newKeyword.trim())) {
      setSearchParams(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()]
      }));
      setNewKeyword("");
    }
  };

  const handleKeywordRemove = (keyword) => {
    setSearchParams(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  const handlePlatformToggle = (platformId) => {
    setSearchParams(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter(p => p !== platformId)
        : [...prev.platforms, platformId]
    }));
  };

  const handleSearch = async () => {
    try {
      setIsSearching(true);
      setSearchResults(null);
      
      const searchData = {
        keywords: searchParams.keywords,
        location: searchParams.location,
        job_type: searchParams.jobType,
        platforms: searchParams.platforms.length > 0 ? searchParams.platforms : null,
        max_results_per_platform: searchParams.maxResultsPerPlatform
      };

      const response = await axios.post(`${API}/jobs/search`, searchData);
      setSearchResults(response.data);
      
      // Show success message
      alert(`Job search initiated successfully! Searching across ${searchData.platforms?.length || 7} platforms.`);
      
    } catch (error) {
      console.error("Search error:", error);
      alert("Failed to start job search. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Job Discovery</h1>
        <p className="text-gray-600">
          Configure and launch automated job searches across multiple platforms.
        </p>
      </div>

      {/* Search Configuration */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Search Configuration</h2>
        
        {/* Keywords */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Keywords
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {searchParams.keywords.map((keyword, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
              >
                {keyword}
                <button
                  onClick={() => handleKeywordRemove(keyword)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleKeywordAdd()}
              placeholder="Add new keyword"
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
            <button
              onClick={handleKeywordAdd}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
            >
              Add
            </button>
          </div>
        </div>

        {/* Location and Job Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location (optional)
            </label>
            <input
              type="text"
              value={searchParams.location}
              onChange={(e) => setSearchParams(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g., San Francisco, Remote"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Type
            </label>
            <select
              value={searchParams.jobType}
              onChange={(e) => setSearchParams(prev => ({ ...prev, jobType: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">Any</option>
              <option value="remote">Remote</option>
              <option value="freelance">Freelance</option>
              <option value="contract">Contract</option>
              <option value="part-time">Part-time</option>
              <option value="full-time">Full-time</option>
            </select>
          </div>
        </div>

        {/* Platforms */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Platforms (leave empty to search all)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {platforms.map((platform) => (
              <label
                key={platform.id}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={searchParams.platforms.includes(platform.id)}
                  onChange={() => handlePlatformToggle(platform.id)}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">
                  {platform.icon} {platform.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Max Results */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Results per Platform
          </label>
          <input
            type="number"
            value={searchParams.maxResultsPerPlatform}
            onChange={(e) => setSearchParams(prev => ({ 
              ...prev, 
              maxResultsPerPlatform: parseInt(e.target.value) || 50 
            }))}
            min="10"
            max="100"
            className="w-32 border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={isSearching || searchParams.keywords.length === 0}
          className={`w-full md:w-auto px-6 py-3 rounded-md text-white font-medium ${
            isSearching || searchParams.keywords.length === 0
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {isSearching ? (
            <>
              <span className="animate-spin inline-block mr-2">⏳</span>
              Searching Jobs...
            </>
          ) : (
            <>
              🔍 Start Job Search
            </>
          )}
        </button>
      </div>

      {/* Search Results */}
      {searchResults && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Search Initiated</h2>
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-green-400 text-xl">✅</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Job search started successfully!
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Search ID: {searchResults.search_id}</p>
                  <p>Platforms: {searchResults.platforms.join(", ")}</p>
                  <p>
                    The job search is running in the background. 
                    Check the Job List page in a few minutes to see discovered jobs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Tips for Better Results</h2>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start space-x-2">
            <span className="text-blue-500">💡</span>
            <p>Use specific keywords related to your skills and desired roles</p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-500">💡</span>
            <p>Include variations of your key skills (e.g., "ML", "machine learning")</p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-500">💡</span>
            <p>Some platforms may require manual verification for access</p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-500">💡</span>
            <p>Job discovery runs automatically - results appear in the Job List</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDiscovery;