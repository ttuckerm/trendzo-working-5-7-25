# Script to remove empty directories that are no longer used
# Particularly focuses on demo and sound-related directories

$emptyDirs = @(
    "src/app/analytics-demo",
    "src/app/sound-demo",
    "src/app/image-downloader-demo",
    "src/app/sound-image-downloader",
    "src/app/sound-library",
    "src/app/sounds"
)

Write-Host "Starting cleanup of empty directories..." -ForegroundColor Cyan

foreach ($dir in $emptyDirs) {
    if (Test-Path $dir) {
        # Check if directory is empty
        $files = Get-ChildItem -Path $dir -Recurse -File
        if ($files.Count -eq 0) {
            Write-Host "Removing empty directory: $dir" -ForegroundColor Yellow
            Remove-Item -Path $dir -Recurse -Force
        } else {
            Write-Host "Directory not empty, skipping: $dir" -ForegroundColor Red
            Write-Host "Contains $($files.Count) files"
        }
    } else {
        Write-Host "Directory doesn't exist: $dir" -ForegroundColor Gray
    }
}

# Also remove references from route files
$routeFiles = Get-ChildItem -Path "src" -Recurse -Include "*.tsx","*.ts" | Where-Object { $_.FullName -like "*route*" }

foreach ($file in $routeFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    $modified = $false
    
    foreach ($dir in $emptyDirs) {
        $dirName = Split-Path $dir -Leaf
        if ($content -match $dirName) {
            Write-Host "Found reference to $dirName in $($file.FullName)" -ForegroundColor Yellow
            $modified = $true
        }
    }
    
    if ($modified) {
        Write-Host "Route file may need manual inspection: $($file.FullName)" -ForegroundColor Magenta
    }
}

Write-Host "Cleanup complete!" -ForegroundColor Green 