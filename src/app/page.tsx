/**
 * CRITICAL FILE: Landing Page
 * 
 * PURPOSE: Renders the public marketing page at root URL (/)
 * 
 * WARNING:
 * - This file MUST serve the root URL (/)
 * - Do NOT redirect to dashboard or any other route
 * - Any changes to this file should NOT affect dashboard functionality
 */

"use client";

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowRight, 
  Check, 
  TrendingUp, 
  Zap, 
  Video, 
  BarChart2, 
  Globe, 
  Star,
  Home,
  Lightbulb,
  CreditCard,
  BookOpen
} from 'lucide-react';
import { PricingContainer } from '@/components/ui/PricingContainer';
import { PricingPlan } from '@/lib/types/pricingTypes';
import { TextRotate, TextRotateRef } from '@/components/ui/TextRotate';
import { MenuBar } from '@/components/ui/glow-menu';
import { useRouter } from 'next/navigation';
import NavHeader from '@/components/ui/NavHeader';
import { ContainerScroll } from '@/components/ui/ContainerScroll';
import { InfiniteSlider } from '@/components/ui/InfiniteSlider';
import { Marquee } from "@/components/ui/marquee";
import { MorphingDialogDemo } from "@/components/ui/morphing-dialog-demo";
import { HeroVideoDialog } from "@/components/ui/hero-video-dialog";
import { TestimonialsColumn } from "@/components/ui/testimonials-column";
import { motion } from "framer-motion";
import { Footerdemo } from "@/components/ui/footer-demo";

const Logos = {
  tailwindcss: () => (
    <svg
      className={"h-[28px] sm:w-auto w-[140px]"}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 262 33"
    >
      <path
        className={"fill-cyan-500"}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M27 0C19.8 0 15.3 3.6 13.5 10.8C16.2 7.2 19.35 5.85 22.95 6.75C25.004 7.263 26.472 8.754 28.097 10.403C30.744 13.09 33.808 16.2 40.5 16.2C47.7 16.2 52.2 12.6 54 5.4C51.3 9 48.15 10.35 44.55 9.45C42.496 8.937 41.028 7.446 39.403 5.797C36.756 3.11 33.692 0 27 0ZM13.5 16.2C6.3 16.2 1.8 19.8 0 27C2.7 23.4 5.85 22.05 9.45 22.95C11.504 23.464 12.972 24.954 14.597 26.603C17.244 29.29 20.308 32.4 27 32.4C34.2 32.4 38.7 28.8 40.5 21.6C37.8 25.2 34.65 26.55 31.05 25.65C28.996 25.137 27.528 23.646 25.903 21.997C23.256 19.31 20.192 16.2 13.5 16.2Z"
      />
      <path
        className={"fill-primary"}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M80.996 13.652H76.284V22.772C76.284 25.204 77.88 25.166 80.996 25.014V28.7C74.688 29.46 72.18 27.712 72.18 22.772V13.652H68.684V9.69996H72.18V4.59596L76.284 3.37996V9.69996H80.996V13.652ZM98.958 9.69996H103.062V28.7H98.958V25.964C97.514 27.978 95.272 29.194 92.308 29.194C87.14 29.194 82.846 24.824 82.846 19.2C82.846 13.538 87.14 9.20596 92.308 9.20596C95.272 9.20596 97.514 10.422 98.958 12.398V9.69996ZM92.954 25.28C96.374 25.28 98.958 22.734 98.958 19.2C98.958 15.666 96.374 13.12 92.954 13.12C89.534 13.12 86.95 15.666 86.95 19.2C86.95 22.734 89.534 25.28 92.954 25.28ZM109.902 6.84996C108.458 6.84996 107.28 5.63396 107.28 4.22796C107.281 3.53297 107.558 2.86682 108.049 2.37539C108.541 1.88395 109.207 1.60728 109.902 1.60596C110.597 1.60728 111.263 1.88395 111.755 2.37539C112.246 2.86682 112.523 3.53297 112.524 4.22796C112.524 5.63396 111.346 6.84996 109.902 6.84996ZM107.85 28.7V9.69996H111.954V28.7H107.85ZM116.704 28.7V0.959961H120.808V28.7H116.704ZM147.446 9.69996H151.778L145.812 28.7H141.784L137.832 15.894L133.842 28.7H129.814L123.848 9.69996H128.18L131.866 22.81L135.856 9.69996H139.77L143.722 22.81L147.446 9.69996ZM156.87 6.84996C155.426 6.84996 154.248 5.63396 154.248 4.22796C154.249 3.53297 154.526 2.86682 155.017 2.37539C155.509 1.88395 156.175 1.60728 156.87 1.60596C157.565 1.60728 158.231 1.88395 158.723 2.37539C159.214 2.86682 159.491 3.53297 159.492 4.22796C159.492 5.63396 158.314 6.84996 156.87 6.84996ZM154.818 28.7V9.69996H158.922V28.7H154.818ZM173.666 9.20596C177.922 9.20596 180.962 12.094 180.962 17.034V28.7H176.858V17.452C176.858 14.564 175.186 13.044 172.602 13.044C169.904 13.044 167.776 14.64 167.776 18.516V28.7H163.672V9.69996H167.776V12.132C169.03 10.156 171.082 9.20596 173.666 9.20596ZM200.418 2.09996H204.522V28.7H200.418V25.964C198.974 27.978 196.732 29.194 193.768 29.194C188.6 29.194 184.306 24.824 184.306 19.2C184.306 13.538 188.6 9.20596 193.768 9.20596C196.732 9.20596 198.974 10.422 200.418 12.398V2.09996ZM194.414 25.28C197.834 25.28 200.418 22.734 200.418 19.2C200.418 15.666 197.834 13.12 194.414 13.12C190.994 13.12 188.41 15.666 188.41 19.2C188.41 22.734 190.994 25.28 194.414 25.28ZM218.278 29.194C212.54 29.194 208.246 24.824 208.246 19.2C208.246 13.538 212.54 9.20596 218.278 9.20596C222.002 9.20596 225.232 11.144 226.752 14.108L223.218 16.16C222.382 14.374 220.52 13.234 218.24 13.234C214.896 13.234 212.35 15.78 212.35 19.2C212.35 22.62 214.896 25.166 218.24 25.166C220.52 25.166 222.382 23.988 223.294 22.24L226.828 24.254C225.232 27.256 222.002 29.194 218.278 29.194ZM233.592 14.944C233.592 18.402 243.814 16.312 243.814 23.342C243.814 27.142 240.508 29.194 236.404 29.194C232.604 29.194 229.868 27.484 228.652 24.748L232.186 22.696C232.794 24.406 234.314 25.432 236.404 25.432C238.228 25.432 239.634 24.824 239.634 23.304C239.634 19.922 229.412 21.822 229.412 15.02C229.412 11.448 232.49 9.20596 236.366 9.20596C239.482 9.20596 242.066 10.65 243.396 13.158L239.938 15.096C239.254 13.614 237.924 12.93 236.366 12.93C234.884 12.93 233.592 13.576 233.592 14.944ZM251.11 14.944C251.11 18.402 261.332 16.312 261.332 23.342C261.332 27.142 258.026 29.194 253.922 29.194C250.122 29.194 247.386 27.484 246.17 24.748L249.704 22.696C250.312 24.406 251.832 25.432 253.922 25.432C255.746 25.432 257.152 24.824 257.152 23.304C257.152 19.922 246.93 21.822 246.93 15.02C246.93 11.448 250.008 9.20596 253.884 9.20596C257 9.20596 259.584 10.65 260.914 13.158L257.456 15.096C256.772 13.614 255.442 12.93 253.884 12.93C252.402 12.93 251.11 13.576 251.11 14.944Z"
      />
    </svg>
  ),
  nextjs: () => (
    <svg
      className={"h-[20px] fill-primary"}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 394 79"
    >
      <path d="M261.919 0.0330722H330.547V12.7H303.323V79.339H289.71V12.7H261.919V0.0330722Z"></path>
      <path d="M149.052 0.0330722V12.7H94.0421V33.0772H138.281V45.7441H94.0421V66.6721H149.052V79.339H80.43V12.7H80.4243V0.0330722H149.052Z"></path>
      <path d="M183.32 0.0661486H165.506L229.312 79.3721H247.178L215.271 39.7464L247.127 0.126654L229.312 0.154184L206.352 28.6697L183.32 0.0661486Z"></path>
      <path d="M201.6 56.7148L192.679 45.6229L165.455 79.4326H183.32L201.6 56.7148Z"></path>
      <path
        clipRule="evenodd"
        d="M80.907 79.339L17.0151 0H0V79.3059H13.6121V16.9516L63.8067 79.339H80.907Z"
        fillRule="evenodd"
      ></path>
      <path d="M333.607 78.8546C332.61 78.8546 331.762 78.5093 331.052 77.8186C330.342 77.1279 329.991 76.2917 330 75.3011C329.991 74.3377 330.342 73.5106 331.052 72.8199C331.762 72.1292 332.61 71.7838 333.607 71.7838C334.566 71.7838 335.405 72.1292 336.115 72.8199C336.835 73.5106 337.194 74.3377 337.204 75.3011C337.194 75.9554 337.028 76.5552 336.696 77.0914C336.355 77.6368 335.922 78.064 335.377 78.373C334.842 78.6911 334.252 78.8546 333.607 78.8546Z"></path>
      <path d="M356.84 45.4453H362.872V68.6846C362.863 70.8204 362.401 72.6472 361.498 74.1832C360.585 75.7191 359.321 76.8914 357.698 77.7185C356.084 78.5364 354.193 78.9546 352.044 78.9546C350.079 78.9546 348.318 78.6001 346.75 77.9094C345.182 77.2187 343.937 76.1826 343.024 74.8193C342.101 73.456 341.649 71.7565 341.649 69.7207H347.691C347.7 70.6114 347.903 71.3838 348.29 72.0291C348.677 72.6744 349.212 73.1651 349.895 73.5105C350.586 73.8559 351.38 74.0286 352.274 74.0286C353.243 74.0286 354.073 73.8286 354.746 73.4196C355.419 73.0197 355.936 72.4199 356.296 71.6201C356.646 70.8295 356.831 69.8479 356.84 68.6846V45.4453Z"></path>
      <path d="M387.691 54.5338C387.544 53.1251 386.898 52.0254 385.773 51.2438C384.638 50.4531 383.172 50.0623 381.373 50.0623C380.11 50.0623 379.022 50.2532 378.118 50.6258C377.214 51.0075 376.513 51.5164 376.033 52.1617C375.554 52.807 375.314 53.5432 375.295 54.3703C375.295 55.061 375.461 55.6608 375.784 56.1607C376.107 56.6696 376.54 57.0968 377.103 57.4422C377.656 57.7966 378.274 58.0874 378.948 58.3237C379.63 58.56 380.313 58.76 380.995 58.9236L384.14 59.6961C385.404 59.9869 386.631 60.3778 387.802 60.8776C388.973 61.3684 390.034 61.9955 390.965 62.7498C391.897 63.5042 392.635 64.413 393.179 65.4764C393.723 66.5397 394 67.7848 394 69.2208C394 71.1566 393.502 72.8562 392.496 74.3285C391.491 75.7917 390.043 76.9369 388.143 77.764C386.252 78.582 383.965 79 381.272 79C378.671 79 376.402 78.6002 374.493 77.8004C372.575 77.0097 371.08 75.8463 370.001 74.3194C368.922 72.7926 368.341 70.9294 368.258 68.7391H374.235C374.318 69.8842 374.687 70.8386 375.314 71.6111C375.95 72.3745 376.78 72.938 377.795 73.3197C378.819 73.6923 379.962 73.8832 381.226 73.8832C382.545 73.8832 383.707 73.6832 384.712 73.2924C385.708 72.9016 386.492 72.3564 387.055 71.6475C387.627 70.9476 387.913 70.1206 387.922 69.1754C387.913 68.312 387.654 67.5939 387.156 67.0304C386.649 66.467 385.948 65.9944 385.053 65.6127C384.15 65.231 383.098 64.8856 381.899 64.5857L378.081 63.6223C375.323 62.9225 373.137 61.8592 371.541 60.4323C369.937 59.0054 369.143 57.115 369.143 54.7429C369.143 52.798 369.678 51.0894 370.758 49.6261C371.827 48.1629 373.294 47.0268 375.148 46.2179C377.011 45.4 379.114 45 381.456 45C383.836 45 385.92 45.4 387.719 46.2179C389.517 47.0268 390.929 48.1538 391.952 49.5897C392.976 51.0257 393.511 52.6707 393.539 54.5338H387.691Z"></path>
    </svg>
  ),
  framer: () => (
    <div
      className={
        "h-fit flex items-center justify-start font-bold text-xl gap-3"
      }
    >
      <svg
        viewBox="0 0 14 21"
        role="presentation"
        className={"h-[30px] fill-primary"}
      >
        <path d="M0 0h14v7H7zm0 7h7l7 7H7v7l-7-7z" fill="currentColor"></path>
      </svg>
      Motion
    </div>
  ),
  aws: () => (
    <svg
      className={"h-[40px]"}
      version="1.1"
      viewBox="-45.101 -44.95 390.872 269.7"
    >
      <g transform="translate(-1.668 -1.1)">
        <path
          d="M86.4 66.4c0 3.7.4 6.7 1.1 8.9.8 2.2 1.8 4.6 3.2 7.2.5.8.7 1.6.7 2.3 0 1-.6 2-1.9 3L83.2 92c-.9.6-1.8.9-2.6.9-1 0-2-.5-3-1.4-1.4-1.5-2.6-3.1-3.6-4.7-1-1.7-2-3.6-3.1-5.9Q59.2 94.7 41.5 94.7c-8.4 0-15.1-2.4-20-7.2s-7.4-11.2-7.4-19.2c0-8.5 3-15.4 9.1-20.6s14.2-7.8 24.5-7.8c3.4 0 6.9.3 10.6.8s7.5 1.3 11.5 2.2v-7.3c0-7.6-1.6-12.9-4.7-16-3.2-3.1-8.6-4.6-16.3-4.6-3.5 0-7.1.4-10.8 1.3s-7.3 2-10.8 3.4c-1.6.7-2.8 1.1-3.5 1.3s-1.2.3-1.6.3c-1.4 0-2.1-1-2.1-3.1v-4.9c0-1.6.2-2.8.7-3.5s1.4-1.4 2.8-2.1Q28.75 5 36.1 3.2C41 1.9 46.2 1.3 51.7 1.3c11.9 0 20.6 2.7 26.2 8.1 5.5 5.4 8.3 13.6 8.3 24.6v32.4zM45.8 81.6c3.3 0 6.7-.6 10.3-1.8s6.8-3.4 9.5-6.4c1.6-1.9 2.8-4 3.4-6.4s1-5.3 1-8.7v-4.2c-2.9-.7-6-1.3-9.2-1.7s-6.3-.6-9.4-.6c-6.7 0-11.6 1.3-14.9 4s-4.9 6.5-4.9 11.5c0 4.7 1.2 8.2 3.7 10.6 2.4 2.5 5.9 3.7 10.5 3.7m80.3 10.8c-1.8 0-3-.3-3.8-1-.8-.6-1.5-2-2.1-3.9L96.7 10.2c-.6-2-.9-3.3-.9-4 0-1.6.8-2.5 2.4-2.5h9.8c1.9 0 3.2.3 3.9 1 .8.6 1.4 2 2 3.9l16.8 66.2 15.6-66.2c.5-2 1.1-3.3 1.9-3.9s2.2-1 4-1h8c1.9 0 3.2.3 4 1 .8.6 1.5 2 1.9 3.9l15.8 67 17.3-67c.6-2 1.3-3.3 2-3.9.8-.6 2.1-1 3.9-1h9.3c1.6 0 2.5.8 2.5 2.5 0 .5-.1 1-.2 1.6s-.3 1.4-.7 2.5l-24.1 77.3q-.9 3-2.1 3.9c-.8.6-2.1 1-3.8 1h-8.6c-1.9 0-3.2-.3-4-1s-1.5-2-1.9-4L156 23l-15.4 64.4c-.5 2-1.1 3.3-1.9 4s-2.2 1-4 1zm128.5 2.7c-5.2 0-10.4-.6-15.4-1.8s-8.9-2.5-11.5-4c-1.6-.9-2.7-1.9-3.1-2.8s-.6-1.9-.6-2.8v-5.1c0-2.1.8-3.1 2.3-3.1q.9 0 1.8.3c.6.2 1.5.6 2.5 1 3.4 1.5 7.1 2.7 11 3.5 4 .8 7.9 1.2 11.9 1.2 6.3 0 11.2-1.1 14.6-3.3s5.2-5.4 5.2-9.5c0-2.8-.9-5.1-2.7-7s-5.2-3.6-10.1-5.2L246 52c-7.3-2.3-12.7-5.7-16-10.2-3.3-4.4-5-9.3-5-14.5q0-6.3 2.7-11.1c1.8-3.2 4.2-6 7.2-8.2 3-2.3 6.4-4 10.4-5.2s8.2-1.7 12.6-1.7c2.2 0 4.5.1 6.7.4 2.3.3 4.4.7 6.5 1.1 2 .5 3.9 1 5.7 1.6q2.7.9 4.2 1.8c1.4.8 2.4 1.6 3 2.5q.9 1.2.9 3.3v4.7c0 2.1-.8 3.2-2.3 3.2-.8 0-2.1-.4-3.8-1.2q-8.55-3.9-19.2-3.9c-5.7 0-10.2.9-13.3 2.8s-4.7 4.8-4.7 8.9c0 2.8 1 5.2 3 7.1s5.7 3.8 11 5.5l14.2 4.5c7.2 2.3 12.4 5.5 15.5 9.6s4.6 8.8 4.6 14c0 4.3-.9 8.2-2.6 11.6-1.8 3.4-4.2 6.4-7.3 8.8-3.1 2.5-6.8 4.3-11.1 5.6-4.5 1.4-9.2 2.1-14.3 2.1"
          className="dark:fill-white fill-gray-900"
        />
        <g>
          <path
            id="path1859"
            d="M273.5 143.7c-32.9 24.3-80.7 37.2-121.8 37.2-57.6 0-109.5-21.3-148.7-56.7-3.1-2.8-.3-6.6 3.4-4.4 42.4 24.6 94.7 39.5 148.8 39.5 36.5 0 76.6-7.6 113.5-23.2 5.5-2.5 10.2 3.6 4.8 7.6"
            className="fill-[#f90]"
          />
          <path
            d="M287.2 128.1c-4.2-5.4-27.8-2.6-38.5-1.3-3.2.4-3.7-2.4-.8-4.5 18.8-13.2 49.7-9.4 53.3-5 3.6 4.5-1 35.4-18.6 50.2-2.7 2.3-5.3 1.1-4.1-1.9 4-9.9 12.9-32.2 8.7-37.5"
            className="fill-[#f90]"
          />
        </g>
      </g>
    </svg>
  ),
};

function MarqueeDemo() {
  const arr = [Logos.tailwindcss, Logos.framer, Logos.nextjs, Logos.aws]

  return (
    <Marquee className="py-8" speed={30} pauseOnHover={true}>
      {arr.map((Logo, index) => (
        <div
          key={index}
          className="flex items-center justify-center mx-12 md:mx-16 lg:mx-20"
        >
          <Logo />
        </div>
      ))}
    </Marquee>
  )
}

function HeroVideoDialogDemo() {
  return (
    <div className="relative">
      <HeroVideoDialog
        className="dark:hidden block"
        animationStyle="from-center"
        videoSrc="https://www.youtube.com/embed/qh3NGpYRG3I?si=4rb-zSdDkVK9qxxb"
        thumbnailSrc="/images/hero/hero-light.png"
        thumbnailAlt="Hero Video"
      />
      <HeroVideoDialog
        className="hidden dark:block"
        animationStyle="from-center"
        videoSrc="https://www.youtube.com/embed/qh3NGpYRG3I?si=4rb-zSdDkVK9qxxb"
        thumbnailSrc="/images/hero/hero-dark.png"
        thumbnailAlt="Hero Video"
      />
    </div>
  )
}

function HeroVideoDialogDemoTopInBottomOut() {
  return (
    <div className="relative">
      <HeroVideoDialog
        className="dark:hidden block"
        animationStyle="top-in-bottom-out"
        videoSrc="https://www.youtube.com/embed/qh3NGpYRG3I?si=4rb-zSdDkVK9qxxb"
        thumbnailSrc="/images/hero/hero-light.png"
        thumbnailAlt="Hero Video"
      />
      <HeroVideoDialog
        className="hidden dark:block"
        animationStyle="top-in-bottom-out"
        videoSrc="https://www.youtube.com/embed/qh3NGpYRG3I?si=4rb-zSdDkVK9qxxb"
        thumbnailSrc="/images/hero/hero-dark.png"
        thumbnailAlt="Hero Video"
      />
    </div>
  )
}

export default function LandingPage() {
  const [videoHovered, setVideoHovered] = useState(false);
  const textRotateRef = useRef<TextRotateRef>(null);
  const router = useRouter();
  const [activeMenuItem, setActiveMenuItem] = useState('Home');
  
  // Testimonials data
  const testimonials = [
    {
      text: "This ERP revolutionized our operations, streamlining finance and inventory. The cloud-based platform keeps us productive, even remotely.",
      image: "https://randomuser.me/api/portraits/women/1.jpg",
      name: "Briana Patton",
      role: "Operations Manager",
    },
    {
      text: "Implementing this ERP was smooth and quick. The customizable, user-friendly interface made team training effortless.",
      image: "https://randomuser.me/api/portraits/men/2.jpg",
      name: "Bilal Ahmed",
      role: "IT Manager",
    },
    {
      text: "The support team is exceptional, guiding us through setup and providing ongoing assistance, ensuring our satisfaction.",
      image: "https://randomuser.me/api/portraits/women/3.jpg",
      name: "Saman Malik",
      role: "Customer Support Lead",
    },
    {
      text: "This ERP's seamless integration enhanced our business operations and efficiency. Highly recommend for its intuitive interface.",
      image: "https://randomuser.me/api/portraits/men/4.jpg",
      name: "Omar Raza",
      role: "CEO",
    },
    {
      text: "Its robust features and quick support have transformed our workflow, making us significantly more efficient.",
      image: "https://randomuser.me/api/portraits/women/5.jpg",
      name: "Zainab Hussain",
      role: "Project Manager",
    },
    {
      text: "The smooth implementation exceeded expectations. It streamlined processes, improving overall business performance.",
      image: "https://randomuser.me/api/portraits/women/6.jpg",
      name: "Aliza Khan",
      role: "Business Analyst",
    },
    {
      text: "Our business functions improved with a user-friendly design and positive customer feedback.",
      image: "https://randomuser.me/api/portraits/men/7.jpg",
      name: "Farhan Siddiqui",
      role: "Marketing Director",
    },
    {
      text: "They delivered a solution that exceeded expectations, understanding our needs and enhancing our operations.",
      image: "https://randomuser.me/api/portraits/women/8.jpg",
      name: "Sana Sheikh",
      role: "Sales Manager",
    },
    {
      text: "Using this ERP, our online presence and conversions significantly improved, boosting business performance.",
      image: "https://randomuser.me/api/portraits/men/9.jpg",
      name: "Hassan Ali",
      role: "E-commerce Manager",
    },
  ];

  const firstColumn = testimonials.slice(0, 3);
  const secondColumn = testimonials.slice(3, 6);
  const thirdColumn = testimonials.slice(6, 9);
  
  // Menu items for the MenuBar component
  const menuItems = [
    {
      icon: Home,
      label: 'Home',
      href: '/',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      iconColor: 'text-blue-500'
    },
    {
      icon: Lightbulb,
      label: 'Features',
      href: '/features',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
      iconColor: 'text-purple-500'
    },
    {
      icon: CreditCard,
      label: 'Pricing',
      href: '#pricing',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      iconColor: 'text-amber-500'
    },
    {
      icon: BookOpen,
      label: 'Blog',
      href: '/blog',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      iconColor: 'text-emerald-500'
    }
  ];
  
  // Handle navigation when menu item is clicked
  const handleMenuItemClick = (label: string) => {
    setActiveMenuItem(label);
    const item = menuItems.find(item => item.label === label);
    if (item) {
      if (item.href.startsWith('#')) {
        // For anchor links
        const element = document.getElementById(item.href.substring(1));
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        // For page navigation
        router.push(item.href);
      }
    }
  };
  
  // Define rotating texts for the hero section
  const rotatingTexts = [
    "actually trends",
    "gets more views",
    "goes viral",
    "attracts followers",
    "drives engagement"
  ];
  
  // Define pricing plans
  const pricingPlans: PricingPlan[] = [
    {
      name: 'Basic',
      monthlyPrice: 0,
      yearlyPrice: 0,
      accent: 'bg-gradient-to-r from-gray-600 to-gray-800',
      features: [
        '10 template analyses per month',
        'Basic analytics dashboard',
        'Template library access'
      ],
      buttonText: 'Get Started'
    },
    {
      name: 'Premium',
      monthlyPrice: 29,
      yearlyPrice: 23,
      accent: 'bg-gradient-to-r from-blue-600 to-indigo-600',
      features: [
        'Unlimited template analyses',
        'Advanced analytics and insights',
        'Template remix engine',
        'AI content suggestions',
        'Priority support'
      ],
      isPopular: true,
      buttonText: 'Get Premium'
    },
    {
      name: 'Business',
      monthlyPrice: 79,
      yearlyPrice: 63,
      accent: 'bg-gradient-to-r from-purple-600 to-indigo-600',
      features: [
        'Everything in Premium',
        'Team collaboration',
        'API access',
        'Custom templates',
        'Dedicated account manager'
      ],
      buttonText: 'Contact Sales'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="border-b bg-white py-4">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <Image 
                  src="/images/logos/trendzo-full-logo.svg" 
                  alt="Trendzo Logo" 
                  width={180}
                  height={50}
                  priority
                />
              </Link>
            </div>
            
            <div className="hidden md:block">
              <NavHeader />
            </div>
            
            <div className="flex items-center gap-3">
              <Link href="/auth" className="hidden sm:inline-block text-sm font-medium text-gray-700 hover:text-blue-600">
                Sign In
              </Link>
              <Link 
                href="/auth?signup=true"
                className="rounded-md bg-blue-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-white to-blue-50 py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                  Create TikTok content that{" "}
                  <span className="inline-flex">
                    <TextRotate 
                      texts={rotatingTexts}
                      mainClassName="text-blue-600 min-h-[1.25em]"
                      staggerDuration={0.025}
                      rotationInterval={3000}
                      splitBy="characters"
                      transition={{
                        type: "spring",
                        damping: 20,
                        stiffness: 300
                      }}
                      ref={textRotateRef}
                    />
                  </span>
                </h1>
                <p className="mt-4 text-lg text-gray-600 leading-relaxed">
                  Trendzo helps you analyze viral TikTok templates, remix them for your niche, and track your content performance—all in one place.
                </p>
                <div className="mt-8 flex gap-4">
                  <Link
                    href="/auth?signup=true"
                    className="rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    Start for free
                  </Link>
                  <Link
                    href="/dashboard"
                    className="rounded-md border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                  >
                    View Dashboard
                  </Link>
                </div>
                
                <div className="mt-6 flex items-center text-sm text-gray-500">
                  <Check className="mr-2 h-4 w-4 text-green-600" /> 
                  No credit card required
                </div>
              </div>
              
              <div className="relative rounded-xl overflow-hidden shadow-2xl border border-gray-200">
                <div 
                  className="aspect-[4/3] bg-gray-800 relative"
                  onMouseEnter={() => setVideoHovered(true)}
                  onMouseLeave={() => setVideoHovered(false)}
                >
                  {/* Fallback for missing image - Dashboard mockup */}
                  <div className="absolute inset-0 flex flex-col p-3">
                    {/* Dashboard header */}
                    <div className="h-12 bg-gray-900 rounded-t-lg mb-2 flex items-center px-4">
                      <div className="w-6 h-6 rounded bg-red-500 mr-3"></div>
                      <div className="text-white font-medium">Template Library</div>
                      <div className="ml-auto flex items-center space-x-3">
                        <div className="w-32 h-8 bg-gray-800 rounded-md"></div>
                        <div className="w-8 h-8 bg-gray-800 rounded-full"></div>
                      </div>
                    </div>
                    
                    {/* Dashboard content */}
                    <div className="flex-1 bg-gray-900 rounded-b-lg p-4">
                      {/* Filter row */}
                      <div className="flex mb-4 gap-2 overflow-x-auto pb-2">
                        <div className="px-3 py-1 bg-gray-800 text-white text-xs rounded-md whitespace-nowrap">Category ▼</div>
                        <div className="px-3 py-1 bg-gray-800 text-white text-xs rounded-md whitespace-nowrap">Engagement Rate</div>
                        <div className="px-3 py-1 bg-gray-800 text-white text-xs rounded-md whitespace-nowrap">Audio Integration ▼</div>
                        <div className="px-3 py-1 bg-gray-800 text-white text-xs rounded-md whitespace-nowrap">Trending ▼</div>
                      </div>
                      
                      {/* Template grid */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Template tiles */}
                        {[
                          { label: 'Lifestyle', color: 'bg-green-600', stats: '520K', growth: '+12.9%' },
                          { label: 'Recipes', color: 'bg-teal-600', stats: '1.3M', growth: '+4.5%' },
                          { label: 'Education', color: 'bg-orange-600', stats: '860K', growth: '+6.1%' },
                          { label: 'Fitness', color: 'bg-blue-600', stats: '7.5%', growth: '', type: 'velocity' }
                        ].map((item, i) => (
                          <div key={i} className="bg-gray-800 rounded-lg overflow-hidden">
                            <div className="h-20 bg-gray-700 relative">
                              <div className={`absolute top-2 left-2 px-2 py-1 ${item.color} text-white text-xs rounded`}>
                                {item.label}
                              </div>
                              {i % 2 === 1 && (
                                <div className="absolute top-2 right-2 text-white">
                                  <span>🔒</span>
                                </div>
                              )}
                            </div>
                            <div className="p-3">
                              <div className="flex justify-between items-center">
                                <div className="text-white text-sm font-medium">{item.stats}</div>
                                {item.growth && (
                                  <div className="text-green-400 text-xs">{item.growth}</div>
                                )}
                                {item.type === 'velocity' && (
                                  <div className="text-blue-400">📊</div>
                                )}
                              </div>
                              <div className="text-gray-400 text-xs mt-1">
                                {item.type === 'velocity' ? 'Growth velocity' : 'Engagement'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${videoHovered ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="rounded-full bg-blue-600 p-3 shadow-lg">
                      <Video className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <ContainerScroll
          titleComponent={
            <div className="text-center mb-10">
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-2 inline-block">Features</span>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">How Trendzo Works</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Analyze trending TikTok templates, remix them for your brand, and track your performance—all in one platform.
              </p>
            </div>
          }
        >
          <div className="flex flex-col md:flex-row gap-6 h-full">
            {/* Feature cards in a vertical column for mobile, horizontal row for desktop */}
            <div className="flex-1 flex flex-col gap-6">
              {/* Feature 1 */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group flex-1">
                <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                  <TrendingUp className="h-7 w-7 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors">Trend Analysis</h3>
                <p className="text-gray-600">
                  Discover viral TikTok templates with AI-powered analysis of structure, timing, and engagement metrics.
                </p>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="text-sm font-medium text-blue-600 flex items-center">
                    Learn more <ArrowRight className="ml-1 h-3 w-3" />
                  </span>
                </div>
              </div>
              
              {/* Feature 2 */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group flex-1">
                <div className="w-14 h-14 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                  <Zap className="h-7 w-7 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-purple-600 transition-colors">Template Remix</h3>
                <p className="text-gray-600">
                  Customize trending templates for your brand and content style with our intuitive remix engine.
                </p>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="text-sm font-medium text-purple-600 flex items-center">
                    Learn more <ArrowRight className="ml-1 h-3 w-3" />
                  </span>
                </div>
              </div>
            </div>

            {/* Feature 3 - Full height on the right side */}
            <div className="flex-1 flex flex-col">
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group flex-1 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                    <BarChart2 className="h-7 w-7 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-green-600 transition-colors">Performance Tracking</h3>
                  <p className="text-gray-600 mb-6">
                    Track how your content performs with analytics that show what's working and why. Get detailed insights on engagement, reach, and conversion metrics.
                  </p>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <span className="text-sm font-medium text-green-600 flex items-center">
                      Learn more <ArrowRight className="ml-1 h-3 w-3" />
                    </span>
                  </div>
                </div>
                
                {/* Decorative background elements */}
                <div className="absolute bottom-0 right-0 opacity-10 pointer-events-none">
                  <BarChart2 className="h-48 w-48 text-green-900" />
                </div>
              </div>
            </div>
          </div>
        </ContainerScroll>

        {/* Trust Partners Section */}
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Trusted by developers worldwide</h2>
              <p className="mt-2 text-gray-600">Trendzo integrates with your favorite tools and platforms</p>
            </div>
            <MarqueeDemo />
            <MorphingDialogDemo />
          </div>
        </section>

        {/* Hero Video Dialog Demo Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-2 inline-block">Video Demos</span>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Interactive Video Presentations</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Engage your audience with stunning video presentations that showcase your content
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">Center Animation</h3>
                <HeroVideoDialogDemo />
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">Top-to-Bottom Animation</h3>
                <HeroVideoDialogDemoTopInBottomOut />
              </div>
            </div>
          </div>
        </section>

        {/* Trending Templates Slider Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-sm font-medium mb-2 inline-block">Templates</span>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Trending TikTok Templates</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Discover the latest trending templates being used by top creators right now
              </p>
            </div>
            
            <InfiniteSlider 
              direction="horizontal" 
              className="py-4"
              gap={24}
              duration={35}
              durationOnHover={80}
            >
              {[
                { title: "Day in My Life", category: "Lifestyle", views: "4.2M", growth: "+28%" },
                { title: "5-Minute Recipes", category: "Food", views: "8.7M", growth: "+15%" },
                { title: "Morning Routine", category: "Wellness", views: "2.9M", growth: "+42%" },
                { title: "Outfit Transition", category: "Fashion", views: "5.1M", growth: "+33%" },
                { title: "Quick Workout", category: "Fitness", views: "3.4M", growth: "+19%" },
                { title: "Product Review", category: "Tech", views: "1.8M", growth: "+22%" },
                { title: "Dance Challenge", category: "Entertainment", views: "12.4M", growth: "+51%" },
                { title: "Makeup Tutorial", category: "Beauty", views: "6.7M", growth: "+27%" }
              ].map((template, index) => (
                <div 
                  key={index}
                  className="w-[280px] h-[200px] bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden flex flex-col"
                >
                  <div className="h-[120px] bg-gradient-to-r from-purple-400 to-blue-500 relative">
                    <div className="absolute top-3 left-3 px-2 py-1 bg-black bg-opacity-60 text-white text-xs rounded-md">
                      {template.category}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center backdrop-blur-sm">
                        <Video className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <h3 className="font-medium text-gray-900">{template.title}</h3>
                    <div className="flex justify-between items-center mt-3">
                      <div className="text-gray-500 text-sm">{template.views} views</div>
                      <div className="text-green-500 text-sm font-medium">{template.growth}</div>
                    </div>
                  </div>
                </div>
              ))}
            </InfiniteSlider>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="bg-background my-20 relative">
          <div className="container z-10 mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true }}
              className="flex flex-col items-center justify-center max-w-[540px] mx-auto"
            >
              <div className="flex justify-center">
                <div className="border py-1 px-4 rounded-lg">Testimonials</div>
              </div>

              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tighter mt-5">
                What our users say
              </h2>
              <p className="text-center mt-5 opacity-75">
                See what our customers have to say about us.
              </p>
            </motion.div>

            <div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
              <TestimonialsColumn testimonials={firstColumn} duration={15} />
              <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
              <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-16 bg-gray-50" id="pricing">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <PricingContainer plans={pricingPlans} />
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-blue-600">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Ready to create viral TikTok content?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Join thousands of creators who are using Trendzo to analyze, remix, and track viral TikTok templates.
            </p>
            <Link
              href="/auth?signup=true"
              className="inline-block rounded-md bg-white px-6 py-3 text-base font-medium text-blue-600 shadow-sm hover:bg-blue-50"
            >
              Get Started for Free <ArrowRight className="inline ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footerdemo />
    </div>
  );
}
