// Apple-inspired Typography System
// Based on SF Pro (System Font) and iOS Human Interface Guidelines

export const typography = {
  // Large titles (iOS Navigation Bars)
  largeTitle: {
    fontSize: 34,
    fontWeight: '700' as const,
    lineHeight: 41,
    letterSpacing: 0.37,
  },

  // Titles
  title1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
    letterSpacing: 0.36,
  },
  title2: {
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
    letterSpacing: 0.35,
  },
  title3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 25,
    letterSpacing: 0.38,
  },

  // Headlines
  headline: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 22,
    letterSpacing: -0.41,
  },

  // Body text
  body: {
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 22,
    letterSpacing: -0.41,
  },
  bodyEmphasized: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 22,
    letterSpacing: -0.41,
  },

  // Callout (slightly smaller than body)
  callout: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 21,
    letterSpacing: -0.32,
  },
  calloutEmphasized: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 21,
    letterSpacing: -0.32,
  },

  // Subheadline
  subheadline: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: -0.24,
  },
  subheadlineEmphasized: {
    fontSize: 15,
    fontWeight: '600' as const,
    lineHeight: 20,
    letterSpacing: -0.24,
  },

  // Footnote
  footnote: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
    letterSpacing: -0.08,
  },
  footnoteEmphasized: {
    fontSize: 13,
    fontWeight: '600' as const,
    lineHeight: 18,
    letterSpacing: -0.08,
  },

  // Caption (smallest text)
  caption1: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    letterSpacing: 0,
  },
  caption1Emphasized: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
    letterSpacing: 0,
  },
  caption2: {
    fontSize: 11,
    fontWeight: '400' as const,
    lineHeight: 13,
    letterSpacing: 0.07,
  },
  caption2Emphasized: {
    fontSize: 11,
    fontWeight: '600' as const,
    lineHeight: 13,
    letterSpacing: 0.07,
  },

  // Legacy mappings for backwards compatibility
  h1: {
    fontSize: 34,
    fontWeight: '700' as const,
    lineHeight: 41,
  },
  h2: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
  },
  h3: {
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 25,
  },
  bodyBold: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  captionBold: {
    fontSize: 13,
    fontWeight: '600' as const,
    lineHeight: 18,
  },
  small: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  smallBold: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
  },
};

// Font weights (iOS standard)
export const fontWeights = {
  ultraLight: '100' as const,
  thin: '200' as const,
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
  black: '900' as const,
};

// Font families (will fallback to system font on mobile)
export const fontFamilies = {
  system: undefined, // Use system default (SF Pro on iOS, Roboto on Android)
  mono: 'Courier New', // Monospace for code/numbers
};
