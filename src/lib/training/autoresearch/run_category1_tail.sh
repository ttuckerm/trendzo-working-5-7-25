#!/usr/bin/env bash
# Runs auto-002, auto-003, auto-004 sequentially through the bridge.
# Sandbox lock forces serial execution anyway — this just orchestrates the
# hand-off so we don't need three separate bash tasks.
#
# Bash-on-Windows quirks: running `npx tsx` from Git Bash works, but each
# bridge call needs its own cwd context. We `cd` once and rely on relative
# output paths.

set -u
cd "$(dirname "$0")/../../../.."

run_bridge() {
  local id="$1"
  local hyp="$2"
  shift 2
  echo ""
  echo "================================================================================"
  echo ">>> starting ${id}: ${hyp}"
  echo ">>> extra args: $*"
  echo "================================================================================"
  rm -rf "results-autoresearch/${id}"
  mkdir -p "results-autoresearch/${id}"

  npx tsx -r dotenv/config \
    src/lib/training/autoresearch/bridge_results_to_db.ts \
    --experiment-id "${id}" \
    --hypothesis "${hyp}" \
    --output-dir "results-autoresearch/${id}" \
    "$@" \
    dotenv_config_path=.env.local
  local rc=$?
  echo ">>> ${id} exit code = ${rc}"
  if [ $rc -ne 0 ]; then
    echo ">>> ${id} FAILED — aborting queue"
    exit $rc
  fi
}

run_bridge "auto-002" \
  "Make NaN-sound signal explicit instead of implicit" \
  --drop-features "music_is_original" \
  --add-features "sound_metadata_available"

run_bridge "auto-003" \
  "Remove 952 NaN-sound rows that may be dragging model toward metadata artefact" \
  --drop-features "music_is_original" \
  --exclude-rows-where "sound_type_isnan"

run_bridge "auto-004" \
  "Zero sound information — reveals how much of 0.68 depends on sound signal" \
  --drop-features "sound_type,music_is_original"

echo ""
echo "================================================================================"
echo ">>> Category 1 queue complete"
echo "================================================================================"
