import React, { useState, useEffect } from "react";
import {
  Heart,
  MessageCircle,
  User,
  Clock,
  Check,
  Bell,
  Trash2,
  BellOff,
  CheckCheck,
} from "lucide-react";
import Navbar from "../common/navbar";
import {
  getUsersNotifications,
  getUnreadNotificationsCount,
  markNotificationsAsRead,
  deleteNotification,
  getUserDataByUID,
} from "../api/FireStore";
import { auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const Notifications = () => {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userProfiles, setUserProfiles] = useState({});
  const navigate = useNavigate();

  // Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/");
        return;
      }
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, [navigate]);

  // Notifications Listener
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    const unsubscribeNotifications = getUsersNotifications((data) => {
      setNotifications(data);
      setLoading(false);
    });

    const unsubscribeUnread = getUnreadNotificationsCount(setUnreadCount);

    return () => {
      if (unsubscribeNotifications) unsubscribeNotifications();
      if (unsubscribeUnread) unsubscribeUnread();
    };
  }, [currentUser]);

  // Load User Profiles for Notification Senders
  useEffect(() => {
    if (!notifications || notifications.length === 0) return;

    const loadUserProfiles = async () => {
      const profilesMap = { ...userProfiles };
      const userIds = notifications
        .map((notification) => notification.fromUID)
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
  }, [notifications]);

  // Mark all unread notifications as read
  const handleMarkAllRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.read);
    if (unreadNotifications.length === 0) return;

    try {
      const markPromises = unreadNotifications.map((notification) =>
        markNotificationsAsRead(notification.id)
      );
      await Promise.all(markPromises);
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Mark individual notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationsAsRead(notificationId);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Delete individual notification
  const handleDeleteNotification = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  // Clear all notifications
  const handleClearAll = async () => {
    if (window.confirm("Are you sure you want to clear all notifications?")) {
      try {
        const deletePromises = notifications.map((n) =>
          deleteNotification(n.id)
        );
        await Promise.all(deletePromises);
      } catch (error) {
        console.error("Error clearing notifications:", error);
      }
    }
  };

  // Format timestamp helper
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return "now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080)
      return `${Math.floor(diffInMinutes / 1440)}d ago`;

    return date.toLocaleDateString();
  };

  // Notification Icon Helper
  const getNotificationIcon = (type) => {
    switch (type) {
      case "like":
        return <Heart className="h-3 w-3 text-red-500 fill-current" />;
      case "comment":
        return <MessageCircle className="h-3 w-3 text-blue-500 fill-current" />;
      case "follow":
        return <User className="h-3 w-3 text-green-500" />;
      default:
        return <User className="h-3 w-3 text-gray-500" />;
    }
  };

  // Avatar Initials Helper
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

  // Consistent Avatar Gradients
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
      hash = (hash << 5) - hash + identifier.charCodeAt(i);
      hash = hash & hash;
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };

  // Render User Avatar
  const UserAvatar = ({ userId, name }) => {
    const profile = userProfiles[userId];
    const profileImageURL = profile?.photoURL;
    const displayName = profile?.name || name || "User";
    const gradient = getConsistentGradient(userId || displayName);

    return (
      <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 relative border border-slate-100 shadow-sm">
        {profileImageURL ? (
          <img
            src={profileImageURL}
            alt={displayName}
            className="w-full h-full rounded-full object-cover"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextElementSibling.style.display = "flex";
            }}
          />
        ) : null}
        <div
          className={`absolute inset-0 w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-semibold text-sm`}
          style={{ display: profileImageURL ? "none" : "flex" }}
        >
          {getProfileInitials(displayName)}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              Notifications
              {unreadCount > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                  {unreadCount} new
                </span>
              )}
            </h1>
            <p className="text-slate-500 mt-1.5 text-sm sm:text-base">
              Stay updated with interactions, comments, and new followers
            </p>
          </div>

          {notifications.length > 0 && (
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100/80 rounded-lg transition-all duration-200"
                >
                  <CheckCheck className="h-4 w-4" />
                  Mark all as read
                </button>
              )}
              <button
                onClick={handleClearAll}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100/80 rounded-lg transition-all duration-200"
              >
                <Trash2 className="h-4 w-4" />
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Notifications Body */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-slate-100 p-5 animate-pulse flex items-start gap-4"
              >
                <div className="w-12 h-12 bg-slate-200 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2.5">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          /* Professional Centered Empty State */
          <div className="bg-white rounded-2xl border border-slate-100 py-20 px-6 text-center shadow-sm flex flex-col items-center justify-center transition-all duration-300">
            <div className="w-16 h-16 bg-blue-50/50 rounded-full flex items-center justify-center mb-6 shadow-inner animate-bounce">
              <Bell className="h-8 w-8 text-blue-500/80" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 tracking-tight mb-2">
              All caught up!
            </h3>
            <p className="text-slate-500 max-w-sm mx-auto text-sm sm:text-base leading-relaxed">
              You don't have any notifications at the moment. We'll let you know when users interact with your posts or profile.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-100">
            {notifications.map((notification) => {
              const profile = userProfiles[notification.fromUID];
              const senderName =
                profile?.name || notification.fromName || "Someone";

              return (
                <div
                  key={notification.id}
                  onClick={() => {
                    if (!notification.read) {
                      handleMarkAsRead(notification.id);
                    }
                    if (notification.postId) {
                      // Navigate to post or handle action
                      console.log("Navigate to post:", notification.postId);
                    }
                  }}
                  className={`p-5 transition-all duration-200 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50/60 ${
                    !notification.read
                      ? "bg-blue-50/20 border-l-4 border-blue-500"
                      : ""
                  }`}
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* User Avatar + Type Badge */}
                    <div className="relative">
                      <UserAvatar
                        userId={notification.fromUID}
                        name={senderName}
                      />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center border border-slate-100 shadow-sm">
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>

                    {/* Notification Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-900 text-sm sm:text-base leading-snug">
                        <span className="font-semibold text-slate-950 hover:underline">
                          {senderName}
                        </span>{" "}
                        {notification.type === "like" && "liked your post"}
                        {notification.type === "comment" &&
                          "commented on your post"}
                        {notification.type === "follow" &&
                          "started following you"}
                      </p>

                      {notification.postTitle && (
                        <p className="text-slate-500 text-xs sm:text-sm truncate mt-1 italic font-medium">
                          "{notification.postTitle}"
                        </p>
                      )}

                      {notification.commentText && (
                        <p className="text-slate-600 text-xs sm:text-sm mt-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 leading-relaxed">
                          "{notification.commentText}"
                        </p>
                      )}

                      <div className="flex items-center gap-1.5 mt-2.5 text-slate-400">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">
                          {formatTime(notification.timestamp)}
                        </span>
                        {!notification.read && (
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full ml-1.5" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                    {!notification.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNotification(notification.id);
                      }}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                      title="Delete notification"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
