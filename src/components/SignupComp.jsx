import React, { useState } from "react";
import { AuthApi, GoogleAuthApi } from "../api/AuthApi";
import { RegisterApi } from "../api/AuthApi";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { updateProfile } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { postUserData } from "../api/FireStore";

const SignupComp = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({});

  async function login(e) {
    e.preventDefault();
    try {
      let response = await RegisterApi(credentials.email, credentials.password);
      await updateProfile(auth.currentUser, {
        displayName: credentials.name,
      });
      toast.success("Account Created");
      postUserData({
        name: credentials.name,
        email: credentials.email,
        role: credentials.role,
      });
      navigate("/home");
    } catch (err) {
      toast.error("Sign up failed");
    }
  }
  localStorage.setItem("userEmail", credentials.email || "");
  const signInWithGoogle = async () => {
    let response = GoogleAuthApi();
    // console.log(response);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F4F4F4]">
      <div className="w-full max-w-sm text-center">
        <img
          src="logo.jpeg"
          alt="ResearchHub Logo"
          className=" ml-16 mb-7 w-64 h-auto "
        />
        <h1 className="text-2xl sm:text-4xl black font-bold mb-7">
          Learn Share Grow
        </h1>
        <h1 className="text-xl sm:text-2xl text-[#071B36] font-bold mb-4">
          Create Account
        </h1>

        <form
          className="space-y-4 text-center sm:text-left"
          onSubmit={(e) => login(e)}
        >
          <div className="mx-6 sm:mx-0">
            <label className="block text-xs font-semibold tracking-wide text-gray-600 mb-1 uppercase">
              Name
            </label>
            <input
              value={credentials.name || ""}
              onChange={(e) =>
                setCredentials({ ...credentials, name: e.target.value })
              }
              type="text"
              placeholder="Enter your name"
              className="w-64  sm:w-full px-3 py-2 border border-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div className="mx-6 sm:mx-0">
            <label className="block text-xs font-semibold tracking-wide text-gray-600 mb-1 uppercase">
              Email
            </label>
            <input
              value={credentials.email || ""}
              onChange={(e) =>
                setCredentials({ ...credentials, email: e.target.value })
              }
              type="email"
              placeholder="hello@reallygreatsite.com"
              className="w-64  sm:w-full px-3 py-2 border border-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div className="mx-6 sm:mx-0">
            <label className="block text-xs font-semibold tracking-wide text-gray-600 mb-1 uppercase rounded sm">
              Password{" "}
              <span className="text-[10px]">(more than 6 characters)</span>
            </label>
            <input
              type="password"
              value={credentials.password || ""}
              onChange={(e) =>
                setCredentials({ ...credentials, password: e.target.value })
              }
              placeholder="••••••"
              className="w-64 sm:w-full  px-3 py-2 border border-gray-400 focus:outline-none focus:ring-2 focus:ring-black rounded-b-sm"
            />
          </div>

          {/* Role Selection */}
          <div className="mx-6 sm:mx-0">
            <label className="block text-xs font-semibold tracking-wide text-gray-600 mb-1 uppercase">
              Role
            </label>
            <select
              value={credentials.role || ""}
              onChange={(e) =>
                setCredentials({ ...credentials, role: e.target.value })
              }
              required
              className="w-64 sm:w-full px-3 py-2 border border-gray-400 focus:outline-none focus:ring-2 focus:ring-black bg-white text-gray-700"
            >
              <option value="">Select Your Role</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="researcher">Researcher</option>
            </select>
          </div>

          <div className="pt-2 flex flex-col justify-between items-center">
            <button
              type="submit"
              className="w-28 rounded-xs sm:w-1/2 mx-auto bg-[#071B36] text-white py-2 font-semibold cursor-pointer hover:bg-gray-900 transition"
            >
              Sign Up
            </button>

            <p className="text-xs text-gray-600 mt-4">
              Already on Research Hub?{" "}
              <span
                className="text-[#071B36] font-semibold cursor-pointer"
                onClick={() => navigate("/login")}
              >
                Sign in
              </span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupComp;
