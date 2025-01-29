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
    picture: null,
  });

  const isOwnProfile = !userId || userId === currentUserId;

  // Fetch profile data and public dreams
  useEffect(() => {
    const fetchData = async () => {
      try {
        const targetUserId = userId || currentUserId;
        const [profileResponse, publicDreamsResponse, totalDreamsResponse] = await Promise.all([
          fetch(`/api/profile/${targetUserId}`),
          fetch(`/api/dreams/public/${targetUserId}`),
          fetch(`/api/dreams/count/${targetUserId}`),
        ]);

        if (!profileResponse.ok) {
          throw new Error("Failed to fetch profile");
        }

        const profileData = await profileResponse.json();
        const dreamsData = await publicDreamsResponse.json();
        const totalDreamsData = await totalDreamsResponse.json();

        setProfile({ ...profileData, totalDreams: totalDreamsData.count });
        setPublicDreams(dreamsData);

        if (isOwnProfile) {
          setEditForm({
            name: profileData.name || "",
            bio: profileData.bio || "",
            picture: profileData.picture || null,
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        // If profile not found, create a default view
        setProfile({
          name: "Anonymous Dreamer",
          bio: "",
          picture: "/assets/profilepic.png",
          totalDreams: 0,
          publicDreamCount: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    if (currentUserId) {
      fetchData();
    }
  }, [userId, currentUserId, isOwnProfile]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: editForm.name,
          bio: editForm.bio,
          picture: editForm.picture,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const updatedProfile = await response.json();
      
      // Fetch the latest total dreams count
      const totalDreamsResponse = await fetch(`/api/dreams/count/${currentUserId}`);
      const totalDreamsData = await totalDreamsResponse.json();

      // Update profile with the latest total dreams count
      setProfile({
        ...updatedProfile,
        totalDreams: totalDreamsData.count
      });
      
      setIsEditing(false);
      setUserProfile((prev) => ({
        ...prev,
        name: updatedProfile.name,
        bio: updatedProfile.bio,
        picture: updatedProfile.picture,
      }));

      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/api/upload-profile-picture", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      console.log("Upload response:", data);

      // Update both the edit form and profile state
      setEditForm((prev) => ({ ...prev, picture: data.imageUrl }));
      setProfile((prev) => ({ ...prev, picture: data.imageUrl }));

      // Update the user profile context as well
      setUserProfile((prev) => ({
        ...prev,
        picture: data.imageUrl,
      }));
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      alert("Failed to upload profile picture. Please try again.");
    }
  };

  useEffect(() => {
    if (isEditing && profile) {
      setEditForm({
        name: profile.name || "",
        bio: profile.bio || "",
        picture: profile.picture || "",
      });
    }
  }, [isEditing, profile]);

  if (!currentUserId) {
    navigate("/");
    return null;
  }

  if (loading) {
    return <div className="profile-loading">Loading profile...</div>;
  }

  return (
    <div className="Profile-container">
      <StarryBackground />
      <div className="u-flex">
        <h1>Profile</h1>
        <div className="header-right">
          <Link to="/gallery" className="gallery-button">Gallery</Link>
        </div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="profile-content">
          {isOwnProfile && !isEditing && (
            <button className="edit-profile-button" onClick={() => setIsEditing(true)}>
              Edit Profile
            </button>
          )}

          {isEditing ? (
            <form onSubmit={handleSubmit} className="profile-edit-form">
              <div className="edit-form-content">
                <div className="profile-picture-upload">
                  <img
                    src={editForm.picture || profile?.picture || "/assets/profilepic.png"}
                    alt="Profile"
                    className="profile-avatar"
                  />
                  <div className="upload-overlay">
                    <label htmlFor="picture-upload" className="upload-button">
                      Change Picture
                      <input
                        id="picture-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: "none" }}
                      />
                    </label>
                  </div>
                </div>
                <div className="edit-form-fields">
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
                  <button type="submit" className="save-profile-button">
                    Save Profile
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <>
              <div className="profile-header">
                <div className="profile-avatar-container">
                  <img
                    src={profile?.picture || "/assets/profilepic.png"}
                    alt="Profile"
                    className="profile-avatar"
                  />
                </div>
                <div className="profile-info">
                  <h1>{profile?.name || "Anonymous Dreamer"}</h1>
                  <p className="profile-bio">{profile?.bio || "No bio yet..."}</p>
                  <div className="profile-stats">
                    <div className="stat">
                      <span className="stat-value">{profile?.publicDreamCount || 0}</span>
                      <span className="stat-label">Public Dreams</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{profile?.totalDreams || 0}</span>
                      <span className="stat-label">Total Dreams</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="profile-dreams">
                <h2>Public Dreams</h2>
                <MiniGallery dreams={publicDreams} userId={currentUserId} />
                {publicDreams.length === 0 && <p className="no-dreams">No public dreams yet</p>}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;
