"""Check actual APK identity/signature and emit public metadata; no private key input."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('apk', type=Path)
parser.add_argument('--expect-release', action='store_true')
parser.add_argument('--output', type=Path)
args = parser.parse_args()
sdk = Path(os.environ.get('ANDROID_HOME') or os.environ.get('ANDROID_SDK_ROOT', ''))
tools = sorted((sdk / 'build-tools').glob('*'), key=lambda p: tuple(int(n) for n in re.findall(r'\d+', p.name)))
if not tools:
    raise SystemExit('Android build-tools not available')
tool = tools[-1]
badging = subprocess.check_output([str(tool / 'aapt'), 'dump', 'badging', str(args.apk)], text=True)
package = re.search(r"package: name='([^']+)' versionCode='(\d+)' versionName='([^']+)'", badging)
if not package:
    raise SystemExit('Missing APK package identity')
app_id, code, version = package.groups()
signing = subprocess.check_output([str(tool / 'apksigner'), 'verify', '--verbose', '--print-certs', str(args.apk)], text=True)
certs = re.findall(r'Signer #\d+ certificate SHA-256 digest: ([0-9a-f]+)', signing)
if len(certs) != 1:
    raise SystemExit('Expected exactly one verified signer')
if args.expect_release:
    expected = json.loads((ROOT / 'release/signing-identity.json').read_text())['certificateSha256']
    assert app_id == 'dev.h516.timeworth' and int(code) == 1 and version == '0.1.0', 'Wrong release identity'
    assert certs[0] == expected, 'Wrong release signing certificate'
    assert 'application-debuggable' not in badging, 'Release APK must not be debuggable'
with zipfile.ZipFile(args.apk) as apk:
    abis = sorted({p.split('/')[1] for p in apk.namelist() if re.fullmatch(r'lib/[^/]+/[^/]+\.so', p)})
    # APK product must be byte-identical to the checked source bundle.
    for source in (ROOT / 'ui-preview/dist').rglob('*'):
        if source.is_file():
            name = 'assets/product/' + source.relative_to(ROOT / 'ui-preview/dist').as_posix()
            assert apk.read(name) == source.read_bytes(), 'Bundled source differs: ' + name
result = {'applicationId': app_id, 'versionCode': int(code), 'versionName': version,
          'minSdk': int(re.search(r"sdkVersion:'(\d+)'", badging).group(1)), 'abis': abis,
          'signingCertificateSha256': certs[0], 'size': args.apk.stat().st_size,
          'sha256': hashlib.sha256(args.apk.read_bytes()).hexdigest(),
          'productAssetsMatchSource': True, 'debuggable': 'application-debuggable' in badging}
if args.output:
    args.output.write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result, indent=2))
