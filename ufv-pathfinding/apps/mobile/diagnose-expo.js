const os = require('os');
const { execSync } = require('child_process');

console.log('🔍 Expo Development Server Diagnostics\n');

// Check network interfaces
const networkInterfaces = os.networkInterfaces();
console.log('📡 Network Interfaces:');
Object.entries(networkInterfaces).forEach(([name, interfaces]) => {
  interfaces.forEach(iface => {
    if (iface.family === 'IPv4' && !iface.internal) {
      console.log(`  ${name}: ${iface.address}`);
    }
  });
});

// Check if ports are accessible
console.log('\n🔌 Port Status:');
try {
  execSync('lsof -i :8081', { stdio: 'pipe' });
  console.log('  ✅ Metro bundler (8081): Running');
} catch {
  console.log('  ❌ Metro bundler (8081): Not running');
}

try {
  execSync('lsof -i :19000', { stdio: 'pipe' });
  console.log('  ✅ Expo server (19000): Running');
} catch {
  console.log('  ❌ Expo server (19000): Not running');
}

try {
  execSync('lsof -i :19001', { stdio: 'pipe' });
  console.log('  ✅ Expo DevTools (19001): Running');
} catch {
  console.log('  ❌ Expo DevTools (19001): Not running');
}

// Check firewall status
console.log('\n🔥 Firewall Status:');
try {
  const firewallStatus = execSync('sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate', { encoding: 'utf8' });
  console.log(`  ${firewallStatus.trim()}`);
} catch {
  console.log('  Unable to check firewall status (requires sudo)');
}

// Expo configuration
console.log('\n📱 Expo Configuration:');
console.log('  To fix "no usable data" error:');
console.log('  1. Ensure your phone and computer are on the same WiFi network');
console.log('  2. Try using the LAN URL instead of scanning QR code:');
console.log(`     exp://192.168.1.24:8081`);
console.log('  3. If using Expo Go app, shake device and change "Connection" to "LAN"');
console.log('  4. Disable firewall temporarily to test:');
console.log('     sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off');
console.log('  5. Clear Expo cache on your phone:');
console.log('     - iOS: Delete and reinstall Expo Go');
console.log('     - Android: Clear app data for Expo Go');

// Check .expo directory
const fs = require('fs');
const path = require('path');
const expoDir = path.join(__dirname, '.expo');
if (fs.existsSync(expoDir)) {
  console.log('\n📂 .expo directory exists');
  const packagerInfo = path.join(expoDir, 'packager-info.json');
  if (fs.existsSync(packagerInfo)) {
    const info = JSON.parse(fs.readFileSync(packagerInfo, 'utf8'));
    console.log('  Packager info:', JSON.stringify(info, null, 2));
  }
}