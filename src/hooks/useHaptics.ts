import { useCallback } from 'react';

/**
 * Custom hook to provide native-like haptic feedback on mobile devices.
 * Uses the Vibration API if supported by the browser.
 */
export function useHaptics() {
  const vibrate = useCallback((pattern: number | number[]) => {
    // Check if the Vibration API is supported
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        // Ignore errors (e.g. if user hasn't interacted with document yet)
        console.warn('Vibration API error:', error);
      }
    }
  }, []);

  return {
    // Light tap for minor interactions (tabs, toggles)
    lightTap: () => vibrate(30),
    
    // Medium tap for important buttons
    mediumTap: () => vibrate(50),
    
    // Heavy tap for critical actions
    heavyTap: () => vibrate(100),
    
    // Success pattern: two quick taps
    success: () => vibrate([50, 50, 50]),
    
    // Error pattern: long heavy vibration
    error: () => vibrate([200, 50, 100]),
    
    // Warning pattern: two medium vibrations
    warning: () => vibrate([100, 50, 100]),
    
    // Custom pattern
    custom: (pattern: number | number[]) => vibrate(pattern)
  };
}
