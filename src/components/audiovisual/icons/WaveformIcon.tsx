import React from 'react';

interface WaveformIconProps {
  size?: number;
  className?: string;
}

export const WaveformIcon: React.FC<WaveformIconProps> = ({ 
  size = 24, 
  className = "" 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M2 12C2 12 2.5 11 4 11C5.5 11 6 12 7.5 12C9 12 9.5 11 11 11C12.5 11 13 12 14.5 12C16 12 16.5 11 18 11C19.5 11 20 12 22 12"
        stroke="url(#waveform_gradient)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="waveform_gradient" x1="2" y1="12" x2="22" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#9333ea" />
          <stop offset="0.5" stopColor="#f97316" />
          <stop offset="1" stopColor="#84cc16" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default WaveformIcon; 