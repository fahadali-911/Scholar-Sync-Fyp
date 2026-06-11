import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Sidebar({ isOpen, onClose, onSettingsClick }) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      label: "Feed",
      icon: "dynamic_feed",
      path: "/home",
      active: location.pathname === "/home",
    },
    {
      label: "Research",
      icon: "school",
      path: "/my-profile",
      active: location.pathname.includes("/profile") || location.pathname === "/my-profile",
    },
    {
      label: "Connections",
      icon: "group",
      path: "/people",
      active: location.pathname === "/people",
    },
  ];

  const handleNavigation = (path, e) => {
    e.preventDefault();
    if (path !== "#") {
      navigate(path);
      if (onClose) onClose();
    }
  };

  return (
    <>
      <aside className="h-full w-64 fixed left-0 top-0 pt-20 hidden lg:flex flex-col bg-bg-subtle border-r border-fine z-40">
        <div className="px-6 py-8 flex-1 flex flex-col justify-between">
          <div>
            {/* Space placeholder instead of logo */}
            <div className="mb-10 px-2" />

            {/* Navigation links */}
            <nav className="flex flex-col gap-2">
              {menuItems.map((item, index) => (
                <a
                  key={index}
                  href={item.path}
                  onClick={(e) => handleNavigation(item.path, e)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-label-md text-label-md ${
                    item.active
                      ? "bg-white text-primary font-bold border-l-4 border-primary shadow-sm rounded-r-xl"
                      : "text-text-muted hover:bg-surface-container hover:text-primary"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  {item.label}
                </a>
              ))}
              
              {/* Settings Link */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (onSettingsClick) onSettingsClick();
                  if (onClose) onClose();
                }}
                className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-all duration-200 font-label-md text-label-md text-text-muted hover:bg-surface-container hover:text-primary cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">settings</span>
                Settings
              </button>
            </nav>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer (visible when isOpen is true, floating sidebar) */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity duration-300"
            onClick={onClose}
          />

          {/* Drawer content */}
          <div className="relative w-64 max-w-xs bg-white h-full shadow-2xl flex flex-col p-6 transition-transform duration-300 z-10 ease-out transform translate-x-0">
            {/* Header / Close button */}
            <div className="flex items-center justify-end mb-8 px-2">
              <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full cursor-pointer flex items-center">
                <span className="material-symbols-outlined text-[20px] text-slate-500">close</span>
              </button>
            </div>

            {/* Navigation links */}
            <nav className="flex flex-col gap-2">
              {menuItems.map((item, index) => (
                <a
                  key={index}
                  href={item.path}
                  onClick={(e) => handleNavigation(item.path, e)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-label-md text-label-md ${
                    item.active
                      ? "bg-slate-100 text-primary font-bold border-l-4 border-primary shadow-sm rounded-r-xl"
                      : "text-text-muted hover:bg-slate-50 hover:text-primary"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  {item.label}
                </a>
              ))}
              
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (onSettingsClick) onSettingsClick();
                  if (onClose) onClose();
                }}
                className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-all duration-200 font-label-md text-label-md text-text-muted hover:bg-slate-50 hover:text-primary cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">settings</span>
                Settings
              </button>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
