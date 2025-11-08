import { cn } from "@/lib/utils";

interface AyraLogoProps {
  size?: number;
  className?: string;
}

export function AyraLogo({ size = 16, className }: AyraLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-primary-foreground", className)}
    >
      {/* Stylized "A" for Ayra */}
      <path
        d="M12 2L4 20H8L9.5 16H14.5L16 20H20L12 2Z"
        fill="currentColor"
        className="opacity-90"
      />
      <path
        d="M10.5 13L12 8.5L13.5 13H10.5Z"
        fill="currentColor"
        className="opacity-60"
      />
      {/* Neural network inspired dots */}
      <circle cx="12" cy="6" r="1.5" fill="currentColor" className="opacity-80" />
      <circle cx="9" cy="14" r="1" fill="currentColor" className="opacity-70" />
      <circle cx="15" cy="14" r="1" fill="currentColor" className="opacity-70" />
    </svg>
  );
}
