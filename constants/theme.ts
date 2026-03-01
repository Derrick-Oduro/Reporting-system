/**
 * Modern Theme System for SPMS Ticketing System
 * Primary Blue: #153D6F with complementary colors for a clean, professional look
 */

import { Platform } from "react-native";

// Primary Blue Palette
const primaryBlue = "#153D6F";
const primaryBlueLight = "#2B5A9E";
const primaryBlueDark = "#0D2847";
const primaryBlueAlpha10 = "rgba(21, 61, 111, 0.1)";
const primaryBlueAlpha20 = "rgba(21, 61, 111, 0.2)";

// Complementary Colors
const secondaryTeal = "#00897B";
const accentOrange = "#FF6F00";
const accentPurple = "#6A1B9A";

// Neutral Palette
const white = "#FFFFFF";
const gray50 = "#FAFAFA";
const gray100 = "#F5F5F5";
const gray200 = "#EEEEEE";
const gray300 = "#E0E0E0";
const gray400 = "#BDBDBD";
const gray500 = "#9E9E9E";
const gray600 = "#757575";
const gray700 = "#616161";
const gray800 = "#424242";
const gray900 = "#212121";
const black = "#000000";

// Semantic Colors
const success = "#4CAF50";
const successLight = "#E8F5E9";
const warning = "#FF9800";
const warningLight = "#FFF3E0";
const error = "#F44336";
const errorLight = "#FFEBEE";
const info = "#2196F3";
const infoLight = "#E3F2FD";

// Status Colors
const statusPending = "#FF9800";
const statusInProgress = "#2196F3";
const statusResolved = "#4CAF50";
const statusClosed = "#757575";

export const Colors = {
  light: {
    // Brand Colors
    primary: primaryBlue,
    primaryLight: primaryBlueLight,
    primaryDark: primaryBlueDark,
    primaryAlpha10: primaryBlueAlpha10,
    primaryAlpha20: primaryBlueAlpha20,
    secondary: secondaryTeal,
    accent: accentOrange,
    accentPurple: accentPurple,

    // Base Colors
    background: gray50,
    surface: white,
    surfaceVariant: gray100,

    // Text Colors
    text: gray900,
    textSecondary: gray700,
    textTertiary: gray500,
    textInverse: white,

    // UI Elements
    border: gray300,
    borderLight: gray200,
    divider: gray200,
    overlay: "rgba(0, 0, 0, 0.5)",
    shadow: primaryBlue,

    // Icon Colors
    icon: gray600,
    iconSecondary: gray500,
    tabIconDefault: gray500,
    tabIconSelected: primaryBlue,

    // Semantic Colors
    success: success,
    successLight: successLight,
    warning: warning,
    warningLight: warningLight,
    error: error,
    errorLight: errorLight,
    info: info,
    infoLight: infoLight,

    // Status Colors
    statusPending: statusPending,
    statusInProgress: statusInProgress,
    statusResolved: statusResolved,
    statusClosed: statusClosed,

    // Legacy support
    tint: primaryBlue,
  },
  dark: {
    // Brand Colors
    primary: primaryBlueLight,
    primaryLight: "#4A7BC8",
    primaryDark: primaryBlueDark,
    primaryAlpha10: "rgba(43, 90, 158, 0.1)",
    primaryAlpha20: "rgba(43, 90, 158, 0.2)",
    secondary: "#26A69A",
    accent: "#FFB74D",
    accentPurple: "#9C27B0",

    // Base Colors
    background: "#121212",
    surface: "#1E1E1E",
    surfaceVariant: "#2C2C2C",

    // Text Colors
    text: "#ECEDEE",
    textSecondary: "#B0B3B8",
    textTertiary: "#8E9297",
    textInverse: gray900,

    // UI Elements
    border: "#3A3A3A",
    borderLight: "#2C2C2C",
    divider: "#2C2C2C",
    overlay: "rgba(0, 0, 0, 0.7)",
    shadow: black,

    // Icon Colors
    icon: "#9BA1A6",
    iconSecondary: "#6E7781",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: primaryBlueLight,

    // Semantic Colors
    success: "#66BB6A",
    successLight: "#1B5E20",
    warning: "#FFA726",
    warningLight: "#E65100",
    error: "#EF5350",
    errorLight: "#B71C1C",
    info: "#42A5F5",
    infoLight: "#0D47A1",

    // Status Colors
    statusPending: "#FFA726",
    statusInProgress: "#42A5F5",
    statusResolved: "#66BB6A",
    statusClosed: "#9E9E9E",

    // Legacy support
    tint: primaryBlueLight,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
