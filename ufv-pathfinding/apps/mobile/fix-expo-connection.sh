#!/bin/bash

echo "🔧 Fixing Expo 'No Usable Data' Error"
echo "====================================="

# Kill any existing processes
echo "1️⃣ Stopping existing processes..."
pkill -f "expo start" 2>/dev/null
pkill -f "react-native" 2>/dev/null
lsof -ti:8081 | xargs kill -9 2>/dev/null
lsof -ti:19000 | xargs kill -9 2>/dev/null
lsof -ti:19001 | xargs kill -9 2>/dev/null

# Clear all caches
echo "2️⃣ Clearing caches..."
rm -rf node_modules/.cache
rm -rf .expo
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*
watchman watch-del-all 2>/dev/null || true

# Get the computer's IP
IP=$(ipconfig getifaddr en0)
echo "3️⃣ Your computer's IP: $IP"

# Create expo settings
echo "4️⃣ Creating .expo directory with proper settings..."
mkdir -p .expo
cat > .expo/packager-info.json << EOF
{
  "devToolsPort": 19002,
  "expoServerPort": 19000,
  "packagerPort": 8081,
  "packagerPid": null,
  "expoServerNgrokUrl": null,
  "packagerNgrokUrl": null,
  "ngrokPid": null,
  "webpackServerPort": null
}
EOF

cat > .expo/settings.json << EOF
{
  "hostType": "lan",
  "lanType": "ip",
  "dev": true,
  "minify": false,
  "urlRandomness": null,
  "https": false,
  "scheme": null,
  "devClient": false
}
EOF

echo "5️⃣ Starting Expo with proper settings..."
echo ""
echo "📱 TO CONNECT YOUR PHONE:"
echo "========================"
echo "1. Make sure your phone is on the same WiFi as your computer"
echo "2. Open Expo Go app"
echo "3. Use one of these methods:"
echo "   a) Scan the QR code that appears"
echo "   b) Manually enter: exp://$IP:8081"
echo "   c) Shake device in Expo Go and ensure 'Host' is set to 'LAN'"
echo ""
echo "🚀 Starting Expo now..."
echo ""

# Start expo with explicit LAN configuration
EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0 npx expo start --lan --clear