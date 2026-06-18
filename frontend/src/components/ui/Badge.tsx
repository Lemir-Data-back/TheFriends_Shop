import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "promo" | "sur-mesure" | "fiable" | "stock-faible" | "rupture" | "default";
  className?: string;
}

const variants = {
  "promo": "bg-tf-black text-tf-gold text-label tracking-widest",
  "sur-mesure": "bg-white text-tf-text border border-tf-border text-label tracking-widest",
  "fiable": "bg-tf-success-bg text-tf-success text-label tracking-widest",
  "stock-faible": "bg-tf-warning-bg text-tf-warning text-label tracking-widest",
  "rupture": "bg-tf-error-bg text-tf-error text-label tracking-widest",
  "default": "bg-tf-gray-soft text-tf-text-muted text-label tracking-widest",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-sm font-semibold uppercase", variants[variant], className)}>
      {children}
    </span>
  );
}
