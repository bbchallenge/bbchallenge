/**
 * Color scheme definitions for machine visualization
 */

export interface ColorScheme {
  background: string;
  foreground: string;
}

export const lightScheme: ColorScheme = {
  background: "white",
  foreground: "orange"
};

export const darkScheme: ColorScheme = {
  background: "black",
  foreground: "white"
};

/**
 * Get the current color scheme based on dark mode setting
 */
export function getColorScheme(isDarkMode: boolean): ColorScheme {
  return isDarkMode ? darkScheme : lightScheme;
}
