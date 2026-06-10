import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Home,
  Users,
  MessageCircle,
  Bell,
  User,
  Menu,
  X,
  LogOut,
  FileText,
  Hash,
  Clock,
  TrendingUp,
} from "lucide-react";
import { onLogut } from "../api/AuthApi";
import { useNavigate, useLocation } from "react-router-dom";
import { auth } from "../firebaseConfig";
import {
  getFollowRequests,
  getTotalUnreadCount,
  getSearchSuggestions,
  getUsersNotifications,
  getUnreadNotificationsCount,
  markNotificationsAsRead,
  deleteNotification,
  // markAllNotificationsAsRead, // Add this new function import
} from "../api/FireStore";
import NotificationsPopup from "../components/NotificationsPopup";

const Navbar = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isPopupOpenMobile, setIsPopupOpenMobile] = useState(false);
  const [followRequestsCount, setFollowRequestsCount] = useState(0);
  const [hasUnreadRequests, setHasUnreadRequests] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  // Notifications state
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // Search-related state
  const [searchTerm, setSearchTerm] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef(null);
  const searchDropdownRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Track follow requests in real-time
  useEffect(() => {
    let unsubscribeRequests = null;

    const setupFollowRequestsListener = () => {
      if (auth.currentUser) {
        unsubscribeRequests = getFollowRequests((requests) => {
          const requestCount = requests.length;
          setFollowRequestsCount(requestCount);
          setHasUnreadRequests(requestCount > 0);
        });
      } else {
        setFollowRequestsCount(0);
        setHasUnreadRequests(false);
      }
    };

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setupFollowRequestsListener();
      } else {
        setFollowRequestsCount(0);
        setHasUnreadRequests(false);
        if (unsubscribeRequests) {
          unsubscribeRequests();
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeRequests) {
        unsubscribeRequests();
      }
    };
  }, []);

  // Track unread messages count
  useEffect(() => {
    let unsubscribeMessages = null;

    const setupMessagesListener = () => {
      if (auth.currentUser) {
        unsubscribeMessages = getTotalUnreadCount(setUnreadMessagesCount);
      } else {
        setUnreadMessagesCount(0);
      }
    };

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setupMessagesListener();
      } else {
        setUnreadMessagesCount(0);
        if (unsubscribeMessages) {
          unsubscribeMessages();
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeMessages) {
        unsubscribeMessages();
      }
    };
  }, []);

  // Track notifications in real-time - SAFE VERSION
  useEffect(() => {
    let unsubscribeNotifications = null;
    let unsubscribeUnreadCount = null;

    const setupNotificationsListeners = () => {
      if (auth.currentUser) {
        console.log(
          "🔔 Setting up notification listeners for user:",
          auth.currentUser.uid
        );

        try {
          // Listen to all notifications
          unsubscribeNotifications = getUsersNotifications(setNotifications);
          console.log(
            "✅ Notifications listener set up:",
            typeof unsubscribeNotifications
          );

          // Listen to unread count
          unsubscribeUnreadCount = getUnreadNotificationsCount(
            setUnreadNotificationsCount
          );
          console.log(
            "✅ Unread count listener set up:",
            typeof unsubscribeUnreadCount
          );
        } catch (error) {
          console.error("❌ Error setting up notification listeners:", error);
          setNotifications([]);
          setUnreadNotificationsCount(0);
        }
      } else {
        console.log("❌ No authenticated user, clearing notifications");
        setNotifications([]);
        setUnreadNotificationsCount(0);
      }
    };

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      console.log("🔄 Auth state changed:", user ? user.uid : "No user");

      if (user) {
        setupNotificationsListeners();
      } else {
        console.log("🔄 User logged out, cleaning up notifications");
        setNotifications([]);
        setUnreadNotificationsCount(0);

        // Safely cleanup existing listeners
        if (
          unsubscribeNotifications &&
          typeof unsubscribeNotifications === "function"
        ) {
          console.log("🧹 Cleaning up notifications listener");
          try {
            unsubscribeNotifications();
          } catch (error) {
            console.error(
              "❌ Error cleaning up notifications listener:",
              error
            );
          }
        }

        if (
          unsubscribeUnreadCount &&
          typeof unsubscribeUnreadCount === "function"
        ) {
          console.log("🧹 Cleaning up unread count listener");
          try {
            unsubscribeUnreadCount();
          } catch (error) {
            console.error("❌ Error cleaning up unread count listener:", error);
          }
        }
      }
    });

    return () => {
      console.log("🧹 Component unmounting, cleaning up all listeners");

      // Cleanup auth listener
      if (unsubscribeAuth && typeof unsubscribeAuth === "function") {
        try {
          unsubscribeAuth();
        } catch (error) {
          console.error("❌ Error cleaning up auth listener:", error);
        }
      }

      // Safely cleanup notification listeners
      if (
        unsubscribeNotifications &&
        typeof unsubscribeNotifications === "function"
      ) {
        try {
          unsubscribeNotifications();
        } catch (error) {
          console.error("❌ Error cleaning up notifications listener:", error);
        }
      }

      if (
        unsubscribeUnreadCount &&
        typeof unsubscribeUnreadCount === "function"
      ) {
        try {
          unsubscribeUnreadCount();
        } catch (error) {
          console.error("❌ Error cleaning up unread count listener:", error);
        }
      }
    };
  }, []);

  // Handle search suggestions
  useEffect(() => {
    const getSuggestions = async () => {
      if (searchTerm.trim().length > 0) {
        setIsSearching(true);
        try {
          const result = await getSearchSuggestions(searchTerm);
          if (result.success) {
            setSearchSuggestions(result.suggestions);
            setShowSuggestions(true);
          }
        } catch (error) {
          console.error("Error getting search suggestions:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(getSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Handle clicks outside search dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(event.target) &&
        !searchInputRef.current?.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (query = searchTerm) => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}&category=all`);
      setShowSuggestions(false);
      setSearchTerm("");
      setIsSearchOpen(false);
    }
  };

  const handleSearchInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setSearchTerm("");
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion);
    handleSearch(suggestion);
  };

  const togglePopup = () => {
    setIsPopupOpen(!isPopupOpen);
  };

  const togglePopupMobile = () => {
    setIsPopupOpenMobile(!isPopupOpenMobile);
  };

  const handleLogout = () => {
    console.log("Logging out...");
    onLogut();
    setIsPopupOpen(false);
  };

  const handlePeopleNavigation = () => {
    setHasUnreadRequests(false);
    navigate("/people");
    setIsMobileMenuOpen(false);
  };

  const handleMessagesNavigation = () => {
    navigate("/messages");
    setIsMobileMenuOpen(false);
  };

  // ENHANCED: Notifications handlers with auto-read functionality
  const handleNotificationsClick = async () => {
    console.log("🔔 Bell icon clicked - opening notifications");

    // Mark all unread notifications as read when opening the popup
    if (unreadNotificationsCount > 0) {
      try {
        console.log(
          `📖 Marking ${unreadNotificationsCount} notifications as read`
        );

        // If markAllNotificationsAsRead function exists, use it
        if (typeof markAllNotificationsAsRead === "function") {
          await markNotificationsAsRead();
        } else {
          // Fallback: Mark each unread notification individually
          const unreadNotifications = notifications.filter((n) => !n.read);
          const markPromises = unreadNotifications.map((notification) =>
            markNotificationsAsRead(notification.id)
          );
          await Promise.all(markPromises);
        }

        console.log("✅ All notifications marked as read");

        // Immediately update the local state to hide the badge
        setUnreadNotificationsCount(0);
      } catch (error) {
        console.error("❌ Error marking notifications as read:", error);
      }
    }

    setIsNotificationsOpen(!isNotificationsOpen);
    setIsMobileMenuOpen(false);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationsAsRead(notificationId);
      console.log("Notification marked as read:", notificationId);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      console.log("Notification deleted:", notificationId);
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const navigationItems = [
    {
      icon: Home,
      label: "Home",
      path: "/home",
      active: location.pathname === "/home",
      onClick: () => handleNavigation("/home"),
    },
    {
      icon: Users,
      label: "People",
      path: "/people",
      active: location.pathname === "/people",
      onClick: handlePeopleNavigation,
      hasNotification: hasUnreadRequests,
      notificationCount: followRequestsCount,
    },
    {
      icon: MessageCircle,
      label: "Messages",
      path: "/messages",
      active: location.pathname === "/messages",
      onClick: handleMessagesNavigation,
      hasNotification: unreadMessagesCount > 0,
      notificationCount: unreadMessagesCount,
    },
    {
      icon: Bell,
      label: "Notifications",
      path: "/notifications",
      active: isNotificationsOpen,
      onClick: handleNotificationsClick,
      hasNotification: unreadNotificationsCount > 0,
      notificationCount: unreadNotificationsCount,
    },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="bg-[#F4F4F4] shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="cursor-pointer" onClick={() => navigate("/home")}>
              <img className="h-6 sm:h-7" src="/logo.jpeg" alt="Research hub" />
            </div>

            {/* Desktop Search Bar */}
            <div className="hidden md:flex flex-1 max-w-lg mx-8 relative">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search research papers, people, topics..."
                  value={searchTerm}
                  onChange={handleSearchInputChange}
                  onKeyPress={handleSearchKeyPress}
                  onFocus={() => searchTerm.trim() && setShowSuggestions(true)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                />

                {/* Search Suggestions Dropdown */}
                {showSuggestions &&
                  (searchSuggestions.length > 0 || isSearching) && (
                    <div
                      ref={searchDropdownRef}
                      className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
                    >
                      {isSearching ? (
                        <div className="px-4 py-3 flex items-center space-x-2 text-gray-500">
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-sm">Searching...</span>
                        </div>
                      ) : (
                        <>
                          {searchSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                            >
                              <Search className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-900">
                                {suggestion}
                              </span>
                            </button>
                          ))}

                          {/* Quick Search Categories */}
                          <div className="border-t border-gray-100 px-4 py-2">
                            <p className="text-xs text-gray-500 mb-2">
                              Search in:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() =>
                                  navigate(
                                    `/search?q=${encodeURIComponent(
                                      searchTerm
                                    )}&category=posts`
                                  )
                                }
                                className="flex items-center space-x-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-xs hover:bg-blue-100"
                              >
                                <FileText className="h-3 w-3" />
                                <span>Posts</span>
                              </button>
                              <button
                                onClick={() =>
                                  navigate(
                                    `/search?q=${encodeURIComponent(
                                      searchTerm
                                    )}&category=people`
                                  )
                                }
                                className="flex items-center space-x-1 px-2 py-1 bg-green-50 text-green-600 rounded-md text-xs hover:bg-green-100"
                              >
                                <Users className="h-3 w-3" />
                                <span>People</span>
                              </button>
                              <button
                                onClick={() =>
                                  navigate(
                                    `/search?q=${encodeURIComponent(
                                      searchTerm
                                    )}&category=topics`
                                  )
                                }
                                className="flex items-center space-x-1 px-2 py-1 bg-orange-50 text-orange-600 rounded-md text-xs hover:bg-orange-100"
                              >
                                <Hash className="h-3 w-3" />
                                <span>Topics</span>
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
              </div>
            </div>

            {/* Desktop Navigation Icons */}
            <div className="hidden md:flex items-center space-x-4">
              {navigationItems.map((item, index) => (
                <button
                  key={index}
                  onClick={item.onClick}
                  className={`p-2 rounded-lg transition-all duration-200 relative cursor-pointer ${
                    item.active
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                  title={item.label}
                >
                  <item.icon className="h-6 w-6" />

                  {/* Notification Dot */}
                  {item.hasNotification && (
                    <div className="absolute -top-1 -right-1 flex items-center justify-center">
                      <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                        <span className="text-white text-xs font-bold">
                          {item.notificationCount > 9
                            ? "9+"
                            : item.notificationCount}
                        </span>
                      </div>
                    </div>
                  )}
                </button>
              ))}

              {/* Profile Button */}
              <button
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 cursor-pointer"
                onClick={togglePopup}
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
              </button>
            </div>

            {/* Popup Dropdown */}
            {isPopupOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsPopupOpen(false)}
                />
                <div className="absolute top-12 right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                  <button
                    onClick={() => {
                      navigate("/my-profile");
                      setIsPopupOpen(false);
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <User className="w-4 h-4 mr-3" />
                    My Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Logout
                  </button>
                </div>
              </>
            )}

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              {/* Mobile Search Toggle */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-all duration-200 cursor-pointer"
              >
                <Search className="h-6 w-6" />
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-all duration-200 cursor-pointer"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          {isSearchOpen && (
            <div className="md:hidden pb-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search research papers, people, topics..."
                  value={searchTerm}
                  onChange={handleSearchInputChange}
                  onKeyPress={handleSearchKeyPress}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                  autoFocus
                />

                {/* Mobile Search Suggestions */}
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    {searchSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                      >
                        <Search className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {suggestion}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 pt-4 pb-4">
              <div className="grid grid-cols-2 gap-4">
                {navigationItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={item.onClick}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 relative cursor-pointer ${
                      item.active
                        ? "bg-blue-100 text-blue-600"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <div className="relative">
                      <item.icon className="h-5 w-5" />
                      {item.hasNotification && (
                        <div className="absolute -top-2 -right-2 flex items-center justify-center">
                          <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                            <span className="text-white text-xs font-bold">
                              {item.notificationCount > 9
                                ? "9+"
                                : item.notificationCount || ""}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                ))}

                {/* Mobile Profile Button */}
                <button
                  className="flex items-center space-x-3 p-3 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 cursor-pointer"
                  onClick={togglePopupMobile}
                >
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium">Profile</span>
                </button>

                {isPopupOpenMobile && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsPopupOpenMobile(false)}
                    />
                    <div className="absolute bottom-3 left-32 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                      <button
                        onClick={() => {
                          navigate("/my-profile");
                          setIsPopupOpenMobile(false);
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <User className="w-4 h-4 mr-3" />
                        My Profile
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Notifications Popup */}
      <NotificationsPopup
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onDeleteNotification={handleDeleteNotification}
      />
    </>
  );
};

export default Navbar;
