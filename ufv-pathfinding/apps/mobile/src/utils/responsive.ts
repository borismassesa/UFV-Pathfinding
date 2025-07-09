import { Dimensions, PixelRatio, Platform } from 'react-native';

// Get device dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 14 Pro)
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

// Scale functions
export const scale = (size: number): number => {
  return (SCREEN_WIDTH / BASE_WIDTH) * size;
};

export const verticalScale = (size: number): number => {
  return (SCREEN_HEIGHT / BASE_HEIGHT) * size;
};

export const moderateScale = (size: number, factor = 0.5): number => {
  return size + (scale(size) - size) * factor;
};

export const moderateVerticalScale = (size: number, factor = 0.5): number => {
  return size + (verticalScale(size) - size) * factor;
};

// Font scaling
export const scaleFontSize = (size: number): number => {
  const newSize = scale(size);
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  }
  return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
};

// Device type detection
export const isSmallDevice = SCREEN_WIDTH < 375;
export const isMediumDevice = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414;
export const isLargeDevice = SCREEN_WIDTH >= 414;
export const isTablet = SCREEN_WIDTH >= 768;

// Responsive values
export const responsiveValue = <T>(values: {
  small?: T;
  medium?: T;
  large?: T;
  tablet?: T;
  default: T;
}): T => {
  if (isTablet && values.tablet !== undefined) return values.tablet;
  if (isLargeDevice && values.large !== undefined) return values.large;
  if (isMediumDevice && values.medium !== undefined) return values.medium;
  if (isSmallDevice && values.small !== undefined) return values.small;
  return values.default;
};

// Common responsive dimensions
export const dimensions = {
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
  
  // Padding & Margins
  paddingXS: moderateScale(4),
  paddingS: moderateScale(8),
  paddingM: moderateScale(16),
  paddingL: moderateScale(24),
  paddingXL: moderateScale(32),
  
  // Font sizes
  fontXS: scaleFontSize(10),
  fontS: scaleFontSize(12),
  fontM: scaleFontSize(14),
  fontL: scaleFontSize(16),
  fontXL: scaleFontSize(20),
  fontXXL: scaleFontSize(24),
  fontXXXL: scaleFontSize(32),
  
  // Border radius
  radiusS: moderateScale(4),
  radiusM: moderateScale(8),
  radiusL: moderateScale(12),
  radiusXL: moderateScale(16),
  radiusRound: moderateScale(999),
  
  // Common heights
  buttonHeight: moderateVerticalScale(48),
  inputHeight: moderateVerticalScale(48),
  headerHeight: moderateVerticalScale(56),
  tabBarHeight: Platform.select({
    ios: isTablet ? moderateVerticalScale(65) : moderateVerticalScale(85),
    android: moderateVerticalScale(70),
    default: moderateVerticalScale(70),
  }),
  
  // Icon sizes
  iconXS: moderateScale(16),
  iconS: moderateScale(20),
  iconM: moderateScale(24),
  iconL: moderateScale(32),
  iconXL: moderateScale(40),
};

// Responsive styles helper
export const responsiveStyles = {
  // Flex containers
  flexContainer: {
    flex: 1,
    paddingHorizontal: dimensions.paddingM,
  },
  
  // Cards
  card: {
    padding: dimensions.paddingM,
    borderRadius: dimensions.radiusM,
    marginBottom: dimensions.paddingM,
  },
  
  // Buttons
  button: {
    height: dimensions.buttonHeight,
    paddingHorizontal: dimensions.paddingL,
    borderRadius: dimensions.radiusM,
  },
  
  // Text inputs
  input: {
    height: dimensions.inputHeight,
    paddingHorizontal: dimensions.paddingM,
    borderRadius: dimensions.radiusM,
  },
  
  // Typography
  h1: {
    fontSize: dimensions.fontXXXL,
    fontWeight: '700' as const,
  },
  h2: {
    fontSize: dimensions.fontXXL,
    fontWeight: '600' as const,
  },
  h3: {
    fontSize: dimensions.fontXL,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: dimensions.fontM,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: dimensions.fontS,
    fontWeight: '400' as const,
  },
};

// Orientation change handler
export const useResponsive = () => {
  const [screenData, setScreenData] = React.useState({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    isLandscape: SCREEN_WIDTH > SCREEN_HEIGHT,
  });

  React.useEffect(() => {
    const updateDimensions = ({ window }: { window: { width: number; height: number } }) => {
      setScreenData({
        width: window.width,
        height: window.height,
        isLandscape: window.width > window.height,
      });
    };

    const subscription = Dimensions.addEventListener('change', updateDimensions);
    return () => subscription?.remove();
  }, []);

  return screenData;
};

// Grid system
export const grid = {
  columns: isTablet ? 12 : 4,
  gutterWidth: dimensions.paddingM,
  
  getColumnWidth: (span: number, totalColumns?: number) => {
    const cols = totalColumns || (isTablet ? 12 : 4);
    const totalGutters = cols - 1;
    const gutterSpace = totalGutters * dimensions.paddingM;
    const availableSpace = SCREEN_WIDTH - (2 * dimensions.paddingM) - gutterSpace;
    return (availableSpace / cols) * span + (span - 1) * dimensions.paddingM;
  },
};

// Safe area helpers
export const safeArea = {
  top: Platform.select({
    ios: isTablet ? 20 : 44,
    android: 0,
    default: 0,
  }),
  bottom: Platform.select({
    ios: isTablet ? 20 : 34,
    android: 0,
    default: 0,
  }),
};

import React from 'react';