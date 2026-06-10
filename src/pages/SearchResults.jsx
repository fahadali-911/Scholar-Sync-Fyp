// Create this as src/pages/SearchResults.jsx

import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Search,
  FileText,
  Users,
  Hash,
  Filter,
  Clock,
  Heart,
  MessageCircle,
  Share2,
  Download,
  MapPin,
  Building2,
  User,
  Tag,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import Navbar from "../common/navbar";
import { performGlobalSearch, getUserDataByUID } from "../api/FireStore";
import { auth } from "../firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState({
    posts: [],
    users: [],
    topics: [],
    total: 0,
    searchTerm: "",
  });
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("relevance");
  const [userProfiles, setUserProfiles] = useState({});

  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || "all";

  useEffect(() => {
    if (query.trim()) {
      performSearch(query, category);
    }
  }, [query, category]);

  useEffect(() => {
    if (!searchResults.posts.length && !searchResults.users.length) return;

    const loadUserProfiles = async () => {
      console.log("Loading user profiles for search results...");
      const profilesMap = { ...userProfiles };

      // Get user IDs from posts
      const postUserIds = searchResults.posts
        .map((post) => post.currUser?.uid || post.currUser?.id || post.authorId)
        .filter((id) => id && !profilesMap[id]);

      // Get user IDs from user results
      const userIds = searchResults.users
        .map((user) => user.id)
        .filter((id) => id && !profilesMap[id]);

      const allUserIds = [...new Set([...postUserIds, ...userIds])];

      if (allUserIds.length === 0) return;

      const profilePromises = allUserIds.map(async (userId) => {
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
  }, [searchResults]);

  useEffect(() => {
    if (!searchResults.posts.length && !searchResults.users.length) return;

    const postUserIds = searchResults.posts
      .map((post) => post.currUser?.uid || post.currUser?.id || post.authorId)
      .filter((id) => id);

    const userIds = searchResults.users
      .map((user) => user.id)
      .filter((id) => id);

    const allUserIds = [...new Set([...postUserIds, ...userIds])];

    if (allUserIds.length === 0) return;

    const unsubscribes = [];

    allUserIds.forEach((userId) => {
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
  }, [searchResults]);
  const performSearch = async (searchTerm, searchCategory = "all") => {
    setLoading(true);
    try {
      const results = await performGlobalSearch(searchTerm, searchCategory);
      setSearchResults(results);
      setActiveFilter(searchCategory);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults({
        posts: [],
        users: [],
        topics: [],
        total: 0,
        searchTerm: searchTerm,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setSearchParams({ q: query, category: filter });
  };

  const handleNewSearch = (newQuery) => {
    if (newQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(newQuery)}&category=all`);
    }
  };

  const getPostTypeStyle = (type) => {
    switch (type) {
      case "research-paper":
        return "bg-blue-50 text-blue-600 border-blue-200";
      case "discussion":
        return "bg-green-50 text-green-600 border-green-200";
      case "project":
        return "bg-purple-50 text-purple-600 border-purple-200";
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

  const getCurrentUserProfile = (userId) => {
    return userProfiles[userId] || {};
  };

  const getProfileImageURL = (userId) => {
    const profile = getCurrentUserProfile(userId);
    return profile.photoURL || profile.profilePicture || null;
  };

  const getUserDisplayName = (userId, fallbackName) => {
    const profile = getCurrentUserProfile(userId);
    return profile.name || fallbackName || "Anonymous";
  };

  // UserAvatar component for search results
  const UserAvatar = ({ userId, fallbackName, size = "md", onClick }) => {
    const profile = getCurrentUserProfile(userId);
    const profileImageURL = getProfileImageURL(userId);
    const displayName = getUserDisplayName(userId, fallbackName);

    const sizeClasses = {
      sm: "w-8 h-8 text-sm",
      md: "w-10 h-10 text-sm",
      lg: "w-12 h-12 text-base",
    };

    const sizeClass = sizeClasses[size] || sizeClasses.md;
    const gradient = getConsistentGradient(userId || displayName);

    return (
      <div
        onClick={onClick}
        className={`${sizeClass} rounded-full overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 flex-shrink-0 relative`}
      >
        {profileImageURL ? (
          <>
            <img
              key={`search-${userId}-${profileImageURL}-${
                profile.updatedAt || Date.now()
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
              className={`absolute inset-0 w-full h-full bg-gradient-to-r ${gradient} rounded-full flex items-center justify-center text-white font-bold`}
              style={{ display: "none" }}
            >
              {getInitials(displayName)}
            </div>
          </>
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-r ${gradient} rounded-full flex items-center justify-center text-white font-bold`}
          >
            {getInitials(displayName)}
          </div>
        )}
      </div>
    );
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleProfileClick = (userId) => {
    if (userId === auth.currentUser?.uid) {
      navigate("/my-profile");
    } else {
      navigate(`/profile/${userId}`);
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "Recently";
    const date = timestamp.seconds
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const filters = [
    { key: "all", label: "All", icon: Search, count: searchResults.total },
    {
      key: "posts",
      label: "Posts",
      icon: FileText,
      count: searchResults.posts.length,
    },
    {
      key: "people",
      label: "People",
      icon: Users,
      count: searchResults.users.length,
    },
    {
      key: "topics",
      label: "Topics",
      icon: Hash,
      count: searchResults.topics.length,
    },
  ];

  const getDisplayResults = () => {
    switch (activeFilter) {
      case "posts":
        return {
          posts: searchResults.posts,
          users: [],
          topics: [],
          showPosts: true,
          showUsers: false,
          showTopics: false,
        };
      case "people":
        return {
          posts: [],
          users: searchResults.users,
          topics: [],
          showPosts: false,
          showUsers: true,
          showTopics: false,
        };
      case "topics":
        return {
          posts: [],
          users: [],
          topics: searchResults.topics,
          showPosts: false,
          showUsers: false,
          showTopics: true,
        };
      default:
        return {
          posts: searchResults.posts,
          users: searchResults.users,
          topics: searchResults.topics,
          showPosts: true,
          showUsers: true,
          showTopics: true,
        };
    }
  };

  const displayResults = getDisplayResults();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                Search Results
              </h1>
              <p className="text-gray-600">
                {loading
                  ? "Searching..."
                  : `${searchResults.total} results for "${query}"`}
              </p>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search research papers, people, topics..."
              defaultValue={query}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleNewSearch(e.target.value);
                }
              }}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 bg-white"
            />
          </div>

          {/* Filter Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 overflow-x-auto">
              {filters.map((filter) => {
                const Icon = filter.icon;
                return (
                  <button
                    key={filter.key}
                    onClick={() => handleFilterChange(filter.key)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-all duration-200 whitespace-nowrap ${
                      activeFilter === filter.key
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{filter.label}</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        activeFilter === filter.key
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {filter.count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Searching...</span>
          </div>
        )}

        {/* No Results */}
        {!loading && searchResults.total === 0 && query && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No results found
            </h3>
            <p className="text-gray-500">
              Try different keywords or check your spelling
            </p>
          </div>
        )}

        {/* Results */}
        {!loading && searchResults.total > 0 && (
          <div className="space-y-6">
            {/* Posts Results */}
            {displayResults.showPosts && displayResults.posts.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-600" />
                  Posts ({displayResults.posts.length})
                </h2>
                <div className="space-y-4">
                  {displayResults.posts.map((post) => (
                    <div
                      key={post.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                    >
                      {/* Post Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <UserAvatar
                            userId={post.currUser?.uid || post.currUser?.id}
                            fallbackName={post.currUser?.name || post.author}
                            size="md"
                            onClick={() =>
                              handleProfileClick(post.currUser?.id)
                            }
                          />
                          <div>
                            <button
                              onClick={() =>
                                handleProfileClick(post.currUser?.id)
                              }
                              className="font-medium text-gray-900 hover:text-blue-600 hover:underline"
                            >
                              {getUserDisplayName(
                                post.currUser?.uid || post.currUser?.id,
                                post.currUser?.name || post.author
                              )}
                            </button>
                            <p className="text-sm text-gray-500">
                              {formatTimeAgo(post.timeStamp)}
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
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 cursor-pointer">
                          {post.title || post.status}
                        </h3>
                        <p className="text-gray-600 line-clamp-2">
                          {post.description || post.excerpt || post.status}
                        </p>
                      </div>

                      {/* Tags */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Post Stats */}
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Heart className="h-4 w-4" />
                          <span>{post.likes || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="h-4 w-4" />
                          <span>{post.comments || 0}</span>
                        </div>
                        {post.fileURL && (
                          <div className="flex items-center space-x-1">
                            <Download className="h-4 w-4" />
                            <span>File attached</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Users Results */}
            {displayResults.showUsers && displayResults.users.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-green-600" />
                  People ({displayResults.users.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayResults.users.map((user) => (
                    <div
                      key={user.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start space-x-4">
                        <UserAvatar
                          userId={user.id}
                          fallbackName={user.name}
                          size="lg"
                          onClick={() => handleProfileClick(user.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => handleProfileClick(user.id)}
                            className="font-semibold text-gray-900 hover:text-blue-600 hover:underline"
                          >
                            {getUserDisplayName(user.id, user.name)}
                          </button>
                          <p className="text-sm text-gray-500 mb-2">
                            @{user.email?.split("@")[0]}
                          </p>
                          {user.bio && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {user.bio}
                            </p>
                          )}
                          <div className="flex items-center text-xs text-gray-500 space-x-4">
                            {user.institution && (
                              <div className="flex items-center space-x-1">
                                <Building2 className="h-3 w-3" />
                                <span>{user.institution}</span>
                              </div>
                            )}
                            {user.location && (
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3" />
                                <span>{user.location}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>
                              {(user.followers || []).length} followers
                            </span>
                            <span>
                              {(user.following || []).length} following
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Topics Results */}
            {displayResults.showTopics && displayResults.topics.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Hash className="h-5 w-5 mr-2 text-orange-600" />
                  Topics ({displayResults.topics.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayResults.topics.map((topic, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleNewSearch(topic.tag)}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Tag className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            #{topic.tag}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {topic.count} posts
                          </p>
                        </div>
                      </div>
                      {topic.posts && topic.posts.length > 0 && (
                        <div className="text-xs text-gray-500">
                          Recent:{" "}
                          {topic.posts
                            .slice(0, 2)
                            .map((post) => post.title)
                            .join(", ")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
