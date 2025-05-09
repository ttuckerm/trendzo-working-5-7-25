import * as React from "react";
import { cn } from "@/lib/design-utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cva, type VariantProps } from "class-variance-authority";

// Define navigation styles
const navStyles = cva("", {
  variants: {
    variant: {
      horizontal: "flex flex-row items-center",
      vertical: "flex flex-col",
      tabbed: "flex flex-row border-b border-neutral-200",
      pill: "flex flex-row p-1 bg-neutral-100 rounded-lg",
      invisible: "flex flex-row",
    },
    size: {
      sm: "gap-1 text-sm",
      md: "gap-2 text-base",
      lg: "gap-4 text-lg",
    },
    fullWidth: {
      true: "w-full",
      false: "w-auto",
    },
  },
  defaultVariants: {
    variant: "horizontal",
    size: "md",
    fullWidth: false,
  },
});

// Define navigation item styles
const navItemStyles = cva(
  "relative transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
  {
    variants: {
      variant: {
        horizontal: "px-2 py-1.5 rounded-md",
        vertical: "px-3 py-2 rounded-md",
        tabbed: "px-4 py-2 border-b-2 border-transparent -mb-px",
        pill: "px-3 py-1.5 rounded-md",
        invisible: "px-2 py-1.5",
      },
      state: {
        active: "",
        inactive: "",
      },
      fullWidth: {
        true: "w-full justify-center",
        false: "",
      },
    },
    compoundVariants: [
      {
        variant: "horizontal",
        state: "active",
        className: "text-primary-600 bg-primary-50",
      },
      {
        variant: "horizontal",
        state: "inactive",
        className: "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50",
      },
      {
        variant: "vertical",
        state: "active",
        className: "text-primary-600 bg-primary-50",
      },
      {
        variant: "vertical",
        state: "inactive",
        className: "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50",
      },
      {
        variant: "tabbed",
        state: "active",
        className: "text-primary-600 border-b-2 border-primary-500",
      },
      {
        variant: "tabbed",
        state: "inactive",
        className: "text-neutral-600 hover:text-neutral-900 hover:border-neutral-300",
      },
      {
        variant: "pill",
        state: "active",
        className: "text-primary-600 bg-white shadow-sm",
      },
      {
        variant: "pill",
        state: "inactive",
        className: "text-neutral-600 hover:text-neutral-900",
      },
      {
        variant: "invisible",
        state: "active",
        className: "text-primary-600 font-medium",
      },
      {
        variant: "invisible",
        state: "inactive",
        className: "text-neutral-600 hover:text-neutral-900",
      },
    ],
    defaultVariants: {
      variant: "horizontal",
      state: "inactive",
      fullWidth: false,
    },
  }
);

// Types for navigation variants
type NavVariant = "horizontal" | "vertical" | "tabbed" | "pill" | "invisible";

// Context to track navigation state
type NavigationContextType = {
  activeItem: string;
  recentItems: string[];
  variant: NavVariant;
  setActiveItem: (item: string) => void;
  registerVisit: (item: string) => void;
  hasVisited: (item: string) => boolean;
  getFavoriteItems: () => string[];
};

const NavigationContext = React.createContext<NavigationContextType | undefined>(
  undefined
);

export function useNavigation() {
  const context = React.useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
}

// Navigation container props
export interface NavigationProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof navStyles> {
  defaultActive?: string;
  enableRecentTracking?: boolean;
  maxRecentItems?: number;
  adaptiveDisplay?: boolean;
  children?: React.ReactNode;
}

// Navigation Container component
const NavigationComponent = React.forwardRef<HTMLElement, NavigationProps>(
  (
    {
      className,
      variant = "horizontal",
      size,
      fullWidth,
      defaultActive = "",
      enableRecentTracking = true,
      maxRecentItems = 5,
      adaptiveDisplay = true,
      children,
      ...props
    },
    ref
  ) => {
    const pathname = usePathname();
    const [activeItem, setActiveItem] = React.useState(defaultActive || pathname);
    const [recentItems, setRecentItems] = React.useState<string[]>([]);
    const [visitCounts, setVisitCounts] = React.useState<Record<string, number>>({});

    // Register a visit to a navigation item
    const registerVisit = React.useCallback(
      (item: string) => {
        if (!enableRecentTracking) return;

        // Update recent items
        setRecentItems((prev) => {
          const newRecent = prev.filter((i) => i !== item);
          return [item, ...newRecent].slice(0, maxRecentItems);
        });

        // Update visit counts
        setVisitCounts((prev) => ({
          ...prev,
          [item]: (prev[item] || 0) + 1,
        }));
      },
      [enableRecentTracking, maxRecentItems]
    );

    // Check if an item has been visited
    const hasVisited = React.useCallback(
      (item: string) => {
        return recentItems.includes(item);
      },
      [recentItems]
    );

    // Get favorite items based on visit count
    const getFavoriteItems = React.useCallback(() => {
      return Object.entries(visitCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([item]) => item)
        .slice(0, 3);
    }, [visitCounts]);

    // Update active item when pathname changes
    React.useEffect(() => {
      if (pathname !== activeItem) {
        setActiveItem(pathname);
        registerVisit(pathname);
      }
    }, [pathname, activeItem, registerVisit]);

    // Ensure variant is never null for the context
    const safeVariant = variant as NavVariant || "horizontal";

    return (
      <NavigationContext.Provider
        value={{
          activeItem,
          recentItems,
          variant: safeVariant,
          setActiveItem,
          registerVisit,
          hasVisited,
          getFavoriteItems,
        }}
      >
        <nav
          ref={ref}
          className={cn(navStyles({ variant, size, fullWidth }), className)}
          {...props}
        >
          {children}
        </nav>
      </NavigationContext.Provider>
    );
  }
);

NavigationComponent.displayName = "Navigation";

// Navigation item props
export interface NavigationItemProps
  extends Omit<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    "href" | "target" | "rel"
  > {
  href: string;
  active?: boolean;
  icon?: React.ReactNode;
  showLabel?: boolean;
  badge?: React.ReactNode;
  tooltip?: string;
}

// Navigation Item component
const NavigationItemComponent = React.forwardRef<
  HTMLAnchorElement,
  NavigationItemProps
>(
  (
    {
      className,
      href,
      active,
      icon,
      showLabel = true,
      badge,
      tooltip,
      children,
      ...props
    },
    ref
  ) => {
    const navigation = useNavigation();
    const isActive = active ?? navigation.activeItem === href;
    const hasBeenVisited = navigation.hasVisited(href);
    
    // Handle click to register the navigation
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      navigation.registerVisit(href);
      props.onClick?.(e);
    };

    return (
      <Link
        href={href}
        ref={ref}
        className={cn(
          navItemStyles({
            variant: navigation.variant,
            state: isActive ? "active" : "inactive",
            fullWidth: false,
          }),
          // Add subtle visual cue for previously visited items
          !isActive && hasBeenVisited && "after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-primary-400",
          className
        )}
        onClick={handleClick}
        title={tooltip}
        aria-current={isActive ? "page" : undefined}
        {...props}
      >
        <span className="inline-flex items-center">
          {icon && (
            <span
              className={cn(
                "inline-flex",
                showLabel && "mr-2"
              )}
            >
              {icon}
            </span>
          )}
          {showLabel && <span>{children}</span>}
          {badge && (
            <span className="ml-2">{badge}</span>
          )}
        </span>
      </Link>
    );
  }
);

NavigationItemComponent.displayName = "NavigationItem";

// Group of navigation items
export interface NavigationGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  adaptiveDisplay?: boolean;
}

const NavigationGroupComponent = React.forwardRef<
  HTMLDivElement,
  NavigationGroupProps
>(
  (
    {
      className,
      title,
      collapsible = false,
      defaultExpanded = true,
      adaptiveDisplay = true,
      children,
      ...props
    },
    ref
  ) => {
    const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
    const navigation = useNavigation();
    
    // Check if this group contains the active item
    const containsActive = React.useMemo(() => {
      // This assumes children are NavigationItems with href props
      let hasActive = false;
      
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child) && child.props.href === navigation.activeItem) {
          hasActive = true;
        }
      });
      
      return hasActive;
    }, [children, navigation.activeItem]);

    // If adaptive display is enabled and this group contains the active item, expand it
    React.useEffect(() => {
      if (adaptiveDisplay && containsActive && !isExpanded) {
        setIsExpanded(true);
      }
    }, [adaptiveDisplay, containsActive, isExpanded]);

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col",
          navigation.variant === "vertical" ? "space-y-1" : "space-x-1",
          className
        )}
        {...props}
      >
        {title && (
          <div
            className={cn(
              "flex items-center",
              collapsible && "cursor-pointer select-none"
            )}
            onClick={collapsible ? () => setIsExpanded(!isExpanded) : undefined}
          >
            {collapsible && (
              <span className="mr-1.5 text-neutral-500">
                {isExpanded ? "▼" : "▶"}
              </span>
            )}
            <span className="text-sm font-medium text-neutral-500 py-1">
              {title}
            </span>
          </div>
        )}
        <div
          className={cn(
            "flex",
            navigation.variant === "vertical" ? "flex-col space-y-1" : "flex-row space-x-1",
            collapsible && !isExpanded && "hidden"
          )}
        >
          {children}
        </div>
      </div>
    );
  }
);

NavigationGroupComponent.displayName = "NavigationGroup";

// Mobile-friendly navigation bar
export interface NavigationBarProps extends NavigationProps {
  logo?: React.ReactNode;
  actions?: React.ReactNode;
}

const NavigationBarComponent = React.forwardRef<HTMLElement, NavigationBarProps>(
  (
    {
      className,
      variant = "horizontal",
      size,
      fullWidth = true,
      logo,
      actions,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <NavigationComponent
        ref={ref}
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        className={cn(
          "px-4 h-16 border-b border-neutral-200 bg-white",
          className
        )}
        {...props}
      >
        {logo && <div className="flex-shrink-0 mr-4">{logo}</div>}
        
        <div className="hidden md:flex flex-1 items-center">
          {children}
        </div>
        
        {actions && (
          <div className="ml-auto flex items-center space-x-2">{actions}</div>
        )}
        
        <button
          className="md:hidden ml-auto p-2 text-neutral-500 hover:text-neutral-900"
          aria-label="Toggle mobile menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </NavigationComponent>
    );
  }
);

NavigationBarComponent.displayName = "NavigationBar";

// Export all components with renamed exports to avoid conflicts
export {
  NavigationComponent as Navigation,
  NavigationItemComponent as NavigationItem,
  NavigationGroupComponent as NavigationGroup,
  NavigationBarComponent as NavigationBar,
  navStyles,
  navItemStyles,
}; 