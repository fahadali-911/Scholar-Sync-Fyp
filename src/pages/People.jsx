import React, { useState, useEffect } from "react";
import {
  Search,
  UserPlus,
  UserCheck,
  Users,
  UserX,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Navbar from "../common/navbar";
import {
  getFollowRequests,
  getFollowersList,
  getFollowingList,
  acceptFollowRequest,
  rejectFollowRequest,
  unfollowUser,
  getMutualFollowersCount,
  sendFollowRequest,
  cancelFollowRequest,
} from "../api/FireStore";
import { auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const People = () => {
  const [activeTab, setActiveTab] = useState("requests");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  // State to track follow request status and loading for each user
  const [followRequestStatus, setFollowRequestStatus] = useState({});
  const [buttonLoading, setButtonLoading] = useState({});

  // Real data from Firebase
  const [followRequests, setFollowRequests] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  // Enhanced data with mutual followers
  const [enhancedRequests, setEnhancedRequests] = useState([]);
  const [enhancedFollowers, setEnhancedFollowers] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // User is logged out, redirect to login page
        navigate("/");
        return;
      }
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);

    // Get follow requests (real-time)
    const unsubscribeRequests = getFollowRequests(setFollowRequests);

    // Load followers and following
    const loadData = async () => {
      try {
        const [followersData, followingData] = await Promise.all([
          getFollowersList(currentUser.uid),
          getFollowingList(currentUser.uid),
        ]);

        setFollowers(followersData);
        setFollowing(followingData);
      } catch (error) {
        console.error("Error loading followers/following data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    return () => {
      if (unsubscribeRequests) {
        unsubscribeRequests();
      }
    };
  }, [currentUser]);

  // Enhance requests with mutual followers count
  useEffect(() => {
    const enhanceRequests = async () => {
      if (followRequests.length === 0) {
        setEnhancedRequests([]);
        return;
      }

      const enhanced = await Promise.all(
        followRequests.map(async (request) => {
          const mutualCount = await getMutualFollowersCount(request.fromUID);
          const timeAgo = getTimeAgo(request.timestamp);

          return {
            id: request.id,
            name: request.fromUserData?.name || "Unknown User",
            username: request.fromUserData?.username || "unknown",
            avatar: request.fromUserData?.photoURL || null,
            bio: request.fromUserData?.bio || "No bio available",
            mutualFollowers: mutualCount,
            timestamp: timeAgo,
            requestId: request.id,
            fromUID: request.fromUID,
          };
        })
      );

      setEnhancedRequests(enhanced);
    };

    enhanceRequests();
  }, [followRequests]);

  // Enhance followers with following status
  useEffect(() => {
    if (!currentUser || followers.length === 0) {
      setEnhancedFollowers([]);
      return;
    }

    const currentUserData = currentUser;
    const followingUIDs = following.map((user) => user.id);

    const enhanced = followers.map((follower) => ({
      id: follower.id,
      name: follower.name || "Unknown User",
      username: follower.username || follower.email?.split("@")[0] || "unknown",
      avatar: follower.photoURL || null,
      bio: follower.bio || "No bio available",
      isFollowing: followingUIDs.includes(follower.id),
      followedDate: getFormattedDate(follower.createdAt) || "Recently",
    }));

    setEnhancedFollowers(enhanced);
  }, [followers, following, currentUser]);

  const handleAcceptRequest = async (requestId, fromUID) => {
    console.log("Accepting follow request:", requestId);

    try {
      const result = await acceptFollowRequest(requestId, fromUID);
      if (result.success) {
        console.log("Follow request accepted successfully");
        // Data will update automatically due to real-time listeners

        // Refresh followers list
        const followersData = await getFollowersList(currentUser.uid);
        setFollowers(followersData);
      } else {
        console.error("Failed to accept follow request:", result.error);
        alert("Failed to accept follow request. Please try again.");
      }
    } catch (error) {
      console.error("Error accepting follow request:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleRejectRequest = async (requestId) => {
    console.log("Rejecting follow request:", requestId);

    try {
      const result = await rejectFollowRequest(requestId);
      if (result.success) {
        console.log("Follow request rejected successfully");
        // Data will update automatically due to real-time listeners
      } else {
        console.error("Failed to reject follow request:", result.error);
        alert("Failed to reject follow request. Please try again.");
      }
    } catch (error) {
      console.error("Error rejecting follow request:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleFollowBack = async (targetUID) => {
    console.log("Following back:", targetUID);

    // Set loading state
    setButtonLoading((prev) => ({ ...prev, [targetUID]: true }));

    try {
      const result = await sendFollowRequest(targetUID);

      if (result.success) {
        console.log("Follow request sent successfully");

        // Update follow request status to "requested"
        setFollowRequestStatus((prev) => ({
          ...prev,
          [targetUID]: "requested",
        }));

        // Update the followers list to reflect the change
        const followersData = await getFollowersList(currentUser.uid);
        setFollowers(followersData);
      } else {
        console.error("Failed to send follow request:", result.error);
        alert("Failed to send follow request. Please try again.");
      }
    } catch (error) {
      console.error("Error sending follow request:", error);
      alert("An error occurred. Please try again.");
    } finally {
      // Remove loading state
      setButtonLoading((prev) => ({ ...prev, [targetUID]: false }));
    }
  };

  const handleCancelRequest = async (targetUID) => {
    console.log("Cancelling follow request:", targetUID);

    // Set loading state
    setButtonLoading((prev) => ({ ...prev, [targetUID]: true }));

    try {
      const result = await cancelFollowRequest(targetUID);

      if (result.success) {
        console.log("Follow request cancelled successfully");

        // Reset follow request status
        setFollowRequestStatus((prev) => ({ ...prev, [targetUID]: null }));

        // Update the followers list
        const followersData = await getFollowersList(currentUser.uid);
        setFollowers(followersData);
      } else {
        console.error("Failed to cancel follow request:", result.error);
        alert("Failed to cancel follow request. Please try again.");
      }
    } catch (error) {
      console.error("Error cancelling follow request:", error);
      alert("An error occurred. Please try again.");
    } finally {
      // Remove loading state
      setButtonLoading((prev) => ({ ...prev, [targetUID]: false }));
    }
  };

  const handleUnfollow = async (targetUID) => {
    console.log("Unfollowing:", targetUID);

    try {
      const result = await unfollowUser(targetUID);
      if (result.success) {
        console.log("User unfollowed successfully");

        // Refresh both followers and following lists
        const [followersData, followingData] = await Promise.all([
          getFollowersList(currentUser.uid),
          getFollowingList(currentUser.uid),
        ]);

        setFollowers(followersData);
        setFollowing(followingData);
      } else {
        console.error("Failed to unfollow user:", result.error);
        alert("Failed to unfollow user. Please try again.");
      }
    } catch (error) {
      console.error("Error unfollowing user:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleProfileClick = (person) => {
    const userId = person.id;
    if (userId === auth.currentUser?.uid) {
      navigate("/my-profile");
    } else if (userId) {
      navigate(`/profile/${userId}`);
    }
  };

  // Function to get follow button configuration
  const getFollowButtonConfig = (person) => {
    const isLoading = buttonLoading[person.id];
    const requestStatus = followRequestStatus[person.id];

    if (isLoading) {
      return {
        text: "Loading...",
        icon: null,
        className: "bg-gray-400 text-white cursor-not-allowed",
        disabled: true,
        onClick: null,
      };
    }

    if (requestStatus === "requested") {
      return {
        text: "Request Sent",
        icon: Clock,
        className: "bg-gray-200 text-gray-700 hover:bg-gray-300",
        disabled: false,
        onClick: () => handleCancelRequest(person.id),
      };
    }

    // Default: Follow Back button
    return {
      text: "Follow Back",
      icon: UserPlus,
      className: "bg-blue-600 text-white hover:bg-blue-700",
      disabled: false,
      onClick: () => handleFollowBack(person.id),
    };
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

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return "Unknown";

    const now = new Date();
    const time = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;

    return time.toLocaleDateString();
  };

  const getFormattedDate = (timestamp) => {
    if (!timestamp) return null;

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  const filteredData = () => {
    let data = [];
    if (activeTab === "requests") data = enhancedRequests;
    else if (activeTab === "followers") data = enhancedFollowers;
    else if (activeTab === "following") {
      data = following.map((user) => ({
        id: user.id,
        name: user.name || "Unknown User",
        username: user.username || user.email?.split("@")[0] || "unknown",
        avatar: user.photoURL || null,
        bio: user.bio || "No bio available",
        followedDate: getFormattedDate(user.createdAt) || "Recently",
      }));
    }

    return data.filter(
      (person) =>
        person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const tabs = [
    {
      id: "requests",
      label: "Requests",
      count: enhancedRequests.length,
      icon: Clock,
    },
    {
      id: "followers",
      label: "Followers",
      count: followers.length,
      icon: Users,
    },
    {
      id: "following",
      label: "Following",
      count: following.length,
      icon: UserCheck,
    },
  ];

  if (!currentUser || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 rounded w-1/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            <div className="h-12 bg-gray-300 rounded"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
            People
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Manage your follow requests, followers, and connections
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-4 sm:mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search people..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 bg-white text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Tabs - Mobile Optimized */}
        <div className="mb-4 sm:mb-6">
          <div className="border-b border-gray-200">
            {/* Desktop/Tablet Tabs */}
            <nav className="hidden sm:flex -mb-px space-x-4 lg:space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-all duration-200 ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        activeTab === tab.id
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* Mobile Tabs - Scrollable */}
            <nav className="sm:hidden -mb-px flex space-x-6 overflow-x-auto pb-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        activeTab === tab.id
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3 sm:space-y-4">
          {filteredData().length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Users className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">
                No {activeTab} found
              </h3>
              <p className="text-sm sm:text-base text-gray-500">
                {searchTerm
                  ? `No results for "${searchTerm}"`
                  : `You don't have any ${activeTab} yet`}
              </p>
            </div>
          ) : (
            filteredData().map((person) => {
              const followButtonConfig = getFollowButtonConfig(person);

              return (
                <div
                  key={person.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow duration-200"
                >
                  {/* Mobile Layout - Stacked */}
                  <div className="sm:hidden">
                    {/* User Info Section */}
                    <div className="flex items-start space-x-3 mb-4">
                      {/* Avatar */}
                      <div
                        className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0 cursor-pointer"
                        onClick={() => handleProfileClick(person)}
                      >
                        {person.avatar ? (
                          <img
                            src={person.avatar}
                            alt={person.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          getInitials(person.name)
                        )}
                      </div>

                      {/* User Details */}
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => handleProfileClick(person)}
                          className="text-base font-semibold text-gray-900 hover:text-blue-500 hover:underline cursor-pointer transition-colors text-left truncate block"
                        >
                          {person.name}
                        </button>
                        <button
                          onClick={() => handleProfileClick(person)}
                          className="text-sm text-gray-500 hover:text-blue-500 hover:underline cursor-pointer transition-colors mb-1 block"
                        >
                          @{person.username}
                        </button>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {person.bio}
                        </p>

                        {/* Additional Info */}
                        <div className="flex flex-col space-y-1 text-xs text-gray-500">
                          {activeTab === "requests" && (
                            <>
                              <span>
                                {person.mutualFollowers} mutual followers
                              </span>
                              <span>{person.timestamp}</span>
                            </>
                          )}
                          {(activeTab === "followers" ||
                            activeTab === "following") && (
                            <span>Followed in {person.followedDate}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons - Full Width on Mobile */}
                    <div className="flex space-x-2">
                      {activeTab === "requests" && (
                        <>
                          <button
                            onClick={() =>
                              handleAcceptRequest(
                                person.requestId,
                                person.fromUID
                              )
                            }
                            className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm"
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() =>
                              handleRejectRequest(person.requestId)
                            }
                            className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 text-sm"
                          >
                            <XCircle className="h-4 w-4" />
                            <span>Decline</span>
                          </button>
                        </>
                      )}

                      {/* REMOVED: Follow/Unfollow buttons for followers tab */}
                      {/* Followers tab now only shows profile navigation via clickable names */}

                      {activeTab === "following" && (
                        <button
                          onClick={() => handleUnfollow(person.id)}
                          className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 text-sm"
                        >
                          <UserX className="h-4 w-4" />
                          <span>Unfollow</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Desktop/Tablet Layout - Side by Side */}
                  <div className="hidden sm:flex items-start justify-between">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        {/* Avatar */}
                        <div
                          className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium cursor-pointer"
                          onClick={() => handleProfileClick(person)}
                        >
                          {person.avatar ? (
                            <img
                              src={person.avatar}
                              alt={person.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            getInitials(person.name)
                          )}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => handleProfileClick(person)}
                            className="text-lg font-semibold text-gray-900 hover:text-blue-500 hover:underline cursor-pointer transition-colors text-left truncate block"
                          >
                            {person.name}
                          </button>
                          <button
                            onClick={() => handleProfileClick(person)}
                            className="text-sm text-gray-500 hover:text-blue-500 hover:underline cursor-pointer transition-colors mb-1 block"
                          >
                            @{person.username}
                          </button>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {person.bio}
                          </p>

                          {/* Additional Info */}
                          <div className="flex items-center text-xs text-gray-500 space-x-4">
                            {activeTab === "requests" && (
                              <>
                                <span>
                                  {person.mutualFollowers} mutual followers
                                </span>
                                <span>•</span>
                                <span>{person.timestamp}</span>
                              </>
                            )}
                            {(activeTab === "followers" ||
                              activeTab === "following") && (
                              <span>Followed in {person.followedDate}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Side Info */}
                      <div className="flex flex-col items-end space-y-2 ml-4 flex-shrink-0">
                        {activeTab === "requests" && (
                          <>
                            <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-medium">
                              Follow Request
                            </div>
                            <div className="text-xs text-gray-500 text-right">
                              {person.mutualFollowers > 0 && (
                                <div className="flex items-center space-x-1">
                                  <Users className="h-3 w-3" />
                                  <span>{person.mutualFollowers} mutual</span>
                                </div>
                              )}
                            </div>
                          </>
                        )}

                        {activeTab === "following" && (
                          <>
                            <div className="bg-purple-50 text-purple-600 px-3 py-1 rounded-full text-xs font-medium">
                              Following
                            </div>
                            <div className="text-xs text-gray-500 text-right">
                              <div>{person.followedDate}</div>
                            </div>
                          </>
                        )}

                        {/* Profile Link Indicator */}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-4">
                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        {activeTab === "requests" && (
                          <>
                            <button
                              onClick={() =>
                                handleAcceptRequest(
                                  person.requestId,
                                  person.fromUID
                                )
                              }
                              className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                            >
                              <CheckCircle className="h-4 w-4" />
                              <span>Accept</span>
                            </button>
                            <button
                              onClick={() =>
                                handleRejectRequest(person.requestId)
                              }
                              className="flex items-center space-x-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                            >
                              <XCircle className="h-4 w-4" />
                              <span>Decline</span>
                            </button>
                          </>
                        )}

                        {activeTab === "following" && (
                          <button
                            onClick={() => handleUnfollow(person.id)}
                            className="flex items-center space-x-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                          >
                            <UserX className="h-4 w-4" />
                            <span>Unfollow</span>
                          </button>
                        )}
                      </div>

                      {/* Right Side Info - Moved to rightmost */}
                      <div className="flex flex-col items-end space-y-2 flex-shrink-0">
                        {activeTab === "requests" && (
                          <>
                            <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-medium">
                              Follow Request
                            </div>
                            <div className="text-xs text-gray-500 text-right">
                              {person.mutualFollowers > 0 && (
                                <div className="flex items-center space-x-1">
                                  <Users className="h-3 w-3" />
                                  <span>{person.mutualFollowers} mutual</span>
                                </div>
                              )}
                            </div>
                          </>
                        )}

                        {activeTab === "followers" && (
                          <>
                            <div className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-xs font-medium">
                              Follower
                            </div>
                            <div className="text-xs text-gray-500 text-right">
                              <div>{person.followedDate}</div>
                            </div>
                          </>
                        )}

                        {activeTab === "following" && (
                          <>
                            <div className="bg-purple-50 text-purple-600 px-3 py-1 rounded-full text-xs font-medium">
                              Following
                            </div>
                            <div className="text-xs text-gray-500 text-right">
                              <div>{person.followedDate}</div>
                            </div>
                          </>
                        )}

                        {/* Profile Link Indicator */}
                        <button
                          onClick={() => handleProfileClick(person)}
                          className="text-xs cursor-pointer text-blue-500 hover:text-blue-700 transition-colors flex items-center space-x-1"
                        >
                          <span>View Profile</span>
                          <svg
                            className="h-3 w-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default People;
