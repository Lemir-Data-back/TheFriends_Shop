"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  /** Intensité de l'inclinaison en degrés (max de chaque côté). */
  maxTilt?: number;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

/**
 * Carte à inclinaison 3D pilotée par la position du curseur, avec une
 * lueur dorée qui suit la souris — réservée aux illustrations qui
 * démontrent une valeur réelle de la plateforme (Règle de la Rareté de l'Or).
 * Plate au repos, vivante au survol (voir DESIGN.md — Élévation).
 */
export function TiltCard({ children, className = "", maxTilt = 6 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [transform, setTransform] = useState("perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
  const [transition, setTransition] = useState("transform 500ms cubic-bezier(0.22, 1, 0.36, 1)");
  const [glow, setGlow] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (reducedMotion) return;
      const el = ref.current;
      if (!el) return;
      const clientX = e.clientX;
      const clientY = e.clientY;

      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const px = (clientX - rect.left) / rect.width;
        const py = (clientY - rect.top) / rect.height;
        const rotateY = (px - 0.5) * maxTilt * 2;
        const rotateX = (0.5 - py) * maxTilt * 2;

        setTransition("transform 90ms ease-out");
        setTransform(
          `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.015, 1.015, 1.015)`
        );
        setGlow({ x: px * 100, y: py * 100, opacity: 1 });
      });
    },
    [maxTilt, reducedMotion]
  );

  const handleLeave = useCallback(() => {
    setTransition("transform 500ms cubic-bezier(0.22, 1, 0.36, 1)");
    setTransform("perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
    setGlow((g) => ({ ...g, opacity: 0 }));
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`relative will-change-transform ${className}`}
      style={reducedMotion ? undefined : { transform, transition }}
    >
      {/* Lueur dorée qui suit le curseur — visible uniquement au survol */}
      {!reducedMotion && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300"
          style={{
            opacity: glow.opacity * 0.55,
            background: `radial-gradient(circle at ${glow.x}% ${glow.y}%, rgba(201, 168, 76, 0.22), transparent 60%)`,
          }}
        />
      )}
      {children}
    </div>
  );
}
