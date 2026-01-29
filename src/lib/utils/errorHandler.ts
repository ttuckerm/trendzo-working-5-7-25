// src/lib/utils/errorHandler.ts
export const initErrorHandling = () => {
  // Catch unhandled promise rejections
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
    });

    // Catch other JavaScript errors
    window.addEventListener('error', (event) => {
      console.error('JavaScript error:', event.error);
    });
  }
};

export const logManualError = (error: Error | string) => {
  console.error('Manual error log:', error);
};