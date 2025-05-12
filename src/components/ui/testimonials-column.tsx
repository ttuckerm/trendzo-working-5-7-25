"use client";

import React from "react";
import { motion, Variants } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";

type Testimonial = {
  text: string;
  name: string;
  role: string;
  image: string;
};

type TestimonialsColumnProps = {
  testimonials: Testimonial[];
  className?: string;
  duration?: number;
};

export const TestimonialsColumn = ({
  testimonials,
  className,
  duration = 15,
}: TestimonialsColumnProps) => {
  const columnVariants: Variants = {
    initial: { y: 0 },
    animate: {
      y: "-100%",
      transition: {
        duration,
        repeat: Infinity,
        repeatType: "loop" as const,
        ease: "linear",
      },
    },
  };

  return (
    <div className={cn("flex flex-col gap-8 py-6 overflow-hidden", className)}>
      <motion.div
        className="flex flex-col gap-8"
        variants={columnVariants}
        initial="initial"
        animate="animate"
      >
        {/* First set */}
        {testimonials.map((testimonial, idx) => (
          <TestimonialCard key={`first-${idx}`} testimonial={testimonial} />
        ))}
        {/* Duplicate for seamless loop */}
        {testimonials.map((testimonial, idx) => (
          <TestimonialCard key={`second-${idx}`} testimonial={testimonial} />
        ))}
      </motion.div>
    </div>
  );
};

const TestimonialCard = ({ testimonial }: { testimonial: Testimonial }) => {
  return (
    <div className="bg-muted/50 dark:bg-muted/20 rounded-lg p-6 w-[320px] backdrop-blur-sm shadow-sm">
      <div className="relative mb-6">
        <span className="absolute text-6xl -top-6 -left-2 text-primary opacity-25">"</span>
        <p className="relative z-10 text-sm text-muted-foreground">{testimonial.text}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative h-12 w-12 rounded-full overflow-hidden">
          <Image
            src={testimonial.image}
            alt={testimonial.name}
            fill
            className="object-cover"
          />
        </div>
        <div>
          <h4 className="font-medium text-sm">{testimonial.name}</h4>
          <p className="text-xs text-muted-foreground">{testimonial.role}</p>
        </div>
      </div>
    </div>
  );
}; 