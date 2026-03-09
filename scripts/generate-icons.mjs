// Simple script to generate PWA icons as SVG (browsers accept SVG icons too)
// For production, replace with actual PNG icons
import { writeFileSync } from "fs";

function generateSvgIcon(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="#0f172a"/>
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle"
    fill="white" font-family="Arial, sans-serif" font-weight="bold" font-size="${size * 0.4}">
    B
  </text>
</svg>`;
}

writeFileSync("public/icons/icon-192.svg", generateSvgIcon(192));
writeFileSync("public/icons/icon-512.svg", generateSvgIcon(512));
console.log("SVG icons generated. Convert to PNG for full PWA support.");
