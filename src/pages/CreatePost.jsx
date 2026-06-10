import React, { useEffect, useState } from "react";
import FileUpload from "../components/FileUpload";

import {
  X,
  Upload,
  FileText,
  Image,
  Link,
  Users,
  Eye,
  Globe,
  Lock,
} from "lucide-react";
import FireStore, { getUserDataByUID } from "../api/FireStore";
import { getAuth } from "firebase/auth";
import { auth } from "../firebaseConfig";

const CreatePost = ({ isOpen, setIsOpen, currUser }) => {
  const [postType, setPostType] = useState("discussion");
  const [visibility, setVisibility] = useState("public");
  const [selectedTags, setSelectedTags] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [userData, setUserData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileData, setFileData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser?.uid) {
        try {
          const data = await getUserDataByUID(auth.currentUser.uid);
          if (data) {
            setUserData(data);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };

    if (isOpen) {
      fetchUserData();
    }
  }, [isOpen]);

  const postTypes = [
    {
      value: "discussion",
      label: "Discussion",
      icon: Users,
      desc: "Start a conversation or ask questions",
    },
    {
      value: "research",
      label: "Research Paper",
      icon: FileText,
      desc: "Share your research work",
    },
    {
      value: "announcement",
      label: "Announcement",
      icon: Globe,
      desc: "Share news or updates",
    },
  ];

  const popularTags = [
    "Machine Learning",
    "Computer Science",
    "AI",
    "Data Science",
    "Research Methods",
    "Statistics",
    "Programming",
    "Academic Writing",
    "Literature Review",
    "Methodology",
  ];

  function tagsSubmit(e) {
    e.preventDefault();
    const tagInput = e.target.querySelector("input[type='text']");
    const newTag = tagInput.value.trim();
    if (newTag && !selectedTags.includes(newTag) && selectedTags.length < 5) {
      setSelectedTags([...selectedTags, newTag]);
      tagInput.value = ""; // Clear input after adding
    }
  }

  const addTag = (tag) => {
    if (!selectedTags.includes(tag) && selectedTags.length < 5) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const removeTag = (tagToRemove) => {
    setSelectedTags(selectedTags.filter((tag) => tag !== tagToRemove));
  };

  const handleFileUpload = (uploadedFile) => {
    setFileData(uploadedFile);
    console.log("File uploaded:", uploadedFile);
  };

  const handleFileRemove = (removedFile) => {
    setFileData(null);
    console.log("File removed:", removedFile);
  };

  async function sendStatus(title, content) {
    if (isSubmitting) return; // Prevent multiple submissions

    setIsSubmitting(true);

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        alert("You must be logged in to create a post");
        return;
      }

      // Get user name from multiple sources with fallbacks
      const userName =
        userData?.name ||
        currUser?.name ||
        user?.displayName ||
        user?.email?.split("@")[0] ||
        "Anonymous";

      const userEmail =
        userData?.email ||
        currUser?.email ||
        user?.email ||
        "unknown@example.com";

      // Generate initials safely
      const generateInitials = (name) => {
        if (!name || typeof name !== "string") return "U";
        return (
          name
            .split(" ")
            .map((n) => n.trim()[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) || "U"
        );
      };

      const initials = generateInitials(userName);

      // Create comprehensive user object
      const currentUserData = {
        name: userName,
        email: userEmail,
        uid: user.uid,
        id: user.uid,
        ...userData,
        ...currUser,
      };

      const postData = {
        postId: Date.now() + Math.random().toString(36).substring(2, 15),
        title: title.trim(),
        description: content.trim(),
        excerpt: content.trim(),
        status: content.trim(),
        authorBg: "bg-gradient-to-br from-green-500 to-teal-600",
        tags: selectedTags,
        postType: postType,
        type: postType, //
        visibility,
        author: userName,
        authorInitials: initials,
        authorEmail: userEmail,
        authorId: user.uid,
        likes: 0,
        likedBy: [],
        comments: 0,
        views: 0,
        liked: false,
        time: new Date().toLocaleString(),
        timeStamp: {
          seconds: Math.floor(Date.now() / 1000),
          nanoseconds: (Date.now() % 1000) * 1000000,
        },
        currUser: currentUserData,
        createdAt: new Date(),
        updatedAt: new Date(),
        fileURL: fileData?.url || null,
        fileName: fileData?.name || null,
        fileType: fileData?.type || null,
        fileSize: fileData?.size || null,
      };
      console.log("Creating post with data:", postData);

      await FireStore(postData);

      // Reset form and close modal
      setIsOpen(false);
      setTitle("");
      setContent("");
      setSelectedTags([]);
      setPostType("discussion");
      setVisibility("public");
      setFileData(null);
      console.log("Post created successfully");
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleClose = () => {
    if (isSubmitting) return; // Prevent closing while submitting
    setIsOpen(false);
    setTitle("");
    setContent("");
    setSelectedTags([]);
    setPostType("discussion");
    setVisibility("public");
    setFileData(null);
  };

  const canSubmit = title.trim() && content.trim() && !isSubmitting;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white border-2 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            Create New Post
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Main content */}
        <div className="flex flex-col lg:flex-row max-h-[calc(90vh-80px)]">
          {/* Left side */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
            {/* Post Type */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Post Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {postTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      onClick={() => setPostType(type.value)}
                      disabled={isSubmitting}
                      className={`p-4 rounded-lg border-2 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        postType === type.value
                          ? "border-blue-500 bg-blue-50 shadow-md"
                          : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-center mb-2">
                        <Icon
                          className={`w-5 h-5 mr-2 ${
                            postType === type.value
                              ? "text-blue-600"
                              : "text-gray-600"
                          }`}
                        />
                        <span
                          className={`font-medium ${
                            postType === type.value
                              ? "text-blue-700"
                              : "text-gray-700"
                          }`}
                        >
                          {type.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{type.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                type="text"
                placeholder="Enter a compelling title for your post..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">
                {title.length}/200 characters
              </p>
            </div>

            {/* Content */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {postType === "research" ? "Abstract" : "Content"}
                <span className="text-red-500">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isSubmitting}
                rows={6}
                placeholder="Write your post content here..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                maxLength={2000}
              />
              <div className="mt-4">
                <FileUpload
                  onFileUpload={handleFileUpload}
                  onFileRemove={handleFileRemove}
                  maxFiles={1}
                  accept="image/*,.pdf,.doc,.docx"
                  className="mb-4"
                />
              </div>
              <div className="flex justify-between items-center mt-2">
                <div className="flex space-x-2">
                  {[
                    { icon: FileText, label: "Attach File" },
                    { icon: Image, label: "Add Image" },
                    { icon: Link, label: "Add Link" },
                  ].map(({ icon: Icon, label }, idx) => (
                    <button
                      key={idx}
                      disabled={isSubmitting}
                      className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Icon className="w-4 h-4 mr-1" />
                      {label}
                    </button>
                  ))}
                </div>
                <span className="text-sm text-gray-500">
                  {content.length}/2000 characters
                </span>
              </div>
            </div>
          </div>

          {/* Right side - Settings */}
          <div className="w-full lg:w-80 bg-gray-50 p-4 sm:p-6 border-t lg:border-t-0 lg:border-l border-gray-200 overflow-y-auto">
            {/* Tags */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Tags <span className="text-gray-500">(up to 5)</span>
              </label>
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        disabled={isSubmitting}
                        className="ml-2 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <form onSubmit={tagsSubmit}>
                <input
                  type="text"
                  placeholder="Add a tag..."
                  disabled={isSubmitting || selectedTags.length >= 5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </form>
              <p className="text-sm text-gray-600 mb-2">Popular tags:</p>
              <div className="flex flex-wrap gap-2">
                {popularTags.slice(0, 6).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => addTag(tag)}
                    disabled={
                      selectedTags.includes(tag) ||
                      selectedTags.length >= 5 ||
                      isSubmitting
                    }
                    className={`px-3 py-1 text-sm rounded-full transition-colors disabled:cursor-not-allowed ${
                      selectedTags.includes(tag)
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Category (only for research) */}
            {postType === "research" && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  <option value="">Select a category</option>
                  <option value="computer-science">Computer Science</option>
                  <option value="engineering">Engineering</option>
                  <option value="mathematics">Mathematics</option>
                  <option value="physics">Physics</option>
                  <option value="biology">Biology</option>
                  <option value="chemistry">Chemistry</option>
                  <option value="social-science">Social Science</option>
                  <option value="literature">Literature</option>
                  <option value="other">Other</option>
                </select>
              </div>
            )}

            {/* User Info Preview */}
            {(userData?.name || currUser?.name) && (
              <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Posting as:
                </h4>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                    {userData?.name || currUser?.name
                      ? (userData?.name || currUser?.name)
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                      : "U"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {userData?.name || currUser?.name || "Loading..."}
                    </p>
                    <p className="text-xs text-gray-500">
                      {userData?.email ||
                        currUser?.email ||
                        auth.currentUser?.email}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2 mb-2 sm:mb-0">
            <span className="text-sm text-gray-600">
              {visibility === "public"
                ? "This post will be visible to everyone"
                : "This post will be private"}
            </span>
            {visibility === "public" ? (
              <Globe className="w-4 h-4 text-green-600" />
            ) : (
              <Lock className="w-4 h-4 text-orange-600" />
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-6 py-2 cursor-pointer text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              disabled={isSubmitting}
              className="px-6 py-2 cursor-pointer bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Draft
            </button>
            <button
              className={`px-2 cursor-pointer sm:px-6 py-1 rounded-lg transition-colors shadow-md flex items-center gap-2 ${
                canSubmit
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              onClick={() => sendStatus(title, content)}
              disabled={!canSubmit}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Publishing...
                </>
              ) : (
                "Publish Post"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
