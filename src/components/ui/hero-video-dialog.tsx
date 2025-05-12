"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HeroVideoDialogProps {
  videoSrc: string;
  thumbnailSrc: string;
  thumbnailAlt: string;
  className?: string;
  animationStyle?: "from-center" | "top-in-bottom-out";
}

export function HeroVideoDialog({
  videoSrc,
  thumbnailSrc,
  thumbnailAlt,
  className = "",
  animationStyle = "from-center",
}: HeroVideoDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const animationVariants = {
    "from-center": {
      initial: { scale: 0.9, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.9, opacity: 0 },
    },
    "top-in-bottom-out": {
      initial: { y: -50, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: 50, opacity: 0 },
    },
  };

  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      <div className="relative aspect-video overflow-hidden rounded-xl shadow-xl">
        <Image
          src={thumbnailSrc}
          alt={thumbnailAlt}
          fill
          className="object-cover"
        />
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm transition-all duration-300 hover:bg-black/30 cursor-pointer"
          onClick={() => setIsOpen(true)}
        >
          <div className="rounded-full bg-white/20 p-4 backdrop-blur-md transition-transform duration-300 hover:scale-110">
            <Play className="h-8 w-8 text-white" fill="white" />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              className="relative w-full max-w-4xl"
              onClick={(e) => e.stopPropagation()}
              initial={animationVariants[animationStyle].initial}
              animate={animationVariants[animationStyle].animate}
              exit={animationVariants[animationStyle].exit}
              transition={{ duration: 0.3 }}
            >
              <div className="aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-black shadow-2xl">
                <iframe
                  className="h-full w-full"
                  src={videoSrc}
                  title="Video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <button
                className="absolute -right-2 -top-2 rounded-full bg-white p-2 text-gray-800 shadow-lg transition-transform duration-300 hover:scale-110"
                onClick={() => setIsOpen(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
} 