import React, { useEffect, useState } from "react";
import LoginComp from "../components/LoginComp";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";
export default function Login() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    onAuthStateChanged(auth, (res) => {
      if (res?.accessToken) {
        navigate("/home");
      } else {
        setLoading(false);
      }
    });
  }, [navigate]);

  return <div>{loading ? <Loader /> : <LoginComp />}</div>;
}
