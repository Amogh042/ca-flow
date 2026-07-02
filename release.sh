#!/bin/bash
set -e

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "Usage: ./release.sh 0.1.4"
  exit 1
fi

echo "🚀 Releasing version $VERSION"

# Update version in config
python3 -c "
import json
data = json.load(open('src-tauri/tauri.conf.json'))
data['version'] = '$VERSION'
json.dump(data, open('src-tauri/tauri.conf.json', 'w'), indent=2)
"

echo "✅ Version updated to $VERSION"
echo "🔨 Building app (you'll be asked for your signing password)..."

export TAURI_SIGNING_PRIVATE_KEY=$(cat ~/.tauri/ca-flow.key)
npx tauri build

echo "✅ Build complete"

SIG=$(cat src-tauri/target/release/bundle/macos/CA-flow.app.tar.gz.sig)

cat > latest.json << JSON
{
  "version": "$VERSION",
  "notes": "New release",
  "pub_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "platforms": {
    "darwin-aarch64": {
      "signature": "$SIG",
      "url": "https://github.com/Amogh042/calcos-workspace/releases/download/v$VERSION/CA-flow.app.tar.gz"
    }
  }
}
JSON

echo "✅ latest.json created"

git add -A
git commit -m "release: v$VERSION"
git push origin main

echo "✅ Pushed to GitHub"
echo ""
echo "📦 Now go to this URL and manually create the release:"
echo "https://github.com/Amogh042/calcos-workspace/releases/new"
echo ""
echo "Tag: v$VERSION"
echo "Upload these 4 files:"
echo "  - src-tauri/target/release/bundle/dmg/CA-flow_${VERSION}_aarch64.dmg"
echo "  - src-tauri/target/release/bundle/macos/CA-flow.app.tar.gz"
echo "  - src-tauri/target/release/bundle/macos/CA-flow.app.tar.gz.sig"
echo "  - latest.json"
