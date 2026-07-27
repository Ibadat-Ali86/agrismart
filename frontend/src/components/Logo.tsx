import { Link } from "react-router-dom";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="shrink-0">
        <path
          d="M16 28 C 16 20, 10 14, 4 12 C 6 20, 10 26, 16 28 Z"
          fill="oklch(0.55 0.16 145)"
        />
        <path
          d="M16 28 C 16 18, 22 10, 28 8 C 26 18, 22 24, 16 28 Z"
          fill="oklch(0.65 0.18 145)"
        />
        <rect x="15" y="20" width="2" height="10" rx="1" fill="oklch(0.36 0.12 145)" />
      </svg>
      <span className="font-display text-xl font-bold tracking-tight">
        <span className="text-primary">Agri</span>
        <span className="text-foreground">Smart</span>
      </span>
    </Link>
  );
}
