# Plan 72-03 Summary: Exemplar Library API Routes

## Objective
Create exemplar library API routes for research phase, allowing users to build a global exemplar library and link exemplars to workflows.

## Tasks Completed

### Task 1: Global Exemplar Library Endpoints
**File:** `src/app/api/workflows/exemplars/route.ts`

Created endpoints:
- **GET /api/workflows/exemplars** - List user's exemplar library
  - Supports `?platform=tiktok|youtube|instagram` filter
  - Supports `?tags=tag1,tag2` filter (comma-separated)
  - Returns array of ExemplarLibraryItem objects with count

- **POST /api/workflows/exemplars** - Add exemplar to library
  - Validates body with AddExemplarInputSchema
  - Accepts: platform, account_handle, account_name, video_url, video_title, metrics, notes, tags
  - Returns 201 with created exemplar

- **DELETE /api/workflows/exemplars?id=...** - Remove from library
  - Verifies user owns the exemplar before deletion
  - Returns 204 No Content on success

### Task 2: Workflow Exemplar Linking Endpoints
**File:** `src/app/api/workflows/[id]/exemplars/route.ts`

Created endpoints:
- **GET /api/workflows/:id/exemplars** - List exemplars linked to workflow
  - Verifies workflow ownership
  - Returns full exemplar data (joined from exemplar_library)

- **POST /api/workflows/:id/exemplars** - Link exemplar to workflow
  - Standard mode: `{ exemplar_id: string }` - links existing exemplar
  - Add-and-link mode: `{ add_and_link: true, ...exemplar_fields }` - creates new exemplar AND links
  - Returns 201 with linked exemplar, 409 if already linked

- **DELETE /api/workflows/:id/exemplars?exemplarId=...** - Unlink exemplar
  - Removes junction table entry only (keeps exemplar in library)
  - Returns 204 No Content on success

## Key Design Decisions

1. **"Both" Pattern Implementation**: Supports the decision from Phase 71 context:
   > "Exemplar Swoop: Both - save exemplars to a global library AND link to current workflow"

   The `add_and_link: true` mode in POST enables creating and linking in one API call.

2. **Ownership Verification**: All endpoints verify user owns both:
   - The workflow (for workflow-specific endpoints)
   - The exemplar (for linking operations)

3. **Auth Session Type**: Added `AuthSession` interface to handle TypeScript types until auth is migrated to Supabase.

4. **Unlink vs Delete**: DELETE on workflow exemplars only removes the link, preserving the exemplar in the global library.

## Files Modified

| File | Change |
|------|--------|
| `src/app/api/workflows/exemplars/route.ts` | Created - Global library CRUD |
| `src/app/api/workflows/[id]/exemplars/route.ts` | Created - Workflow-exemplar linking |
| `src/lib/services/workflow-db.ts` | Fixed optional input handling in createWorkflow |

## Verification

- [x] TypeScript compiles without errors in workflow routes
- [x] Global library persists across workflows (separate table)
- [x] Exemplars can be linked to multiple workflows (junction table)
- [x] User can only access their own exemplars (ownership checks)

## Commits

- `604ad11`: feat(api): create global exemplar library endpoints
- `8df3465`: (prior commit) Added workflow exemplar linking route

## Notes

The workflow exemplar linking route (`[id]/exemplars/route.ts`) was discovered to already exist from a prior plan execution (committed in 8df3465). The file content matched the specification, so Task 2 was verified rather than recreated.
