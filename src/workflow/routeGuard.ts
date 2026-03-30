// Guard for Gallery/Recipe Book route context only.
// Use pathname strings from Next.js router, which look like "/admin/viral-recipe-book" etc.

export function isGalleryRoute(pathname: string): boolean {
  if (!pathname) return false;
  // Only true for the Gallery/Recipe Book views
  // Current gallery route lives at /admin/viral-recipe-book and the sandbox workflow gallery
  const normalized = pathname.split('?')[0];
  return normalized === '/admin/viral-recipe-book' || normalized === '/app/admin/viral-recipe-book' || normalized === '/app/admin/recipe-book' || normalized === '/admin/recipe-book' || normalized === '/sandbox/workflow/gallery' || normalized === '/app/sandbox/workflow/gallery';
}


