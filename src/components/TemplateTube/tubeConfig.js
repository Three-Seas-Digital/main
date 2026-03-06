// 3D Image Tube configuration constants

export const TUBE = {
  radius: 3.5,
  cols: 8,
  tileW: 1.2,
  tileH: 0.8,
  ySpacing: 1.6,
  repeatCount: 3,

  // Animation
  baseSpeed: 0.15,
  damping: 0.92,
  scrollSensitivity: 0.004,
  hoverSpeedScale: 0.25,
  hoverLerpSpeed: 0.08,
  scrollLerp: 0.12,
  maxSpinVelocity: 2.0,

  // Row speed variation (parallax — inner rows rotate faster)
  rowSpeedRange: [0.7, 1.3],

  // Visual
  glowColor: '#22d3ee',
  hoverScale: 1.15,
};

export const TIER_CONFIG = {
  Starter:    { color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.2)', label: 'Starter' },
  Business:   { color: '#22d3ee', bgColor: 'rgba(34, 211, 238, 0.2)', label: 'Business' },
  Premium:    { color: '#c084fc', bgColor: 'rgba(168, 85, 247, 0.2)', label: 'Premium' },
  Enterprise: { color: '#c8a43e', bgColor: 'rgba(200, 164, 62, 0.2)', label: 'Enterprise' },
};

export const GRADIENTS = [
  ['#667eea', '#764ba2'],
  ['#f093fb', '#f5576c'],
  ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140'],
  ['#30cfd0', '#330867'],
  ['#a8edea', '#fed6e3'],
  ['#ff9a9e', '#fecfef'],
  ['#ffecd2', '#fcb69f'],
  ['#ff8a80', '#ea6100'],
  ['#8e2de2', '#4a00e0'],
  ['#11998e', '#38ef7d'],
];

export function getGradientColors(id) {
  if (typeof id === 'string') {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
    return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
  }
  return GRADIENTS[id % GRADIENTS.length];
}

export function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 0,
  }).format(price);
}
