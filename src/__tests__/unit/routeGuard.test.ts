describe('route guard', () => {
  it('returns true only for gallery/recipe book routes', () => {
    const guard = require('../../workflow/routeGuard')
    expect(guard.isGalleryRoute('/admin/viral-recipe-book')).toBe(true)
    expect(guard.isGalleryRoute('/admin/recipe-book')).toBe(true)
    expect(guard.isGalleryRoute('/sandbox/workflow/gallery')).toBe(true)
    expect(guard.isGalleryRoute('/admin/studio')).toBe(false)
    expect(guard.isGalleryRoute('/')).toBe(false)
    expect(guard.isGalleryRoute('')).toBe(false)
  })
})


