import React from "react";

interface EFCLogoProps {
  className?: string;
  size?: number; // width and height of the circular logo
  showOnlyWordmark?: boolean; // simple version for smaller spaces like Navbar
}

export const EFCLogo: React.FC<EFCLogoProps> = ({
  className = "",
  size = 180,
  showOnlyWordmark = false
}) => {
  if (showOnlyWordmark) {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        {/* Compact Logo Mark */}
        <svg
          width={40}
          height={40}
          viewBox="0 0 100 100"
          className="shrink-0 drop-shadow-sm filter hover:scale-105 transition-transform duration-300"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="miniEGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0B53C3" />
              <stop offset="100%" stopColor="#022e70" />
            </linearGradient>
            <linearGradient id="miniFGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF8F00" />
              <stop offset="100%" stopColor="#FF6F00" />
            </linearGradient>
            <linearGradient id="miniCGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9C27B0" />
              <stop offset="100%" stopColor="#7A1FA2" />
            </linearGradient>
            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0B53C3" />
              <stop offset="50%" stopColor="#FF6F00" />
              <stop offset="100%" stopColor="#7A1FA2" />
            </linearGradient>
          </defs>

          {/* Outer Ring */}
          <circle cx="50" cy="50" r="46" fill="white" stroke="url(#ringGrad)" strokeWidth="4" />
          
          {/* Stylized letters */}
          <g transform="translate(14, 52)">
            {/* E */}
            <text
              x="0"
              y="10"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontStyle="italic"
              fontSize="38"
              fill="url(#miniEGrad)"
              letterSpacing="-2"
            >
              E
            </text>
            {/* F */}
            <text
              x="22"
              y="10"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontStyle="italic"
              fontSize="38"
              fill="url(#miniFGrad)"
              letterSpacing="-2"
            >
              F
            </text>
            {/* C */}
            <text
              x="43"
              y="10"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontStyle="italic"
              fontSize="38"
              fill="url(#miniCGrad)"
              letterSpacing="-2"
            >
              C
            </text>
          </g>

          {/* Speech Bubble Icon */}
          <path
            d="M 40 18 Q 40 12 50 12 Q 60 12 60 18 Q 60 24 55 24 L 55 27 L 51 24 Q 40 24 40 18 Z"
            fill="#0B53C3"
          />
          <circle cx="47" cy="18" r="1" fill="white" />
          <circle cx="50" cy="18" r="1" fill="white" />
          <circle cx="53" cy="18" r="1" fill="white" />
        </svg>
        <div className="flex flex-col items-start text-left leading-none">
          <span className="font-sans text-base font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
            English Fluency
          </span>
          <span className="font-sans text-[10px] font-extrabold uppercase tracking-widest text-blue-600">
            EFC Campaign
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col items-center justify-center p-2 select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xl filter hover:scale-102 transition-transform duration-500 ease-out"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F8FAFC" />
          </linearGradient>

          <linearGradient id="ringGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0B53C3" />
            <stop offset="50%" stopColor="#FF6F00" />
            <stop offset="100%" stopColor="#7A1FA2" />
          </linearGradient>

          <linearGradient id="ringGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF8F00" />
            <stop offset="100%" stopColor="#0B53C3" />
          </linearGradient>

          <linearGradient id="letterE" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E6DF5" />
            <stop offset="100%" stopColor="#0B53C3" />
          </linearGradient>

          <linearGradient id="letterF" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFA000" />
            <stop offset="100%" stopColor="#FF6F00" />
          </linearGradient>

          <linearGradient id="letterC" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#9C27B0" />
            <stop offset="100%" stopColor="#6A1B9A" />
          </linearGradient>

          <linearGradient id="maleSil" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E88E5" />
            <stop offset="100%" stopColor="#0D47A1" />
          </linearGradient>

          <linearGradient id="femaleSil" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E91E63" />
            <stop offset="100%" stopColor="#880E4F" />
          </linearGradient>

          <linearGradient id="blueBubble" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2979FF" />
            <stop offset="100%" stopColor="#0B53C3" />
          </linearGradient>

          <linearGradient id="orangeBubble" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF9100" />
            <stop offset="100%" stopColor="#FF6D00" />
          </linearGradient>

          <linearGradient id="bannerOrange" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF6F00" />
            <stop offset="100%" stopColor="#0B53C3" />
          </linearGradient>

          {/* Curved paths for text */}
          <path id="curveTop" d="M 75,250 A 175,175 0 0,1 425,250" fill="none" />
          <path id="curveBottom" d="M 100,250 A 150,150 0 0,0 400,250" fill="none" />

          {/* Soft Shadows */}
          <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="8" stdDeviation="6" floodOpacity="0.15" />
          </filter>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Circular Badge Frame */}
        <circle cx="250" cy="250" r="235" fill="url(#bgGrad)" filter="url(#shadow)" />
        
        {/* Dynamic Sweeping Rings */}
        <circle cx="250" cy="250" r="230" fill="none" stroke="url(#ringGrad1)" strokeWidth="6" />
        <circle cx="250" cy="250" r="223" fill="none" stroke="url(#ringGrad2)" strokeWidth="2" strokeDasharray="6 4" />

        {/* Global Map Grid Overlay (Subtle) */}
        <g opacity="0.08" stroke="#000000" strokeWidth="1">
          <circle cx="250" cy="250" r="215" fill="none" />
          <path d="M 50 250 H 450" />
          <path d="M 250 50 V 450" />
          <path d="M 100 130 C 180 200, 320 200, 400 130" fill="none" />
          <path d="M 100 370 C 180 300, 320 300, 400 370" fill="none" />
          {/* Vertical longitude lines */}
          <path d="M 250 50 C 150 150, 150 350, 250 450" fill="none" />
          <path d="M 250 50 C 350 150, 350 350, 250 450" fill="none" />
        </g>

        {/* 2. Top Header Text (Curved) */}
        <text fontStyle="normal" fontWeight="bold" fill="#0F172A">
          <textPath
            href="#curveTop"
            startOffset="50%"
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="18.5"
            letterSpacing="3.5"
          >
            • SPEAK TODAY, LEAD TOMORROW. •
          </textPath>
        </text>

        {/* 3. Overlapping Speech Bubbles at top */}
        <g transform="translate(0, -10)">
          {/* Orange Bubble Behind */}
          <path
            d="M 255 110 C 255 92, 280 92, 280 110 C 280 128, 275 125, 272 135 L 265 128 C 255 128, 255 115, 255 110 Z"
            fill="url(#orangeBubble)"
            opacity="0.9"
          />
          {/* Blue Bubble Front */}
          <path
            d="M 215 100 C 215 75, 260 75, 260 100 C 260 125, 250 122, 243 135 L 235 125 C 215 125, 215 110, 215 100 Z"
            fill="url(#blueBubble)"
            filter="url(#glow)"
          />
          {/* Three white Dots */}
          <circle cx="230" cy="100" r="3.5" fill="white" />
          <circle cx="238" cy="100" r="3.5" fill="white" />
          <circle cx="246" cy="100" r="3.5" fill="white" />
        </g>

        {/* 4. Silhouettes with Speakers Sound Lines */}
        {/* Male Silhouette Left */}
        <g transform="translate(60, 130)">
          {/* Speaker Voice Lines */}
          <g stroke="#0B53C3" strokeWidth="3" strokeLinecap="round" opacity="0.85">
            <path d="M 120 70 A 15 15 0 0,1 120 94" />
            <path d="M 125 64 A 24 24 0 0,1 125 100" strokeWidth="2.5" />
            <path d="M 130 58 A 33 33 0 0,1 130 106" strokeWidth="2" />
          </g>
          {/* Body and head path */}
          <path
            d="M 15 150 
               C 15 130, 25 100, 45 95 
               C 42 85, 40 75, 43 65 
               C 38 60, 32 50, 36 30 
               C 38 18, 50 15, 58 10 
               C 62 5, 75 15, 80 20 
               C 85 22, 88 28, 88 35 
               C 88 40, 85 43, 85 45 
               C 92 50, 96 55, 96 60 
               C 92 68, 82 72, 80 75
               C 76 83, 75 88, 77 92
               C 85 98, 98 120, 102 150 Z"
            fill="url(#maleSil)"
          />
        </g>

        {/* Female Silhouette Right */}
        <g transform="translate(300, 130)">
          {/* Speaker Voice Lines (Reverse) */}
          <g stroke="#7A1FA2" strokeWidth="3" strokeLinecap="round" opacity="0.85">
            <path d="M 15 70 A 15 15 0 0,0 15 94" />
            <path d="M 10 64 A 24 24 0 0,0 10 100" strokeWidth="2.5" />
            <path d="M 5 58 A 33 33 0 0,0 5 106" strokeWidth="2" />
          </g>
          {/* Body and head path with Ponytail */}
          <path
            d="M 85 150 
               C 85 130, 75 100, 55 95 
               C 58 85, 60 75, 57 65 
               C 62 60, 68 50, 64 30 
               C 62 18, 50 15, 42 10 
               C 38 5, 25 15, 20 20 
               C 15 22, 12 28, 12 35 
               C 12 40, 15 43, 15 45 
               C 8 50, 4 55, 4 60 
               C 8 68, 18 72, 20 75
               C 24 83, 25 88, 23 92
               C 15 98, 2 120, -2 150 Z"
            fill="url(#femaleSil)"
          />
          {/* Dynamic Ponytail */}
          <path
            d="M 64 30 
               C 75 32, 90 40, 92 55 
               C 93 65, 82 75, 80 85 
               C 78 75, 75 65, 68 58 Z"
            fill="url(#femaleSil)"
          />
        </g>

        {/* 5. Central Bold Italicized Acronym "EFC" */}
        <g transform="translate(145, 260)" filter="url(#shadow)">
          {/* E */}
          <text
            x="0"
            y="0"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="900"
            fontStyle="italic"
            fontSize="105"
            fill="url(#letterE)"
            letterSpacing="-8"
          >
            E
          </text>
          {/* F */}
          <text
            x="70"
            y="0"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="900"
            fontStyle="italic"
            fontSize="105"
            fill="url(#letterF)"
            letterSpacing="-8"
          >
            F
          </text>
          {/* C */}
          <text
            x="138"
            y="0"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="900"
            fontStyle="italic"
            fontSize="105"
            fill="url(#letterC)"
            letterSpacing="-8"
          >
            C
          </text>
        </g>

        {/* 6. Primary curved Dark Navy-Blue Ribbon Banner */}
        <g filter="url(#shadow)">
          {/* Banner Back fold left */}
          <path d="M 60 285 L 85 260 L 85 305 Z" fill="#0A1E3F" />
          {/* Banner Back fold right */}
          <path d="M 440 285 L 415 260 L 415 305 Z" fill="#0A1E3F" />

          {/* Left Ribbon end tail */}
          <path d="M 40 310 L 85 285 L 85 325 L 50 335 Z" fill="#0D2E5C" />
          {/* Right Ribbon end tail */}
          <path d="M 460 310 L 415 285 L 415 325 L 450 335 Z" fill="#0D2E5C" />

          {/* Central main banner front plate (curved rectangle) */}
          <path
            d="M 75 275 
               Q 250 260 425 275 
               L 420 320 
               Q 250 305 80 320 Z"
            fill="#091E42"
            stroke="#0B53C3"
            strokeWidth="3.5"
          />

          {/* Text: ENGLISH FLUENCY inside the main ribbon banner */}
          <text
            x="250"
            y="302"
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="900"
            fontSize="26"
            fill="#FFFFFF"
            letterSpacing="3"
          >
            ENGLISH FLUENCY
          </text>
        </g>

        {/* 7. Secondary Smaller Campaign Banner directly below */}
        <g transform="translate(0, 10)">
          <rect
            x="160"
            y="320"
            width="180"
            height="26"
            rx="13"
            fill="url(#bannerOrange)"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            filter="url(#shadow)"
          />
          <text
            x="250"
            y="338"
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="900"
            fontSize="13"
            fill="#FFFFFF"
            letterSpacing="4"
          >
            — CAMPAIGN —
          </text>
        </g>

        {/* 8. Core Values Horizontal Row (5 Icons separated by vertical dividers) */}
        <g transform="translate(85, 385)">
          {/* Background strip for neatness */}
          <rect x="-10" y="-12" width="350" height="42" rx="12" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />

          {/* Divider 1 */}
          <line x1="60" y1="-5" x2="60" y2="23" stroke="#CBD5E1" strokeWidth="1" />
          {/* Divider 2 */}
          <line x1="128" y1="-5" x2="128" y2="23" stroke="#CBD5E1" strokeWidth="1" />
          {/* Divider 3 */}
          <line x1="196" y1="-5" x2="196" y2="23" stroke="#CBD5E1" strokeWidth="1" />
          {/* Divider 4 */}
          <line x1="264" y1="-5" x2="264" y2="23" stroke="#CBD5E1" strokeWidth="1" />

          {/* 1. SPEAK */}
          <g transform="translate(5, -5)">
            <circle cx="15" cy="12" r="10" fill="#0B53C3" opacity="0.1" />
            <path
              d="M 11 8 C 8 8, 6 10, 6 12 C 6 15, 10 17, 11 18 L 11 20 L 14 18 C 19 18, 19 8, 11 8 Z"
              fill="#0B53C3"
              stroke="#0B53C3"
              strokeWidth="1"
            />
            <circle cx="10" cy="13" r="1" fill="#FFFFFF" />
            <circle cx="13" cy="13" r="1" fill="#FFFFFF" />
            <circle cx="16" cy="13" r="1" fill="#FFFFFF" />
            <text x="15" y="27" textAnchor="middle" fontFamily="system-ui" fontSize="8" fontWeight="bold" fill="#334155">SPEAK</text>
          </g>

          {/* 2. FOCUS */}
          <g transform="translate(73, -5)">
            <circle cx="15" cy="12" r="10" fill="#FF6F00" opacity="0.1" />
            <circle cx="15" cy="12" r="7" stroke="#FF6F00" strokeWidth="2" fill="none" />
            <circle cx="15" cy="12" r="4" stroke="#FF6F00" strokeWidth="1.5" fill="none" />
            <circle cx="15" cy="12" r="1.5" fill="#FF6F00" />
            <path d="M 21 6 L 15 12" stroke="#FF6F00" strokeWidth="1.5" strokeLinecap="round" />
            <text x="15" y="27" textAnchor="middle" fontFamily="system-ui" fontSize="8" fontWeight="bold" fill="#334155">FOCUS</text>
          </g>

          {/* 3. LEARN */}
          <g transform="translate(141, -5)">
            <circle cx="15" cy="12" r="10" fill="#7A1FA2" opacity="0.1" />
            {/* Open Book */}
            <path d="M 7 10 Q 15 12 15 17 Q 15 12 23 10 L 23 15 Q 15 17 15 21 Q 15 17 7 15 Z" fill="#7A1FA2" />
            <line x1="15" y1="12" x2="15" y2="21" stroke="#FFFFFF" strokeWidth="1" />
            <text x="15" y="27" textAnchor="middle" fontFamily="system-ui" fontSize="8" fontWeight="bold" fill="#334155">LEARN</text>
          </g>

          {/* 4. IMPROVE */}
          <g transform="translate(209, -5)">
            <circle cx="15" cy="12" r="10" fill="#00ACC1" opacity="0.1" />
            {/* Bar chart with arrow */}
            <rect x="7" y="14" width="3" height="4" fill="#00ACC1" />
            <rect x="11" y="11" width="3" height="7" fill="#00ACC1" />
            <rect x="15" y="8" width="3" height="10" fill="#00ACC1" />
            <path d="M 6 18 H 22 M 17 7 L 21 7 L 21 11 M 10 15 L 14 11 L 21 7" stroke="#00ACC1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <text x="15" y="27" textAnchor="middle" fontFamily="system-ui" fontSize="8" fontWeight="bold" fill="#334155">IMPROVE</text>
          </g>

          {/* 5. SUCCEED */}
          <g transform="translate(277, -5)">
            <circle cx="15" cy="12" r="10" fill="#E91E63" opacity="0.1" />
            {/* Person celebrating */}
            <circle cx="15" cy="8" r="2.5" fill="#E91E63" />
            <path d="M 9 12 Q 15 10 21 12 L 19 14 Q 15 13 11 14 Z M 13 13 V 19 H 11 M 17 13 V 19 H 15" fill="#E91E63" stroke="#E91E63" strokeWidth="1" />
            <text x="15" y="27" textAnchor="middle" fontFamily="system-ui" fontSize="8" fontWeight="bold" fill="#334155">SUCCEED</text>
          </g>
        </g>

        {/* 9. Elegant Bottom Motto Cursive Text */}
        <text
          x="250"
          y="464"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontWeight="bold"
          fontSize="17.5"
          fill="#0B53C3"
          className="animate-pulse"
        >
          Your Voice. Your Future. Our Mission.
        </text>
      </svg>
    </div>
  );
};
