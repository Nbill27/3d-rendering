#!/bin/bash
# Negara Sistem Bobrok chunked render — FIXED version (2026-11-25, ~12:40 WIB).
# Root cause of the chunk-2 stalls (evidence in render-chunks.log):
#  - Frame 244 timed out twice at 123 s (Remotion --timeout=120000) while TWO
#    concurrent SwiftShader tabs fought over 1.5 shared CPUs with ~500 MB free RAM.
#    Frame 244 itself is fine: a standalone still rendered in 28 s at concurrency 1
#    (saved as check/f244-verified.png). The timeout was transient host contention,
#    not a broken frame.
#  - Later attempts died silently at 5-7/100 frames with NO error in the log
#    (process killed externally: VM restarts at 02:21 / 03:10 / 05:15 UTC, host kills),
#    losing the whole in-progress 100-frame chunk each time.
# Fixes applied here:
#  - --concurrency=1 : one Chrome tab instead of two -> half the memory, no tab
#    contention on 1.5 CPUs. (Standalone test: frame 244 in 28 s at concurrency 1.)
#  - --timeout=300000 : a slow frame gets 5 minutes instead of 2.
#  - 50-frame segments for frames 200-1799 : at most ~15 min of work is lost per
#    host kill, and a segment is far more likely to finish between VM restarts
#    (boots were ~50-125 min apart) than a 32-min 100-frame chunk.
# Chunks 0-1 (100 frames each, already done) are kept as-is and skipped.
# Final video is still exactly 1800 frames / 60 s; concat order is the segment list.
# Detached (setsid nohup) so a VM/agent restart of the exec call does not kill it.
# Progress: ~/workspace/motion-studio/projects/negara-sistem-bobrok/render-chunks.log
# Start it with:  setsid nohup bash render-chunks.sh > /dev/null 2>&1 < /dev/null &
set -u
cd ~/workspace/motion-studio/studio || exit 1
export TEMP=$HOME/workspace/remotion-tmp TMP=$HOME/workspace/remotion-tmp TMPDIR=$HOME/workspace/remotion-tmp
PROJ=~/workspace/motion-studio/projects/negara-sistem-bobrok
CHUNKDIR=$PROJ/chunks
LOG=$PROJ/render-chunks.log
mkdir -p "$CHUNKDIR" "$HOME/workspace/remotion-tmp"
echo "=== chunk render started $(date) (concurrency=1 timeout=300000, 50f segments) ===" >> "$LOG"

# segments in render/concat order: name start end
SEGMENTS=()
SEGMENTS+=("nb_c0 0 99")
SEGMENTS+=("nb_c1 100 199")
for i in $(seq 2 17); do
  a=$((i * 100))
  SEGMENTS+=("nb_c${i}a $a $((a + 49))")
  SEGMENTS+=("nb_c${i}b $((a + 50)) $((a + 99))")
done

for seg in "${SEGMENTS[@]}"; do
  set -- $seg
  name=$1; start=$2; end=$3
  frames=$((end - start + 1))
  out="$CHUNKDIR/$name.mp4"
  min_dur=$(awk "BEGIN{print $frames/30*0.9}")
  if [ -s "$out" ]; then
    # verify it is a playable mp4 with ~all frames (duration check)
    dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$out" 2>/dev/null || echo 0)
    if awk "BEGIN{exit !($dur > $min_dur)}"; then
      echo "segment $name ($start-$end) already done ($dur s), skipping $(date)" >> "$LOG"
      continue
    fi
    echo "segment $name ($start-$end) exists but looks bad ($dur s), re-rendering" >> "$LOG"
    rm -f "$out"
  fi
  echo "segment $name ($start-$end) rendering $(date)" >> "$LOG"
  ok=0
  for attempt in 1 2; do
    if npx remotion render NegaraBobrok "$out" --frames=$start-$end --concurrency=1 --timeout=300000 >> "$LOG" 2>&1; then
      ok=1
      break
    fi
    echo "segment $name attempt $attempt FAILED, retrying $(date)" >> "$LOG"
    rm -f "$out"
  done
  if [ "$ok" = 1 ]; then
    echo "segment $name DONE $(date)" >> "$LOG"
  else
    echo "segment $name FAILED twice, stopping loop $(date)" >> "$LOG"
    echo "CHUNKS_FAILED_AT=$name" >> "$LOG"
    exit 1
  fi
done

echo "=== all segments done, concat $(date) ===" >> "$LOG"
: > "$CHUNKDIR/concat.txt"
for seg in "${SEGMENTS[@]}"; do
  set -- $seg
  echo "file '$CHUNKDIR/$1.mp4'" >> "$CHUNKDIR/concat.txt"
done
ffmpeg -y -f concat -safe 0 -i "$CHUNKDIR/concat.txt" -c copy "$PROJ/negara-sistem-bobrok-video-only.mp4" >> "$LOG" 2>&1 || { echo "CONCAT FAILED" >> "$LOG"; exit 1; }

echo "=== mux audio $(date) ===" >> "$LOG"
ffmpeg -y -i "$PROJ/negara-sistem-bobrok-video-only.mp4" -i "$PROJ/audio/mix.wav" \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -shortest "$PROJ/negara-sistem-bobrok-final.mp4" >> "$LOG" 2>&1 || { echo "MUX FAILED" >> "$LOG"; exit 1; }

echo "=== verify ===" >> "$LOG"
ffprobe -v error -show_entries format=duration,size -show_entries stream=codec_name,width,height,r_frame_rate -of default=noprint_wrappers=1 "$PROJ/negara-sistem-bobrok-final.mp4" >> "$LOG" 2>&1
mkdir -p "$PROJ/final-check"
for t in 5 15 25 35 45 55; do
  ffmpeg -y -v error -ss "$t" -i "$PROJ/negara-sistem-bobrok-final.mp4" -frames:v 1 "$PROJ/final-check/final_${t}s.png"
done
echo "=== ALL DONE $(date) ===" >> "$LOG"
echo "DONE" >> "$LOG"
