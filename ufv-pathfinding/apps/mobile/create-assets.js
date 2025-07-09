const fs = require('fs');
const path = require('path');

// Create a simple 1x1 transparent PNG as placeholder
const transparentPNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

const assetsDir = path.join(__dirname, 'assets');

// Ensure assets directory exists
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Create required asset files
const assets = ['icon.png', 'splash.png', 'adaptive-icon.png'];

assets.forEach(asset => {
  const assetPath = path.join(assetsDir, asset);
  if (!fs.existsSync(assetPath)) {
    fs.writeFileSync(assetPath, transparentPNG);
    console.log(`Created ${asset}`);
  }
});

console.log('✅ All placeholder assets created');