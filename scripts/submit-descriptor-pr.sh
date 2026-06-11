#!/usr/bin/env bash
#
# Open the ERC-7730 registry PR that makes Clear-Claim's claim() render as
# "Claim 142.5 RWRD to 0x..." on real Ledger devices (Ledger's CAL signs
# accepted descriptors with its PKI so the on-device app trusts them).
#
# Prereqs:
#   - GitHub CLI authenticated:  gh auth login
#
# Run:  scripts/submit-descriptor-pr.sh
set -euo pipefail

UPSTREAM="ethereum/clear-signing-erc7730-registry"
BRANCH="add-clear-claim-depinrewarddistributor"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SUBMISSION="${HERE}/descriptor/registry/clear-claim/calldata-DePINRewardDistributor.json"
WORK="$(mktemp -d)"

command -v gh >/dev/null || { echo "Install GitHub CLI (gh) first."; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "Run 'gh auth login' first."; exit 1; }
[[ -f "$SUBMISSION" ]] || { echo "Missing $SUBMISSION"; exit 1; }

echo "Forking + cloning ${UPSTREAM} ..."
gh repo fork "$UPSTREAM" --clone=false >/dev/null 2>&1 || true
USER_LOGIN="$(gh api user --jq .login)"
git clone --depth 1 "https://github.com/${USER_LOGIN}/clear-signing-erc7730-registry" "$WORK" >/dev/null 2>&1

cd "$WORK"
git checkout -b "$BRANCH" >/dev/null 2>&1
mkdir -p registry/clear-claim
cp "$SUBMISSION" registry/clear-claim/calldata-DePINRewardDistributor.json
git add registry/clear-claim/calldata-DePINRewardDistributor.json
git commit -q -m "Add Clear-Claim DePINRewardDistributor calldata descriptor"
git push -u origin "$BRANCH" >/dev/null 2>&1

gh pr create --repo "$UPSTREAM" \
  --title "Add Clear-Claim DePINRewardDistributor calldata descriptor" \
  --body-file "${HERE}/descriptor/registry/PR_BODY.md"

echo "PR opened against ${UPSTREAM}."
rm -rf "$WORK"
