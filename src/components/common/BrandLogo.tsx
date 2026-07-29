import React from 'react';

export interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  variant?: 'mark' | 'full' | 'app-icon';
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  variant = 'mark',
  className = '',
}) => {
  const getDimension = () => {
    if (typeof size === 'number') return `${size}px`;
    switch (size) {
      case 'sm':
        return '24px';
      case 'md':
        return '36px';
      case 'lg':
        return '48px';
      case 'xl':
        return '64px';
      default:
        return '36px';
    }
  };

  const dim = getDimension();

  if (variant === 'full') {
    return (
      <img
        src="/icons/logo-horizontal.png"
        alt="Udhari Khata Logo"
        style={{ height: dim, width: 'auto' }}
        className={`object-contain ${className}`}
      />
    );
  }

  if (variant === 'app-icon') {
    return (
      <img
        src="/icons/apple-touch-icon.png"
        alt="Udhari Khata App Icon"
        style={{ width: dim, height: dim }}
        className={`rounded-2xl shadow-lg border border-amber-500/20 object-cover ${className}`}
      />
    );
  }

  return (
    <img
      src="/icons/logo-mark.svg"
      alt="Udhari Khata Symbol"
      style={{ width: dim, height: dim }}
      className={`object-contain ${className}`}
    />
  );
};
