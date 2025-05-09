import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const Pagination = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <nav
    className={`mx-auto flex w-full justify-center ${className || ""}`}
    {...props}
  />
)
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={`flex flex-row items-center gap-1 ${className || ""}`}
    {...props}
  />
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li ref={ref} className={`${className || ""}`} {...props} />
))
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
  isActive?: boolean
} & React.AnchorHTMLAttributes<HTMLAnchorElement>

const PaginationLink = ({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps & {
  size?: "default" | "sm" | "lg" | "icon"
}) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={`flex h-9 items-center justify-center rounded-md border px-3 text-sm ${
      isActive
        ? "bg-primary border-primary text-primary-foreground pointer-events-none"
        : "bg-white hover:text-accent-foreground hover:bg-accent"
    } ${className || ""}`}
    {...props}
  />
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = ({
  className,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <a
    aria-label="Go to previous page"
    className={`flex h-9 items-center justify-center rounded-md border border-input bg-white px-3 text-sm ${className || ""}`}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span className="sr-only">Previous</span>
  </a>
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = ({
  className,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <a
    aria-label="Go to next page"
    className={`flex h-9 items-center justify-center rounded-md border border-input bg-white px-3 text-sm ${className || ""}`}
    {...props}
  >
    <span className="sr-only">Next</span>
    <ChevronRight className="h-4 w-4" />
  </a>
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    aria-hidden
    className={`flex h-9 items-center justify-center text-sm ${className || ""}`}
    {...props}
  >
    <span className="mx-1">...</span>
    <span className="sr-only">More pages</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} 