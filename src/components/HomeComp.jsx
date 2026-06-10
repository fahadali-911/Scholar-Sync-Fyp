import React, { useEffect, useState } from "react";
import Navbar from "../common/navbar";
import Homefeed from "./Homefeed";
import { getUser } from "../api/FireStore";

export default function HomeComp() {
  const [currUser, setCurrUser] = useState(null);
  useEffect(() => {
    getUser(setCurrUser);
  }, []);
  // console.log(currUser);

  return (
    <div className="main h-[100vh] w-[100vw] bg-[#F2F3EE] overflow-x-hidden">
      <Navbar />
      <Homefeed currUser={currUser} />
    </div>
  );
}
