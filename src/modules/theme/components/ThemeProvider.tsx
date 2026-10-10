import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";
import { DEFAULT_THEME, THEME_ATTRIBUTE, THEMES } from "../constants";

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute={THEME_ATTRIBUTE}
      themes={THEMES}
      defaultTheme={DEFAULT_THEME}
      enableSystem={false}
    >
      {children}
    </NextThemesProvider>
  );
}
