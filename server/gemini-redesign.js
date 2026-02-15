/**
 * Gemini CSS Redesign Script
 * Sends your current site CSS + structure to Gemini and asks it to
 * remix it in the style of the Aura Financial dark fintech template.
 * 
 * Usage: cd server && npm install @google/genai && node gemini-redesign.js
 * Requires: GEMINI_API_KEY in your .env file
 */

import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcStyles = path.join(__dirname, '..', 'src', 'styles');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Read all current CSS files
const cssFiles = ['base.css', 'navbar.css', 'home.css', 'about.css', 'contact.css', 'portfolio.css', 'footer.css'];
const currentCSS = {};
for (const file of cssFiles) {
  const filePath = path.join(srcStyles, file);
  if (fs.existsSync(filePath)) {
    currentCSS[file] = fs.readFileSync(filePath, 'utf-8');
  }
}

// Read key JSX files for structure context
const pagesDir = path.join(__dirname, '..', 'src', 'pages');
const componentsDir = path.join(__dirname, '..', 'src', 'components');
const jsxContext = {};
for (const file of ['Home.jsx', 'About.jsx', 'Contact.jsx', 'Portfolio.jsx']) {
  const filePath = path.join(pagesDir, file);
  if (fs.existsSync(filePath)) {
    jsxContext[file] = fs.readFileSync(filePath, 'utf-8');
  }
}
for (const file of ['Navbar.jsx', 'Footer.jsx']) {
  const filePath = path.join(componentsDir, file);
  if (fs.existsSync(filePath)) {
    jsxContext[file] = fs.readFileSync(filePath, 'utf-8');
  }
}

const prompt = `You are an expert frontend designer. I need you to completely redesign the CSS for a digital marketing agency website called "Three Seas Digital".

DESIGN REFERENCE — Remix it to look like the "Aura Financial" premium dark fintech template (aura-financial-paid.aura.build):
- Premium dark mode with deep blacks/navy (#0a0a1a, #0d0d1f, #111128)
- Glassmorphism cards with backdrop-filter blur, semi-transparent backgrounds (rgba white ~3-6% opacity), subtle 1px borders (rgba white ~8%)
- Vibrant gradient accents — electric purple-to-cyan, or green-to-blue neon gradients
- Gradient text on headings (white to colored gradient)
- Floating ambient glow orbs/blobs in background (CSS radial-gradients with animation)
- Smooth hover animations with glow box-shadows
- Clean modern sans-serif typography (use Outfit or Satoshi font family)
- JetBrains Mono for small badges/labels/code-like elements
- Subtle grid or dot pattern overlay on dark backgrounds
- Cards that glow on hover with colored box-shadow
- Buttons with gradient backgrounds and glow shadows
- Smooth fade-in-up entrance animations
- Top accent gradient line (1-2px) on cards on hover
- Section dividers using subtle gradient lines
- Overall: sleek, futuristic, premium SaaS / fintech aesthetic

IMPORTANT RULES:
1. Output ONLY valid CSS — no explanations, no markdown code fences, no commentary
2. Preserve ALL existing class names exactly (the JSX components won't change)
3. Every class that exists in the current CSS must still be styled
4. Keep all responsive @media queries — update their styles to match the new theme
5. Include the Google Fonts @import for Outfit and JetBrains Mono at the top of base.css
6. Use CSS custom properties (variables) in :root for the color palette
7. Include @keyframes for float, fadeInUp, shimmer, spin animations

Here are the current CSS files and the JSX structure they style:

=== CURRENT CSS FILES ===

${Object.entries(currentCSS).map(([name, content]) => `--- ${name} ---\n${content}`).join('\n\n')}

=== JSX STRUCTURE (for class name reference) ===

${Object.entries(jsxContext).map(([name, content]) => `--- ${name} ---\n${content}`).join('\n\n')}

Now generate the COMPLETE redesigned CSS. Output each file separated by a line that says exactly:
=== FILENAME: base.css ===
=== FILENAME: navbar.css ===
=== FILENAME: home.css ===
=== FILENAME: about.css ===
=== FILENAME: contact.css ===
=== FILENAME: portfolio.css ===
=== FILENAME: footer.css ===

Start with base.css. Output EVERY file completely. Do not truncate or abbreviate. Do not use placeholder comments like "/* rest stays the same */".`;

async function main() {
  console.log('🚀 Sending your site to Gemini for redesign...');
  console.log(`📦 Sending ${Object.keys(currentCSS).length} CSS files + ${Object.keys(jsxContext).length} JSX files as context`);
  console.log('⏳ This may take 30-60 seconds...\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        maxOutputTokens: 65536,
      },
    });

    const fullText = response.text;
    
    // Save the raw response for debugging
    const rawPath = path.join(__dirname, 'gemini-raw-output.txt');
    fs.writeFileSync(rawPath, fullText);
    console.log(`💾 Raw Gemini response saved to: ${rawPath}`);

    // Parse individual CSS files from the response
    const fileRegex = /===\s*FILENAME:\s*([\w.-]+)\s*===\s*\n([\s\S]*?)(?====\s*FILENAME:|$)/g;
    let match;
    let filesWritten = 0;

    while ((match = fileRegex.exec(fullText)) !== null) {
      const fileName = match[1].trim();
      let cssContent = match[2].trim();
      
      // Strip any markdown code fences if Gemini added them
      cssContent = cssContent.replace(/^```css\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

      if (cssFiles.includes(fileName)) {
        const outPath = path.join(srcStyles, fileName);
        fs.writeFileSync(outPath, cssContent);
        console.log(`✅ Written: src/styles/${fileName} (${cssContent.length} chars)`);
        filesWritten++;
      }
    }

    if (filesWritten === 0) {
      console.log('\n⚠️  Could not parse individual files. The raw output has been saved.');
      console.log('Check gemini-raw-output.txt and manually split the CSS files.');
    } else {
      console.log(`\n🎉 Done! ${filesWritten} CSS files redesigned by Gemini.`);
      console.log('Run "npm run dev" in the root to see your new design!');
    }

  } catch (err) {
    console.error('❌ Error calling Gemini:', err.message);
    if (err.message.includes('API_KEY')) {
      console.error('   Make sure GEMINI_API_KEY is set in your .env file');
    }
  }
}

main();
