# Three Seas Digital - Premium Home Page Color Scheme

> Elevated Design System for Luxury Brand Appeal
> Version: 2.0 - Premium Edition
> Last Updated: 2026-02-24

---

## 🎨 Premium Color Philosophy

### Design Direction
Shift from **gold/amber** (traditional, warm) to **platinum/champagne** with **deep emerald** accents (sophisticated, modern luxury). This creates:
- Higher perceived value
- Modern fintech aesthetic
- Better accessibility
- Timeless elegance

---

## 🌈 Core Palette

### Primary Backgrounds (Dark Luxury)
```css
--abyss: #0a0a0c           /* Deeper, richer black */
--deep-ocean: #0f0f12      /* Slightly warmer dark */
--mid-ocean: #18181c       /* Elevated surface */
--surface-ocean: #222228   /* Cards and panels */
```

### Platinum Accents (Primary)
```css
--platinum: #E8E6E1        /* Main platinum - sophisticated neutral */
--platinum-light: #F5F4F1  /* Hover states */
--platinum-dark: #C4C2BD   /* Muted elements */
--platinum-glow: rgba(232, 230, 225, 0.15)  /* Soft glow */
```

### Emerald Accents (Secondary)
```css
--emerald: #10B981         /* Primary action - confident green */
--emerald-light: #34D399   /* Hover/success states */
--emerald-dark: #059669    /* Active states */
--emerald-glow: rgba(16, 185, 129, 0.2)     /* Emerald glow */
```

### Champagne Gold (Tertiary - Subtle)
```css
--champagne: #D4AF37       /* Refined gold - less yellow */
--champagne-soft: rgba(212, 175, 55, 0.12) /* Subtle backgrounds */
--champagne-glow: rgba(212, 175, 55, 0.15) /* Glow effects */
```

---

## 📊 Semantic Colors

### Text Hierarchy
```css
--text-bright: #FFFFFF           /* Headlines - pure white */
--text-primary: #E8E6E1          /* Body - platinum */
--text-secondary: #9CA3AF        /* Descriptions - cool gray */
--text-muted: #6B7280            /* Captions - muted gray */
```

### Status Colors (Refined)
```css
--success: #10B981               /* Emerald - confident */
--success-bg: rgba(16, 185, 129, 0.12)
--warning: #F59E0B               /* Amber - warm alert */
--warning-bg: rgba(245, 158, 11, 0.12)
--danger: #EF4444                /* Rose - elegant error */
--danger-bg: rgba(239, 68, 68, 0.12)
--info: #3B82F6                 /* Royal blue - informative */
--info-bg: rgba(59, 130, 246, 0.12)
```

### Borders & Dividers
```css
--border-subtle: rgba(255, 255, 255, 0.06)
--border-light: rgba(255, 255, 255, 0.1)
--border-medium: rgba(255, 255, 255, 0.15)
--border-emerald: rgba(16, 185, 129, 0.2)
--border-platinum: rgba(232, 230, 225, 0.15)
```

---

## ✨ Gradient Specifications

### Hero Text Gradient (Premium Platinum)
```css
--gradient-hero-text: linear-gradient(
  135deg,
  #FFFFFF 0%,
  #E8E6E1 25%,
  #C4C2BD 50%,
  #E8E6E1 75%,
  #FFFFFF 100%
);
```

### CTA Button Gradient (Emerald Shine)
```css
--gradient-primary: linear-gradient(
  135deg,
  #10B981 0%,
  #059669 50%,
  #10B981 100%
);
```

### Secondary Button (Platinum Outline)
```css
--gradient-secondary: linear-gradient(
  135deg,
  rgba(232, 230, 225, 0.1) 0%,
  rgba(232, 230, 225, 0.05) 100%
);
```

### Accent Highlight (Champagne Touch)
```css
--gradient-accent: linear-gradient(
  135deg,
  #D4AF37 0%,
  #B8941F 50%,
  #D4AF37 100%
);
```

### Glass Panel Background
```css
--gradient-glass: linear-gradient(
  135deg,
  rgba(24, 24, 28, 0.8) 0%,
  rgba(16, 16, 20, 0.6) 100%
);
```

---

## 🎯 Component-Specific Colors

### Video Hero Section
```css
/* Label */
--hero-label: #10B981                    /* Emerald - fresh */

/* Headline */
--hero-headline: #FFFFFF                 /* Pure white */
--hero-accent: var(--gradient-hero-text) /* Platinum gradient */

/* Subtext */
--hero-subtext: #9CA3AF                  /* Cool gray */
--hero-subtext-accent: #10B981          /* Emerald keywords */
```

### Editorial Panels (Glass Cards)
```css
/* Panel Background */
--panel-bg: linear-gradient(
  135deg,
  rgba(34, 34, 40, 0.9) 0%,
  rgba(24, 24, 28, 0.8) 100%
);
--panel-border: rgba(255, 255, 255, 0.08);
--panel-backdrop: blur(20px);

/* Micro Label */
--micro-label: #D4AF37                   /* Champagne gold */

/* Headlines */
--headline-filled: var(--gradient-hero-text)
--headline-outline: rgba(255, 255, 255, 0.6)

/* Body Text */
--editorial-text: #E8E6E1               /* Platinum */
--editorial-accent: #10B981             /* Emerald highlights */
```

### Capabilities List
```css
/* Icons */
--capability-icon-bg: rgba(16, 185, 129, 0.1)   /* Emerald tint */
--capability-icon-color: #10B981               /* Emerald */

/* Hover State */
--capability-hover-bg: rgba(16, 185, 129, 0.08);
--capability-hover-text: #FFFFFF;
```

### Navigation Dots
```css
--dot-default: #10B981                   /* Emerald */
--dot-hover: #34D399                     /* Light emerald */
```

---

## 🎭 Shadow & Glow System

### Elevation Shadows
```css
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.4);
--shadow-md: 0 4px 20px rgba(0, 0, 0, 0.5);
--shadow-lg: 0 8px 40px rgba(0, 0, 0, 0.6);
--shadow-xl: 0 16px 60px rgba(0, 0, 0, 0.7);
```

### Premium Glows
```css
--glow-platinum: 0 0 40px rgba(232, 230, 225, 0.15);
--glow-emerald: 0 0 40px rgba(16, 185, 129, 0.25);
--glow-champagne: 0 0 40px rgba(212, 175, 55, 0.2);
```

### Interactive States
```css
/* Button Hover Glow */
--glow-button-hover: 0 0 30px rgba(16, 185, 129, 0.3);

/* Card Hover Lift */
--shadow-card-hover: 
  0 20px 60px rgba(0, 0, 0, 0.5),
  0 0 0 1px rgba(255, 255, 255, 0.1);
```

---

## 🖼️ Visual Treatment Guidelines

### 1. Background Depth
- Use pure black (#0a0a0c) for deepest background
- Layer with subtle noise texture (4% opacity)
- Gradients should be subtle, never harsh

### 2. Text Contrast
- Headlines: Pure white for maximum impact
- Body: Platinum (#E8E6E1) for readability
- Accents: Emerald for calls-to-action

### 3. Glass Panels
- Background: 80-90% opacity dark
- Border: 8-10% white opacity
- Backdrop blur: 18-20px
- Border radius: 18px (premium feel)

### 4. Interactive Elements
- Primary buttons: Emerald gradient
- Secondary buttons: Platinum outline
- Hover states: Glow effect + slight scale

### 5. Iconography
- Use emerald for capability icons
- Champagne gold for labels/highlights
- White for primary actions

---

## 🔄 Animation Colors

### Scroll Reveal
```css
/* Panels fade from subtle glow */
--reveal-glow-start: rgba(16, 185, 129, 0.05);
--reveal-glow-end: transparent;
```

### Hover Transitions
```css
/* Smooth 300ms transitions */
transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);

/* Color shifts */
--hover-lift: translateY(-2px);
--hover-glow: box-shadow: var(--glow-emerald);
```

---

## 📱 Responsive Color Adjustments

### Mobile
- Maintain same color palette
- Increase contrast slightly for outdoor viewing
- Shadows can be slightly less pronounced

### Light Theme (if implemented)
```css
--light-bg: #FAFAFA;
--light-surface: #FFFFFF;
--light-text: #1a1a1e;
--light-accent: #059669;        /* Darker emerald */
--light-border: rgba(0, 0, 0, 0.08);
```

---

## 🎨 Before vs After

### Before (Gold/Amber)
```
Primary: #C8A43E (gold)
Secondary: #B8602E (amber)
Feel: Traditional, warm, classic luxury
```

### After (Platinum/Emerald)
```
Primary: #E8E6E1 (platinum)
Secondary: #10B981 (emerald)
Feel: Modern, sophisticated, fintech premium
```

---

## 💡 Implementation Notes

### CSS Variable Migration
1. Replace `--jelly-cyan` with `--platinum`
2. Replace `--jelly-pink` with `--emerald`
3. Replace `--accent-gold` with `--champagne`
4. Update all gradient definitions

### Key Changes in home.css
- Hero hook accent colors
- Editorial panel borders
- Capability icon backgrounds
- Button gradients
- Text accent colors

### Accessibility Improvements
- Better contrast ratios (WCAG AA compliant)
- Clear focus states with emerald outline
- Reduced motion support maintained
