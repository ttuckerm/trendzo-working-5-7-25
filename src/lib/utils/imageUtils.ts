/**
 * Utility functions for working with images
 */

/**
 * Download an image from a URL
 * @param url - The URL of the image to download
 * @param filename - The name to save the file as
 */
export const downloadImageFromUrl = (url: string, filename: string = 'image.png') => {
  // Create a link element
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Download an image from an HTML element (img, div with background-image, etc.)
 * @param element - The DOM element containing the image
 * @param filename - The name to save the file as
 */
export const downloadImageFromElement = (element: HTMLElement, filename: string = 'image.png') => {
  // Create a canvas element
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) {
    console.error('Canvas context not available');
    return;
  }
  
  // Set canvas dimensions to match the element
  canvas.width = element.offsetWidth;
  canvas.height = element.offsetHeight;
  
  // Create a new image
  const img = new Image();
  
  // Handle different element types
  if (element instanceof HTMLImageElement) {
    // For img elements
    img.crossOrigin = 'anonymous';
    img.src = element.src;
    img.onload = () => {
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
      downloadFromCanvas(canvas, filename);
    };
  } else {
    // For elements with background image
    const style = window.getComputedStyle(element);
    const backgroundImage = style.backgroundImage;
    
    if (backgroundImage && backgroundImage !== 'none') {
      // Extract the URL from the backgroundImage value
      const urlMatch = /url\(['"]?([^'"()]+)['"]?\)/g.exec(backgroundImage);
      if (urlMatch && urlMatch[1]) {
        img.crossOrigin = 'anonymous';
        img.src = urlMatch[1];
        img.onload = () => {
          context.drawImage(img, 0, 0, canvas.width, canvas.height);
          downloadFromCanvas(canvas, filename);
        };
      } else {
        console.error('Could not extract background image URL');
      }
    } else {
      // For elements without background image, capture the element's content
      const html2canvas = async () => {
        try {
          // Dynamically import html2canvas
          const { default: html2canvas } = await import('html2canvas');
          const canvas = await html2canvas(element);
          downloadFromCanvas(canvas, filename);
        } catch (error) {
          console.error('Error capturing element:', error);
        }
      };
      
      html2canvas();
    }
  }
};

/**
 * Download a screenshot of the visible portion of a page
 * @param filename - The name to save the file as
 */
export const downloadPageScreenshot = (filename: string = 'screenshot.png') => {
  const html2canvas = async () => {
    try {
      // Dynamically import html2canvas
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(document.documentElement);
      downloadFromCanvas(canvas, filename);
    } catch (error) {
      console.error('Error capturing screenshot:', error);
    }
  };
  
  html2canvas();
};

/**
 * Helper function to download from canvas
 * @param canvas - The canvas element to download
 * @param filename - The name to save the file as
 */
const downloadFromCanvas = (canvas: HTMLCanvasElement, filename: string) => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}; 