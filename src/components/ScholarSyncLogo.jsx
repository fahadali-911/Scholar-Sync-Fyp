import React from "react";

/**
 * ScholarSyncLogo component renders the premium vector logo for Scholar Sync.
 * 
 * @param {Object} props
 * @param {string} [props.theme='light'] - 'light' | 'dark'
 * @param {string} [props.className=''] - Custom CSS classes
 * @param {string|number} [props.width='100%'] - Width of the SVG
 * @param {string|number} [props.height='100%'] - Height of the SVG
 */
const ScholarSyncLogo = ({ theme = "light", className = "", width = "100%", height = "100%" }) => {
  const isDark = theme === "dark";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 330 80"
      width={width}
      height={height}
      className={className}
    >
      <defs>
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700;800&display=swap');
            .logo-text-scholar {
              font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              font-weight: 800;
              font-size: 36px;
              fill: ${isDark ? "#FFFFFF" : "#071B36"};
              transition: fill 0.3s ease;
            }
            .logo-text-sync {
              font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              font-weight: 500;
              font-size: 36px;
              fill: url(#reactSyncGrad);
            }
          `}
        </style>

        {/* Gradients */}
        <linearGradient id="reactIconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isDark ? "#F8FAFC" : "#071B36"} />
          <stop offset="60%" stopColor={isDark ? "#E2E8F0" : "#0F2B48"} />
          <stop offset="100%" stopColor={isDark ? "#CBD5E1" : "#1E3A8A"} />
        </linearGradient>

        <linearGradient id="reactSyncGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0EA5E9" />
        </linearGradient>

        <linearGradient id="reactAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>

        {/* Glow / Shadow Effects */}
        {isDark ? (
          <filter id="reactGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        ) : (
          <filter id="reactShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#071B36" floodOpacity="0.08" />
          </filter>
        )}
      </defs>

      {/* Group for Logo Icon */}
      <g transform="translate(4, 5) scale(1.22)" filter={isDark ? "url(#reactGlow)" : "url(#reactShadow)"}>
        {/* Outer Sync Orbit Arc */}
        <path
          d="M 62 18 A 28 28 0 0 1 50 68"
          fill="none"
          stroke="url(#reactSyncGrad)"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeDasharray="1 8 20 20"
          opacity={isDark ? 0.8 : 0.95}
        />
        <path
          d="M 8 42 A 28 28 0 0 1 20 12"
          fill="none"
          stroke="url(#reactSyncGrad)"
          strokeWidth="4.5"
          strokeLinecap="round"
        />

        {/* Mortarboard Diamond */}
        <path d="M 35 15 L 10 27 L 35 39 L 35 15 Z" fill="url(#reactIconGrad)" />
        <path d="M 35 15 L 60 27 L 35 39 L 35 15 Z" fill={isDark ? "#94A3B8" : "#1E40AF"} opacity={isDark ? 0.85 : 0.9} />

        {/* Cap Base */}
        <path d="M 20 34.5 C 20 44 26 47 35 47 C 44 47 50 44 50 34.5 C 45 38 39 39 35 39 C 31 39 25 38 20 34.5 Z" fill="url(#reactIconGrad)" />

        {/* Tassel & Digital Node */}
        <path d="M 35 27 L 55 37 L 55 49" fill="none" stroke="url(#reactAccentGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="55" cy="52" r="4.5" fill="url(#reactAccentGrad)" />
        <circle cx="55" cy="52" r="8" fill="none" stroke="url(#reactAccentGrad)" strokeWidth="1.2" opacity="0.45" />
      </g>

      {/* Typography */}
      <text x="92" y="52" class="logo-text-scholar">Scholar</text>
      <text x="226" y="52" class="logo-text-sync">Sync</text>
    </svg>
  );
};

export default ScholarSyncLogo;
