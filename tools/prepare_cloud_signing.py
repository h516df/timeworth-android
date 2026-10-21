"""Prepare one stable signing identity and seal values for GitHub Secrets.

Run only in the cloud executor. Never prints a password, key or keystore content.
The private state directory must be outside every Git working tree.
"""

import argparse
import base64
import hashlib
import json
import os
from pathlib import Path
import secrets
import shutil
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[1]
REPOSITORY = "h516df/timeworth-android"
ALIAS = "timeworth"


def private_write(path, value):
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, "w", encoding="utf-8") as stream:
        stream.write(value)


def validate_state_dir(path):
    if os.name != "posix":
        raise RuntimeError("This bootstrap is intended for the Linux cloud executor")
    if path.is_symlink():
        raise RuntimeError("Refusing a symlink as private state directory")
    path = path.resolve()
    for parent in (path, *path.parents):
        if (parent / ".git").exists():
            raise RuntimeError("Private signing state must stay outside Git working trees")
    path.mkdir(parents=True, exist_ok=True, mode=0o700)
    os.chmod(path, 0o700)
    return path


def keytool(arguments, password):
    environment = os.environ.copy()
    environment["TIMEWORTH_BOOTSTRAP_PASSWORD"] = password
    result = subprocess.run(
        ["keytool", *arguments], env=environment, capture_output=True, text=True
    )
    if result.returncode:
        # Do not forward tool output: it may contain private configuration.
        raise RuntimeError("Signing key operation failed; private output was suppressed")


def prepare(state_dir):
    if not shutil.which("keytool"):
        raise RuntimeError("keytool is required in the cloud executor")
    state_file = state_dir / "signing-state.json"
    keystore = state_dir / "timeworth-release.p12"
    certificate = state_dir / "certificate.der"
    identity_file = ROOT / "release" / "signing-identity.json"
    if state_file.exists():
        state = json.loads(state_file.read_text(encoding="utf-8"))
        os.chmod(state_file, 0o600)
        if not keystore.is_file():
            raise RuntimeError("Stored signing identity has no keystore; refusing regeneration")
    else:
        if keystore.exists() or identity_file.exists():
            raise RuntimeError("An identity already exists; refusing to replace the signing key")
        state = {"repository": REPOSITORY, "alias": ALIAS,
                 "store_password": secrets.token_urlsafe(48)}
        # Record the password before key generation so an interrupted run is recoverable.
        private_write(state_file, json.dumps(state))
        previous_umask = os.umask(0o077)
        try:
            keytool([
                "-genkeypair", "-noprompt", "-keystore", str(keystore),
                "-storetype", "PKCS12", "-alias", ALIAS,
                "-storepass:env", "TIMEWORTH_BOOTSTRAP_PASSWORD",
                "-keypass:env", "TIMEWORTH_BOOTSTRAP_PASSWORD",
                "-keyalg", "RSA", "-keysize", "3072", "-sigalg", "SHA256withRSA",
                "-validity", "10000", "-dname", "CN=TimeWorth Android,O=h516df",
            ], state["store_password"])
        finally:
            os.umask(previous_umask)
    if state.get("repository") != REPOSITORY or state.get("alias") != ALIAS:
        raise RuntimeError("Private state belongs to another project")
    os.chmod(keystore, 0o600)
    keytool([
        "-exportcert", "-keystore", str(keystore), "-alias", ALIAS,
        "-storepass:env", "TIMEWORTH_BOOTSTRAP_PASSWORD", "-file", str(certificate),
    ], state["store_password"])
    fingerprint = hashlib.sha256(certificate.read_bytes()).hexdigest()
    identity = {"schemaVersion": 1, "repository": REPOSITORY, "alias": ALIAS,
                "certificateSha256": fingerprint, "keyAlgorithm": "RSA-3072"}
    if identity_file.exists():
        if json.loads(identity_file.read_text(encoding="utf-8")) != identity:
            raise RuntimeError("Public signing identity changed; refusing replacement")
    else:
        identity_file.parent.mkdir(parents=True, exist_ok=True)
        identity_file.write_text(json.dumps(identity, indent=2) + "\n", encoding="utf-8")
    return state, keystore, identity


def seal(state_dir, state, keystore, public_key_file, output):
    from nacl.encoding import Base64Encoder
    from nacl.public import PublicKey, SealedBox

    public_key_file = public_key_file.resolve()
    public_key = json.loads(public_key_file.read_text(encoding="utf-8"))
    if public_key.get("repository") != REPOSITORY:
        raise RuntimeError("Public key response must identify the intended repository")
    box = SealedBox(PublicKey(public_key["key"], Base64Encoder))
    values = {
        "TIMEWORTH_KEYSTORE_BASE64": base64.b64encode(keystore.read_bytes()).decode("ascii"),
        "TIMEWORTH_KEYSTORE_PASSWORD": state["store_password"],
    }
    payloads = []
    for name, value in values.items():
        encrypted = base64.b64encode(box.encrypt(value.encode("utf-8"))).decode("ascii")
        payloads.append({
            "path": f"/repos/{REPOSITORY}/actions/secrets/{name}", "method": "PUT",
            "body": {"encrypted_value": encrypted, "key_id": public_key["key_id"]},
        })
    private_write(output, json.dumps({"repository": REPOSITORY, "requests": payloads}))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--state-dir", type=Path, required=True)
    parser.add_argument("--public-key-file", type=Path)
    parser.add_argument("--sealed-output", type=Path)
    args = parser.parse_args()
    if bool(args.public_key_file) != bool(args.sealed_output):
        parser.error("--public-key-file and --sealed-output are required together")
    state_dir = validate_state_dir(args.state_dir)
    state, keystore, identity = prepare(state_dir)
    if args.public_key_file:
        seal(state_dir, state, keystore, args.public_key_file, args.sealed_output)
    print(json.dumps({"repository": REPOSITORY,
                      "certificateSha256": identity["certificateSha256"],
                      "sealedPayloadsCreated": bool(args.public_key_file)}))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Stopped: {type(error).__name__}: {error}", file=sys.stderr)
        sys.exit(1)
