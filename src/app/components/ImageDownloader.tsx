"use client";

import React, { useState } from "react";
import { 
  downloadImageFromUrl, 
  downloadImageFromElement, 
  downloadPageScreenshot 
} from "@/lib/utils/imageUtils";

interface ImageDownloaderProps {
  targetSelector?: string;
  imageUrl?: string;
  defaultFilename?: string;
  variant?: "icon" | "button" | "full";
  className?: string;
  showScreenshotOption?: boolean;
  buttonLabel?: string;
}

/**
 * Component for downloading images in different ways
 */
export default function ImageDownloader({
  targetSelector,
  imageUrl,
  defaultFilename = "image.png",
  variant = "button",
  className = "",
  showScreenshotOption = false,
  buttonLabel = "Download Image"
}: ImageDownloaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Handler for downloading from URL
  const handleUrlDownload = () => {
    if (!imageUrl) return;
    
    setIsLoading(true);
    try {
      downloadImageFromUrl(imageUrl, defaultFilename);
    } catch (error) {
      console.error("Error downloading image from URL:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handler for downloading from DOM element
  const handleElementDownload = () => {
    if (!targetSelector) return;
    
    setIsLoading(true);
    try {
      const element = document.querySelector(targetSelector) as HTMLElement;
      if (element) {
        downloadImageFromElement(element, defaultFilename);
      } else {
        console.error(`Element not found: ${targetSelector}`);
      }
    } catch (error) {
      console.error("Error downloading element as image:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handler for taking screenshot
  const handleScreenshot = () => {
    setIsLoading(true);
    try {
      downloadPageScreenshot(defaultFilename);
    } catch (error) {
      console.error("Error taking screenshot:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Choose appropriate action based on props provided
  const handleDefaultAction = () => {
    if (imageUrl) {
      handleUrlDownload();
    } else if (targetSelector) {
      handleElementDownload();
    } else if (showScreenshotOption) {
      handleScreenshot();
    }
  };
  
  // Icon-only variant
  if (variant === "icon") {
    return (
      <button
        onClick={handleDefaultAction}
        className={`p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors ${className}`}
        disabled={isLoading}
        title="Download Image"
      >
        {isLoading ? (
          <span className="block w-4 h-4 border-2 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></span>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        )}
      </button>
    );
  }
  
  // Button variant (default)
  if (variant === "button" || !variant) {
    return (
      <button
        onClick={handleDefaultAction}
        className={`px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2 transition-colors ${className}`}
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="block w-4 h-4 border-2 border-t-white border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></span>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        )}
        {buttonLabel}
      </button>
    );
  }
  
  // Full variant with multiple options
  return (
    <div className={`flex gap-2 ${className}`}>
      {imageUrl && (
        <button
          onClick={handleUrlDownload}
          className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2 transition-colors"
          disabled={isLoading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          Save Original
        </button>
      )}
      
      {targetSelector && (
        <button
          onClick={handleElementDownload}
          className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2 transition-colors"
          disabled={isLoading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Download View
        </button>
      )}
      
      {showScreenshotOption && (
        <button
          onClick={handleScreenshot}
          className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2 transition-colors"
          disabled={isLoading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
            <circle cx="12" cy="13" r="4"></circle>
          </svg>
          Screenshot
        </button>
      )}
      
      {isLoading && (
        <span className="block w-4 h-4 border-2 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin ml-2"></span>
      )}
    </div>
  );
} 