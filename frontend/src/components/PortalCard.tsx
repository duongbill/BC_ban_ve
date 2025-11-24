import React from "react";

interface PortalCardProps {
  title: string;
  description: string;
  gradient:
    | "blue"
    | "purple"
    | "pink"
    | "orange"
    | "deep-purple"
    | "cyan"
    | "amber";
  onClick?: () => void;
}

export function PortalCard({
  title,
  description,
  gradient,
  onClick,
}: PortalCardProps) {
  return (
    <div
      className={`portal-card gradient-${gradient} animate-fade-in-up`}
      onClick={onClick}
    >
      <div className="portal-card-content">
        <h3 className="portal-card-title">{title}</h3>
        <p className="portal-card-desc">{description}</p>
      </div>
    </div>
  );
}
