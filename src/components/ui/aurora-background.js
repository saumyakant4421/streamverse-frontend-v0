import React from "react";

export function AuroraBackground({ children, className }) {
  return (
    <div className={`aurora-background ${className}`}>
      {children}
    </div>
  );
}