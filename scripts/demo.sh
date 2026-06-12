#!/usr/bin/env bash
# One-command end-to-end test: runs the keyless agent and AUTO-APPROVES on the
# Speculos simulator (swipes through the review + holds to sign), so you don't
# have to operate the emulator's touchscreen by hand. Prints the on-chain tx.
#
# Prereqs: Speculos running on :5005 (scripts/run-speculos.sh) and agent/.env set
# (cp agent/.env.amoy-demo.example agent/.env).
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SPECULOS="${SPECULOS_URL:-http://localhost:5005}"
LOG="$(mktemp)"

curl -sf -m 3 "$SPECULOS/" >/dev/null || { echo "Speculos not reachable at $SPECULOS — start scripts/run-speculos.sh"; exit 1; }

screen() { curl -sf -m 2 "$SPECULOS/events?currentscreenonly=true" 2>/dev/null \
  | python3 -c "import sys,json;print(' '.join(e['text'] for e in json.load(sys.stdin).get('events',[])))" 2>/dev/null; }
tap()   { curl -sf -m5 -XPOST "$SPECULOS/finger" -H 'Content-Type: application/json' -d "{\"action\":\"press-and-release\",\"x\":$1,\"y\":$2}" >/dev/null 2>&1; }
swipe() { curl -sf -m5 -XPOST "$SPECULOS/finger" -H 'Content-Type: application/json' -d '{"action":"press","x":430,"y":400}' >/dev/null 2>&1; sleep .3;
          curl -sf -m5 -XPOST "$SPECULOS/finger" -H 'Content-Type: application/json' -d '{"action":"release","x":50,"y":400}' >/dev/null 2>&1; }
hold()  { curl -sf -m5 -XPOST "$SPECULOS/finger" -H 'Content-Type: application/json' -d '{"action":"press","x":136,"y":430}' >/dev/null 2>&1; sleep 4;
          curl -sf -m5 -XPOST "$SPECULOS/finger" -H 'Content-Type: application/json' -d '{"action":"release","x":136,"y":430}' >/dev/null 2>&1; }

echo "▶ building agent…"
( cd "$HERE/agent" && npm run build >/dev/null 2>&1 )
echo "▶ running agent (it will assemble the claim and wait for on-device approval)…"
( cd "$HERE/agent" && node dist/index.mjs --once > "$LOG" 2>&1 ) &
AGENT=$!

echo "▶ auto-approving on the simulator…"
for _ in $(seq 1 100); do
  t="$(screen)"
  if echo "$t" | grep -q "Hold to sign"; then hold; echo "  ✔ held to sign"; break
  elif echo "$t" | grep -q "Maybe later"; then tap 367 552
  elif echo "$t" | grep -qE "Review|Claim DePIN|Interaction|RWRD|Network|Sign transaction"; then swipe; sleep .6
  fi
  sleep .4
done

wait "$AGENT" 2>/dev/null || true
echo
echo "── result ─────────────────────────────────────────────"
grep -iE "live DePIN|claimable=|DECIDE|signed on device|tx success|error:" "$LOG" | sed -E 's/\[agent [0-9T:.-]+Z\] //'
rm -f "$LOG"
