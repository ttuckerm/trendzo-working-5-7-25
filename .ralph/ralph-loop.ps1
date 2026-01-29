# Ralph Loop - Autonomous Task Execution
# Each task runs in a fresh Claude Code session to prevent context rot

param(
    [switch]$DryRun,
    [int]$MaxIterations = 50,
    [int]$DelayBetweenTasks = 5
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

# File paths
$FixPlanPath = Join-Path $ScriptDir "fix_plan.md"
$ProgressPath = Join-Path $ScriptDir "PROGRESS.md"
$PromptPath = Join-Path $ScriptDir "PROMPT.md"

function Write-Log {
    param([string]$Message, [string]$Color = "White")
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] " -NoNewline -ForegroundColor DarkGray
    Write-Host $Message -ForegroundColor $Color
}

function Get-NextIncompleteTask {
    if (-not (Test-Path $FixPlanPath)) {
        Write-Log "fix_plan.md not found at $FixPlanPath" "Red"
        return $null
    }

    $content = Get-Content $FixPlanPath -Raw
    $lines = $content -split "`n"

    $currentPhase = ""
    $currentTask = ""

    foreach ($line in $lines) {
        # Track current phase
        if ($line -match "^## Phase \d+:(.+)$") {
            $currentPhase = $Matches[1].Trim()
        }
        # Track current task
        if ($line -match "^### Task (\d+\.\d+):(.+)$") {
            $currentTask = "Task $($Matches[1]): $($Matches[2].Trim())"
        }
        # Find first incomplete item
        if ($line -match "^- \[ \](.+)$") {
            $taskDescription = $Matches[1].Trim()
            return @{
                Phase = $currentPhase
                Task = $currentTask
                Description = $taskDescription
                FullLine = $line.Trim()
            }
        }
    }

    return $null
}

function Get-CompletedTaskCount {
    if (-not (Test-Path $FixPlanPath)) { return 0 }
    $content = Get-Content $FixPlanPath -Raw
    $completed = ([regex]::Matches($content, "- \[x\]")).Count
    return $completed
}

function Get-TotalTaskCount {
    if (-not (Test-Path $FixPlanPath)) { return 0 }
    $content = Get-Content $FixPlanPath -Raw
    $total = ([regex]::Matches($content, "- \[[ x]\]")).Count
    return $total
}

function Initialize-ProgressFile {
    if (-not (Test-Path $ProgressPath)) {
        $initialContent = @"
# Ralph Progress Log

This file tracks progress and failures for the Ralph Loop.
Each session should read this first to understand what was tried before.

## Session History

"@
        Set-Content -Path $ProgressPath -Value $initialContent
        Write-Log "Created PROGRESS.md" "Green"
    }
}

function Add-ProgressEntry {
    param(
        [string]$Task,
        [string]$Status,
        [string]$Notes
    )

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $entry = @"

### $timestamp
- **Task:** $Task
- **Status:** $Status
- **Notes:** $Notes

"@
    Add-Content -Path $ProgressPath -Value $entry
}

function Build-ClaudePrompt {
    param([hashtable]$Task)

    $prompt = @"
You are Ralph, an autonomous development agent. Read these files first:
1. .ralph/PROGRESS.md - See what was tried before
2. .ralph/PROMPT.md - Understand the project context
3. .ralph/fix_plan.md - See the full plan

YOUR SINGLE TASK FOR THIS SESSION:
Phase: $($Task.Phase)
$($Task.Task)
Specific item: $($Task.Description)

RULES:
1. Work on ONLY this one task - do not proceed to other tasks
2. If successful: Mark this item complete in fix_plan.md by changing "- [ ]" to "- [x]"
3. If you encounter an error you cannot resolve: Do NOT mark it complete. Instead, document what you tried in .ralph/PROGRESS.md
4. Run the build to verify your changes compile: npm run build (or check with tsc --noEmit)
5. When done (success or failure), exit cleanly

START by reading .ralph/PROGRESS.md, then proceed with the task.
"@

    return $prompt
}

function Invoke-ClaudeSession {
    param([string]$Prompt)

    Write-Log "Starting Claude Code session..." "Cyan"

    if ($DryRun) {
        Write-Log "[DRY RUN] Would execute: claude -p `"$Prompt`"" "Yellow"
        return $true
    }

    try {
        # Change to project root directory
        Push-Location $ProjectRoot

        # Save prompt to temp file (avoids escaping issues)
        $tempPromptFile = Join-Path $env:TEMP "ralph-prompt-$(Get-Random).txt"
        Set-Content -Path $tempPromptFile -Value $Prompt -Encoding UTF8

        # Run Claude Code with -p flag for single prompt execution
        # --dangerously-skip-permissions allows autonomous file edits
        Write-Log "Executing: claude -p (prompt from file) --dangerously-skip-permissions" "DarkGray"

        $processInfo = New-Object System.Diagnostics.ProcessStartInfo
        $processInfo.FileName = "claude"
        $processInfo.Arguments = "-p `"$(Get-Content $tempPromptFile -Raw)`" --dangerously-skip-permissions"
        $processInfo.UseShellExecute = $false
        $processInfo.RedirectStandardOutput = $true
        $processInfo.RedirectStandardError = $true
        $processInfo.WorkingDirectory = $ProjectRoot

        $process = New-Object System.Diagnostics.Process
        $process.StartInfo = $processInfo
        $process.Start() | Out-Null

        # Read output
        $stdout = $process.StandardOutput.ReadToEnd()
        $stderr = $process.StandardError.ReadToEnd()
        $process.WaitForExit()

        # Clean up temp file
        Remove-Item $tempPromptFile -ErrorAction SilentlyContinue

        Pop-Location

        # Show truncated output
        if ($stdout) {
            $lines = $stdout -split "`n"
            $preview = ($lines | Select-Object -First 10) -join "`n"
            Write-Log "Output preview:" "DarkGray"
            Write-Host $preview -ForegroundColor DarkGray
            if ($lines.Count -gt 10) {
                Write-Log "... ($($lines.Count - 10) more lines)" "DarkGray"
            }
        }

        if ($process.ExitCode -eq 0) {
            Write-Log "Claude session completed successfully" "Green"
            return $true
        } else {
            Write-Log "Claude session exited with code $($process.ExitCode)" "Yellow"
            if ($stderr) { Write-Log "Error: $stderr" "Red" }
            return $false
        }
    }
    catch {
        Pop-Location
        Write-Log "Error running Claude: $_" "Red"
        return $false
    }
}

# Main Loop
function Start-RalphLoop {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "        RALPH LOOP - Starting          " -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""

    Initialize-ProgressFile

    $iteration = 0
    $consecutiveFailures = 0
    $maxConsecutiveFailures = 3

    while ($iteration -lt $MaxIterations) {
        $iteration++
        $completed = Get-CompletedTaskCount
        $total = Get-TotalTaskCount

        Write-Host ""
        Write-Log "=== Iteration $iteration of $MaxIterations ===" "Magenta"
        Write-Log "Progress: $completed / $total tasks complete" "White"

        # Get next task
        $task = Get-NextIncompleteTask

        if ($null -eq $task) {
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "   ALL TASKS COMPLETE!                 " -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green
            Write-Host ""
            Add-ProgressEntry -Task "Loop Complete" -Status "SUCCESS" -Notes "All $total tasks completed in $iteration iterations"
            return
        }

        Write-Log "Next task: $($task.Task)" "Yellow"
        Write-Log "Item: $($task.Description)" "White"

        # Build prompt and run Claude
        $prompt = Build-ClaudePrompt -Task $task
        $beforeCount = Get-CompletedTaskCount

        $success = Invoke-ClaudeSession -Prompt $prompt

        # Check if task was actually completed
        $afterCount = Get-CompletedTaskCount

        if ($afterCount -gt $beforeCount) {
            Write-Log "Task marked complete!" "Green"
            Add-ProgressEntry -Task $task.Description -Status "COMPLETED" -Notes "Marked complete in fix_plan.md"
            $consecutiveFailures = 0
        } else {
            Write-Log "Task not marked complete - may need manual intervention" "Yellow"
            Add-ProgressEntry -Task $task.Description -Status "INCOMPLETE" -Notes "Session ended but task not marked complete"
            $consecutiveFailures++

            if ($consecutiveFailures -ge $maxConsecutiveFailures) {
                Write-Log "Too many consecutive failures ($consecutiveFailures). Stopping." "Red"
                Add-ProgressEntry -Task "Loop Stopped" -Status "BLOCKED" -Notes "Stopped after $consecutiveFailures consecutive failures on: $($task.Description)"
                return
            }
        }

        # Delay between tasks
        if ($DelayBetweenTasks -gt 0) {
            Write-Log "Waiting $DelayBetweenTasks seconds before next task..." "DarkGray"
            Start-Sleep -Seconds $DelayBetweenTasks
        }
    }

    Write-Log "Reached maximum iterations ($MaxIterations)" "Yellow"
    Add-ProgressEntry -Task "Loop Limit" -Status "STOPPED" -Notes "Reached max iterations limit"
}

# Run the loop
Start-RalphLoop
