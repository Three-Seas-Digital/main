import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { getGradientColors, TIER_CONFIG } from './tubeConfig';

interface TemplateItem {
  id: number | string;
  name: string;
  tier?: string;
  category?: string;
  color?: string;
  image?: string;
  [key: string]: unknown;
}

const TEX_W = 512;
const TEX_H = 384;

// ── Helpers ──────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawTierBadge(ctx: CanvasRenderingContext2D, template: TemplateItem): void {
  const tier = TIER_CONFIG[template.tier];
  if (!tier) return;
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  const metrics = ctx.measureText(tier.label);
  const bw = metrics.width + 14;
  const bh = 20;
  const bx = TEX_W - bw - 10;
  const by = 10;
  ctx.shadowBlur = 0;
  ctx.fillStyle = tier.bgColor;
  roundRect(ctx, bx, by, bw, bh, 4);
  ctx.fill();
  ctx.fillStyle = tier.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(tier.label, bx + bw / 2, by + bh / 2);
}

function drawNameplate(ctx: CanvasRenderingContext2D, name: string, cat: string, accent: string): void {
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 6;
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText(name, 16, TEX_H - 30);
  ctx.font = '12px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = accent;
  ctx.fillText(cat, 16, TEX_H - 14);
  ctx.shadowBlur = 0;
}

// ── Template-specific renderers ──────────────────────

// ID 6: Nova Dashboard — sidebar + stat cards + chart
function drawNovaDashboard(ctx: CanvasRenderingContext2D, c: string): void {
  ctx.fillStyle = '#0c1929';
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  // Sidebar
  ctx.fillStyle = '#0f2240';
  ctx.fillRect(0, 0, 80, TEX_H);
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i === 1 ? hexToRgba(c, 0.3) : 'rgba(255,255,255,0.06)';
    roundRect(ctx, 12, 50 + i * 36, 56, 26, 6);
    ctx.fill();
  }
  ctx.fillStyle = c;
  roundRect(ctx, 16, 56, 8, 14, 2); ctx.fill();
  // Stat cards
  const cardColors = [c, '#8b5cf6', '#f59e0b', '#10b981'];
  for (let i = 0; i < 4; i++) {
    const cx = 96 + i * 104;
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    roundRect(ctx, cx, 30, 94, 60, 8); ctx.fill();
    ctx.fillStyle = cardColors[i];
    ctx.font = 'bold 18px system-ui';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(['2.4K', '$18K', '94%', '156'][i], cx + 12, 42);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '9px system-ui';
    ctx.fillText(['Users', 'Revenue', 'Uptime', 'Orders'][i], cx + 12, 66);
  }
  // Area chart
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  roundRect(ctx, 96, 106, 404, 160, 8); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(110, 240);
  const pts = [240, 220, 200, 230, 180, 160, 190, 150, 130, 145, 120, 140];
  pts.forEach((y, i) => ctx.lineTo(110 + i * 32, y));
  ctx.lineTo(110 + (pts.length - 1) * 32, 260);
  ctx.lineTo(110, 260);
  ctx.closePath();
  ctx.fillStyle = hexToRgba(c, 0.15);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(110, pts[0]);
  pts.forEach((y, i) => ctx.lineTo(110 + i * 32, y));
  ctx.strokeStyle = c;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Mini table rows
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent';
    ctx.fillRect(96, 278 + i * 24, 404, 24);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    roundRect(ctx, 110, 284 + i * 24, 60, 10, 3); ctx.fill();
    roundRect(ctx, 200, 284 + i * 24, 80, 10, 3); ctx.fill();
    ctx.fillStyle = hexToRgba(c, 0.3);
    roundRect(ctx, 420, 284 + i * 24, 40, 10, 3); ctx.fill();
  }
}

// ID 7: SaaS Launch — hero text + pricing cards
function drawSaaSLaunch(ctx: CanvasRenderingContext2D, c: string): void {
  const grad = ctx.createLinearGradient(0, 0, 0, TEX_H);
  grad.addColorStop(0, '#0f0a2a');
  grad.addColorStop(1, '#1a0e3e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  // Glow blob
  const grd = ctx.createRadialGradient(TEX_W / 2, 80, 20, TEX_W / 2, 80, 200);
  grd.addColorStop(0, hexToRgba(c, 0.2));
  grd.addColorStop(1, 'transparent');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  // Hero text
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 28px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('Ship Faster', TEX_W / 2, 70);
  ctx.fillStyle = c;
  ctx.fillText('Scale Smarter', TEX_W / 2, 102);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '11px system-ui';
  ctx.fillText('The all-in-one platform for modern SaaS teams', TEX_W / 2, 128);
  // CTA button
  ctx.fillStyle = c;
  roundRect(ctx, TEX_W / 2 - 50, 142, 100, 28, 6); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px system-ui';
  ctx.fillText('Get Started', TEX_W / 2, 156);
  // 3 pricing cards
  const tiers = ['Starter', 'Pro', 'Enterprise'];
  const prices = ['$29', '$79', '$199'];
  for (let i = 0; i < 3; i++) {
    const cx = 60 + i * 150;
    const isPro = i === 1;
    ctx.fillStyle = isPro ? hexToRgba(c, 0.12) : 'rgba(255,255,255,0.04)';
    ctx.strokeStyle = isPro ? hexToRgba(c, 0.4) : 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    roundRect(ctx, cx, 190, 130, 170, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = isPro ? c : 'rgba(255,255,255,0.5)';
    ctx.font = 'bold 11px system-ui';
    ctx.fillText(tiers[i], cx + 65, 214);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px system-ui';
    ctx.fillText(prices[i], cx + 65, 248);
    // Feature lines
    for (let j = 0; j < 4; j++) {
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      roundRect(ctx, cx + 16, 268 + j * 18, 98, 8, 3); ctx.fill();
    }
    // Button
    ctx.fillStyle = isPro ? c : 'rgba(255,255,255,0.08)';
    roundRect(ctx, cx + 16, 340, 98, 12, 4); ctx.fill();
  }
}

// ID 8: Medical Plus — clean healthcare look
function drawMedicalPlus(ctx: CanvasRenderingContext2D, c: string): void {
  ctx.fillStyle = '#f0fdf4';
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  // Green header bar
  ctx.fillStyle = c;
  ctx.fillRect(0, 0, TEX_W, 50);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px system-ui';
  ctx.textAlign = 'left';
  ctx.fillText('Medical+', 20, 30);
  // Nav links
  ctx.font = '10px system-ui';
  ctx.textAlign = 'right';
  ctx.fillText('Services    Doctors    Book Now', TEX_W - 20, 30);
  // Hero
  ctx.fillStyle = '#065f46';
  ctx.font = 'bold 22px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('Your Health, Our Priority', TEX_W / 2, 90);
  ctx.fillStyle = '#6b7280';
  ctx.font = '10px system-ui';
  ctx.fillText('Compassionate care backed by cutting-edge technology', TEX_W / 2, 110);
  // Book button
  ctx.fillStyle = c;
  roundRect(ctx, TEX_W / 2 - 50, 120, 100, 24, 6); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px system-ui';
  ctx.fillText('Book Appointment', TEX_W / 2, 133);
  // Doctor cards
  for (let i = 0; i < 3; i++) {
    const cx = 40 + i * 158;
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(0,0,0,0.06)';
    ctx.shadowBlur = 8;
    roundRect(ctx, cx, 160, 138, 110, 10); ctx.fill();
    ctx.shadowBlur = 0;
    // Avatar circle
    ctx.fillStyle = hexToRgba(c, 0.15);
    ctx.beginPath();
    ctx.arc(cx + 69, 192, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c;
    ctx.font = 'bold 14px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(['SC', 'JW', 'KP'][i], cx + 69, 196);
    // Name
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 11px system-ui';
    ctx.fillText(['Dr. Chen', 'Dr. Webb', 'Dr. Patel'][i], cx + 69, 226);
    ctx.fillStyle = c;
    ctx.font = '9px system-ui';
    ctx.fillText(['Cardiology', 'Neurology', 'Pediatrics'][i], cx + 69, 240);
    // Stars
    ctx.fillStyle = '#fbbf24';
    ctx.font = '10px system-ui';
    ctx.fillText('★★★★★', cx + 69, 258);
  }
  // Heart pulse line
  ctx.beginPath();
  ctx.moveTo(40, 300);
  ctx.lineTo(120, 300); ctx.lineTo(140, 285); ctx.lineTo(155, 320);
  ctx.lineTo(170, 280); ctx.lineTo(185, 310); ctx.lineTo(200, 300);
  ctx.lineTo(472, 300);
  ctx.strokeStyle = hexToRgba(c, 0.3);
  ctx.lineWidth = 2;
  ctx.stroke();
  // Stats bar
  ctx.fillStyle = hexToRgba(c, 0.06);
  roundRect(ctx, 40, 320, 432, 40, 8); ctx.fill();
  const stats = ['15K+ Patients', '50+ Doctors', '98% Satisfaction'];
  stats.forEach((s, i) => {
    ctx.fillStyle = i === 0 ? c : '#374151';
    ctx.font = i === 0 ? 'bold 11px system-ui' : '10px system-ui';
    ctx.fillText(s, 120 + i * 150, 344);
  });
}

// ID 9: Tech Startup — bold hero + features
function drawTechStartup(ctx: CanvasRenderingContext2D, c: string): void {
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  // Wireframe sphere hint
  ctx.strokeStyle = hexToRgba(c, 0.08);
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.ellipse(400, 120, 80, 80, 0, 0, Math.PI * 2);
    ctx.stroke();
    const rx = Math.abs(80 * Math.cos(i * 0.4));
    if (rx > 0.5) {
      ctx.beginPath();
      ctx.ellipse(400, 120, rx, 80, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  // Hero
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 30px system-ui';
  ctx.textAlign = 'left';
  ctx.fillText('Build the', 30, 80);
  ctx.fillStyle = c;
  ctx.fillText('Future', 30, 114);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '11px system-ui';
  ctx.fillText('Next-gen infrastructure for ambitious teams', 30, 140);
  // CTA buttons
  ctx.fillStyle = c;
  roundRect(ctx, 30, 158, 90, 26, 6); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('Launch Now', 75, 172);
  ctx.strokeStyle = hexToRgba(c, 0.4);
  ctx.lineWidth = 1;
  roundRect(ctx, 130, 158, 80, 26, 6); ctx.stroke();
  ctx.fillStyle = c;
  ctx.fillText('Demo →', 170, 172);
  // Feature cards
  ctx.textAlign = 'left';
  const feats = [
    { icon: '⚡', title: 'Blazing Fast', desc: 'Sub-ms response' },
    { icon: '🔒', title: 'Secure', desc: 'SOC2 compliant' },
    { icon: '📈', title: 'Scalable', desc: 'Auto-scaling infra' },
    { icon: '🔧', title: 'Developer DX', desc: 'API-first design' },
  ];
  feats.forEach((f, i) => {
    const fx = 30 + (i % 2) * 235;
    const fy = 210 + Math.floor(i / 2) * 78;
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    roundRect(ctx, fx, fy, 215, 66, 8); ctx.fill(); ctx.stroke();
    ctx.font = '20px system-ui';
    ctx.fillStyle = '#fff';
    ctx.fillText(f.icon, fx + 14, fy + 30);
    ctx.font = 'bold 12px system-ui';
    ctx.fillStyle = '#fff';
    ctx.fillText(f.title, fx + 44, fy + 26);
    ctx.font = '9px system-ui';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText(f.desc, fx + 44, fy + 44);
  });
}

// ID 10: Finance Pro — financial dashboard
function drawFinancePro(ctx: CanvasRenderingContext2D, c: string): void {
  ctx.fillStyle = '#030d1a';
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  // Sidebar
  ctx.fillStyle = '#071426';
  ctx.fillRect(0, 0, 70, TEX_H);
  ctx.fillStyle = c;
  ctx.font = 'bold 14px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('FP', 35, 30);
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i === 0 ? hexToRgba(c, 0.15) : 'rgba(255,255,255,0.04)';
    roundRect(ctx, 12, 52 + i * 32, 46, 22, 5); ctx.fill();
  }
  // Revenue card
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  roundRect(ctx, 84, 20, 200, 80, 8); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '9px system-ui';
  ctx.textAlign = 'left';
  ctx.fillText('Total Revenue', 100, 40);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px system-ui';
  ctx.fillText('$142,580', 100, 68);
  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 9px system-ui';
  ctx.fillText('+12.4%', 210, 68);
  // Expense card
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  roundRect(ctx, 296, 20, 200, 80, 8); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '9px system-ui';
  ctx.fillText('Expenses', 312, 40);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px system-ui';
  ctx.fillText('$48,230', 312, 68);
  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 9px system-ui';
  ctx.fillText('+3.2%', 420, 68);
  // Bar chart
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  roundRect(ctx, 84, 114, 412, 140, 8); ctx.fill();
  const barHeights = [60, 85, 70, 95, 80, 110, 75, 100, 65, 90, 105, 88];
  barHeights.forEach((h, i) => {
    const bx = 108 + i * 32;
    ctx.fillStyle = hexToRgba(c, 0.6);
    roundRect(ctx, bx, 240 - h, 12, h, 3); ctx.fill();
    ctx.fillStyle = hexToRgba('#10b981', 0.4);
    roundRect(ctx, bx + 14, 240 - h * 0.4, 8, h * 0.4, 3); ctx.fill();
  });
  // Mini invoice table
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  roundRect(ctx, 84, 268, 412, 100, 8); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = 'bold 10px system-ui';
  ctx.fillText('Recent Invoices', 100, 288);
  for (let i = 0; i < 3; i++) {
    const ry = 300 + i * 20;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    roundRect(ctx, 100, ry, 70, 10, 3); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    roundRect(ctx, 200, ry, 100, 10, 3); ctx.fill();
    ctx.fillStyle = hexToRgba(c, 0.25);
    roundRect(ctx, 420, ry, 50, 10, 3); ctx.fill();
  }
}

// ID 11: Event Launch — countdown + schedule
function drawEventLaunch(ctx: CanvasRenderingContext2D, c: string): void {
  const grad = ctx.createLinearGradient(0, 0, 0, TEX_H);
  grad.addColorStop(0, '#1a0800');
  grad.addColorStop(1, '#0a0400');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  // Stage light circles
  [{ x: 100, r: 120 }, { x: 300, r: 100 }, { x: 450, r: 90 }].forEach(l => {
    const grd = ctx.createRadialGradient(l.x, 0, 0, l.x, 0, l.r);
    grd.addColorStop(0, hexToRgba(c, 0.12));
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, TEX_W, TEX_H);
  });
  // Event title
  ctx.fillStyle = c;
  ctx.font = 'bold 10px system-ui';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '4px';
  ctx.fillText('TECH SUMMIT 2026', TEX_W / 2, 40);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 28px system-ui';
  ctx.fillText('The Future of AI', TEX_W / 2, 76);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '10px system-ui';
  ctx.fillText('June 15-17, 2026 • San Francisco', TEX_W / 2, 100);
  // Countdown boxes
  const units = ['DAYS', 'HRS', 'MIN', 'SEC'];
  const vals = ['42', '08', '23', '51'];
  units.forEach((u, i) => {
    const cx = 136 + i * 72;
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.strokeStyle = hexToRgba(c, 0.2);
    ctx.lineWidth = 1;
    roundRect(ctx, cx, 118, 56, 56, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px system-ui';
    ctx.fillText(vals[i], cx + 28, 146);
    ctx.fillStyle = hexToRgba(c, 0.6);
    ctx.font = 'bold 7px system-ui';
    ctx.fillText(u, cx + 28, 164);
  });
  // Speaker circles
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = 'bold 10px system-ui';
  ctx.fillText('Featured Speakers', TEX_W / 2, 200);
  const speakers = ['JD', 'AK', 'SR', 'MP'];
  speakers.forEach((s, i) => {
    const sx = 160 + i * 60;
    ctx.fillStyle = hexToRgba(c, 0.15);
    ctx.beginPath();
    ctx.arc(sx, 228, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c;
    ctx.font = 'bold 11px system-ui';
    ctx.fillText(s, sx, 232);
  });
  // Schedule rows
  const sched = ['9:00 AM  •  Opening Keynote', '11:00 AM  •  AI Workshop', '2:00 PM  •  Panel Discussion'];
  sched.forEach((s, i) => {
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    roundRect(ctx, 60, 264 + i * 30, 392, 24, 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '10px system-ui';
    ctx.fillText(s, TEX_W / 2, 280 + i * 30);
  });
  // Ticket CTA
  ctx.fillStyle = c;
  roundRect(ctx, TEX_W / 2 - 55, 350, 110, 24, 6); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px system-ui';
  ctx.fillText('Get Tickets →', TEX_W / 2, 363);
}

// ID 12: App Promo — phone mockup
function drawAppPromo(ctx: CanvasRenderingContext2D, c: string): void {
  ctx.fillStyle = '#050520';
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  // Glow
  const grd = ctx.createRadialGradient(TEX_W / 2, TEX_H / 2, 40, TEX_W / 2, TEX_H / 2, 250);
  grd.addColorStop(0, hexToRgba(c, 0.1));
  grd.addColorStop(1, 'transparent');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  // Left text
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px system-ui';
  ctx.textAlign = 'left';
  ctx.fillText('Your App,', 30, 100);
  ctx.fillStyle = c;
  ctx.fillText('Perfected.', 30, 130);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '10px system-ui';
  ctx.fillText('Beautiful mobile experience', 30, 155);
  ctx.fillText('your users will love.', 30, 170);
  // Download buttons
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  roundRect(ctx, 30, 192, 90, 24, 6); ctx.fill();
  roundRect(ctx, 128, 192, 90, 24, 6); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 9px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('App Store', 75, 206);
  ctx.fillText('Google Play', 173, 206);
  // Phone mockup (right side)
  const px = 310, py = 30, pw = 160, ph = 310;
  ctx.fillStyle = '#1a1a2e';
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 2;
  roundRect(ctx, px, py, pw, ph, 20); ctx.fill(); ctx.stroke();
  // Notch
  ctx.fillStyle = '#0a0a1a';
  roundRect(ctx, px + 50, py + 6, 60, 14, 7); ctx.fill();
  // App header
  ctx.fillStyle = c;
  ctx.fillRect(px + 8, py + 28, pw - 16, 30);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px system-ui';
  ctx.fillText('Dashboard', px + pw / 2, py + 46);
  // Mini stat cards in phone
  for (let i = 0; i < 2; i++) {
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    roundRect(ctx, px + 12 + i * 70, py + 68, 62, 40, 6); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px system-ui';
    ctx.fillText(i === 0 ? '847' : '$2.4K', px + 43 + i * 70, py + 88);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '7px system-ui';
    ctx.fillText(i === 0 ? 'Users' : 'Revenue', px + 43 + i * 70, py + 100);
  }
  // Activity list in phone
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    roundRect(ctx, px + 12, py + 120 + i * 30, pw - 24, 24, 5); ctx.fill();
    ctx.fillStyle = hexToRgba(c, 0.3);
    ctx.beginPath();
    ctx.arc(px + 24, py + 132 + i * 30, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    roundRect(ctx, px + 36, py + 128 + i * 30, 80, 8, 3); ctx.fill();
  }
  // Tab bar
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.fillRect(px + 8, py + ph - 36, pw - 16, 26);
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i === 0 ? c : 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.arc(px + 36 + i * 32, py + ph - 22, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  // Floating badges
  ctx.fillStyle = hexToRgba(c, 0.08);
  ctx.strokeStyle = hexToRgba(c, 0.15);
  roundRect(ctx, 30, 250, 100, 36, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('4.9 ★', 80, 272);
  ctx.fillStyle = hexToRgba(c, 0.08);
  roundRect(ctx, 160, 270, 110, 36, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px system-ui';
  ctx.fillText('50K+ Downloads', 215, 292);
}

// ID 13: Startup Pitch — metrics + growth
function drawStartupPitch(ctx: CanvasRenderingContext2D, c: string): void {
  ctx.fillStyle = '#040d0b';
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  // Hero
  ctx.fillStyle = c;
  ctx.font = 'bold 10px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('SERIES A READY', TEX_W / 2, 30);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 26px system-ui';
  ctx.fillText('Redefining the', TEX_W / 2, 62);
  ctx.fillStyle = c;
  ctx.fillText('$42B Market', TEX_W / 2, 92);
  // Metric boxes
  const metrics = [
    { val: '3.2M', label: 'Users', pct: '+280%' },
    { val: '$8.4M', label: 'ARR', pct: '+142%' },
    { val: '94%', label: 'Retention', pct: '+12%' },
    { val: '2.1x', label: 'LTV/CAC', pct: '+38%' },
  ];
  metrics.forEach((m, i) => {
    const mx = 30 + i * 122;
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.strokeStyle = hexToRgba(c, 0.1);
    ctx.lineWidth = 1;
    roundRect(ctx, mx, 116, 108, 70, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(m.val, mx + 54, 146);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '9px system-ui';
    ctx.fillText(m.label, mx + 54, 162);
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 9px system-ui';
    ctx.fillText(m.pct, mx + 54, 178);
  });
  // Growth chart
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  roundRect(ctx, 30, 200, 452, 100, 8); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = 'bold 10px system-ui';
  ctx.textAlign = 'left';
  ctx.fillText('Revenue Growth', 48, 220);
  ctx.beginPath();
  ctx.moveTo(50, 286);
  const gPts = [280, 274, 268, 260, 248, 240, 235, 226, 218, 216];
  gPts.forEach((y, i) => ctx.lineTo(50 + i * 44, y));
  ctx.strokeStyle = c;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.lineTo(50 + (gPts.length - 1) * 44, 290);
  ctx.lineTo(50, 290);
  ctx.closePath();
  ctx.fillStyle = hexToRgba(c, 0.1);
  ctx.fill();
  // Timeline
  const tl = ['2023 Seed', '2024 Product', '2025 Growth', '2026 Series A'];
  tl.forEach((t, i) => {
    const tx = 70 + i * 110;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(tx, 328, 4, 0, Math.PI * 2);
    ctx.fill();
    if (i < 3) {
      ctx.strokeStyle = hexToRgba(c, 0.2);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(tx + 6, 328); ctx.lineTo(tx + 104, 328); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '8px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(t, tx, 346);
  });
}

// ID 14: Product Hunt — launch page with upvotes
function drawProductHunt(ctx: CanvasRenderingContext2D, c: string): void {
  ctx.fillStyle = '#0c0414';
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  // Shimmer glow
  const grd = ctx.createRadialGradient(TEX_W / 2, 60, 20, TEX_W / 2, 60, 220);
  grd.addColorStop(0, hexToRgba(c, 0.12));
  grd.addColorStop(1, 'transparent');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  // Badge
  ctx.fillStyle = hexToRgba(c, 0.12);
  ctx.strokeStyle = hexToRgba(c, 0.3);
  ctx.lineWidth = 1;
  roundRect(ctx, TEX_W / 2 - 70, 26, 140, 22, 11); ctx.fill(); ctx.stroke();
  ctx.fillStyle = c;
  ctx.font = 'bold 9px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('🏆 #1 Product of the Day', TEX_W / 2, 40);
  // Title
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 28px system-ui';
  ctx.fillText('Launch Your', TEX_W / 2, 84);
  ctx.fillStyle = c;
  ctx.fillText('Next Big Thing', TEX_W / 2, 116);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = '11px system-ui';
  ctx.fillText('The all-in-one toolkit for product launches', TEX_W / 2, 142);
  // Upvote button
  ctx.fillStyle = c;
  roundRect(ctx, TEX_W / 2 - 45, 158, 90, 32, 8); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px system-ui';
  ctx.fillText('▲ 1,247', TEX_W / 2, 178);
  // Avatar stack
  for (let i = 4; i >= 0; i--) {
    ctx.fillStyle = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', c][i];
    ctx.beginPath();
    ctx.arc(TEX_W / 2 - 32 + i * 16, 216, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0c0414';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '9px system-ui';
  ctx.fillText('Loved by 5,000+ makers', TEX_W / 2, 240);
  // Feature cards
  const feats = ['Lightning Fast', 'Analytics Built-in', 'Team Ready'];
  feats.forEach((f, i) => {
    const fx = 50 + i * 150;
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    roundRect(ctx, fx, 260, 130, 50, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px system-ui';
    ctx.fillText(f, fx + 65, 280);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '8px system-ui';
    ctx.fillText('Feature description here', fx + 65, 298);
  });
  // Email signup
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  roundRect(ctx, 100, 330, 220, 30, 8); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.font = '10px system-ui';
  ctx.textAlign = 'left';
  ctx.fillText('your@email.com', 116, 348);
  ctx.fillStyle = c;
  roundRect(ctx, 330, 330, 80, 30, 8); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('Join Waitlist', 370, 348);
}

// ID 15: Course Sales — education layout
function drawCourseSales(ctx: CanvasRenderingContext2D, c: string): void {
  const grad = ctx.createLinearGradient(0, 0, 0, TEX_H);
  grad.addColorStop(0, '#1a0a12');
  grad.addColorStop(1, '#0a0408');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  // Hero
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '10px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('ONLINE MASTERCLASS', TEX_W / 2, 30);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px system-ui';
  ctx.fillText('Master Modern', TEX_W / 2, 60);
  ctx.fillStyle = c;
  ctx.fillText('Web Design', TEX_W / 2, 88);
  // Stars + rating
  ctx.fillStyle = '#fbbf24';
  ctx.font = '12px system-ui';
  ctx.fillText('★★★★★', TEX_W / 2 - 20, 112);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '10px system-ui';
  ctx.fillText('4.9 (2,847 students)', TEX_W / 2 + 40, 112);
  // Play button circle
  ctx.fillStyle = hexToRgba(c, 0.15);
  ctx.beginPath();
  ctx.arc(TEX_W / 2, 156, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(TEX_W / 2 - 6, 146);
  ctx.lineTo(TEX_W / 2 + 10, 156);
  ctx.lineTo(TEX_W / 2 - 6, 166);
  ctx.closePath();
  ctx.fill();
  // Curriculum
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = 'bold 10px system-ui';
  ctx.textAlign = 'left';
  ctx.fillText('CURRICULUM', 40, 210);
  const modules = ['01  Foundations', '02  Layout & Grid', '03  Animation', '04  Advanced CSS', '05  Final Project'];
  modules.forEach((m, i) => {
    ctx.fillStyle = i === 0 ? hexToRgba(c, 0.08) : 'rgba(255,255,255,0.02)';
    roundRect(ctx, 40, 220 + i * 24, 260, 20, 4); ctx.fill();
    ctx.fillStyle = i === 0 ? c : 'rgba(255,255,255,0.5)';
    ctx.font = '9px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(m, 54, 234 + i * 24);
  });
  // Instructor card (right side)
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  roundRect(ctx, 320, 200, 170, 140, 10); ctx.fill();
  ctx.fillStyle = hexToRgba(c, 0.15);
  ctx.beginPath();
  ctx.arc(405, 240, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = c;
  ctx.font = 'bold 14px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('SK', 405, 244);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px system-ui';
  ctx.fillText('Sarah Kim', 405, 276);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '8px system-ui';
  ctx.fillText('Senior Designer @ Google', 405, 292);
  ctx.fillText('10+ years experience', 405, 306);
  // Enroll CTA
  ctx.fillStyle = c;
  roundRect(ctx, 340, 318, 130, 14, 4); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 8px system-ui';
  ctx.fillText('Enroll — $199', 405, 327);
}

// ID 16: Consulting Co — corporate with globe
function drawConsultingCo(ctx: CanvasRenderingContext2D, c: string): void {
  ctx.fillStyle = '#020818';
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.02)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 20; i++) {
    ctx.beginPath(); ctx.moveTo(i * 28, 0); ctx.lineTo(i * 28, TEX_H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * 28); ctx.lineTo(TEX_W, i * 28); ctx.stroke();
  }
  // Globe wireframe hint
  ctx.strokeStyle = hexToRgba(c, 0.08);
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.arc(410, 100, 70, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const rx = Math.abs(70 * Math.cos(i * 0.6));
    if (rx > 0.5) {
      ctx.beginPath();
      ctx.ellipse(410, 100, rx, 70, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  // Dots on globe
  const dots = [[380, 60], [430, 80], [400, 120], [440, 50], [370, 100]];
  dots.forEach(([dx, dy]) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(dx, dy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });
  // Hero text
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 26px system-ui';
  ctx.textAlign = 'left';
  ctx.fillText('Strategic', 30, 70);
  ctx.fillStyle = c;
  ctx.fillText('Consulting', 30, 100);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = '10px system-ui';
  ctx.fillText('Transforming businesses worldwide', 30, 125);
  // CTA
  ctx.fillStyle = c;
  roundRect(ctx, 30, 142, 100, 26, 6); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('Get Started', 80, 156);
  // Stats row
  const sts = [{ val: '500+', lbl: 'Clients' }, { val: '98%', lbl: 'Satisfaction' }, { val: '25+', lbl: 'Countries' }];
  sts.forEach((s, i) => {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px system-ui';
    ctx.fillText(s.val, 90 + i * 140, 210);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '9px system-ui';
    ctx.fillText(s.lbl, 90 + i * 140, 228);
  });
  // Case study cards
  ctx.textAlign = 'left';
  const cases = ['McKinsey Global', 'Deloitte Digital', 'BCG Transform'];
  cases.forEach((cs, i) => {
    const cx = 30 + i * 160;
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    roundRect(ctx, cx, 250, 145, 60, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = hexToRgba(c, 0.3);
    roundRect(ctx, cx + 10, 262, 30, 30, 4); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px system-ui';
    ctx.fillText(cs, cx + 50, 274);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '8px system-ui';
    ctx.fillText('Strategy & Growth', cx + 50, 290);
  });
  // Testimonial
  ctx.fillStyle = 'rgba(255,255,255,0.02)';
  roundRect(ctx, 30, 326, 452, 40, 8); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = 'italic 9px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('"They transformed our business model and doubled our revenue in 12 months."', TEX_W / 2, 350);
}

// ID 17: Luxe Realty — luxury real estate
function drawLuxeRealty(ctx: CanvasRenderingContext2D, c: string): void {
  ctx.fillStyle = '#080604';
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  // Gold line
  ctx.fillStyle = c;
  ctx.fillRect(0, 48, TEX_W, 1);
  // Nav
  ctx.fillStyle = c;
  ctx.font = 'bold 16px serif';
  ctx.textAlign = 'left';
  ctx.fillText('LUXE', 24, 35);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '9px system-ui';
  ctx.textAlign = 'right';
  ctx.fillText('Properties    Agents    Contact', TEX_W - 24, 35);
  // Hero
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '9px system-ui';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '3px';
  ctx.fillText('EXCLUSIVE PROPERTIES', TEX_W / 2, 80);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 28px serif';
  ctx.fillText('Luxury Living', TEX_W / 2, 112);
  ctx.fillStyle = c;
  ctx.fillText('Redefined', TEX_W / 2, 142);
  // Property cards
  const props = [
    { name: 'Pacific Heights Villa', price: '$4.2M', beds: '5 BD', sqft: '4,200 sqft' },
    { name: 'Marina Bay Penthouse', price: '$3.8M', beds: '4 BD', sqft: '3,600 sqft' },
    { name: 'Nob Hill Estate', price: '$6.1M', beds: '6 BD', sqft: '5,800 sqft' },
  ];
  props.forEach((p, i) => {
    const px = 24 + i * 160;
    // Image placeholder
    ctx.fillStyle = `rgba(${100 + i * 30}, ${80 + i * 20}, ${60 + i * 10}, 0.3)`;
    roundRect(ctx, px, 168, 148, 90, 6); ctx.fill();
    // Gold accent line
    ctx.fillStyle = c;
    ctx.fillRect(px, 258, 40, 2);
    // Info
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(p.name, px, 278);
    ctx.fillStyle = c;
    ctx.font = 'bold 14px serif';
    ctx.fillText(p.price, px, 298);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '8px system-ui';
    ctx.fillText(`${p.beds}  •  ${p.sqft}`, px, 314);
  });
  // Bottom CTA
  ctx.strokeStyle = c;
  ctx.lineWidth = 1;
  roundRect(ctx, TEX_W / 2 - 60, 340, 120, 26, 2); ctx.stroke();
  ctx.fillStyle = c;
  ctx.font = 'bold 9px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('VIEW ALL PROPERTIES', TEX_W / 2, 356);
}

// ID 18: Analytics Pro — data dashboard
function drawAnalyticsPro(ctx: CanvasRenderingContext2D, c: string): void {
  ctx.fillStyle = '#030d1a';
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  // Sidebar
  ctx.fillStyle = '#061422';
  ctx.fillRect(0, 0, 64, TEX_H);
  ctx.fillStyle = c;
  ctx.font = 'bold 12px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('AP', 32, 26);
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i === 0 ? hexToRgba(c, 0.2) : 'rgba(255,255,255,0.04)';
    roundRect(ctx, 10, 44 + i * 28, 44, 20, 5); ctx.fill();
  }
  // KPI cards
  const kpis = [
    { val: '24.8K', label: 'Visitors', change: '+18%', up: true },
    { val: '3.2%', label: 'Conv Rate', change: '+0.4%', up: true },
    { val: '$847', label: 'AOV', change: '-2.1%', up: false },
    { val: '12.4s', label: 'Avg Session', change: '+5.2%', up: true },
  ];
  kpis.forEach((k, i) => {
    const kx = 78 + i * 108;
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    roundRect(ctx, kx, 16, 98, 56, 8); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(k.val, kx + 49, 40);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '8px system-ui';
    ctx.fillText(k.label, kx + 49, 54);
    ctx.fillStyle = k.up ? '#10b981' : '#ef4444';
    ctx.font = 'bold 8px system-ui';
    ctx.fillText(k.change, kx + 49, 66);
  });
  // Line chart
  ctx.fillStyle = 'rgba(255,255,255,0.02)';
  roundRect(ctx, 78, 84, 234, 130, 8); ctx.fill();
  // Draw two lines
  const l1 = [190, 180, 170, 185, 160, 150, 145, 155, 140, 130];
  const l2 = [200, 195, 188, 192, 180, 178, 172, 168, 170, 165];
  [l1, l2].forEach((pts, li) => {
    ctx.beginPath();
    pts.forEach((y, i) => {
      const x = 92 + i * 22;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = li === 0 ? c : '#8b5cf6';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
  // Donut chart
  ctx.fillStyle = 'rgba(255,255,255,0.02)';
  roundRect(ctx, 322, 84, 178, 130, 8); ctx.fill();
  const donutData = [0.4, 0.25, 0.2, 0.15];
  const donutColors = [c, '#8b5cf6', '#f59e0b', '#10b981'];
  let startAngle = -Math.PI / 2;
  donutData.forEach((d, i) => {
    const endAngle = startAngle + d * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(380, 150, 36, startAngle, endAngle);
    ctx.arc(380, 150, 22, endAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = donutColors[i];
    ctx.fill();
    startAngle = endAngle;
  });
  // Legend
  donutData.forEach((_, i) => {
    ctx.fillStyle = donutColors[i];
    roundRect(ctx, 430, 128 + i * 14, 6, 6, 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '7px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(['Direct', 'Organic', 'Social', 'Referral'][i], 440, 134 + i * 14);
  });
  // Data table
  ctx.fillStyle = 'rgba(255,255,255,0.02)';
  roundRect(ctx, 78, 226, 422, 140, 8); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = 'bold 9px system-ui';
  ctx.textAlign = 'left';
  ctx.fillText('Top Pages', 94, 244);
  // Header
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.fillRect(78, 250, 422, 18);
  const cols = ['Page', 'Views', 'Bounce', 'Conv'];
  cols.forEach((col, i) => {
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = 'bold 8px system-ui';
    ctx.fillText(col, 94 + i * 105, 262);
  });
  for (let i = 0; i < 5; i++) {
    const ry = 272 + i * 18;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent';
    ctx.fillRect(78, ry, 422, 18);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    roundRect(ctx, 94, ry + 4, 60 + Math.random() * 30, 8, 3); ctx.fill();
    roundRect(ctx, 199, ry + 4, 30, 8, 3); ctx.fill();
    roundRect(ctx, 304, ry + 4, 25, 8, 3); ctx.fill();
    ctx.fillStyle = hexToRgba(c, 0.2);
    roundRect(ctx, 409, ry + 4, 30, 8, 3); ctx.fill();
  }
}

// ID 19: CRM Panel — pipeline kanban
function drawCRMPanel(ctx: CanvasRenderingContext2D, c: string): void {
  ctx.fillStyle = '#0a0618';
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  // Top bar
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.fillRect(0, 0, TEX_W, 40);
  ctx.fillStyle = c;
  ctx.font = 'bold 14px system-ui';
  ctx.textAlign = 'left';
  ctx.fillText('CRM', 16, 26);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '9px system-ui';
  ctx.fillText('Pipeline    Contacts    Reports', 60, 26);
  // Pipeline view
  const stages = [
    { title: 'Lead', color: '#64748b', deals: ['Acme Inc', 'Beta Corp'] },
    { title: 'Qualified', color: '#f59e0b', deals: ['Delta Co', 'Echo LLC', 'Fox Ltd'] },
    { title: 'Proposal', color: c, deals: ['Gamma AG'] },
    { title: 'Won', color: '#10b981', deals: ['Zeta Inc', 'Omega Co'] },
  ];
  stages.forEach((s, i) => {
    const sx = 10 + i * 126;
    // Column header
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(sx + 8, 60, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(s.title, sx + 18, 64);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '9px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText(s.deals.length.toString(), sx + 116, 64);
    // Deal cards
    s.deals.forEach((d, j) => {
      const dy = 78 + j * 58;
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      roundRect(ctx, sx, dy, 118, 50, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px system-ui';
      ctx.textAlign = 'left';
      ctx.fillText(d, sx + 10, dy + 18);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '8px system-ui';
      ctx.fillText('$' + (Math.floor(Math.random() * 50) + 10) + 'K', sx + 10, dy + 34);
      // Avatar
      ctx.fillStyle = hexToRgba(s.color, 0.2);
      ctx.beginPath();
      ctx.arc(sx + 102, dy + 25, 8, 0, Math.PI * 2);
      ctx.fill();
    });
  });
  // Bottom stats
  ctx.fillStyle = 'rgba(255,255,255,0.02)';
  roundRect(ctx, 10, 300, 492, 70, 8); ctx.fill();
  const crmStats = [
    { val: '$284K', lbl: 'Pipeline Value' },
    { val: '32', lbl: 'Active Deals' },
    { val: '68%', lbl: 'Win Rate' },
    { val: '$42K', lbl: 'Avg Deal Size' },
  ];
  crmStats.forEach((s, i) => {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(s.val, 70 + i * 125, 330);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '8px system-ui';
    ctx.fillText(s.lbl, 70 + i * 125, 348);
  });
}

// ID 20: Project Tracker — kanban board
function drawProjectTracker(ctx: CanvasRenderingContext2D, c: string): void {
  ctx.fillStyle = '#060f0b';
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  // Header
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.fillRect(0, 0, TEX_W, 40);
  ctx.fillStyle = c;
  ctx.font = 'bold 12px system-ui';
  ctx.textAlign = 'left';
  ctx.fillText('ProjectTracker', 16, 26);
  // Sprint info
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '9px system-ui';
  ctx.fillText('Sprint 14 — Product Launch', 16, 60);
  // Progress bar
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  roundRect(ctx, 16, 68, 480, 6, 3); ctx.fill();
  ctx.fillStyle = c;
  roundRect(ctx, 16, 68, 326, 6, 3); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '8px system-ui';
  ctx.textAlign = 'right';
  ctx.fillText('68%', 496, 62);
  // Kanban columns
  const cols = [
    { title: 'To Do', color: '#64748b', tasks: ['Design audit', 'API docs'] },
    { title: 'In Progress', color: '#f59e0b', tasks: ['Auth flow', 'DB migration', 'Landing page'] },
    { title: 'Review', color: c, tasks: ['Payment API'] },
    { title: 'Done', color: '#10b981', tasks: ['CI/CD', 'Onboarding'] },
  ];
  cols.forEach((col, i) => {
    const cx = 10 + i * 126;
    // Header
    ctx.fillStyle = col.color;
    ctx.beginPath();
    ctx.arc(cx + 8, 98, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(col.title, cx + 16, 100);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = '8px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText(col.tasks.length.toString(), cx + 118, 100);
    // Task cards
    col.tasks.forEach((t, j) => {
      const ty = 112 + j * 48;
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 0.5;
      roundRect(ctx, cx, ty, 118, 40, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = '9px system-ui';
      ctx.textAlign = 'left';
      ctx.fillText(t, cx + 10, ty + 16);
      // Priority dot
      const pColors = ['#ef4444', '#f59e0b', '#64748b'];
      ctx.fillStyle = pColors[j % 3];
      ctx.beginPath();
      ctx.arc(cx + 10, ty + 30, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.font = '7px system-ui';
      ctx.fillText(['High', 'Medium', 'Low'][j % 3], cx + 18, ty + 33);
      // Assignee
      ctx.fillStyle = hexToRgba(c, 0.2);
      ctx.beginPath();
      ctx.arc(cx + 104, ty + 28, 7, 0, Math.PI * 2);
      ctx.fill();
    });
  });
  // Team row
  ctx.fillStyle = 'rgba(255,255,255,0.02)';
  roundRect(ctx, 10, 308, 492, 60, 8); ctx.fill();
  const team = ['AK', 'JL', 'PS', 'RC'];
  team.forEach((m, i) => {
    ctx.fillStyle = hexToRgba(c, 0.15);
    ctx.beginPath();
    ctx.arc(60 + i * 120, 338, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c;
    ctx.font = 'bold 10px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(m, 60 + i * 120, 342);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '7px system-ui';
    ctx.fillText(['3 tasks', '2 tasks', '4 tasks', '2 tasks'][i], 60 + i * 120, 358);
  });
}

// ID 21: Artisan Gallery — masonry grid
function drawArtisanGallery(ctx: CanvasRenderingContext2D, c: string): void {
  ctx.fillStyle = '#0d0510';
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  // Nav
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px system-ui';
  ctx.textAlign = 'left';
  ctx.fillText('Artisan', 20, 28);
  ctx.fillStyle = c;
  ctx.fillText('.', 80, 28);
  // Hero title
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 36px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('Art', TEX_W / 2, 72);
  ctx.fillStyle = c;
  ctx.fillText('.', TEX_W / 2 + 28, 72);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '10px system-ui';
  ctx.fillText('Color, form, and emotion', TEX_W / 2, 92);
  // Filter buttons
  const filters = ['All', 'Painting', 'Photography', 'Digital'];
  filters.forEach((f, i) => {
    const fw = f.length * 7 + 16;
    const fx = 110 + i * 80;
    ctx.fillStyle = i === 0 ? hexToRgba(c, 0.12) : 'transparent';
    ctx.strokeStyle = i === 0 ? c : 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    roundRect(ctx, fx, 108, fw, 20, 10); if (i === 0) ctx.fill(); ctx.stroke();
    ctx.fillStyle = i === 0 ? c : 'rgba(255,255,255,0.4)';
    ctx.font = '8px system-ui';
    ctx.fillText(f, fx + fw / 2, 120);
  });
  // Masonry gallery
  const artColors = [c, '#8b5cf6', '#06b6d4', '#f43f5e', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#6366f1'];
  const layout = [
    { x: 20, y: 142, w: 110, h: 130 },
    { x: 140, y: 142, w: 110, h: 85 },
    { x: 260, y: 142, w: 110, h: 110 },
    { x: 380, y: 142, w: 110, h: 85 },
    { x: 140, y: 237, w: 110, h: 100 },
    { x: 380, y: 237, w: 110, h: 100 },
    { x: 20, y: 282, w: 110, h: 80 },
    { x: 260, y: 262, w: 110, h: 75 },
  ];
  layout.forEach((l, i) => {
    const gc = artColors[i % artColors.length];
    const grad = ctx.createLinearGradient(l.x, l.y, l.x + l.w, l.y + l.h);
    grad.addColorStop(0, hexToRgba(gc, 0.3));
    grad.addColorStop(1, hexToRgba(gc, 0.08));
    ctx.fillStyle = grad;
    roundRect(ctx, l.x, l.y, l.w, l.h, 8); ctx.fill();
  });
}

// ID 22: Pixel Studio — bold agency
function drawPixelStudio(ctx: CanvasRenderingContext2D, c: string): void {
  ctx.fillStyle = '#08081a';
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  // Nav
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px system-ui';
  ctx.textAlign = 'left';
  ctx.fillText('PIXEL', 24, 30);
  ctx.fillStyle = c;
  ctx.fillText('.', 70, 30);
  // Hero — massive text
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 42px system-ui';
  ctx.textAlign = 'left';
  ctx.fillText('We make', 24, 90);
  ctx.fillStyle = c;
  ctx.fillText('brands bold.', 24, 136);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '10px system-ui';
  ctx.fillText('Creative agency specializing in brand identity', 24, 162);
  // CTA
  ctx.fillStyle = c;
  roundRect(ctx, 24, 178, 100, 26, 8); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('View Our Work', 74, 192);
  // Case studies list
  ctx.textAlign = 'left';
  const cases = [
    { year: '2025', client: 'Modernize', type: 'Brand Identity' },
    { year: '2025', client: 'Zenith App', type: 'Product Design' },
    { year: '2024', client: 'Volt Motors', type: 'Website' },
    { year: '2024', client: 'Aura Music', type: 'Brand + Web' },
  ];
  cases.forEach((cs, i) => {
    const cy = 226 + i * 36;
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(0, cy, TEX_W, 34);
    ctx.strokeStyle = hexToRgba(c, 0.06);
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(0, cy + 34); ctx.lineTo(TEX_W, cy + 34); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '9px system-ui';
    ctx.fillText(cs.year, 24, cy + 20);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px system-ui';
    ctx.fillText(cs.client, 80, cy + 20);
    ctx.fillStyle = hexToRgba(c, 0.6);
    ctx.font = '9px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText(cs.type, TEX_W - 24, cy + 20);
    ctx.textAlign = 'left';
  });
}

// ID 23: Dev Portfolio — terminal + matrix
function drawDevPortfolio(ctx: CanvasRenderingContext2D, c: string): void {
  ctx.fillStyle = '#0a0f0d';
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  // Faint matrix rain
  ctx.fillStyle = hexToRgba(c, 0.04);
  ctx.font = '10px monospace';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%'.split('');
  for (let col = 0; col < 40; col++) {
    for (let row = 0; row < 30; row++) {
      if (Math.random() > 0.3) continue;
      const ch = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(ch, col * 13, row * 13);
    }
  }
  // Nav
  ctx.fillStyle = c;
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('<alex />', 16, 24);
  // Hero text
  ctx.fillStyle = hexToRgba(c, 0.6);
  ctx.font = '9px monospace';
  ctx.fillText('// Hello, World!', 16, 60);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 28px system-ui';
  ctx.fillText('Alex Chen', 16, 92);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '10px system-ui';
  ctx.fillText('Full Stack Developer', 16, 112);
  // Terminal window (right side)
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.strokeStyle = hexToRgba(c, 0.15);
  ctx.lineWidth = 1;
  roundRect(ctx, 280, 46, 220, 120, 8); ctx.fill(); ctx.stroke();
  // Traffic lights
  ctx.fillStyle = '#ef4444';
  ctx.beginPath(); ctx.arc(296, 60, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath(); ctx.arc(308, 60, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#10b981';
  ctx.beginPath(); ctx.arc(320, 60, 4, 0, Math.PI * 2); ctx.fill();
  // Terminal lines
  const lines = [
    { prompt: '~$', cmd: 'whoami' },
    { output: 'Full Stack Developer' },
    { prompt: '~$', cmd: 'cat skills.txt' },
    { output: 'TS, React, Node, Go, AWS' },
  ];
  lines.forEach((l, i) => {
    const ly = 80 + i * 18;
    if (l.prompt) {
      ctx.fillStyle = c;
      ctx.font = '9px monospace';
      ctx.fillText(l.prompt, 292, ly);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(l.cmd, 316, ly);
    } else {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px monospace';
      ctx.fillText(l.output, 292, ly);
    }
  });
  // Project cards
  const projects = ['CloudSync', 'QueryForge', 'DeployBot', 'PixelML'];
  projects.forEach((p, i) => {
    const px = 16 + (i % 2) * 244;
    const py = 140 + Math.floor(i / 2) * 68;
    ctx.fillStyle = hexToRgba(c, 0.04);
    ctx.strokeStyle = hexToRgba(c, 0.1);
    ctx.lineWidth = 1;
    roundRect(ctx, px, py, 228, 58, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(p, px + 12, py + 22);
    ctx.fillStyle = '#fbbf24';
    ctx.font = '9px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText('⭐ ' + [342, 891, 1247, 567][i], px + 218, py + 22);
    ctx.textAlign = 'left';
    // Tags
    ctx.fillStyle = hexToRgba(c, 0.1);
    const tags = [['Go', 'WS'], ['TS', 'React'], ['Node', 'Docker'], ['Python', 'ML']][i];
    tags.forEach((tag, ti) => {
      roundRect(ctx, px + 12 + ti * 50, py + 34, 40, 14, 4); ctx.fill();
      ctx.fillStyle = c;
      ctx.font = '7px monospace';
      ctx.fillText(tag, px + 32 + ti * 50, py + 44);
      ctx.fillStyle = hexToRgba(c, 0.1);
    });
  });
  // Skill bars
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '8px monospace';
  const skills = [['TypeScript', 95], ['React', 92], ['Node.js', 90], ['Go', 78]];
  skills.forEach((s, i) => {
    const sy = 296 + i * 20;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.textAlign = 'left';
    ctx.fillText(s[0] as string, 16, sy);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    roundRect(ctx, 100, sy - 6, 400, 6, 3); ctx.fill();
    const grad = ctx.createLinearGradient(100, 0, 100 + (s[1] as number) * 4, 0);
    grad.addColorStop(0, c);
    grad.addColorStop(1, '#06b6d4');
    ctx.fillStyle = grad;
    roundRect(ctx, 100, sy - 6, (s[1] as number) * 4, 6, 3); ctx.fill();
  });
}

// ── Renderer map ─────────────────────────────────────

const TEMPLATE_RENDERERS: Record<number, (ctx: CanvasRenderingContext2D, c: string) => void> = {
  6:  drawNovaDashboard,
  7:  drawSaaSLaunch,
  8:  drawMedicalPlus,
  9:  drawTechStartup,
  10: drawFinancePro,
  11: drawEventLaunch,
  12: drawAppPromo,
  13: drawStartupPitch,
  14: drawProductHunt,
  15: drawCourseSales,
  16: drawConsultingCo,
  17: drawLuxeRealty,
  18: drawAnalyticsPro,
  19: drawCRMPanel,
  20: drawProjectTracker,
  21: drawArtisanGallery,
  22: drawPixelStudio,
  23: drawDevPortfolio,
};

// ── Main render function ─────────────────────────────

/** Generate a data URL preview for a template (used by mobile fallback cards) */
export function getTemplatePreviewUrl(template: TemplateItem): string {
  const canvas = renderGradientCanvas(template);
  return canvas.toDataURL('image/png');
}

function renderGradientCanvas(template: TemplateItem): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext('2d')!;

  const renderer = TEMPLATE_RENDERERS[template.id as number];
  if (renderer) {
    renderer(ctx, template.color || '#22d3ee');
    drawTierBadge(ctx, template);
    drawNameplate(ctx, template.name, template.category || '', template.color || '#22d3ee');
    return canvas;
  }

  // Default gradient fallback for unknown templates
  const [c1, c2] = getGradientColors(template.id);
  const grad = ctx.createLinearGradient(0, 0, TEX_W, TEX_H);
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 8;
  ctx.fillText(template.name, TEX_W / 2, TEX_H / 2 - 16);

  ctx.font = '18px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.shadowBlur = 4;
  ctx.fillText(template.category || '', TEX_W / 2, TEX_H / 2 + 24);

  drawTierBadge(ctx, template);

  return canvas;
}

/**
 * Generate a Map<templateId, THREE.Texture> for all templates.
 * Templates with images get TextureLoader; others get CanvasTexture from gradient.
 */
export function useGradientTextures(templates: TemplateItem[]): React.MutableRefObject<Map<number | string, THREE.Texture>> {
  const textureMapRef = useRef<Map<number | string, THREE.Texture>>(new Map());
  const loaderRef = useRef<THREE.TextureLoader>(new THREE.TextureLoader());

  useEffect(() => {
    const map = textureMapRef.current;
    const loader = loaderRef.current;

    templates.forEach((t) => {
      // Skip if already created for this ID
      if (map.has(t.id)) return;

      if (t.imageUrl || t.image) {
        const url = t.imageUrl || t.image;
        loader.load(
          url as string,
          (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            map.set(t.id, tex);
          },
          undefined,
          () => {
            // Fallback to gradient on load error
            const canvas = renderGradientCanvas(t);
            const tex = new THREE.CanvasTexture(canvas);
            tex.colorSpace = THREE.SRGBColorSpace;
            map.set(t.id, tex);
          }
        );
      } else {
        const canvas = renderGradientCanvas(t);
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        map.set(t.id, tex);
      }
    });

    return () => {
      map.forEach((tex) => tex.dispose());
      map.clear();
    };
  }, [templates]);

  return textureMapRef;
}
