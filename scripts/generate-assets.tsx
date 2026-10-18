import fs from "fs";
import path from "path";
import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import TrashTruckArtwork from "../components/TrashTruckArtwork";

async function main() {
  const imagesDir = path.join(process.cwd(), "public/images");
  fs.mkdirSync(imagesDir, { recursive: true });

  // 1. Render standalone truck SVG & PNG
  const truckSvg = renderToStaticMarkup(
    createElement(TrashTruckArtwork, { className: "w-full h-full" })
  );

  const truckPngBuffer = await sharp(Buffer.from(truckSvg))
    .resize(440, 250)
    .png({ quality: 95, compressionLevel: 9 })
    .toBuffer();

  fs.writeFileSync(path.join(imagesDir, "truck.png"), truckPngBuffer);
  console.log("✅ Generated public/images/truck.png");

  // Extract inner SVG elements of truck to embed directly into banner
  const truckInner = truckSvg
    .replace(/^<svg[^>]*>/, "")
    .replace(/<\/svg>$/, "");

  // 2. Build full Email Banner mirroring website header:
  // - Flip7 Card Game Cream Parallelogram badge with teal border
  // - "CurbDay" in bold teal (#094B48) with gold (#FFD23F) drop shadow
  // - "San Diego" in cursive coral (#EF6C4A) with gold (#FFD23F) drop shadow
  // - Trash truck illustration on the right side scaled with generous breathing room
  // - Slogan excluded for email real estate
  // Dimensions: 1040x220 (Retina 2x for 520x110 display in email)
  const bannerSvg = `
<svg width="1040" height="220" viewBox="0 0 1040 220" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Left: Flip7 Header Badge Container: cream parallelogram with teal border & soft card shadow -->
  <g transform="translate(35, 25)">
    <!-- Shadow -->
    <rect x="0" y="4" width="630" height="150" rx="28" fill="#137A74" fill-opacity="0.12" transform="skewX(-6) rotate(-2)" />
    <!-- Cream Base Card -->
    <rect x="0" y="0" width="630" height="150" rx="28" fill="#FAF7F0" stroke="#137A74" stroke-width="4" stroke-opacity="0.35" transform="skewX(-6) rotate(-2)" />
    
    <!-- Text Elements inside -->
    <g transform="translate(38, 105)">
      <!-- CurbDay with #FFD23F drop shadow -->
      <text x="3" y="3" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="64" font-weight="900" letter-spacing="-1.5" fill="#FFD23F">CurbDay</text>
      <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="64" font-weight="900" letter-spacing="-1.5" fill="#094B48">CurbDay</text>

      <!-- San Diego cursive with -3 deg tilt & #FFD23F drop shadow -->
      <g transform="translate(285, 0) rotate(-3)">
        <text x="2" y="2" font-family="'Brush Script MT', 'Snell Roundhand', 'Apple Chancery', 'Segoe Script', cursive, sans-serif" font-size="70" font-weight="normal" fill="#FFD23F">San Diego</text>
        <text x="0" y="0" font-family="'Brush Script MT', 'Snell Roundhand', 'Apple Chancery', 'Segoe Script', cursive, sans-serif" font-size="70" font-weight="normal" fill="#EF6C4A">San Diego</text>
      </g>
    </g>
  </g>

  <!-- Right: Truck illustration scaled to 0.72 with generous breathing room -->
  <g transform="translate(700, 20) scale(0.72)">
    ${truckInner}
  </g>
</svg>
`;

  const bannerPngBuffer = await sharp(Buffer.from(bannerSvg))
    .png({ quality: 95, compressionLevel: 9 })
    .toBuffer();

  fs.writeFileSync(path.join(imagesDir, "email-banner.png"), bannerPngBuffer);
  console.log("✅ Generated public/images/email-banner.png");
}

main().catch(console.error);
