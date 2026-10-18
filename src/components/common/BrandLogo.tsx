import Link from "next/link";
import artwork from "@/lib/brandArtwork.json";
import "./BrandLogo.css";

function Emblem() {
  return <>{artwork.mark.map((part, index) => <path key={index} d={part.path} fill={part.fill} transform={part.transform} fillRule="evenodd" />)}</>;
}

export function BrandIcon({ size = 42, className = "" }: { size?: number; className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"
    width={size} height={size} className={className} role="img" aria-label="ATSAI emblem"><Emblem /></svg>;
}

type BrandLogoProps = {
  theme?: "light" | "dark";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  href?: string | null;
};

// Header, footer and downloadable assets share these exact vector outlines.
export function BrandLogo({ theme = "light", size = "md", className = "", href = "/" }: BrandLogoProps) {
  const dark = theme === "dark";
  const layout = artwork.layout;
  const content = <svg xmlns="http://www.w3.org/2000/svg" viewBox={artwork.viewBox} fill="none"
    width="404" height="112" role="img" aria-label="ATS AI Talent Solutions">
    <g transform={`translate(0 ${layout.markY})`}><Emblem /></g>
    <g transform={`translate(${layout.wordmarkX} ${layout.wordmarkY}) scale(${layout.wordmarkWidth / artwork.wordmark.width} ${layout.wordmarkHeight / artwork.wordmark.height})`}>
      <path d={artwork.wordmark.path} fill={dark ? "#F7FAFF" : "#142C49"} />
      <path d={artwork.wordmark.accentPath} transform={`translate(${artwork.wordmark.accentX} 0)`} fill={dark ? "#82AEFF" : "#2864EA"} />
    </g>
    <path d={artwork.descriptor.path}
      transform={`translate(${layout.descriptorX} ${layout.descriptorY}) scale(${layout.descriptorWidth / artwork.descriptor.width} ${layout.descriptorHeight / artwork.descriptor.height})`}
      fill={dark ? "#B0C1D8" : "#4B627E"} />
  </svg>;
  const classes = `atsai-brand-logo atsai-brand-logo--${size} ${className}`;
  return href ? <Link href={href} className={classes} aria-label="ATS AI Talent Solutions home">{content}</Link>
    : <span className={classes}>{content}</span>;
}

export default BrandLogo;
