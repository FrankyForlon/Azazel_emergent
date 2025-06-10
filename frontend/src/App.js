import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import axios from "axios";

// Import components
import Dashboard from "./components/Dashboard";
import JobDiscovery from "./components/JobDiscovery";
import JobList from "./components/JobList";
import Applications from "./components/Applications";
import CoverLetters from "./components/CoverLetters";
import Analytics from "./components/Analytics";
import Profile from "./components/Profile";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Navigation Component
const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { path: "/", label: "Dashboard", icon: "📊" },
    { path: "/discovery", label: "Job Discovery", icon: "🔍" },
    { path: "/jobs", label: "Job List", icon: "💼" },
    { path: "/applications", label: "Applications", icon: "📝" },
    { path: "/cover-letters", label: "Cover Letters", icon: "📄" },
    { path: "/analytics", label: "Analytics", icon: "📈" },
    { path: "/profile", label: "Profile", icon: "👤" }
  ];

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900">Job Search Agent</h1>
            </div>
            <div className="hidden md:flex space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 ${
                    location.pathname === item.path
                      ? "border-blue-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

function App() {
  const [apiStatus, setApiStatus] = useState("checking");

  useEffect(() => {
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    try {
      const response = await axios.get(`${API}/health`);
      setApiStatus("connected");
      console.log("API Health:", response.data);
    } catch (error) {
      setApiStatus("disconnected");
      console.error("API Health Check Failed:", error);
    }
  };

  return (
    <div className="App min-h-screen bg-gray-50">
      <BrowserRouter>
        <Navigation />
        
        {/* API Status Indicator */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  apiStatus === "connected" ? "bg-green-500" : 
                  apiStatus === "disconnected" ? "bg-red-500" : "bg-yellow-500"
                }`}></div>
                <span className="text-sm text-gray-600">
                  API Status: {apiStatus === "connected" ? "Connected" : 
                             apiStatus === "disconnected" ? "Disconnected" : "Checking..."}
                </span>
              </div>
              <button 
                onClick={checkApiHealth}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto py-6 px-4">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/discovery" element={<JobDiscovery />} />
            <Route path="/jobs" element={<JobList />} />
            <Route path="/applications" element={<Applications />} />
            <Route path="/cover-letters" element={<CoverLetters />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
}

export default App;