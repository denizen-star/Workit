// Simple script to generate placeholder icons
// Run with: node scripts/generateIcons.js

const fs = require('fs');
const path = require('path');

// This is a placeholder - you should replace with actual icon generation
// For production, use a tool like sharp or canvas to generate real icons

const iconSVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#2563eb" rx="100"/>
  <text x="256" y="340" font-family="Arial, sans-serif" font-size="280" font-weight="bold" 
        text-anchor="middle" fill="white">💪</text>
</svg>
`;

const publicDir = path.join(__dirname, '..', 'public');

// Create SVG file
fs.writeFileSync(path.join(publicDir, 'icon.svg'), iconSVG.trim());

console.log('✓ Generated icon.svg');
console.log('\nTo generate PNG files, you have several options:');
console.log('\n1. Use an online converter:');
console.log('   - Go to https://svgtopng.com/');
console.log('   - Upload public/icon.svg');
console.log('   - Download at 192x192 and 512x512 sizes');
console.log('\n2. Use ImageMagick (if installed):');
console.log('   brew install imagemagick  # macOS');
console.log('   sudo apt-get install imagemagick  # Linux');
console.log('   convert public/icon.svg -resize 192x192 public/icon-192.png');
console.log('   convert public/icon.svg -resize 512x512 public/icon-512.png');
console.log('\n3. Use a design tool:');
console.log('   - Open public/icon.svg in Figma, Sketch, or Adobe XD');
console.log('   - Export as PNG at 192x192 and 512x512 sizes');
console.log('\n4. Use a PWA icon generator:');
console.log('   - https://www.pwabuilder.com/imageGenerator');
console.log('   - Upload a base image and generate all sizes');
