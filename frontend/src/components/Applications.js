import React, { useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);

      const response = await axios.get(`${API}/applications?${params}`);
      setApplications(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to load applications");
      console.error("Applications fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      await axios.put(`${API}/applications/${applicationId}/status`, null, {
        params: { status: newStatus }
      });
      fetchApplications();
      if (selectedApp?.id === applicationId) {
        setSelectedApp(prev => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      console.error("Status update error:", error);
      alert("Failed to update status");
    }
  };

  const sendApplicationEmail = async (applicationId) => {
    try {
      await axios.post(`${API}/emails/send-application`, null, {
        params: { application_id: applicationId }
      });
      alert("Application email queued for sending!");
    } catch (error) {
      console.error("Email send error:", error);
      alert("Failed to send email");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      applied: "bg-blue-100 text-blue-800",
      interviewing: "bg-purple-100 text-purple-800",
      rejected: "bg-red-100 text-red-800",
      offered: "bg-green-100 text-green-800",
      accepted: "bg-green-100 text-green-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: "⏳",
      applied: "📝",
      interviewing: "💼",
      rejected: "❌",
      offered: "🎉",
      accepted: "✅"
    };
    return icons[status] || "📄";
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Applications</h1>
            <p className="text-gray-600">
              Manage your job applications and track their status. {applications.length} applications found.
            </p>
          </div>
          <button
            onClick={fetchApplications}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Filter by Status</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setStatusFilter("")}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              statusFilter === "" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Applications
          </button>
          {["pending", "applied", "interviewing", "rejected", "offered", "accepted"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize ${
                statusFilter === status ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {getStatusIcon(status)} {status}
            </button>
          ))}
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

      {/* Applications Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications List */}
        <div className="space-y-4">
          {applications.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
              <p className="text-gray-600">
                Start applying to jobs to see them here.
              </p>
            </div>
          ) : (
            applications.map((app) => (
              <div
                key={app.id}
                className={`bg-white shadow rounded-lg p-6 cursor-pointer transition-colors ${
                  selectedApp?.id === app.id ? "ring-2 ring-blue-500" : "hover:bg-gray-50"
                }`}
                onClick={() => setSelectedApp(app)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      Application #{app.id.slice(-8)}
                    </h3>
                    <p className="text-gray-600">Job ID: {app.job_id.slice(-8)}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                    {getStatusIcon(app.status)} {app.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex justify-between">
                    <span>Applied:</span>
                    <span>{new Date(app.applied_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Method:</span>
                    <span className="capitalize">{app.application_method}</span>
                  </div>
                  {app.updated_at !== app.applied_at && (
                    <div className="flex justify-between">
                      <span>Updated:</span>
                      <span>{new Date(app.updated_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {app.notes && (
                  <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                    <strong>Notes:</strong> {app.notes}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Application Details Panel */}
        <div className="sticky top-6">
          {selectedApp ? (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Application Details
                  </h2>
                  <p className="text-gray-600">#{selectedApp.id.slice(-8)}</p>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Status Section */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Status</h3>
                  <div className="flex items-center space-x-3 mb-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedApp.status)}`}>
                      {getStatusIcon(selectedApp.status)} {selectedApp.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Update Status:
                    </label>
                    <select
                      value={selectedApp.status}
                      onChange={(e) => updateApplicationStatus(selectedApp.id, e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      <option value="pending">⏳ Pending</option>
                      <option value="applied">📝 Applied</option>
                      <option value="interviewing">💼 Interviewing</option>
                      <option value="rejected">❌ Rejected</option>
                      <option value="offered">🎉 Offered</option>
                      <option value="accepted">✅ Accepted</option>
                    </select>
                  </div>
                </div>

                {/* Application Info */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Application Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Job ID:</span>
                      <span className="font-mono">{selectedApp.job_id.slice(-8)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Applied Date:</span>
                      <span>{new Date(selectedApp.applied_at).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Last Updated:</span>
                      <span>{new Date(selectedApp.updated_at).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Method:</span>
                      <span className="capitalize">{selectedApp.application_method}</span>
                    </div>
                    {selectedApp.cover_letter_id && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Cover Letter:</span>
                        <span className="font-mono">{selectedApp.cover_letter_id.slice(-8)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Notes</h3>
                  {selectedApp.notes ? (
                    <div className="p-3 bg-gray-50 rounded-md text-sm">
                      {selectedApp.notes}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm italic">No notes available</p>
                  )}
                </div>

                {/* Important Dates */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Important Dates</h3>
                  <div className="space-y-2 text-sm">
                    {selectedApp.follow_up_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Follow-up Date:</span>
                        <span>{new Date(selectedApp.follow_up_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {selectedApp.interview_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Interview Date:</span>
                        <span>{new Date(selectedApp.interview_date).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3 pt-4 border-t">
                  <button
                    onClick={() => sendApplicationEmail(selectedApp.id)}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    📧 Send Application Email
                  </button>
                  
                  {selectedApp.cover_letter_id && (
                    <button
                      onClick={() => window.open(`/cover-letters/${selectedApp.cover_letter_id}`, '_blank')}
                      className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      📄 View Cover Letter
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">👈</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select an application</h3>
              <p className="text-gray-600">
                Click on an application from the list to view details and manage status.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Applications;