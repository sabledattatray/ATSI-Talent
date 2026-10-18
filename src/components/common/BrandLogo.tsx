"use client";

import Link from "next/link";
import { useId } from "react";
import "./BrandLogo.css";

export function BrandIcon({ size = 42, className = "" }: { size?: number; className?: string }) {
  const reactId = useId().replace(/:/g, "_");
  const id = `atsai-icon-${reactId}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="ATSAI emblem"
    >
      <defs>
        <linearGradient id={`${id}-left`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="45%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>

        <linearGradient id={`${id}-right`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00F0FF" />
          <stop offset="35%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>

        <linearGradient id={`${id}-arrow`} x1="50%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor="#1E40AF" />
          <stop offset="40%" stopColor="#2563EB" />
          <stop offset="85%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#E0F2FE" />
        </linearGradient>

        <linearGradient id={`${id}-fold-l`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#172554" />
          <stop offset="100%" stopColor="#1E40AF" />
        </linearGradient>

        <linearGradient id={`${id}-fold-r`} x1="100%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#082F49" />
          <stop offset="100%" stopColor="#0369A1" />
        </linearGradient>

        <linearGradient id={`${id}-crest`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#93C5FD" />
          <stop offset="50%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#A5F3FC" />
        </linearGradient>
      </defs>

      <g>
        {/* Left Outer Pillar */}
        <path
          d="M 50 10 L 16 72 C 14.5 75 16 78.5 19.5 78.5 L 31 78.5 C 33 78.5 34.8 77.3 35.8 75.5 L 43.5 61 L 50 48 L 50 10 Z"
          fill={`url(#${id}-left)`}
        />
        {/* Right Outer Pillar */}
        <path
          d="M 50 10 L 84 72 C 85.5 75 84 78.5 80.5 78.5 L 69 78.5 C 67 78.5 65.2 77.3 64.2 75.5 L 56.5 61 L 50 48 L 50 10 Z"
          fill={`url(#${id}-right)`}
        />
        {/* Lower Left Fold */}
        <path
          d="M 19.5 78.5 L 14 86 C 13 87.5 14.2 89.5 16 89.5 L 33 89.5 L 31 78.5 Z"
          fill={`url(#${id}-fold-l)`}
        />
        {/* Lower Right Fold */}
        <path
          d="M 80.5 78.5 L 86 86 C 87 87.5 85.8 89.5 84 89.5 L 67 89.5 L 69 78.5 Z"
          fill={`url(#${id}-fold-r)`}
        />
        {/* Upward Ascending Chevron Arrow */}
        <path
          d="M 50 24 L 66 54 L 57 54 L 50 41 L 43 54 L 34 54 Z"
          fill={`url(#${id}-arrow)`}
        />
        {/* Intersecting Hex-Nexus Bridge Bar */}
        <path
          d="M 33 63 L 43 63 L 50 51 L 57 63 L 67 63 L 61 73 L 39 73 Z"
          fill={`url(#${id}-left)`}
          opacity="0.9"
        />
        {/* Apex Crest Highlight */}
        <polygon points="50,10 44,18 50,22 56,18" fill={`url(#${id}-crest)`} />
        {/* Luminous Node */}
        <circle cx="50" cy="46" r="3" fill="#FFFFFF" />
        <circle cx="50" cy="46" r="1.5" fill="#38BDF8" />
      </g>
    </svg>
  );
}

export type BrandLogoProps = {
  theme?: "light" | "dark";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  href?: string | null;
  badge?: string;
  subtitle?: string;
  shield?: boolean;
};

export function BrandLogo({
  theme = "light",
  size = "md",
  className = "",
  href = "/",
  badge,
  subtitle = "TECHNOLOGIES",
  shield = false,
}: BrandLogoProps) {
  const dark = theme === "dark";
  const reactId = useId().replace(/:/g, "_");
  const id = `atsai-logo-${reactId}`;
  const textColor = dark ? "#FFFFFF" : "#0A192F";
  const descColor = dark ? "#94A3B8" : "#475569";
  const viewBox = badge || shield ? (shield && badge ? "0 0 415 90" : "0 0 395 90") : "0 0 360 90";
  const svgWidth = badge || shield ? (shield && badge ? "415" : "395") : "360";

  const content = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      fill="none"
      width={svgWidth}
      height="90"
      role="img"
      aria-label={`ATSAI ${badge ? `${badge} ` : ""}${subtitle}`}
    >
      <defs>
        <linearGradient id={`${id}-left`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="45%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>

        <linearGradient id={`${id}-right`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00F0FF" />
          <stop offset="35%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>

        <linearGradient id={`${id}-arrow`} x1="50%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor="#1E40AF" />
          <stop offset="40%" stopColor="#2563EB" />
          <stop offset="85%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#E0F2FE" />
        </linearGradient>

        <linearGradient id={`${id}-fold-l`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#172554" />
          <stop offset="100%" stopColor="#1E40AF" />
        </linearGradient>

        <linearGradient id={`${id}-fold-r`} x1="100%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#082F49" />
          <stop offset="100%" stopColor="#0369A1" />
        </linearGradient>

        <linearGradient id={`${id}-crest`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#93C5FD" />
          <stop offset="50%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#A5F3FC" />
        </linearGradient>

        <linearGradient id={`${id}-ai`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="60%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>

        <linearGradient id={`${id}-badge-stroke`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#2563EB" stopOpacity="0.4" />
        </linearGradient>
      </defs>

      {/* Emblem Icon */}
      <g transform="translate(4, 3) scale(0.84)">
        {/* Left Outer Pillar */}
        <path
          d="M 50 10 L 16 72 C 14.5 75 16 78.5 19.5 78.5 L 31 78.5 C 33 78.5 34.8 77.3 35.8 75.5 L 43.5 61 L 50 48 L 50 10 Z"
          fill={`url(#${id}-left)`}
        />
        {/* Right Outer Pillar */}
        <path
          d="M 50 10 L 84 72 C 85.5 75 84 78.5 80.5 78.5 L 69 78.5 C 67 78.5 65.2 77.3 64.2 75.5 L 56.5 61 L 50 48 L 50 10 Z"
          fill={`url(#${id}-right)`}
        />
        {/* Lower Left Fold */}
        <path
          d="M 19.5 78.5 L 14 86 C 13 87.5 14.2 89.5 16 89.5 L 33 89.5 L 31 78.5 Z"
          fill={`url(#${id}-fold-l)`}
        />
        {/* Lower Right Fold */}
        <path
          d="M 80.5 78.5 L 86 86 C 87 87.5 85.8 89.5 84 89.5 L 67 89.5 L 69 78.5 Z"
          fill={`url(#${id}-fold-r)`}
        />
        {/* Upward Ascending Chevron Arrow */}
        <path
          d="M 50 24 L 66 54 L 57 54 L 50 41 L 43 54 L 34 54 Z"
          fill={`url(#${id}-arrow)`}
        />
        {/* Intersecting Hex-Nexus Bridge Bar */}
        <path
          d="M 33 63 L 43 63 L 50 51 L 57 63 L 67 63 L 61 73 L 39 73 Z"
          fill={`url(#${id}-left)`}
          opacity="0.9"
        />
        {/* Apex Crest Highlight */}
        <polygon points="50,10 44,18 50,22 56,18" fill={`url(#${id}-crest)`} />
        {/* Luminous Node */}
        <circle cx="50" cy="46" r="3" fill="#FFFFFF" />
        <circle cx="50" cy="46" r="1.5" fill="#38BDF8" />
      </g>

      {/* Wordmark */}
      <g transform="translate(100, 16)">
        {/* "ATS" */}
        <text
          x="0"
          y="44"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif"
          fontSize="44"
          fontWeight="850"
          letterSpacing="-1"
          fill={textColor}
        >
          ATS
        </text>

        {/* "AI" */}
        <text
          x="96"
          y="44"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif"
          fontSize="44"
          fontWeight="850"
          letterSpacing="-1"
          fill={`url(#${id}-ai)`}
        >
          AI
        </text>

        {/* Optional Pill Badge (e.g. ADMIN, ENTERPRISE, CONSOLE) with optional Security Shield */}
        {badge ? (
          <g transform="translate(154, 20)">
            <rect
              width={shield ? "86" : "60"}
              height="22"
              rx="6"
              fill={dark ? "rgba(37, 99, 235, 0.28)" : "rgba(37, 99, 235, 0.1)"}
              stroke={`url(#${id}-badge-stroke)`}
              strokeWidth="1.2"
            />
            {shield && (
              <g transform="translate(7, 4) scale(0.5833)" stroke="#34D399" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" fill="rgba(52, 211, 153, 0.22)" />
                <path d="m9 12 2 2 4-4" fill="none" strokeWidth="2.6" />
              </g>
            )}
            <text
              x={shield ? "53" : "30"}
              y="15"
              textAnchor="middle"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif"
              fontSize="9"
              fontWeight="800"
              letterSpacing="1.5"
              fill={dark ? "#93C5FD" : "#1D4ED8"}
            >
              {badge}
            </text>
          </g>
        ) : shield ? (
          <g transform="translate(154, 20)">
            <rect
              width="26"
              height="22"
              rx="6"
              fill={dark ? "rgba(37, 99, 235, 0.28)" : "rgba(37, 99, 235, 0.1)"}
              stroke={`url(#${id}-badge-stroke)`}
              strokeWidth="1.2"
            />
            <g transform="translate(6, 4) scale(0.5833)" stroke="#34D399" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" fill="rgba(52, 211, 153, 0.22)" />
              <path d="m9 12 2 2 4-4" fill="none" strokeWidth="2.6" />
            </g>
          </g>
        ) : (
          /* Subtle Tech Pulse Dot next to AI */
          <circle cx="152" cy="18" r="3" fill="#00F0FF" />
        )}

        {/* Subtitle */}
        <text
          x="2"
          y="63"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif"
          fontSize="11.5"
          fontWeight="650"
          letterSpacing="4.5"
          fill={descColor}
        >
          {subtitle}
        </text>
      </g>
    </svg>
  );

  const classes = `atsai-brand-logo atsai-brand-logo--${size} ${className}`;
  return href ? (
    <Link href={href} className={classes} aria-label={`ATSAI ${badge ? `${badge} ` : ""}${subtitle}`}>
      {content}
    </Link>
  ) : (
    <span className={classes}>{content}</span>
  );
}

export default BrandLogo;
