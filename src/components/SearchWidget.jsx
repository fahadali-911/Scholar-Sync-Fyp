import React, { useState, useEffect, useRef } from "react";
import { Search, TrendingUp, Hash, Users, FileText, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getSearchSuggestions } from "../api/FireStore";

const SearchWidget = ({ placeholder = "Search...", className = "" }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  const navigate = useNavigate();
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const recent = JSON.parse(localStorage.getItem("recentSearches") || "[]");
    setRecentSearches(recent.slice(0, 5));
  }, []);

  // Handle search suggestions
  useEffect(() => {
    const getSuggestions = async () => {
      if (searchTerm.trim().length > 0) {
        setIsLoading(true);
        try {
          const result = await getSearchSuggestions(searchTerm);
          if (result.success) {
            setSuggestions(result.suggestions);
          }
        } catch (error) {
          console.error("Error getting suggestions:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSuggestions([]);
      }
    };

    const debounceTimer = setTimeout(getSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !searchRef.current?.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (query = searchTerm) => {
    if (query.trim()) {
      // Save to recent searches
      const recent = JSON.parse(localStorage.getItem("recentSearches") || "[]");
      const updated = [query, ...recent.filter((item) => item !== query)].slice(
        0,
        5
      );
      localStorage.setItem("recentSearches", JSON.stringify(updated));
      setRecentSearches(updated);

      // Navigate to search results
      navigate(`/search?q=${encodeURIComponent(query.trim())}&category=all`);
      setShowSuggestions(false);
      setSearchTerm("");
    }
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    if (e.target.value.trim()) {
      setShowSuggestions(true);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleSearch(suggestion);
  };

  const quickSearchCategories = [
    { label: "Posts", category: "posts", icon: FileText, color: "blue" },
    { label: "People", category: "people", icon: Users, color: "green" },
    { label: "Topics", category: "topics", icon: Hash, color: "orange" },
  ];

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={searchRef}
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onFocus={() => setShowSuggestions(true)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 bg-white hover:shadow-sm"
        />
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
        >
          {/* Recent Searches */}
          {!searchTerm.trim() && recentSearches.length > 0 && (
            <div className="p-4 border-b border-gray-100">
              <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                <Clock className="h-4 w-4 mr-2 text-gray-400" />
                Recent Searches
              </h4>
              <div className="space-y-1">
                {recentSearches.map((recent, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(recent)}
                    className="w-full px-2 py-1.5 text-left hover:bg-gray-50 rounded text-sm text-gray-700 transition-colors"
                  >
                    {recent}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="px-4 py-3 flex items-center space-x-2 text-gray-500">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Searching...</span>
            </div>
          )}

          {/* Suggestions */}
          {!isLoading && suggestions.length > 0 && (
            <div className="p-2">
              <h4 className="text-sm font-medium text-gray-900 mb-2 px-2">
                Suggestions
              </h4>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 rounded-md flex items-center space-x-3 transition-colors"
                >
                  <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-900 truncate">
                    {suggestion}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Quick Search Categories */}
          {searchTerm.trim() && (
            <div className="border-t border-gray-100 p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Search in:
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {quickSearchCategories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.category}
                      onClick={() =>
                        navigate(
                          `/search?q=${encodeURIComponent(
                            searchTerm
                          )}&category=${category.category}`
                        )
                      }
                      className={`flex flex-col items-center space-y-1 p-3 rounded-lg border-2 border-${category.color}-100 bg-${category.color}-50 hover:bg-${category.color}-100 transition-colors text-${category.color}-600`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-medium">
                        {category.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Trending Topics */}
          {!searchTerm.trim() && (
            <div className="border-t border-gray-100 p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-orange-500" />
                Trending
              </h4>
              <div className="space-y-2">
                {[
                  "Machine Learning",
                  "Artificial Intelligence",
                  "Data Science",
                  "Research Methods",
                  "Academic Writing",
                ].map((topic, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(topic)}
                    className="w-full px-2 py-1.5 text-left hover:bg-gray-50 rounded text-sm text-gray-700 transition-colors flex items-center space-x-2"
                  >
                    <Hash className="h-3 w-3 text-gray-400" />
                    <span>{topic}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {!isLoading && searchTerm.trim() && suggestions.length === 0 && (
            <div className="px-4 py-6 text-center">
              <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                No suggestions found for "{searchTerm}"
              </p>
              <button
                onClick={() => handleSearch()}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Search anyway
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchWidget;
