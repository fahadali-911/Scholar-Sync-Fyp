import React, { useState, useEffect, useRef } from "react";
import {
  Heart,
  MessageCircle,
  User,
  X,
  Clock,
  Check,
  CheckCheck,
  Bell,
  Trash2,
} from "lucide-react";
import { getUserDataByUID } from "../api/FireStore";

const NotificationsPopup = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onDeleteNotification,
}) => {
  const [userProfiles, setUserProfiles] = useState({});
  const popupRef = useRef(null);

  // Load user profiles for notification senders
  useEffect(() => {
    if (!notifications || notifications.length === 0) return;

    const loadUserProfiles = async () => {
      const profilesMap = { ...userProfiles };

      // Get all unique user IDs from notifications
      const userIds = notifications
        .map((notification) => notification.fromUID)
        .filter((id) => id && !profilesMap[id]);

      const uniqueUserIds = [...new Set(userIds)];

      if (uniqueUserIds.length === 0) return;

      console.log("Loading profiles for notification senders:", uniqueUserIds);

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
      console.log("Loaded notification sender profiles:", profilesMap);
      setUserProfiles(profilesMap);
    };

    loadUserProfiles();
  }, [notifications]);

  // Handle clicks outside popup
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Helper functions
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

  const getNotificationIcon = (type) => {
    switch (type) {
      case "like":
        return <Heart className="h-4 w-4 text-red-500 fill-current" />;
      case "comment":
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case "follow":
        return <User className="h-4 w-4 text-green-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationBgColor = (type, isRead) => {
    if (isRead) return "bg-white hover:bg-gray-50";

    switch (type) {
      case "like":
        return "bg-red-50 hover:bg-red-100 border-l-4 border-red-500";
      case "comment":
        return "bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500";
      case "follow":
        return "bg-green-50 hover:bg-green-100 border-l-4 border-green-500";
      default:
        return "bg-gray-50 hover:bg-gray-100";
    }
  };

  const UserAvatar = ({ userId, name, size = "sm" }) => {
    const profile = userProfiles[userId];
    const profileImageURL = profile?.photoURL;
    const displayName = profile?.name || name || "User";

    const sizeClasses = {
      sm: "w-8 h-8 text-xs",
      md: "w-10 h-10 text-sm",
      lg: "w-12 h-12 text-base",
    };

    const sizeClass = sizeClasses[size] || sizeClasses.sm;
    const gradient = getConsistentGradient(userId || displayName);

    return (
      <div
        className={`${sizeClass} rounded-full overflow-hidden flex-shrink-0 relative`}
      >
        {profileImageURL ? (
          <>
            <img
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-25"
        onClick={onClose}
      />

      {/* Popup */}
      <div
        ref={popupRef}
        className="absolute top-16 right-4 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          <div className="flex items-center space-x-2">
            {notifications.filter((n) => !n.read).length > 0 && (
              <button
                onClick={() => {
                  notifications.forEach((notification) => {
                    if (!notification.read) {
                      onMarkAsRead(notification.id);
                    }
                  });
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Bell className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No notifications yet
              </h3>
              <p className="text-gray-500 text-center">
                You'll see notifications here when people interact with your
                posts
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => {
                const profile = userProfiles[notification.fromUID];
                const senderName =
                  profile?.name || notification.fromName || "Someone";

                return (
                  <div
                    key={notification.id}
                    className={`p-4 transition-all duration-200 cursor-pointer ${getNotificationBgColor(
                      notification.type,
                      notification.read
                    )}`}
                    onClick={() => {
                      if (!notification.read) {
                        onMarkAsRead(notification.id);
                      }
                      // Navigate to post if postId exists
                      if (notification.postId) {
                        // You can implement navigation to specific post here
                        console.log("Navigate to post:", notification.postId);
                      }
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      {/* User Avatar */}
                      <div className="relative">
                        <UserAvatar
                          userId={notification.fromUID}
                          name={senderName}
                          size="md"
                        />

                        {/* Notification Type Icon */}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center border border-gray-200">
                          {getNotificationIcon(notification.type)}
                        </div>
                      </div>

                      {/* Notification Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900">
                              <span className="font-semibold">
                                {senderName}
                              </span>
                              {notification.type === "like" &&
                                " liked your post"}
                              {notification.type === "comment" &&
                                " commented on your post"}
                              {notification.type === "follow" &&
                                " started following you"}
                            </p>

                            {notification.postTitle && (
                              <p className="text-sm text-gray-600 truncate mt-1">
                                "{notification.postTitle}"
                              </p>
                            )}

                            {notification.commentText && (
                              <p className="text-sm text-gray-600 mt-1 bg-gray-50 rounded px-2 py-1">
                                "{notification.commentText}"
                              </p>
                            )}

                            <div className="flex items-center space-x-2 mt-2">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {formatTime(notification.timestamp)}
                              </span>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-1 ml-2">
                            {!notification.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMarkAsRead(notification.id);
                                }}
                                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                                title="Mark as read"
                              >
                                <Check className="h-3 w-3 text-gray-500" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteNotification(notification.id);
                              }}
                              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                              title="Delete notification"
                            >
                              <Trash2 className="h-3 w-3 text-gray-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">
                {notifications.filter((n) => !n.read).length} unread
              </span>
              <button
                onClick={() => {
                  // Clear all notifications
                  notifications.forEach((notification) => {
                    onDeleteNotification(notification.id);
                  });
                }}
                className="text-red-600 hover:text-red-800 font-medium"
              >
                Clear all
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPopup;
