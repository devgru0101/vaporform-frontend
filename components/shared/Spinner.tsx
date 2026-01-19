'use client';

import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
  label?: string;
}

const sizeMap = {
  sm: 16,
  md: 24,
  lg: 40,
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'currentColor',
  className = '',
  label,
}) => {
  const dimension = sizeMap[size];

  return (
    <div
      className={`vf-spinner ${className}`}
      role="status"
      aria-label={label || 'Loading'}
    >
      <svg
        width={dimension}
        height={dimension}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        className="vf-spinner-svg"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          strokeDasharray="60"
          strokeDashoffset="20"
        />
      </svg>
      {label && <span className="vf-sr-only">{label}</span>}
    </div>
  );
};

export default Spinner;
