#!/usr/bin/env bash
#
# Run the Ledger Speculos emulator with the Ethereum app, exposing the HTTP API
# on :5000 (consumed by the DMK Speculos transport) and the web UI on :5001.
#
# Speculos does NOT ship Ledger app binaries. You must provide the Ethereum app
# .elf for your target device model. Get one by either:
#   * building it with Ledger's app-builder:
#       https://github.com/LedgerHQ/app-ethereum  +  ledger-app-builder
#   * or copying an elf from a Ledger app release.
# Place it at:   scripts/apps/ethereum-<model>.elf
#
# Usage:
#   scripts/run-speculos.sh                # defaults: model=flex
#   DEVICE_MODEL=nanox scripts/run-speculos.sh
#
# The default Speculos seed is the well-known test mnemonic. After it boots, run
# `npm run whoami` in agent/ to print the operator address at 44'/60'/0'/0/0 and
# put that in agent/.env as OPERATOR_ADDRESS (and the contracts deploy).
set -euo pipefail

DEVICE_MODEL="${DEVICE_MODEL:-flex}"
API_PORT="${API_PORT:-5000}"
IMAGE="${SPECULOS_IMAGE:-ghcr.io/ledgerhq/speculos:latest}"
SEED="${SPECULOS_SEED:-glory promote mansion idle axis finger extend february uncover one trip resource lawn turtle enact monster seven myth punch hobby comfort wild raw hat}"

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APPS_DIR="${HERE}/apps"
APP_ELF="${APPS_DIR}/ethereum-${DEVICE_MODEL}.elf"

if [[ ! -f "${APP_ELF}" ]]; then
  echo "ERROR: missing app binary: ${APP_ELF}" >&2
  echo "Provide the Ethereum app .elf for model '${DEVICE_MODEL}' (see header of this script)." >&2
  exit 1
fi

echo "Pulling ${IMAGE} ..."
docker pull "${IMAGE}" >/dev/null

echo "Starting Speculos: model=${DEVICE_MODEL} api+web=:${API_PORT}"
echo "Web UI / API -> http://localhost:${API_PORT}"
exec docker run --rm -it \
  -v "${APPS_DIR}:/apps" \
  -p "${API_PORT}:5000" \
  "${IMAGE}" \
  "/apps/ethereum-${DEVICE_MODEL}.elf" \
  --model "${DEVICE_MODEL}" \
  --seed "${SEED}" \
  --display headless \
  --api-port 5000
