## Starter Surface Lock Report

This report identifies the exact file paths for the Studio/Viral Workflow surface, its gallery header and card list components, the onboarding exit path that lands users here, and the Admin Recipe Book container to explicitly exclude.

### Router object shape used
- pathname: string (via `next/navigation` `usePathname()`)
- top-tab accessor: local state value in `src/app/admin/studio/page.tsx` named `activeTab`, with the Viral Workflow tab using the slug `"viral-workflow"`.

### Studio / Viral Workflow
- Studio page (GET `/admin/studio`):
  - `src/app/admin/studio/page.tsx`
  - Top-tab state: `const [activeTab, setActiveTab] = useState('proving-grounds')` and tab trigger sets `activeTab === 'viral-workflow'`.
- Viral Workflow embedding component used inside Studio:
  - `src/app/admin/viral-studio/page.tsx`
- Gallery container (niche chips + cards) for Viral Workflow phase:
  - `src/app/admin/viral-studio/components/phases/GalleryPhase.tsx`
    - Includes the header and category chips
    - Renders grid of cards
- Gallery header used on that tab:
  - `src/app/admin/viral-studio/components/phases/GalleryPhase.tsx` (header section within the component)
- Card list component and card component it renders:
  - Card list: internal grid within `GalleryPhase.tsx`
  - Card component: `src/components/common/VideoCard.tsx`

### Onboarding exit route that lands users here
- Onboarding completion in admin viral studio drives phase to GALLERY:
  - `src/app/admin/viral-studio/page.tsx` → `handleOnboardingComplete(...)` → `goToPhase(ViralStudioPhase.GALLERY)`

### Admin Recipe Book container (explicitly excluded)
- Admin Recipe Book main page:
  - `src/app/admin/viral-recipe-book/page.tsx`

### Guard implementation references
- Route guards:
  - `src/workflow/routeGuards.ts`
    - `isStudioViralWorkflow(pathname, activeTopTab)` returns true only for `/admin/studio` with `activeTopTab === 'viral-workflow'` and not on deny-listed paths.
    - `isAllowedStarterFlowPath(pathname)` allowlist for starter-related subpaths.
- Surface check hook (no-op, debug only):
  - `src/workflow/useStarterSurfaceCheck.ts` (called inside `GalleryPhase.tsx`)


