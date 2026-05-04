import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface O2LogoProps {
  /** "icon" = só os anéis O2 / "full" = logo + wordmark */
  variant?: "icon" | "full";
  /** Override de tema para casos onde o fundo é fixo (ex: hero charcoal sempre escuro) */
  forceTheme?: "dark" | "light" | "lima";
  className?: string;
  /** alt text para a11y; default sensato baseado em variant */
  alt?: string;
}

/**
 * Logo oficial O2 Inc.
 * - Auto-detecta dark/light via next-themes
 * - `forceTheme="lima"` força a versão verde (icon.png) — útil em superfícies
 *   coloridas/charcoal onde a Lima dá mais "uau"
 * - Renderiza um placeholder no SSR pra evitar layout shift quando o tema
 *   ainda não foi resolvido
 */
export function O2Logo({ variant = "icon", forceTheme, className, alt }: O2LogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const theme = forceTheme ?? (mounted ? resolvedTheme : "light") ?? "light";
  const src = pickSrc(variant, theme);
  const altText = alt ?? (variant === "full" ? "Oxy People — by O2 Inc" : "O2 Inc");

  return (
    <img
      src={src}
      alt={altText}
      className={cn("select-none", className)}
      draggable={false}
    />
  );
}

function pickSrc(variant: "icon" | "full", theme: string): string {
  if (variant === "icon") {
    if (theme === "lima") return "/brand/o2-icon.png";
    if (theme === "dark") return "/brand/o2-icon-2.png"; // branco em fundo escuro
    return "/brand/o2-icon-1.png"; // preto em fundo claro
  }
  // full
  if (theme === "dark" || theme === "lima") return "/brand/o2-logo-white.png";
  return "/brand/o2-logo-black.png";
}
