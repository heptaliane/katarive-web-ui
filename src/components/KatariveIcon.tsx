import React from 'react';

interface Props extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export const KatariveIcon: React.FC<Props> = ({ size = 48, className, ...props }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="katarive-brand-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      {/* Sleek Dark Slate Rounded Rect Background */}
      <rect width="100" height="100" rx="24" fill="#0f172a" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" />
      
      {/* Sound waves rising from the book */}
      <rect x="47.5" y="16" width="5" height="26" rx="2.5" fill="url(#katarive-brand-grad)" />
      <rect x="37.5" y="22" width="5" height="20" rx="2.5" fill="url(#katarive-brand-grad)" />
      <rect x="57.5" y="22" width="5" height="20" rx="2.5" fill="url(#katarive-brand-grad)" />
      <rect x="27.5" y="28" width="5" height="14" rx="2.5" fill="url(#katarive-brand-grad)" />
      <rect x="67.5" y="28" width="5" height="14" rx="2.5" fill="url(#katarive-brand-grad)" />
      <rect x="17.5" y="34" width="5" height="8" rx="2.5" fill="url(#katarive-brand-grad)" opacity="0.6" />
      <rect x="77.5" y="34" width="5" height="8" rx="2.5" fill="url(#katarive-brand-grad)" opacity="0.6" />

      {/* Book spine and pages spread below */}
      <path
        d="M50 76 V 51 M50 55 C40 49, 25 51, 18 57 V 75 C25 69, 40 67, 50 73 C60 67, 75 69, 82 75 V 57 C75 51, 60 49, 50 55 Z"
        fill="none"
        stroke="url(#katarive-brand-grad)"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
