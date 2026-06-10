import React, { useState, useEffect, useMemo } from "react";
import { db } from "../firebaseConfig";
import { getStatus, getUserDataByUID } from "../api/FireStore";
import { doc, onSnapshot } from "firebase/firestore";
import {
  Heart,
  MessageCircle,
  Download,
  Eye,
  Users,
  TrendingUp,
  UserPlus,
  LogIn,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const PublicFeed = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [posts, setPosts] = useState([]);
  const [userProfiles, setUserProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Set up real-time listener for posts
  useMemo(() => {
    getStatus(setPosts);
    setLoading(false);
  }, []);

  // Load user profiles for all post authors when posts change
  useEffect(() => {
    if (!posts || posts.length === 0) return;

    const loadUserProfiles = async () => {
      console.log("Loading user profiles for posts...");
      const profilesMap = { ...userProfiles };

      // Get all unique user IDs from posts
      const userIds = posts
        .map((post) => post.currUser?.uid || post.currUser?.id || post.authorId)
        .filter((id) => id && !profilesMap[id]);

      const uniqueUserIds = [...new Set(userIds)];

      if (uniqueUserIds.length === 0) {
        console.log("No new user profiles to load");
        return;
      }

      console.log("Loading profiles for users:", uniqueUserIds);

      // Load profile data for each user
      const profilePromises = uniqueUserIds.map(async (userId) => {
        try {
          const profileData = await getUserDataByUID(userId);
          if (profileData) {
            profilesMap[userId] = profileData;
          }
        } catch (error) {
          console.error(`Error loading profile for ${userId}:`, error);
        }
      });

      await Promise.all(profilePromises);
      console.log("Loaded user profiles:", profilesMap);
      setUserProfiles(profilesMap);
    };

    loadUserProfiles();
  }, [posts]);

  // Set up real-time listeners for user profiles that appear in posts
  useEffect(() => {
    if (!posts || posts.length === 0) return;

    const userIds = posts
      .map((post) => post.currUser?.uid || post.currUser?.id || post.authorId)
      .filter((id) => id);

    const uniqueUserIds = [...new Set(userIds)];

    if (uniqueUserIds.length === 0) return;

    console.log("Setting up real-time profile listeners for:", uniqueUserIds);

    const unsubscribes = [];

    // Set up individual listeners for each user
    uniqueUserIds.forEach((userId) => {
      if (!userId) return;

      const userRef = doc(db, "users", userId);

      const unsubscribe = onSnapshot(
        userRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const userData = { id: docSnap.id, ...docSnap.data() };
            console.log(`Profile updated for user ${userId}:`, userData);

            setUserProfiles((prev) => ({
              ...prev,
              [userId]: userData,
            }));
          } else {
            console.log(`User profile not found for: ${userId}`);
            setUserProfiles((prev) => {
              const updated = { ...prev };
              delete updated[userId];
              return updated;
            });
          }
        },
        (error) => {
          console.error(
            `Error in real-time profile listener for ${userId}:`,
            error
          );
        }
      );

      unsubscribes.push(unsubscribe);
    });

    // Cleanup function
    return () => {
      console.log(
        "Cleaning up profile listeners for",
        uniqueUserIds.length,
        "users"
      );
      unsubscribes.forEach((unsubscribe) => {
        if (typeof unsubscribe === "function") {
          unsubscribe();
        }
      });
    };
  }, [posts]);

  // Generate consistent initials
  const getProfileInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .filter((n) => n.length > 0)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get current profile data for a user
  const getCurrentUserProfile = (post) => {
    const userId = post.currUser?.uid || post.currUser?.id || post.authorId;
    return userProfiles[userId] || post.currUser || {};
  };

  // Get profile image URL with real-time data
  const getProfileImageURL = (post) => {
    const currentProfile = getCurrentUserProfile(post);
    if (!currentProfile) return null;

    return (
      currentProfile.photoURL ||
      currentProfile.profilePicture ||
      currentProfile.avatar ||
      currentProfile.image ||
      post.currUser?.photoURL ||
      post.currUser?.profilePicture ||
      null
    );
  };

  // Get user display name with real-time data
  const getUserDisplayName = (post) => {
    const currentProfile = getCurrentUserProfile(post);
    if (!currentProfile) return "Anonymous";

    return (
      currentProfile.name ||
      currentProfile.displayName ||
      currentProfile.fullName ||
      post.currUser?.name ||
      post.author ||
      (currentProfile.email && currentProfile.email.split("@")[0]) ||
      (post.currUser?.email && post.currUser.email.split("@")[0]) ||
      "Anonymous"
    );
  };

  // Generate consistent gradient colors
  const getConsistentGradient = (identifier) => {
    const gradients = [
      "from-blue-500 to-purple-600",
      "from-green-500 to-blue-600",
      "from-purple-500 to-pink-600",
      "from-yellow-500 to-red-600",
      "from-indigo-500 to-purple-600",
      "from-pink-500 to-rose-600",
      "from-cyan-500 to-blue-600",
      "from-emerald-500 to-teal-600",
    ];

    if (!identifier) return gradients[0];

    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
      const char = identifier.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };

  // UserAvatar component for posts
  const UserAvatar = ({ post, size = "lg", onClick }) => {
    const currentProfile = getCurrentUserProfile(post);
    const profileImageURL = getProfileImageURL(post);
    const displayName = getUserDisplayName(post);
    const userId =
      post.currUser?.uid || post.currUser?.id || post.authorId || post.id;

    // Size classes
    const sizeClasses = {
      sm: "w-8 h-8 text-sm",
      md: "w-10 h-10 text-sm",
      lg: "w-12 h-12 text-base",
      xl: "w-16 h-16 text-lg",
    };

    const sizeClass = sizeClasses[size] || sizeClasses.lg;
    const gradient = getConsistentGradient(userId || displayName);

    return (
      <div
        onClick={onClick}
        className={`${sizeClass} rounded-full overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 border-2 border-gray-100 hover:border-blue-200 flex-shrink-0 relative`}
      >
        {profileImageURL ? (
          <>
            <img
              key={`profile-${userId}-${profileImageURL}-${
                currentProfile.updatedAt || Date.now()
              }`}
              src={profileImageURL}
              alt={displayName}
              className="w-full h-full rounded-full object-cover"
              onLoad={(e) => {
                const initialsDiv = e.target.nextElementSibling;
                if (
                  initialsDiv &&
                  initialsDiv.classList.contains("initials-fallback")
                ) {
                  initialsDiv.style.display = "none";
                }
                console.log("Profile image loaded for:", displayName);
              }}
              onError={(e) => {
                console.log("Profile image failed to load for:", displayName);
                e.target.style.display = "none";
                const initialsDiv = e.target.nextElementSibling;
                if (
                  initialsDiv &&
                  initialsDiv.classList.contains("initials-fallback")
                ) {
                  initialsDiv.style.display = "flex";
                }
              }}
            />
            <div
              className={`initials-fallback absolute inset-0 w-full h-full bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center text-white font-bold`}
              style={{ display: "none" }}
            >
              {getProfileInitials(displayName)}
            </div>
          </>
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center text-white font-bold`}
          >
            {getProfileInitials(displayName)}
          </div>
        )}
      </div>
    );
  };

  // Handle interactions that require authentication
  const handleAuthRequired = (action) => {
    const actionMessages = {
      like: "Please sign up or log in to like posts",
      comment: "Please sign up or log in to comment on posts",
      profile: "Please sign up or log in to view user profiles",
      download: "Please sign up or log in to download files",
    };

    if (
      window.confirm(
        `${actionMessages[action]}. Would you like to sign up now?`
      )
    ) {
      navigate("/register");
    }
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  const filteredPosts = posts.filter((post) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "papers")
      return (
        post.type === "research-paper" || post.postType === "research-paper"
      );
    if (activeFilter === "discussions")
      return post.type === "discussion" || post.postType === "discussion";
    if (activeFilter === "projects")
      return post.type === "project" || post.postType === "project";
    return true;
  });

  const getPostTypeStyle = (type) => {
    switch (type) {
      case "research-paper":
        return "bg-blue-50 text-blue-600 border-blue-200";
      case "discussion":
        return "bg-red-50 text-red-600 border-red-200";
      case "project":
        return "bg-yellow-50 text-yellow-600 border-yellow-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  const getPostTypeLabel = (type) => {
    switch (type) {
      case "research-paper":
        return "Research Paper";
      case "discussion":
        return "Discussion";
      case "project":
        return "Project";
      default:
        return "Post";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading Research Hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-[#F4F4F4] border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="cursor-pointer" onClick={() => navigate("/home")}>
              <img className="h-6 sm:h-7" src="/logo.jpeg" alt="Research hub" />
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate("/login")}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Log In</span>
              </button>
              <button
                onClick={() => navigate("/register")}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300"
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Up</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Discover Academic{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Research & Collaboration
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of researchers, students, and academics sharing
            knowledge, collaborating on projects, and advancing science
            together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/register")}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              Join Research Hub
            </button>
            <button
              onClick={() => navigate("/login")}
              className="px-8 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-300"
            >
              Log In
            </button>
          </div>
        </div>
      </div>

      {/* Stats Section */}

      {/* Main Feed */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          {/* Feed Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                Latest Research & Discussions
              </h3>
              <p className="text-gray-600">
                Explore what the academic community is sharing
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: "All" },
                { key: "papers", label: "Papers" },
                { key: "discussions", label: "Discussions" },
                { key: "projects", label: "Projects" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleFilterChange(tab.key)}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    activeFilter === tab.key
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                      : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Posts */}
          <div className="space-y-6">
            {filteredPosts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🔬</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No posts yet
                </h3>
                <p className="text-gray-500 mb-4">
                  Be the first to share your research!
                </p>
                <button
                  onClick={() => navigate("/register")}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                >
                  Join Now
                </button>
              </div>
            ) : (
              filteredPosts.map((post, index) => {
                const currentProfile = getCurrentUserProfile(post);
                const displayName = getUserDisplayName(post);

                return (
                  <div
                    key={`post-${post.id}-${currentProfile.updatedAt || index}`}
                    className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                  >
                    {/* Post Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <UserAvatar
                          post={post}
                          size="lg"
                          onClick={() => handleAuthRequired("profile")}
                        />
                        <div>
                          <button
                            onClick={() => handleAuthRequired("profile")}
                            className="font-semibold cursor-pointer hover:text-blue-500 text-gray-900 transition-colors"
                          >
                            {displayName}
                          </button>
                          <p className="text-sm text-gray-500">
                            {post.timeStamp
                              ? new Date(
                                  post.timeStamp.seconds * 1000
                                ).toLocaleDateString()
                              : post.time || "Recently"}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getPostTypeStyle(
                          post.postType || post.type
                        )}`}
                      >
                        {getPostTypeLabel(post.postType || post.type)}
                      </span>
                    </div>

                    {/* Post Content */}
                    <div className="mb-4">
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">
                        {post.title || post.status}
                      </h4>
                      <p className="text-gray-600 leading-relaxed">
                        {post.description || post.excerpt || post.status}
                      </p>
                    </div>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* File Preview */}
                    {post.fileURL && (
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-xl">
                              {post.fileType === "pdf" ? "📄" : "📎"}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {post.fileName || "Attached file"}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {post.fileType
                                ? post.fileType.toUpperCase()
                                : "File"}{" "}
                              • Sign up to download
                            </p>
                          </div>
                          <button
                            onClick={() => handleAuthRequired("download")}
                            className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors flex-shrink-0"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Post Actions */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 border-t border-gray-50 gap-4">
                      <div className="flex space-x-4">
                        <button
                          onClick={() => handleAuthRequired("like")}
                          className="flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-300"
                        >
                          <Heart className="w-4 h-4" />
                          <span>Like ({post.likes || 0})</span>
                        </button>
                        <button
                          onClick={() => handleAuthRequired("comment")}
                          className="flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-all duration-300"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Comment ({post.comments || 0})</span>
                        </button>
                      </div>

                      {(post.postType === "research-paper" ||
                        post.type === "research-paper") &&
                        post.fileURL && (
                          <button
                            onClick={() => handleAuthRequired("download")}
                            className="flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all duration-300"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download PDF</span>
                          </button>
                        )}

                      {(post.postType === "project" ||
                        post.type === "project") && (
                        <button
                          onClick={() => handleAuthRequired("profile")}
                          className="flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-all duration-300"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Project</span>
                        </button>
                      )}
                    </div>

                    {/* Show likes info without links for public users */}
                    {post.likedBy && post.likedBy.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-50">
                        <p className="text-sm text-gray-500">
                          {post.likedBy.length === 1
                            ? `Liked by ${
                                post.likedBy[0].name ||
                                post.likedBy[0].email?.split("@")[0] ||
                                "someone"
                              }`
                            : post.likedBy.length === 2
                            ? `Liked by ${
                                post.likedBy[0].name ||
                                post.likedBy[0].email?.split("@")[0] ||
                                "someone"
                              } and ${
                                post.likedBy[1].name ||
                                post.likedBy[1].email?.split("@")[0] ||
                                "1 other"
                              }`
                            : `Liked by ${
                                post.likedBy[0].name ||
                                post.likedBy[0].email?.split("@")[0] ||
                                "someone"
                              } and ${post.likedBy.length - 1} others`}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Ready to Join the Community?
          </h3>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Connect with researchers worldwide, share your work, and collaborate
            on groundbreaking projects.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/register")}
              className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              Sign Up Free
            </button>
            <button
              onClick={() => navigate("/login")}
              className="px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-all duration-300"
            >
              Log In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicFeed;
