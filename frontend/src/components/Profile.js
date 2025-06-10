import React, { useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/profile`);
      setProfile(response.data);
      setFormData(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to load profile");
      console.error("Profile fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const response = await axios.put(`${API}/profile`, formData);
      setProfile(response.data);
      setSuccess(true);
      setEditMode(false);
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError("Failed to save profile");
      console.error("Profile save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(profile);
    setEditMode(false);
    setError(null);
  };

  const updateArrayField = (field, index, value) => {
    const newArray = [...formData[field]];
    if (value === '') {
      newArray.splice(index, 1);
    } else {
      newArray[index] = value;
    }
    setFormData(prev => ({ ...prev, [field]: newArray }));
  };

  const addToArrayField = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), '']
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
            <button 
              onClick={fetchProfile}
              className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile</h1>
            <p className="text-gray-600">
              Manage your professional profile used for cover letter generation and job matching.
            </p>
          </div>
          <div className="space-x-3">
            {editMode ? (
              <>
                <button
                  onClick={handleCancel}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`px-4 py-2 rounded-md text-sm text-white ${
                    saving ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
                  }`}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-green-400 text-xl">✅</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Profile updated successfully!
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
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

      {/* Basic Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            {editMode ? (
              <input
                type="text"
                value={formData.full_name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            ) : (
              <p className="text-gray-900">{profile?.full_name || 'Not set'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            {editMode ? (
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            ) : (
              <p className="text-gray-900">{profile?.email || 'Not set'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            {editMode ? (
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            ) : (
              <p className="text-gray-900">{profile?.phone || 'Not set'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            {editMode ? (
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            ) : (
              <p className="text-gray-900">{profile?.location || 'Not set'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Professional Bio */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Professional Bio</h2>
        {editMode ? (
          <textarea
            value={formData.bio || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
            rows={6}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="Write a professional summary that will be used in cover letters..."
          />
        ) : (
          <div className="text-gray-900 whitespace-pre-wrap">
            {profile?.bio || 'No bio set'}
          </div>
        )}
      </div>

      {/* Skills */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Skills</h2>
        {editMode ? (
          <div className="space-y-2">
            {(formData.skills || []).map((skill, index) => (
              <div key={index} className="flex space-x-2">
                <input
                  type="text"
                  value={skill}
                  onChange={(e) => updateArrayField('skills', index, e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="Enter a skill"
                />
                <button
                  onClick={() => updateArrayField('skills', index, '')}
                  className="text-red-500 hover:text-red-700 px-2"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={() => addToArrayField('skills')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
            >
              Add Skill
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(profile?.skills || []).map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
              >
                {skill}
              </span>
            ))}
            {(!profile?.skills || profile.skills.length === 0) && (
              <p className="text-gray-500">No skills added yet</p>
            )}
          </div>
        )}
      </div>

      {/* Experience */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Experience</h2>
        {editMode ? (
          <div className="space-y-3">
            {(formData.experience || []).map((exp, index) => (
              <div key={index} className="flex space-x-2">
                <textarea
                  value={exp}
                  onChange={(e) => updateArrayField('experience', index, e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                  rows={2}
                  placeholder="Describe your experience"
                />
                <button
                  onClick={() => updateArrayField('experience', index, '')}
                  className="text-red-500 hover:text-red-700 px-2"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={() => addToArrayField('experience')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
            >
              Add Experience
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {(profile?.experience || []).map((exp, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-md">
                <p className="text-gray-900 text-sm">{exp}</p>
              </div>
            ))}
            {(!profile?.experience || profile.experience.length === 0) && (
              <p className="text-gray-500">No experience added yet</p>
            )}
          </div>
        )}
      </div>

      {/* Languages */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Languages</h2>
        {editMode ? (
          <div className="space-y-2">
            {(formData.languages || []).map((lang, index) => (
              <div key={index} className="flex space-x-2">
                <input
                  type="text"
                  value={lang}
                  onChange={(e) => updateArrayField('languages', index, e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="e.g., English (Native), Spanish (Fluent)"
                />
                <button
                  onClick={() => updateArrayField('languages', index, '')}
                  className="text-red-500 hover:text-red-700 px-2"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={() => addToArrayField('languages')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
            >
              Add Language
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(profile?.languages || []).map((lang, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
              >
                {lang}
              </span>
            ))}
            {(!profile?.languages || profile.languages.length === 0) && (
              <p className="text-gray-500">No languages added yet</p>
            )}
          </div>
        )}
      </div>

      {/* Job Preferences */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Job Preferences</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Preferred Job Types</h3>
            {editMode ? (
              <div className="space-y-2">
                {(formData.preferred_job_types || []).map((type, index) => (
                  <div key={index} className="flex space-x-2">
                    <input
                      type="text"
                      value={type}
                      onChange={(e) => updateArrayField('preferred_job_types', index, e.target.value)}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                      placeholder="e.g., remote, freelance, contract"
                    />
                    <button
                      onClick={() => updateArrayField('preferred_job_types', index, '')}
                      className="text-red-500 hover:text-red-700 px-2"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addToArrayField('preferred_job_types')}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                >
                  Add Job Type
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(profile?.preferred_job_types || []).map((type, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                  >
                    {type}
                  </span>
                ))}
                {(!profile?.preferred_job_types || profile.preferred_job_types.length === 0) && (
                  <p className="text-gray-500">No job type preferences set</p>
                )}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Target Keywords</h3>
            {editMode ? (
              <div className="space-y-2">
                {(formData.target_keywords || []).map((keyword, index) => (
                  <div key={index} className="flex space-x-2">
                    <input
                      type="text"
                      value={keyword}
                      onChange={(e) => updateArrayField('target_keywords', index, e.target.value)}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                      placeholder="e.g., machine learning, AI, translation"
                    />
                    <button
                      onClick={() => updateArrayField('target_keywords', index, '')}
                      className="text-red-500 hover:text-red-700 px-2"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addToArrayField('target_keywords')}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                >
                  Add Keyword
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(profile?.target_keywords || []).map((keyword, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800"
                  >
                    {keyword}
                  </span>
                ))}
                {(!profile?.target_keywords || profile.target_keywords.length === 0) && (
                  <p className="text-gray-500">No target keywords set</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Usage */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2">How Your Profile is Used</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <div className="flex items-start space-x-2">
            <span>📝</span>
            <p>Your bio and experience are used to generate personalized cover letters</p>
          </div>
          <div className="flex items-start space-x-2">
            <span>🔍</span>
            <p>Target keywords help match you with relevant job opportunities</p>
          </div>
          <div className="flex items-start space-x-2">
            <span>🎯</span>
            <p>Skills and preferences improve job recommendation accuracy</p>
          </div>
          <div className="flex items-start space-x-2">
            <span>🔒</span>
            <p>Your information is stored securely and only used for job search purposes</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;