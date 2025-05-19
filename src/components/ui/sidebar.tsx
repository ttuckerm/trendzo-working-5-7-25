"use client";

import React, { useState, createContext, useContext } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChevronRight, Lock } from "lucide-react";
import { SubscriptionTier } from "@/lib/contexts/SubscriptionContext";

interface LinkProps {
  label: string;
  href: string;
  icon: React.ReactNode;
  subLinks?: LinkProps[];
  className?: string;
  isActive?: boolean;
  isLocked?: boolean;
  requiredTier?: SubscriptionTier;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  hovered: boolean;
  setHovered: (hovered: boolean) => void;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: (open: boolean) => void;
  className?: string;
  defaultOpen?: boolean;
}

export const Sidebar = ({
  children,
  open: controlledOpen,
  setOpen: controlledSetOpen,
  className,
  defaultOpen = true,
}: SidebarProps) => {
  const [open, setOpen] = useState(defaultOpen);
  const [hovered, setHovered] = useState(false);

  const currentOpen = controlledOpen !== undefined ? controlledOpen : open;
  const currentSetOpen = controlledSetOpen !== undefined ? controlledSetOpen : setOpen;

  return (
    <SidebarContext.Provider
      value={{
        open: currentOpen,
        setOpen: currentSetOpen,
        hovered,
        setHovered,
      }}
    >
      <motion.div
        initial={false}
        animate={{
          width: currentOpen ? "16rem" : (hovered ? "16rem" : "4.5rem"),
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "bg-white dark:bg-neutral-900 transition-all duration-300 ease-in-out overflow-hidden border-r border-neutral-200 dark:border-neutral-700 flex flex-col relative z-50",
          className
        )}
      >
        {children}
      </motion.div>
    </SidebarContext.Provider>
  );
};

export const SidebarBody = (props: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        "flex flex-col h-full overflow-y-auto overflow-x-hidden p-2",
        props.className
      )}
    >
      {props.children}
    </div>
  );
};

interface SidebarLinkProps {
  link: LinkProps;
  className?: string;
}

export const SidebarLink = ({ link, className }: SidebarLinkProps) => {
  const { open, hovered } = useSidebar();
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);

  const hasSubLinks = link.subLinks && link.subLinks.length > 0;

  const handleToggleSubmenu = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (link.isLocked) {
      e.preventDefault();
      return;
    }
    if (hasSubLinks) {
      setIsSubmenuOpen(!isSubmenuOpen);
    }
  };

  const effectiveHref = link.isLocked ? "#" : link.href;

  return (
    <>
      <Link
        href={effectiveHref}
        onClick={handleToggleSubmenu}
        className={cn(
          "flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 transition-colors duration-200 text-sm",
          link.isActive
            ? "bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-400 font-medium"
            : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800",
          link.isLocked && "cursor-not-allowed opacity-60",
          className
        )}
      >
        <div className="flex items-center gap-3">
          <span className={cn(
            link.isActive ? (link.isLocked ? "text-neutral-400 dark:text-neutral-500" : "text-blue-600 dark:text-blue-400") : (link.isLocked ? "text-neutral-400 dark:text-neutral-500" : "text-neutral-500 dark:text-neutral-400"),
            "group-hover:text-neutral-700 dark:group-hover:text-neutral-200 transition-colors"
          )}>
             {link.icon}
          </span>
          <AnimatePresence>
            {(open || hovered) && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                className={cn(
                    "whitespace-nowrap",
                    link.isActive ? "font-medium" : "font-normal",
                    link.isLocked ? "text-neutral-500 dark:text-neutral-400" : "text-neutral-700 dark:text-neutral-200"
                )}
              >
                {link.label}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-1.5">
          {link.isLocked && (open || hovered) && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Lock size={14} className="text-neutral-400 dark:text-neutral-500" />
            </motion.span>
          )}
          {!link.isLocked && link.requiredTier && (open || hovered) && (
            <motion.span 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className={cn(
                    "ml-auto flex h-5 items-center rounded-full px-2 text-xs font-medium",
                    link.requiredTier === "premium" && "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
                    link.requiredTier === "business" && "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
            )}>
              {link.requiredTier.charAt(0).toUpperCase() + link.requiredTier.slice(1)}
            </motion.span>
          )}
          {hasSubLinks && (open || hovered) && (
            <motion.div
              initial={false}
              animate={{ rotate: isSubmenuOpen ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
            </motion.div>
          )}
        </div>
      </Link>
      {hasSubLinks && (open || hovered) && (
        <AnimatePresence>
          {isSubmenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="ml-7 pl-3 my-0.5 border-l border-neutral-300 dark:border-neutral-600 flex flex-col gap-0.5"
            >
              {link.subLinks?.map((subLink, idx) => (
                <SidebarLink key={`sub-${idx}`} link={subLink} className="text-xs py-2" />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </>
  );
};

interface SidebarNavSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  isCollapsed?: boolean;
}

export const SidebarNavSection = ({ title, children, defaultExpanded = true, isCollapsed }: SidebarNavSectionProps) => {
  const { open, hovered } = useSidebar();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const shouldShowTitle = open || hovered;

  return (
    <div className="mb-1">
      {shouldShowTitle && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
        >
          {title}
          <ChevronRight
            size={14}
            className={`transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
          />
        </button>
      )}
      <AnimatePresence initial={false}>
        {(isExpanded || !shouldShowTitle) && (
            <motion.div
                initial={{ height:  shouldShowTitle ? 0 : 'auto', opacity: shouldShowTitle ? 0 : 1 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden' }}
                transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
            >
                <ul className={cn("space-y-0.5 list-none p-0", shouldShowTitle && "pt-0.5 pb-1")}>{children}</ul>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SidebarToggleButton = () => {
  const { open, setOpen } = useSidebar();
  return (
    <button
      onClick={() => setOpen(!open)}
      className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 absolute top-4 right-0 translate-x-1/2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 shadow-md z-50"
      aria-label={open ? "Close sidebar" : "Open sidebar"}
    >
      <ChevronRight
        className={cn(
          "h-5 w-5 text-neutral-600 dark:text-neutral-300 transition-transform duration-300",
          open && "rotate-180"
        )}
      />
    </button>
  );
}; 