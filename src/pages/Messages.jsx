import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Send,
  MoreVertical,
  Phone,
  Video,
  Info,
  ArrowLeft,
  Paperclip,
  Smile,
  CheckCheck,
  Check,
  Trash2,
  Edit3,
  Circle,
} from "lucide-react";
import Navbar from "../common/navbar";
import EmojiPicker from "../components/EmojiPicker";
import {
  getConversations,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  deleteMessage,
  editMessage,
  getTotalUnreadCount,
  getOnlineStatus,
  updateOnlineStatus,
  getOrCreateConversation,
  getUserDataByUID,
} from "../api/FireStore";
import { auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate, useLocation } from "react-router-dom";

const Messages = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Real-time data
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [editingMessage, setEditingMessage] = useState(null);

  // NEW: Store participant profile data
  const [participantProfiles, setParticipantProfiles] = useState({});

  // Emoji picker state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiButtonRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Get user ID from URL params if navigating from profile
  const searchParams = new URLSearchParams(location.search);
  const initialUserId = searchParams.get("userId");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/");
        return;
      }
      console.log("Current user authenticated:", user.uid);
      setCurrentUser(user);
      setLoading(false);

      // Update online status
      updateOnlineStatus(true);
    });

    return () => unsubscribe();
  }, [navigate]);

  // Load conversations
  useEffect(() => {
    if (!currentUser) return;

    console.log("Setting up conversations listener...");
    const unsubscribe = getConversations(setConversations);
    return () => {
      if (unsubscribe) {
        console.log("Cleaning up conversations listener");
        unsubscribe();
      }
    };
  }, [currentUser]);

  useEffect(() => {
    if (!conversations || conversations.length === 0) return;

    const loadParticipantProfiles = async () => {
      console.log("Loading participant profiles...");
      const profilesMap = {};

      // Get all unique participant IDs
      const participantIds = conversations.map(
        (conv) => conv.otherParticipant.id
      );
      const uniqueParticipantIds = [...new Set(participantIds)];

      // Load profile data for each participant
      const profilePromises = uniqueParticipantIds.map(
        async (participantId) => {
          try {
            const profileData = await getUserDataByUID(participantId);
            if (profileData) {
              profilesMap[participantId] = profileData;
            }
          } catch (error) {
            console.error(`Error loading profile for ${participantId}:`, error);
          }
        }
      );

      await Promise.all(profilePromises);
      console.log("Loaded participant profiles:", profilesMap);
      setParticipantProfiles(profilesMap);
    };

    loadParticipantProfiles();
  }, [conversations]);

  // Load messages for selected chat
  useEffect(() => {
    if (!selectedChat) {
      setMessages([]);
      return;
    }

    console.log("Setting up messages listener for chat:", selectedChat.id);
    const unsubscribe = getMessages(selectedChat.id, setMessages);
    return () => {
      if (unsubscribe) {
        console.log("Cleaning up messages listener");
        unsubscribe();
      }
    };
  }, [selectedChat]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark messages as read when chat is selected
  useEffect(() => {
    if (selectedChat && selectedChat.unreadCount > 0) {
      console.log("Marking messages as read for chat:", selectedChat.id);
      markMessagesAsRead(selectedChat.id);
    }
  }, [selectedChat]);

  // Track online status for conversation participants
  useEffect(() => {
    if (conversations.length === 0) return;

    const participantIds = conversations.map(
      (conv) => conv.otherParticipant.id
    );
    console.log("Setting up online status for participants:", participantIds);
    const unsubscribe = getOnlineStatus(participantIds, setOnlineUsers);

    return () => {
      if (unsubscribe) {
        console.log("Cleaning up online status listeners");
        unsubscribe();
      }
    };
  }, [conversations]);

  // Handle direct message from profile
  useEffect(() => {
    if (initialUserId && conversations.length > 0 && currentUser) {
      console.log("Looking for conversation with user:", initialUserId);
      // Find existing conversation with this user
      const existingConversation = conversations.find(
        (conv) => conv.otherParticipant.id === initialUserId
      );

      if (existingConversation) {
        console.log("Found existing conversation:", existingConversation.id);
        handleChatSelect(existingConversation);
      } else {
        console.log("No existing conversation found, creating one...");
        // Create a conversation if it doesn't exist
        createConversationForUser(initialUserId);
      }
    }
  }, [initialUserId, conversations, currentUser]);

  // Create conversation for direct messaging
  const createConversationForUser = async (userId) => {
    try {
      console.log("Creating conversation with user:", userId);
      const result = await getOrCreateConversation(userId);

      if (result.success) {
        console.log("Conversation created/found:", result.conversationId);
        // Wait a moment for the conversation to appear in the list
        setTimeout(() => {
          const newConversation = conversations.find(
            (conv) => conv.id === result.conversationId
          );
          if (newConversation) {
            handleChatSelect(newConversation);
          }
        }, 1000);
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  // Update online status on component unmount
  useEffect(() => {
    return () => {
      if (currentUser) {
        updateOnlineStatus(false);
      }
    };
  }, [currentUser]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [newMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || sendingMessage) return;

    console.log("Sending message to:", selectedChat.otherParticipant.id);
    setSendingMessage(true);
    const messageContent = newMessage;
    setNewMessage(""); // Clear input immediately for better UX

    try {
      const result = await sendMessage(
        selectedChat.otherParticipant.id,
        messageContent
      );

      if (result.success) {
        console.log("Message sent successfully:", result.messageId);
        // Focus back to textarea after sending
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }, 100);
      } else {
        console.error("Failed to send message:", result.error);
        setNewMessage(messageContent); // Restore message on failure
        alert("Failed to send message: " + result.error);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setNewMessage(messageContent); // Restore message on error
      alert("Error sending message: " + error.message);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleEditMessage = async (messageId, newContent) => {
    try {
      const result = await editMessage(messageId, newContent);
      if (result.success) {
        setEditingMessage(null);
        console.log("Message edited successfully");
      } else {
        console.error("Failed to edit message:", result.error);
        alert("Failed to edit message: " + result.error);
      }
    } catch (error) {
      console.error("Error editing message:", error);
      alert("Error editing message: " + error.message);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Are you sure you want to delete this message?")) {
      return;
    }

    try {
      const result = await deleteMessage(messageId);
      if (result.success) {
        console.log("Message deleted successfully");
      } else {
        console.error("Failed to delete message:", result.error);
        alert("Failed to delete message: " + result.error);
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Error deleting message: " + error.message);
    }
  };

  const handleChatSelect = (chat) => {
    console.log("Selecting chat:", chat.id);
    setSelectedChat(chat);
    setShowMobileChat(true);
    setEditingMessage(null);
    setShowEmojiPicker(false);
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
    setSelectedChat(null);
    setEditingMessage(null);
    setShowEmojiPicker(false);
  };

  const handleEmojiSelect = (emoji) => {
    // Insert emoji at cursor position or at the end
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText =
        newMessage.slice(0, start) + emoji + newMessage.slice(end);
      setNewMessage(newText);

      // Set cursor position after emoji
      setTimeout(() => {
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
        textarea.focus();
      }, 0);
    } else {
      setNewMessage((prev) => prev + emoji);
    }
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

  const getProfilePicture = (userId) => {
    const profile = participantProfiles[userId];
    return profile?.photoURL || null;
  };

  const UserAvatar = ({
    userId,
    name,
    size = "default",
    showOnline = false,
  }) => {
    const profilePic = getProfilePicture(userId);
    const sizeClasses = {
      small: "w-6 h-6",
      default: "w-10 h-10 sm:w-12 sm:h-12",
      large: "w-8 h-8 sm:w-10 sm:h-10",
    };

    const onlineSize = {
      small: "w-2.5 h-2.5",
      default: "w-3 h-3 sm:w-4 sm:h-4",
      large: "w-2.5 h-2.5 sm:w-3 sm:h-3",
    };

    return (
      <div className="relative flex-shrink-0">
        <div
          className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base overflow-hidden`}
        >
          {profilePic ? (
            <img
              src={profilePic}
              alt={name}
              className="w-full h-full rounded-full object-cover"
              onError={(e) => {
                console.log("Image failed to load, falling back to initials");
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
          ) : null}
          <div
            className={`w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center ${
              profilePic ? "hidden" : "flex"
            }`}
          >
            {getInitials(name)}
          </div>
        </div>
      </div>
    );
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";

    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return "now";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;

    return date.toLocaleDateString();
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return "";

    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const isOnline = (userId) => {
    return onlineUsers[userId]?.isOnline || false;
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.otherParticipant?.name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex h-[calc(100vh-4rem)] max-h-screen">
          {/* Conversations List */}
          <div
            className={`${
              showMobileChat ? "hidden" : "w-full"
            } md:w-80 lg:w-96 bg-white border-r border-gray-200 flex flex-col md:flex`}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Messages
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => handleChatSelect(conversation)}
                    className={`p-3 sm:p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors active:bg-gray-100 ${
                      selectedChat?.id === conversation.id
                        ? "bg-blue-50 border-blue-200"
                        : ""
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Avatar with real profile picture */}
                      <UserAvatar
                        userId={conversation.otherParticipant.id}
                        name={conversation.otherParticipant.name}
                        size="default"
                        showOnline={true}
                      />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate pr-2">
                            {conversation.otherParticipant.name}
                          </h3>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {conversation.lastMessage &&
                              formatTime(conversation.lastMessage.timestamp)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <p className="text-xs sm:text-sm text-gray-600 truncate pr-2">
                            {conversation.lastMessage ? (
                              <>
                                {conversation.lastMessage.senderId ===
                                  currentUser.uid && "You: "}
                                {conversation.lastMessage.content}
                              </>
                            ) : (
                              "Start a conversation"
                            )}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <span className="flex-shrink-0 px-2 py-1 text-xs font-bold text-white bg-blue-500 rounded-full min-w-[20px] text-center">
                              {conversation.unreadCount > 99
                                ? "99+"
                                : conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-32">
                  <p className="text-gray-500 text-sm">
                    {searchQuery ? "No conversations found" : "No messages yet"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div
            className={`${
              !showMobileChat ? "hidden md:flex" : "flex"
            } flex-1 bg-white flex-col min-w-0`}
          >
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                    {/* Mobile Back Button */}
                    <button
                      onClick={handleBackToList}
                      className="md:hidden p-2 hover:bg-gray-100 rounded-lg flex-shrink-0 active:bg-gray-200 transition-colors"
                    >
                      <ArrowLeft className="h-5 w-5 text-gray-600" />
                    </button>

                    {/* Avatar with real profile picture */}
                    <UserAvatar
                      userId={selectedChat.otherParticipant.id}
                      name={selectedChat.otherParticipant.name}
                      size="large"
                      showOnline={true}
                    />

                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                        {selectedChat.otherParticipant.name}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
                  {messages.length > 0 ? (
                    messages.map((message, index) => {
                      const isCurrentUser =
                        message.senderId === currentUser.uid;
                      const showAvatar =
                        index === 0 ||
                        messages[index - 1].senderId !== message.senderId;

                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            isCurrentUser ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`flex items-end space-x-2 max-w-[85%] sm:max-w-xs lg:max-w-md ${
                              isCurrentUser
                                ? "flex-row-reverse space-x-reverse"
                                : ""
                            }`}
                          >
                            {/* Avatar for received messages */}
                            {!isCurrentUser && showAvatar && (
                              <UserAvatar
                                userId={selectedChat.otherParticipant.id}
                                name={selectedChat.otherParticipant.name}
                                size="small"
                              />
                            )}

                            {!isCurrentUser && !showAvatar && (
                              <div className="w-6 h-6 flex-shrink-0"></div>
                            )}

                            <div className="relative group">
                              {/* Message Bubble */}
                              <div
                                className={`px-3 sm:px-4 py-2 sm:py-3 rounded-2xl ${
                                  isCurrentUser
                                    ? "bg-blue-500 text-white rounded-br-md"
                                    : "bg-gray-100 text-gray-900 rounded-bl-md"
                                }`}
                              >
                                {editingMessage === message.id ? (
                                  <div className="space-y-2">
                                    <input
                                      type="text"
                                      defaultValue={message.content}
                                      onKeyPress={(e) => {
                                        if (e.key === "Enter") {
                                          handleEditMessage(
                                            message.id,
                                            e.target.value
                                          );
                                        }
                                        if (e.key === "Escape") {
                                          setEditingMessage(null);
                                        }
                                      }}
                                      className="w-full px-2 py-1 text-sm bg-white text-black rounded border"
                                      autoFocus
                                    />
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={() => setEditingMessage(null)}
                                        className="text-xs text-gray-500 hover:text-gray-700"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <p className="text-sm sm:text-base leading-relaxed break-words">
                                      {message.deleted ? (
                                        <span className="italic text-gray-500">
                                          This message was deleted
                                        </span>
                                      ) : (
                                        message.content
                                      )}
                                    </p>
                                    <div
                                      className={`flex items-center justify-between mt-1 space-x-2 ${
                                        isCurrentUser
                                          ? "text-blue-100"
                                          : "text-gray-500"
                                      }`}
                                    >
                                      <span className="text-xs">
                                        {formatMessageTime(message.timestamp)}
                                        {message.editedAt && (
                                          <span className="ml-1 text-xs opacity-75">
                                            (edited)
                                          </span>
                                        )}
                                      </span>
                                      {isCurrentUser && (
                                        <div className="flex-shrink-0">
                                          {message.status === "read" ? (
                                            <CheckCheck className="h-3 w-3" />
                                          ) : (
                                            <Check className="h-3 w-3" />
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>

                              {/* Message Actions */}
                              {isCurrentUser && !message.deleted && (
                                <div className="absolute top-0 right-0 transform translate-x-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <div className="flex space-x-1 ml-2">
                                    <button
                                      onClick={() =>
                                        setEditingMessage(message.id)
                                      }
                                      className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700"
                                      title="Edit message"
                                    >
                                      <Edit3 className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteMessage(message.id)
                                      }
                                      className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-red-600"
                                      title="Delete message"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Send className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Start a conversation
                        </h3>
                        <p className="text-gray-500">
                          Send a message to {selectedChat.otherParticipant.name}
                        </p>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-3 sm:p-4 border-t border-gray-200 flex-shrink-0">
                  <div className="flex items-end space-x-2">
                    {" "}
                    <div className="flex-1 relative">
                      <textarea
                        ref={textareaRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="Type a message..."
                        rows="1"
                        disabled={sendingMessage}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-sm sm:text-base disabled:opacity-50"
                        style={{
                          minHeight: "40px",
                          maxHeight: "120px",
                        }}
                      />

                      {/* Emoji Button */}
                      <div className="absolute right-2 sm:right-3 bottom-2 sm:bottom-3">
                        <button
                          ref={emojiButtonRef}
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className="p-1 hover:bg-gray-100 rounded-lg active:bg-gray-200 transition-colors"
                          title="Add emoji"
                        >
                          <Smile className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                        </button>

                        {/* Emoji Picker */}
                        <EmojiPicker
                          isOpen={showEmojiPicker}
                          onClose={() => setShowEmojiPicker(false)}
                          onEmojiSelect={handleEmojiSelect}
                          buttonRef={emojiButtonRef}
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendingMessage}
                      className="p-2 sm:p-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full transition-colors flex-shrink-0 active:bg-blue-700"
                    >
                      {sendingMessage ? (
                        <div className="h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Send className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Empty State */
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center max-w-sm">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-sm sm:text-base text-gray-500">
                    Choose a conversation from the list to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
