import React, { useState } from "react";
import { AuthApi, GoogleAuthApi } from "../api/AuthApi";
import { RegisterApi } from "../api/AuthApi";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebaseConfig";
import { provider } from "../firebaseConfig";
import { signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
const LoginComp = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({});
  async function login(e) {
    e.preventDefault();
    try {
      let response = await AuthApi(credentials.email, credentials.password);
      toast.success("Login Successful");
      navigate("/home");
    } catch (err) {
      toast.error("Login Failed: ");
    }
  }
  // const signInWithGoogle = async () => {
  //   let response = GoogleAuthApi();
  //   console.log(response);
  //   navigate("/home");
  // };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) {
        await setDoc(userDocRef, {
          name: user.displayName,
          email: user.email,
          role: "",
        });
        // console.log("✅ Google user added to Firestore");
      } else {
        console.log("🔁 Google user already exists in Firestore");
      }
    } catch (error) {
      // console.log("User signed in with Google:", user);
      console.error("Google sign-in error:", error);
      alert(error.message); // Optional user-friendly error
    }
  };

  // const user = auth.currentUser;
  // localStorage.setItem(
  //   "userEmail",
  //   user ? user.email : credentials.email || ""
  // );
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F4F4F4]">
      <div className="w-full max-w-sm text-center">
        <img
          src="logo.jpeg"
          alt="ResearchHub Logo"
          className=" ml-16 mb-10 w-64 h-auto "
        />
        <h1 className="text-3xl text-[#071B36] font-bold mb-4">Login</h1>
        <p className="text-xs text-gray-600 mb-6">Sign in to continue</p>

        <form
          className="space-y-4 text-center sm:text-left"
          onSubmit={(e) => login(e)}
        >
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
              Password
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

          <div className="pt-2 flex flex-col justify-between items-center">
            <button
              type="submit"
              className="w-28 rounded-xs sm:w-1/2 mx-auto bg-[#071B36] text-white py-2 font-semibold cursor-pointer hover:bg-gray-900 transition"
            >
              login
            </button>
            <div
              onClick={signInWithGoogle}
              className="w-64 mt-9 sm:w-full px-3 py-2 border border-gray-400 flex justify-center gap-2 rounded-md hover:bg-[#071B36] transition cursor-pointer text-gray-600 hover:text-white"
            >
              <img src="google.png" alt="google" className="w-5" />{" "}
              <span className="text-sm ">Sign in with google</span>
            </div>
            <p className="text-xs text-gray-600 mt-4">
              New on Research Hub?{" "}
              <span
                className="text-[#071B36] font-semibold cursor-pointer"
                onClick={() => navigate("/register")}
              >
                Create Account
              </span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginComp;
