import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-8 h-8" }) => {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <line x1="3" y1="10" x2="21" y2="10" />
      
      {/* Row 1: Two Checkmarks (Centered in top half of body) */}
      <path d="M6 14l1 1 2-2" /> 
      <path d="M15 14l1 1 2-2" /> 
      
      {/* Row 2: Two Dots (Centered in bottom half of body) */}
      <path d="M7.5 18h.01" strokeWidth="3" />
      <path d="M16.5 18h.01" strokeWidth="3" />
    </svg>
  );
};
