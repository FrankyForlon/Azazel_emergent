import React, { useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [emailLogs, setEmailLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [analyticsResponse, emailLogsResponse] = await Promise.all([
        axios.get(`${API}/analytics/dashboard`),
        axios.get(`${API}/emails/logs`)
      ]);
      
      setAnalytics(analyticsResponse.data);
      setEmailLogs(emailLogsResponse.data);
      setError(null);
    } catch (err) {
      setError("Failed to load analytics data");
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
            <button 
              onClick={fetchAnalyticsData}
              className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const metrics = analytics?.metrics || {};
  const recentJobs = analytics?.recent_jobs || [];
  const recentApplications = analytics?.recent_applications || [];

  // Calculate success rates
  const totalApplications = metrics.total_applications || 0;
  const interviewRate = totalApplications > 0 ? ((metrics.interviewing || 0) / totalApplications * 100) : 0;
  const rejectionRate = totalApplications > 0 ? ((metrics.rejected || 0) / totalApplications * 100) : 0;
  const pendingRate = totalApplications > 0 ? ((metrics.pending_applications || 0) / totalApplications * 100) : 0;

  // Email statistics
  const sentEmails = emailLogs.filter(log => log.status === 'sent').length;
  const failedEmails = emailLogs.filter(log => log.status === 'failed').length;
  const emailSuccessRate = emailLogs.length > 0 ? (sentEmails / emailLogs.length * 100) : 0;

  // Job source distribution
  const jobSourceCounts = {};
  recentJobs.forEach(job => {
    jobSourceCounts[job.source] = (jobSourceCounts[job.source] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics</h1>
            <p className="text-gray-600">
              Insights and statistics about your job search performance.
            </p>
          </div>
          <button
            onClick={fetchAnalyticsData}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                  📊
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Application Rate
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {metrics.total_jobs_discovered > 0 
                      ? Math.round((totalApplications / metrics.total_jobs_discovered) * 100)
                      : 0}%
                  </dd>
                  <dd className="text-xs text-gray-500">
                    {totalApplications} of {metrics.total_jobs_discovered} jobs
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                  💼
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Interview Rate
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {Math.round(interviewRate)}%
                  </dd>
                  <dd className="text-xs text-gray-500">
                    {metrics.interviewing || 0} interviews
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                  ⏳
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pending Rate
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {Math.round(pendingRate)}%
                  </dd>
                  <dd className="text-xs text-gray-500">
                    {metrics.pending_applications || 0} pending
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center">
                  📧
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Email Success
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {Math.round(emailSuccessRate)}%
                  </dd>
                  <dd className="text-xs text-gray-500">
                    {sentEmails} of {emailLogs.length} emails
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application Status Breakdown */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Application Status Breakdown</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-400 rounded mr-3"></div>
                <span className="text-sm text-gray-600">Pending</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{metrics.pending_applications || 0}</div>
                <div className="text-xs text-gray-500">{Math.round(pendingRate)}%</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-400 rounded mr-3"></div>
                <span className="text-sm text-gray-600">Applied</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{totalApplications}</div>
                <div className="text-xs text-gray-500">100%</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-purple-400 rounded mr-3"></div>
                <span className="text-sm text-gray-600">Interviewing</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{metrics.interviewing || 0}</div>
                <div className="text-xs text-gray-500">{Math.round(interviewRate)}%</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-400 rounded mr-3"></div>
                <span className="text-sm text-gray-600">Rejected</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{metrics.rejected || 0}</div>
                <div className="text-xs text-gray-500">{Math.round(rejectionRate)}%</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-400 rounded mr-3"></div>
                <span className="text-sm text-gray-600">Offered</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{metrics.offered || 0}</div>
                <div className="text-xs text-gray-500">0%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Job Source Distribution */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Job Sources</h3>
          <div className="space-y-3">
            {Object.entries(jobSourceCounts).length === 0 ? (
              <p className="text-gray-500 text-center py-4">No job sources data available</p>
            ) : (
              Object.entries(jobSourceCounts)
                .sort(([,a], [,b]) => b - a)
                .map(([source, count]) => (
                  <div key={source} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-400 rounded-full mr-3"></div>
                      <span className="text-sm text-gray-600 capitalize">{source}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{count}</div>
                      <div className="text-xs text-gray-500">
                        {Math.round((count / recentJobs.length) * 100)}%
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Email Activity */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Email Activity</h3>
        {emailLogs.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No email activity yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sent
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {emailLogs.slice(0, 10).map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.recipient_email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="truncate max-w-xs">{log.subject}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        log.status === 'sent' 
                          ? 'bg-green-100 text-green-800'
                          : log.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {log.status === 'sent' ? '✅' : log.status === 'failed' ? '❌' : '⏳'} {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.sent_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Performance Insights */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Strengths</h4>
            <div className="space-y-2 text-sm">
              {emailSuccessRate >= 80 && (
                <div className="flex items-center text-green-600">
                  <span className="mr-2">✅</span>
                  High email delivery success rate
                </div>
              )}
              {interviewRate >= 10 && (
                <div className="flex items-center text-green-600">
                  <span className="mr-2">✅</span>
                  Good interview conversion rate
                </div>
              )}
              {metrics.total_jobs_discovered >= 50 && (
                <div className="flex items-center text-green-600">
                  <span className="mr-2">✅</span>
                  Strong job discovery pipeline
                </div>
              )}
              {totalApplications >= 10 && (
                <div className="flex items-center text-green-600">
                  <span className="mr-2">✅</span>
                  Active application activity
                </div>
              )}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Areas for Improvement</h4>
            <div className="space-y-2 text-sm">
              {totalApplications === 0 && (
                <div className="flex items-center text-yellow-600">
                  <span className="mr-2">⚠️</span>
                  Start applying to discovered jobs
                </div>
              )}
              {interviewRate < 5 && totalApplications > 5 && (
                <div className="flex items-center text-yellow-600">
                  <span className="mr-2">⚠️</span>
                  Consider improving application materials
                </div>
              )}
              {emailSuccessRate < 80 && emailLogs.length > 0 && (
                <div className="flex items-center text-yellow-600">
                  <span className="mr-2">⚠️</span>
                  Check email delivery issues
                </div>
              )}
              {metrics.total_jobs_discovered < 20 && (
                <div className="flex items-center text-yellow-600">
                  <span className="mr-2">⚠️</span>
                  Expand job search to more platforms
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;