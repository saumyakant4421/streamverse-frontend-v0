// src/components/fallback/Avatar.js
import React from 'react';
import avatar from '../../assets/profile_11121549.png'

const DEFAULT_AVATAR = avatar

const Avatar = ({ src, alt, className }) => {
  return (
    <img
      src={src || DEFAULT_AVATAR} // Use provided src or fallback to default
      alt={alt || 'User avatar'}
      className={className}
      onError={(e) => {
        e.target.src = DEFAULT_AVATAR; // Set default image if src fails to load
      }}
    />
  );
};

export default Avatar;