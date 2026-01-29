# Script to remove all deprecated routes and references
# Complete cleanup of all unused/test/demo routes from the codebase

# List of all routes that should NOT exist or be referenced
$deprecatedRoutes = @(
    "/analytics-demo",
    "/premium-features",
    "/analytics/sound-correlation",
    "/analytics/sound-dashboard",
    "/templates/sound-demo",
    "/sound-library/usage-stats",
    "/sounds-dashboard/test",
    "/sounds-dashboard/player",
    "/sound-library",
    "/sound-demo",
    "/sound-image-downloader",
    "/sounds-dashboard",
    "/test-dashboard",
    "/test-dashboard-simple",
    "/test-simple-charts",
    "/emergency",
    "/analytics-test",
    "/plain-test",
    "/simplest",
    "/test-lucide",
    "/image-downloader-demo",
    "/analytics/sound-dashboard-fallback",
    "/dashboard/sounds"
)

# Convert routes to directory paths
$directoriesToRemove = @()
foreach ($route in $deprecatedRoutes) {
    # Remove leading slash and convert to directory path
    $dir = $route.TrimStart('/')
    $directoriesToRemove += "src/app/$dir"
    
    # Also add without the src/app prefix
    $directoriesToRemove += $dir
}

# Add specific empty directories that might be missed by the route conversion
$directoriesToRemove += @(
    "src/app/analytics-demo",
    "src/app/sound-demo",
    "src/app/image-downloader-demo",
    "src/app/sound-image-downloader",
    "src/app/sound-library",
    "src/app/sounds"
)

# Remove duplicates
$directoriesToRemove = $directoriesToRemove | Select-Object -Unique

Write-Host "=== DEPRECATED ROUTES CLEANUP SCRIPT ===" -ForegroundColor Cyan
Write-Host "Starting removal of deprecated routes and their references..." -ForegroundColor Cyan
Write-Host

# STEP 1: Remove empty directories
Write-Host "STEP 1: Removing empty directories..." -ForegroundColor Green

foreach ($dir in $directoriesToRemove) {
    if (Test-Path $dir) {
        # Check if directory is empty
        $files = Get-ChildItem -Path $dir -File -Recurse -ErrorAction SilentlyContinue
        $subdirs = Get-ChildItem -Path $dir -Directory -Recurse -ErrorAction SilentlyContinue
        
        if (($files.Count -eq 0) -and ($subdirs.Count -eq 0)) {
            Write-Host "  Removing empty directory: $dir" -ForegroundColor Yellow
            Remove-Item -Path $dir -Force -Recurse -ErrorAction SilentlyContinue
        } else {
            Write-Host "  Directory not empty, contains files or subdirectories: $dir" -ForegroundColor Red
            Write-Host "    Files: $($files.Count), Subdirectories: $($subdirs.Count)"
        }
    } else {
        Write-Host "  Directory doesn't exist: $dir" -ForegroundColor Gray
    }
}

# STEP 2: Find route references in code
Write-Host
Write-Host "STEP 2: Finding route references in code..." -ForegroundColor Green

# Find all TS/TSX/JS files
$codeFiles = Get-ChildItem -Path "src" -Recurse -Include "*.tsx", "*.ts", "*.js", "*.jsx" -ErrorAction SilentlyContinue

$referencesFound = $false

foreach ($file in $codeFiles) {
    $content = Get-Content -Path $file.FullName -ErrorAction SilentlyContinue
    $contentString = $content -join "`n"
    $modified = $false
    
    foreach ($route in $deprecatedRoutes) {
        # Clean up the route string for regex pattern
        $searchPattern = [regex]::Escape($route)
        
        if ($contentString -match $searchPattern) {
            if (-not $modified) {
                Write-Host "  Found references in: $($file.FullName)" -ForegroundColor Yellow
                $modified = $true
                $referencesFound = $true
            }
            
            Write-Host "    - Reference to: $route" -ForegroundColor Yellow
        }
    }
}

if (-not $referencesFound) {
    Write-Host "  No explicit references to deprecated routes found in code." -ForegroundColor Green
}

# STEP 3: Find route components in Next.js app directory
Write-Host
Write-Host "STEP 3: Finding route components in Next.js app directory..." -ForegroundColor Green

$routeComponentsFound = $false

foreach ($route in $deprecatedRoutes) {
    $routePath = $route.TrimStart('/')
    $potentialPaths = @(
        "src/app/$routePath/page.tsx",
        "src/app/$routePath/page.ts",
        "src/app/$routePath/page.js",
        "src/app/$routePath/route.tsx",
        "src/app/$routePath/route.ts",
        "src/app/$routePath/route.js",
        "src/pages/$routePath.tsx",
        "src/pages/$routePath.ts",
        "src/pages/$routePath.js"
    )
    
    foreach ($path in $potentialPaths) {
        if (Test-Path $path) {
            Write-Host "  Found route component: $path" -ForegroundColor Red
            $routeComponentsFound = $true
        }
    }
}

if (-not $routeComponentsFound) {
    Write-Host "  No route components found for deprecated routes." -ForegroundColor Green
}

Write-Host
Write-Host "=== CLEANUP COMPLETE ===" -ForegroundColor Cyan
Write-Host "The script has completed. Some manual checks may still be required." -ForegroundColor Cyan
Write-Host "For a complete cleanup, check the following:" -ForegroundColor Yellow
Write-Host "  1. Sidebar navigation links in layout components" -ForegroundColor Yellow
Write-Host "  2. Route redirections in middleware.ts" -ForegroundColor Yellow
Write-Host "  3. API routes that might support these deprecated front-end routes" -ForegroundColor Yellow 