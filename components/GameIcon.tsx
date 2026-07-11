import type { LucideIcon } from "lucide-react";

interface GameIconProps {
  icon: LucideIcon;
  tone?: string;
  size?: "sm" | "md";
  className?: string;
}

export default function GameIcon({ icon: Icon, tone = "bg-ink-950 text-cream-100", size = "md", className }: GameIconProps) {
  const box = size === "sm" ? "h-9 w-9" : "h-11 w-11";
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <span
      className={`inline-flex ${box} shrink-0 items-center justify-center rounded-2xl shadow-card transition-transform group-hover:scale-110 group-hover:rotate-3 ${tone} ${className ?? ""}`}
    >
      <Icon className={iconSize} strokeWidth={2.5} />
    </span>
  );
}
