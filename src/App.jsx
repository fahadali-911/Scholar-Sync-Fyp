import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import { useEffect } from "react";

import "./App.css";
// Environment variables are automatically loaded in Vite projects.
// No need to manually import .env files in React with Vite.
// Access variables via process.env.REACT_APP_*
function App() {
  const [count, setCount] = useState(0);

  // Add this to src/App.jsx or any component temporarily
  console.log("hello");

  useEffect(() => {
    // For Vite projects - use import.meta.env
    console.log("Cloud Name:", import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);
    console.log(
      "Upload Preset:",
      import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
    );

    if (!import.meta.env.VITE_CLOUDINARY_CLOUD_NAME) {
      console.error("❌ Missing VITE_CLOUDINARY_CLOUD_NAME in .env file");
    }
    if (!import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET) {
      console.error("❌ Missing VITE_CLOUDINARY_UPLOAD_PRESET in .env file");
    }
  }, []);

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
