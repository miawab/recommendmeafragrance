"use client";

import { HelpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface InfoTooltipProps {
  children: React.ReactNode;
  label?: string;
  align?: "start" | "center" | "end";
}

export default function InfoTooltip({ children, label = "More info", align = "start" }: InfoTooltipProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className="tap-target inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-400 hover:text-ink-950 transition-colors"
        >
          <HelpCircle className="h-6 w-6" strokeWidth={2.5} />
        </button>
      </PopoverTrigger>
      <PopoverContent align={align}>{children}</PopoverContent>
    </Popover>
  );
}
