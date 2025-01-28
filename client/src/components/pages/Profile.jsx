import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { UserContext } from "../App";
import StarryBackground from "../modules/StarryBackground";
import MiniGallery from "../modules/MiniGallery";
import "./Profile.css";

const Profile = () => {
  const navigate = useNavigate();
  const { userId } = useParams(); // Get userId from URL
  const { userId: currentUserId, userProfile, setUserProfile } = useContext(UserContext);
  const [profile, setProfile] = useState(null);
  const [publicDreams, setPublicDreams] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState({
    name: "",
    bio: "",
    socialLinks: {
      website: "",
      twitter: "",
      instagram: "",
    },
    preferences: {
      emailNotifications: true,
      displayFullName: true,
    },
  });

  // Fetch profile data and public dreams
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileResponse, dreamsResponse] = await Promise.all([
          fetch(`/api/profile/${userId || currentUserId}`, {
            credentials: "include",
          }),
          fetch(`/api/dreams/public/${userId || currentUserId}`)
        ]);

        const profileData = await profileResponse.json();
        const dreamsData = await dreamsResponse.json();

        setProfile(profileData);
        setPublicDreams(dreamsData);
        setEditForm({
          name: profileData.name || "",
          bio: profileData.bio || "",
          socialLinks: profileData.socialLinks || {},
          preferences: profileData.preferences || {},
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUserId) {
      fetchData();
    }
  }, [userId, currentUserId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setIsEditing(false);
      setUserProfile((prev) => ({
        ...prev,
        name: updatedProfile.name,
        bio: updatedProfile.bio,
        socialLinks: updatedProfile.socialLinks,
        preferences: updatedProfile.preferences,
      }));

      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  if (!currentUserId) {
    navigate("/");
    return null;
  }

  if (loading) {
    return <div className="profile-loading">Loading profile...</div>;
  }

  const isOwnProfile = !userId || userId === currentUserId;

  return (
    <div className="Profile-container">
      <StarryBackground />
      <div className="u-flex">
        <h1>Profile</h1>
      </div>

      <div className="profile-content">
        <div className="profile-header">
          <div className="profile-avatar-container">
            <img
              src="/assets/profilepic.png"
              alt="Profile"
              className="profile-avatar"
            />
          </div>
          <div className="profile-info">
            <h1>{userProfile?.name || profile?.name || "Dreamer"}</h1>
            <div className="profile-stats">
              <div className="stat">
                <span className="stat-value">{publicDreams.length}</span>
                <span className="stat-label">Public Dreams</span>
              </div>
            </div>
          </div>
          {isOwnProfile && (
            <button
              className="edit-profile-button"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="profile-edit-form">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Your name"
              />
            </div>
            <div className="form-group">
              <label>Bio</label>
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                placeholder="Tell us about yourself"
              />
            </div>
            <div className="form-group">
              <label>Social Links</label>
              <input
                type="url"
                value={editForm.socialLinks.website || ""}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    socialLinks: { ...editForm.socialLinks, website: e.target.value },
                  })
                }
                placeholder="Website URL"
              />
              <input
                type="text"
                value={editForm.socialLinks.twitter || ""}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    socialLinks: { ...editForm.socialLinks, twitter: e.target.value },
                  })
                }
                placeholder="Twitter username"
              />
              <input
                type="text"
                value={editForm.socialLinks.instagram || ""}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    socialLinks: { ...editForm.socialLinks, instagram: e.target.value },
                  })
                }
                placeholder="Instagram username"
              />
            </div>
            <div className="form-group">
              <label>Preferences</label>
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={editForm.preferences.emailNotifications}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        preferences: {
                          ...editForm.preferences,
                          emailNotifications: e.target.checked,
                        },
                      })
                    }
                  />
                  Receive email notifications
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={editForm.preferences.displayFullName}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        preferences: {
                          ...editForm.preferences,
                          displayFullName: e.target.checked,
                        },
                      })
                    }
                  />
                  Display full name
                </label>
              </div>
            </div>
            <button type="submit" className="save-profile-button">
              Save Profile
            </button>
          </form>
        ) : (
          <div className="profile-details">
            {profile?.bio && <p className="profile-bio">{profile.bio}</p>}
            {profile?.socialLinks && Object.keys(profile.socialLinks).length > 0 && (
              <div className="profile-social-links">
                {profile.socialLinks.website && (
                  <a href={profile.socialLinks.website} target="_blank" rel="noopener noreferrer">
                    🌐 Website
                  </a>
                )}
                {profile.socialLinks.twitter && (
                  <a href={`https://twitter.com/${profile.socialLinks.twitter}`} target="_blank" rel="noopener noreferrer">
                    🐦 Twitter
                  </a>
                )}
                {profile.socialLinks.instagram && (
                  <a href={`https://instagram.com/${profile.socialLinks.instagram}`} target="_blank" rel="noopener noreferrer">
                    📸 Instagram
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        <div className="profile-dreams">
          <h2>Public Dreams</h2>
          <MiniGallery dreams={publicDreams} userId={currentUserId} />
          {publicDreams.length === 0 && (
            <p className="no-dreams">No public dreams yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
