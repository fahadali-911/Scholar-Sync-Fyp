import React from "react";
import { LogIn, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ScholarSyncLogo from "../components/ScholarSyncLogo";

const PublicNavbar = () => {
  const navigate = useNavigate();

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm sticky top-0 z-50 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Section: Logo */}
          <div 
            className="cursor-pointer flex items-center transition-opacity hover:opacity-95" 
            onClick={() => navigate("/")}
          >
            <ScholarSyncLogo theme="light" className="h-10 sm:h-11 w-auto" width="auto" height="100%" />
          </div>

          {/* Right Section: Auth Controls */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={() => navigate("/login")}
              className="flex items-center space-x-1 px-3 py-2 sm:px-4 text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#0B192C] hover:bg-slate-50 rounded-full transition-all duration-200 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
              <span>Log In</span>
            </button>
            <button
              onClick={() => navigate("/register")}
              className="flex items-center space-x-1 px-4 py-2 sm:px-5 sm:py-2.5 bg-[#0B192C] hover:bg-[#14263f] hover:shadow-md text-white text-xs sm:text-sm font-semibold rounded-full transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Sign Up</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default PublicNavbar;
