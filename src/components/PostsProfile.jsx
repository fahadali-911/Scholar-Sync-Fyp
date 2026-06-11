import React, { useEffect, useState } from "react";
import {
  getStatus,
  toggleLikeWithNotification,
  getUserDataByUID,
  deletePost,
} from "../api/FireStore";

import { auth, db } from "../firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";
import {
  Heart,
  MessageCircle,
  Share2,
  Download,
  Eye,
  Loader2,
  MoreVertical,
  Trash2,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import LikesModal from "./LikesModal";
import CommentsModal from "../components/CommentsModal";
import PaperSummarizer from "./PaperSummarizer";

export default function PostsProfile({ currentUser, targetUID, isOwnProfile }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userPosts, setUserPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("posts"); // "posts", "papers", "saved"

  const [likesModal, setLikesModal] = useState({
    isOpen: false,
    postId: null,
    totalLikes: 0,
  });
  const [commentsModal, setCommentsModal] = useState({
    isOpen: false,
    postId: null,
    postTitle: "",
    totalComments: 0,
  });
  const [likingStates, setLikingStates] = useState({});
  const [userProfiles, setUserProfiles] = useState({});
  const [summarizerModal, setSummarizerModal] = useState({
    isOpen: false,
    post: null,
  });

  const [deletingStates, setDeletingStates] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState({
    isOpen: false,
    postId: null,
    postTitle: "",
  });
  const [showDropdown, setShowDropdown] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    getStatus(setPosts);
  }, []);

  const handleFilePreview = (post) => {
    const fileType = post.fileType?.toLowerCase() || "";
    const fileName = post.fileName || "";
    const fileExtension = fileName.split(".").pop()?.toLowerCase() || "";

    if (fileType === "pdf" || fileExtension === "pdf") {
      window.open(post.fileURL, "_blank");
      return;
    }

    if (
      fileType === "docx" ||
      fileExtension === "docx" ||
      fileType.includes("word") ||
      fileType.includes("document") ||
      fileExtension === "doc" ||
      fileExtension === "ppt" ||
      fileExtension === "pptx"
    ) {
      const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(
        post.fileURL
      )}&embedded=true`;
      window.open(viewerUrl, "_blank");
      return;
    }

    window.open(post.fileURL, "_blank");
  };

  useEffect(() => {
    if (posts.length > 0 && currentUser?.email) {
      const filteredPosts = posts.filter((post) => {
        if (currentUser?.email) {
          return post.currUser?.email === currentUser.email;
        }
        return false;
      });

      setUserPosts(filteredPosts);
      setLoading(false);
    } else if (posts.length === 0 && currentUser?.email) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [posts, currentUser]);

  // Load user profiles for all post authors when posts change
  useEffect(() => {
    if (!userPosts || userPosts.length === 0) return;

    const loadUserProfiles = async () => {
      const profilesMap = { ...userProfiles };
      const userIds = userPosts
        .map((post) => post.currUser?.uid || post.currUser?.id || post.authorId)
        .filter((id) => id && !profilesMap[id]);

      const uniqueUserIds = [...new Set(userIds)];
      if (uniqueUserIds.length === 0) return;

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
      setUserProfiles(profilesMap);
    };

    loadUserProfiles();
  }, [userPosts]);

  // Set up real-time listeners for user profiles
  useEffect(() => {
    if (!userPosts || userPosts.length === 0) return;

    const userIds = userPosts
      .map((post) => post.currUser?.uid || post.currUser?.id || post.authorId)
      .filter((id) => id);

    const uniqueUserIds = [...new Set(userIds)];
    if (uniqueUserIds.length === 0) return;

    const unsubscribes = [];

    uniqueUserIds.forEach((userId) => {
      if (!userId) return;

      const userRef = doc(db, "users", userId);
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = { id: docSnap.id, ...docSnap.data() };
          setUserProfiles((prev) => ({
            ...prev,
            [userId]: userData,
          }));
        }
      });

      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach((unsubscribe) => {
        if (typeof unsubscribe === "function") {
          unsubscribe();
        }
      });
    };
  }, [userPosts]);

  useEffect(() => {
    const handleClickOutside = () => {
      setShowDropdown({});
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

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

  const getCurrentUserProfile = (post) => {
    const userId = post.currUser?.uid || post.currUser?.id || post.authorId;
    return userProfiles[userId] || post.currUser || {};
  };

  const getProfileImageURL = (post) => {
    const currentProfile = getCurrentUserProfile(post);
    if (!currentProfile) return null;

    return (
      currentProfile.photoURL ||
      currentProfile.profilePicture ||
      post.currUser?.photoURL ||
      null
    );
  };

  const getUserDisplayName = (post) => {
    const currentProfile = getCurrentUserProfile(post);
    if (!currentProfile) return "Anonymous";

    return (
      currentProfile.name || post.currUser?.name || post.author || "Anonymous"
    );
  };

  const UserAvatar = ({ post, size = "lg", onClick }) => {
    const currentProfile = getCurrentUserProfile(post);
    const profileImageURL = getProfileImageURL(post);
    const displayName = getUserDisplayName(post);
    const userId =
      post.currUser?.uid || post.currUser?.id || post.authorId || post.id;

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
              onError={(e) => {
                e.target.style.display = "none";
                const initialsDiv = e.target.nextElementSibling;
                if (initialsDiv) {
                  initialsDiv.style.display = "flex";
                }
              }}
            />
            <div
              className={`absolute inset-0 w-full h-full bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center text-white font-bold`}
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

  const canDeletePost = (post) => {
    if (!auth.currentUser) return false;

    return (
      post.currUser?.uid === auth.currentUser.uid ||
      post.authorId === auth.currentUser.uid ||
      post.currUser?.email === auth.currentUser.email
    );
  };

  const handleDeleteClick = (post) => {
    setShowDeleteModal({
      isOpen: true,
      postId: post.id,
      postTitle: post.title || post.status || "this post",
    });
    setShowDropdown({});
  };

  const handleDeleteConfirm = async () => {
    const { postId } = showDeleteModal;
    if (!postId) return;

    setDeletingStates((prev) => ({ ...prev, [postId]: true }));

    try {
      const result = await deletePost(postId);
      if (result.success) {
        setShowDeleteModal({ isOpen: false, postId: null, postTitle: "" });
        alert("Post deleted successfully!");
      } else {
        console.error("Failed to delete post:", result.error);
        alert(result.error || "Failed to delete post. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("An error occurred while deleting the post. Please try again.");
    } finally {
      setDeletingStates((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal({ isOpen: false, postId: null, postTitle: "" });
  };

  const toggleDropdown = (postId) => {
    setShowDropdown((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleLike = async (postId) => {
    if (!auth.currentUser) {
      alert("Please log in to like posts");
      return;
    }

    if (likingStates[postId]) return;
    setLikingStates((prev) => ({ ...prev, [postId]: true }));

    try {
      const result = await toggleLikeWithNotification(postId);
      if (result.success) {
        console.log("Like toggled successfully");
      } else {
        console.error("Failed to toggle like:", result.error);
        alert("Failed to update like. Please try again.");
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setLikingStates((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleLikesClick = (postId, totalLikes) => {
    if (totalLikes > 0) {
      setLikesModal({ isOpen: true, postId, totalLikes });
    }
  };

  const closeLikesModal = () => {
    setLikesModal({ isOpen: false, postId: null, totalLikes: 0 });
  };

  const handleCommentsClick = (post) => {
    setCommentsModal({
      isOpen: true,
      postId: post.id,
      postTitle: post.title || post.status,
      totalComments: post.comments || 0,
    });
  };

  const closeCommentsModal = () => {
    setCommentsModal({
      isOpen: false,
      postId: null,
      postTitle: "",
      totalComments: 0,
    });
  };

  const handleShare = (post) => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.excerpt,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const handleProfileClick = (post) => {
    if (post.currUser?.id === auth.currentUser?.uid) {
      navigate("/my-profile");
    } else if (post.currUser?.id) {
      navigate(`/profile/${post.currUser.id}`);
    }
  };

  const isPostLikedByCurrentUser = (post) => {
    if (!auth.currentUser || !post.likedBy) return false;
    return post.likedBy.some((like) => like.uid === auth.currentUser.uid);
  };

  // Filter posts based on active tab
  const getFilteredPosts = () => {
    if (activeTab === "posts") {
      // General posts & discussions, projects
      return userPosts.filter(
        (post) => (post.postType || post.type) !== "research-paper"
      );
    } else if (activeTab === "papers") {
      // Research papers only
      return userPosts.filter(
        (post) => (post.postType || post.type) === "research-paper"
      );
    } else if (activeTab === "saved") {
      // Placeholder: no saved hubs in backend yet, show empty
      return [];
    }
    return userPosts;
  };

  const filteredPosts = getFilteredPosts();

  const tabs = [
    { id: "posts", label: "Posts" },
    { id: "papers", label: "Research Papers" },
    { id: "saved", label: "Saved Hubs" },
  ];

  if (loading) {
    return (
      <div className="w-full flex flex-col gap-6">
        {/* Stats card loading skeleton */}
        <div className="glass-card p-6 rounded-2xl animate-pulse">
          <div className="grid grid-cols-3 divide-x divide-slate-100">
            <div className="h-12 bg-slate-100 rounded mx-4"></div>
            <div className="h-12 bg-slate-100 rounded mx-4"></div>
            <div className="h-12 bg-slate-100 rounded mx-4"></div>
          </div>
        </div>
        {/* Content loading card */}
        <div className="glass-card rounded-2xl min-h-[300px] flex flex-col items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <span className="text-text-muted text-sm font-semibold">Loading academic data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Likes Modal */}
      <LikesModal
        isOpen={likesModal.isOpen}
        onClose={closeLikesModal}
        postId={likesModal.postId}
        totalLikes={likesModal.totalLikes}
      />

      {/* Comments Modal */}
      <CommentsModal
        isOpen={commentsModal.isOpen}
        onClose={closeCommentsModal}
        postId={commentsModal.postId}
        postTitle={commentsModal.postTitle}
        totalComments={commentsModal.totalComments}
      />

      {/* Paper Summarizer Modal */}
      <PaperSummarizer
        isOpen={summarizerModal.isOpen}
        onClose={() => setSummarizerModal({ isOpen: false, post: null })}
        post={summarizerModal.post}
      />

      {/* Delete confirmation modal */}
      {showDeleteModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Post</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{showDeleteModal.postTitle}"? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleDeleteCancel}
                  className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium cursor-pointer"
                  disabled={deletingStates[showDeleteModal.postId]}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deletingStates[showDeleteModal.postId]}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {deletingStates[showDeleteModal.postId] ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Horizontal Bar */}
      <div className="backdrop-blur-md bg-white/40 border border-white/20 shadow-[0_8px_30px_rgba(15,23,42,0.02)] p-2 rounded-2xl overflow-hidden relative">
        <div className="grid grid-cols-3 py-3 relative">
          
          {/* Posts Column */}
          <div 
            className="flex flex-col items-center justify-center cursor-pointer hover:bg-white/60 hover:scale-[1.02] active:scale-98 transition-all duration-250 py-2.5 rounded-xl group"
            onClick={() => setActiveTab("posts")}
          >
            <span className="text-3xl font-extrabold tracking-tight text-primary transition-transform duration-200 group-hover:scale-105">
              {userPosts.length}
            </span>
            <span className="text-[10px] font-bold tracking-widest text-slate-500/80 uppercase mt-1">
              Posts
            </span>
          </div>
          
          {/* Faded Divider 1 */}
          <div className="absolute left-1/3 top-3 bottom-3 w-[1.5px] bg-gradient-to-b from-transparent via-slate-200/50 to-transparent"></div>

          {/* Followers Column */}
          <div 
            className="flex flex-col items-center justify-center cursor-pointer hover:bg-white/60 hover:scale-[1.02] active:scale-98 transition-all duration-250 py-2.5 rounded-xl group"
            onClick={() => console.log("Followers clicked")}
          >
            <span className="text-3xl font-extrabold tracking-tight text-primary transition-transform duration-200 group-hover:scale-105">
              {currentUser?.followers?.length || 0}
            </span>
            <span className="text-[10px] font-bold tracking-widest text-slate-500/80 uppercase mt-1">
              Followers
            </span>
          </div>

          {/* Faded Divider 2 */}
          <div className="absolute left-2/3 top-3 bottom-3 w-[1.5px] bg-gradient-to-b from-transparent via-slate-200/50 to-transparent"></div>

          {/* Following Column */}
          <div 
            className="flex flex-col items-center justify-center cursor-pointer hover:bg-white/60 hover:scale-[1.02] active:scale-98 transition-all duration-250 py-2.5 rounded-xl group"
            onClick={() => console.log("Following clicked")}
          >
            <span className="text-3xl font-extrabold tracking-tight text-primary transition-transform duration-200 group-hover:scale-105">
              {currentUser?.following?.length || 0}
            </span>
            <span className="text-[10px] font-bold tracking-widest text-slate-500/80 uppercase mt-1">
              Following
            </span>
          </div>

        </div>
      </div>

      {/* Tabs & Content Cards */}
      <div className="glass-card rounded-2xl min-h-[400px] flex flex-col overflow-hidden bg-white">
        {/* Tab Selector Header */}
        <div className="flex border-b border-fine px-6 bg-slate-50/30">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 sm:px-6 py-4 font-bold font-label-md text-label-md transition-all border-b-2 cursor-pointer ${
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-text-muted hover:text-primary"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab panel contents */}
        <div className="flex-1 flex flex-col p-6">
          {filteredPosts.length === 0 ? (
            /* Encouraging Empty State layout */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center my-auto">
              <div className="w-48 h-48 mb-6 opacity-20 relative flex items-center justify-center">
                <span className="material-symbols-outlined text-[96px] text-primary">draw</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-inverse-surface mb-2">
                {activeTab === "posts" && "Start the conversation"}
                {activeTab === "papers" && "Publish your research"}
                {activeTab === "saved" && "No saved hubs yet"}
              </h3>
              <p className="font-body-md text-body-md text-text-muted max-w-sm leading-relaxed mb-6">
                {activeTab === "posts" &&
                  "You haven't posted anything yet. Share your first research insight or academic update with your network."}
                {activeTab === "papers" &&
                  "No research papers uploaded yet. Share your publications and technical write-ups with the academic community."}
                {activeTab === "saved" &&
                  "Bookmark important research papers, articles, and discussions to view them later on your profile."}
              </p>

              {isOwnProfile && (
                <button
                  onClick={() => {
                    if (activeTab === "saved") {
                      navigate("/home");
                    } else {
                      navigate("/create-post");
                    }
                  }}
                  className="px-8 py-3 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-full shadow-lg hover:shadow-xl hover:scale-102 active:scale-95 transition-all cursor-pointer"
                >
                  {activeTab === "posts" && "Create First Post"}
                  {activeTab === "papers" && "Upload Paper"}
                  {activeTab === "saved" && "Explore Academic Feed"}
                </button>
              )}
            </div>
          ) : (
            /* Post Cards list */
            <div className="space-y-6">
              {filteredPosts.map((post, index) => (
                <div
                  key={`profile-post-${post.id}-${
                    getCurrentUserProfile(post).updatedAt || index
                  }`}
                  className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-md transition-all duration-300 animate-fade-in-up"
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  {/* Post Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <UserAvatar
                        post={post}
                        size="md"
                        onClick={() => handleProfileClick(post)}
                      />
                      <div>
                        <button
                          onClick={() => handleProfileClick(post)}
                          className="font-semibold text-gray-900 hover:text-primary transition-colors text-sm sm:text-base text-left block"
                        >
                          {getUserDisplayName(post)}
                        </button>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {post.timeStamp
                            ? new Date(post.timeStamp.seconds * 1000).toLocaleDateString()
                            : "Recently"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getPostTypeStyle(
                          post.postType || post.type
                        )}`}
                      >
                        {getPostTypeLabel(post.postType || post.type)}
                      </span>

                      {canDeletePost(post) && (
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDropdown(post.id);
                            }}
                            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-500" />
                          </button>

                          {/* Dropdown Menu */}
                          {showDropdown[post.id] && (
                            <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                              <button
                                onClick={() => handleDeleteClick(post)}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="mb-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 hover:text-primary cursor-pointer transition-colors leading-snug">
                      {post.title || post.status}
                    </h3>
                    <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                      {post.description || post.excerpt || post.status}
                    </p>
                  </div>

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {post.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium hover:bg-blue-100 cursor-pointer transition-colors"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* File Attachment */}
                  {post.fileURL && (
                    <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 text-primary">
                          <span className="material-symbols-outlined text-[24px]">
                            {post.fileType === "pdf" ? "description" : "attachment"}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {post.fileName || "Attached Document"}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {post.fileType ? post.fileType.toUpperCase() : "Document"} • Click to interact
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          <button
                            onClick={() => handleFilePreview(post)}
                            className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/95 transition-colors cursor-pointer"
                          >
                            Preview
                          </button>
                          
                          {!(post.fileType?.includes("image") || [
                            "jpg", "jpeg", "png", "gif", "webp", "svg"
                          ].includes(post.fileName?.split(".").pop()?.toLowerCase())) && (
                            <button
                              onClick={() => {
                                const link = document.createElement("a");
                                link.href = post.fileURL;
                                link.download = post.fileName || "download";
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-300 transition-colors cursor-pointer"
                            >
                              Download
                            </button>
                          )}

                          {(post.fileType?.includes("pdf") || post.fileName?.toLowerCase().endsWith(".pdf")) && (
                            <button
                              onClick={() => setSummarizerModal({ isOpen: true, post })}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5" /> Summary
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions & Engagement bar */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-3 border-t border-slate-100 gap-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleLike(post.id)}
                        disabled={likingStates[post.id]}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                          isPostLikedByCurrentUser(post)
                            ? "bg-red-500 text-white shadow"
                            : "bg-slate-50 text-slate-600 hover:bg-red-50 hover:text-red-500"
                        }`}
                      >
                        {likingStates[post.id] ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Heart
                            className={`w-3.5 h-3.5 ${
                              isPostLikedByCurrentUser(post) ? "fill-current" : ""
                            }`}
                          />
                        )}
                        <span>Like</span>
                      </button>

                      <button
                        onClick={() => handleCommentsClick(post)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-50 text-slate-600 hover:bg-primary/10 hover:text-primary transition-all duration-200 cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Comment</span>
                      </button>

                      <button
                        onClick={() => handleShare(post)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-all duration-200 cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-none pt-2 sm:pt-0">
                      <button
                        onClick={() => handleLikesClick(post.id, post.likes || 0)}
                        className="hover:underline font-medium hover:text-primary"
                      >
                        {post.likes || 0} likes
                      </button>
                      <button
                        onClick={() => handleCommentsClick(post)}
                        className="hover:underline font-medium hover:text-primary"
                      >
                        {post.comments || 0} comments
                      </button>
                    </div>
                  </div>

                  {/* Engaged summary text */}
                  {post.likedBy && post.likedBy.length > 0 && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-50 text-xs text-slate-400">
                      <button
                        onClick={() => handleLikesClick(post.id, post.likes || 0)}
                        className="hover:underline transition-colors hover:text-primary text-left"
                      >
                        Liked by{" "}
                        <span className="font-semibold text-slate-600">
                          {post.likedBy[0].name || post.likedBy[0].email?.split("@")[0]}
                        </span>
                        {post.likedBy.length > 1 && ` and ${post.likedBy.length - 1} other${post.likedBy.length > 2 ? 's' : ''}`}
                      </button>
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
