#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
if [[ -f .cloud/env.sh ]]; then source .cloud/env.sh; fi
python3 -m json.tool .devcontainer/devcontainer.json >/dev/null
git diff --check
java -version
python3 -m json.tool release/distribution.json >/dev/null
python3 -m json.tool release/signing-identity.json >/dev/null
echo "Planning repository: no App build or signing is claimed."
