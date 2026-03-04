# Netflix-Style Templates Page Guide

A comprehensive guide on how the Netflix-style template browsing page was built for Three Seas Digital.

## Table of Contents
- [Overview](#overview)
- [Design Philosophy](#design-philosophy)
- [File Structure](#file-structure)
- [Key Components](#key-components)
- [Animation System](#animation-system)
- [Responsive Behavior](#responsive-behavior)
- [Customization Guide](#customization-guide)
- [Troubleshooting](#troubleshooting)

---

## Overview

The `/templates` page transforms the traditional grid-based template library into a Netflix-style browsing experience with:

- **Horizontal scrolling rows** organized by category
- **Featured hero section** with backdrop imagery
- **Hover-to-expand cards** with smooth animations
- **Fixed navigation** with scroll-aware styling
- **Modal preview system** for template details

---

## Design Philosophy

### Why Netflix Style?

1. **Familiar UX Pattern** — Users already understand how to browse Netflix
2. **Content Density** — Shows many templates without overwhelming vertical scroll
3. **Discovery** — Categories encourage exploration
4. **Visual Impact** — Large preview cards with hover states

### Key UX Decisions

| Decision | Rationale |
|----------|-----------|
| Horizontal scrolling | Mimics content platforms, feels like browsing |
| 16:9 card ratio | Video/TV metaphor, consistent with Netflix |
| Scale on hover (1.25x) | Not too jarring, still shows context |
| Staggered content reveal | Creates visual interest and hierarchy |
| "Preview" not "Play" | Appropriate for templates, not movies |

---

## File Structure

```
src/
├── pages/
│   └── Templates.jsx       # Main page component
├── styles/
│   └── templates.css       # All Netflix-style styles
└── (Netflix styles integrated into existing build)
```

### Route Configuration

```jsx
// src/App.jsx
<Route path="/templates" element={<Templates />} />
```

---

## Key Components

### 1. Navigation Bar (`netflix-nav`)

```jsx
<nav className={`netflix-nav ${scrolled ? 'netflix-nav--scrolled' : ''}`}>
  {/* Logo + links */}
  {/* Search toggle */}
  {/* Profile icon */}
</nav>
```

**Features:**
- Transparent → Solid background on scroll
- Expandable search bar
- Fixed position (z-index: 1000)

**Scroll Detection:**
```javascript
const [scrolled, setScrolled] = useState(false);

useEffect(() => {
  const handleScroll = () => setScrolled(window.scrollY > 50);
  window.addEventListener('scroll', handleScroll, { passive: true });
}, []);
```

---

### 2. Hero Section (`netflix-hero`)

```jsx
<div className="netflix-hero">
  <div className="netflix-hero-bg">
    <img src={template.image} />
    <div className="netflix-hero-overlay" />  {/* Gradient */}
    <div className="netflix-hero-vignette" /> {/* Edge darkening */}
  </div>
  <div className="netflix-hero-content">
    {/* Tags, Title, Meta, Description, Buttons */}
  </div>
</div>
```

**Visual Layers (bottom to top):**
1. Background image
2. Bottom gradient overlay (fades to background color)
3. Vignette (radial darkening at edges)
4. Content (z-index: 2)

---

### 3. Template Row (`netflix-row`)

```jsx
<div className="netflix-row">
  <h2 className="netflix-row-title">Trending Now</h2>
  <div className="netflix-row-container">
    <button className="netflix-row-arrow netflix-row-arrow--left">...</button>
    <div className="netflix-row-scroll" ref={rowRef}>
      {items.map(item => <TemplateCard key={item.id} item={item} />)}
    </div>
    <button className="netflix-row-arrow netflix-row-arrow--right">...</button>
  </div>
</div>
```

**Horizontal Scrolling Logic:**
```javascript
const scroll = (direction) => {
  const scrollAmount = direction === 'left' 
    ? -rowRef.current.clientWidth * 0.75 
    : rowRef.current.clientWidth * 0.75;
  rowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
};
```

**Arrow Visibility:**
```javascript
const checkScroll = useCallback(() => {
  const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
  setCanScrollLeft(scrollLeft > 0);
  setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
}, []);
```

---

### 4. Template Card (`netflix-card`)

**State Management:**
```jsx
const [isHovered, setIsHovered] = useState(false);
const [inList, setInList] = useState(false);
```

**Structure:**
```jsx
<div className={`netflix-card ${isHovered ? 'netflix-card--hovered' : ''}`}>
  <div className="netflix-card-inner">
    <div className="netflix-card-thumb">
      {/* Image or gradient */}
      <div className="netflix-card-overlay">
        <div className="netflix-card-actions">
          <Link className="netflix-card-btn netflix-card-btn-preview">
            <Eye size={18} />
          </Link>
          <button className="netflix-card-btn netflix-card-btn-list">
            {inList ? <Check /> : <Plus />}
          </button>
        </div>
        <div className="netflix-card-meta">
          <span className="netflix-card-tier">{item.tier}</span>
          <span className="netflix-card-cat">{item.category}</span>
        </div>
      </div>
    </div>
    <div className="netflix-card-title-wrap">
      <h3 className="netflix-card-title">{item.name}</h3>
    </div>
  </div>
</div>
```

---

### 5. Info Modal (`netflix-modal`)

```jsx
{showInfo && (
  <InfoModal template={FEATURED} onClose={() => setShowInfo(false)} />
)}
```

**Animation:**
```css
@keyframes modalFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes modalSlideUp {
  from { 
    opacity: 0;
    transform: translateY(30px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## Animation System

### Card Hover Animation

**CSS Transition:**
```css
.netflix-card {
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), 
              z-index 0s;
  will-change: transform;
}

.netflix-card--hovered {
  z-index: 100;
  transform: scale(1.25) translateY(-10px);
  margin: 0 40px;
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), 
              margin 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

**Easing Functions:**
- **Hover in:** `cubic-bezier(0.34, 1.56, 0.64, 1)` — Spring/bounce effect
- **Hover out:** `cubic-bezier(0.25, 0.46, 0.45, 0.94)` — Smooth deceleration

### Staggered Content Reveal

```css
/* Buttons appear first */
.netflix-card-actions {
  transform: translateY(5px);
  opacity: 0;
  transition: transform 0.3s ease 0.05s, opacity 0.3s ease 0.05s;
}

/* Meta appears second (100ms delay) */
.netflix-card-meta {
  transform: translateY(5px);
  opacity: 0;
  transition: transform 0.3s ease 0.1s, opacity 0.3s ease 0.1s;
}

.netflix-card--hovered .netflix-card-actions,
.netflix-card--hovered .netflix-card-meta {
  transform: translateY(0);
  opacity: 1;
}
```

### GPU Optimization

Always use `will-change` on animated properties:
```css
.netflix-card {
  will-change: transform;
}

.netflix-card-thumb {
  will-change: transform, box-shadow;
}
```

---

## Responsive Behavior

### Breakpoints

| Breakpoint | Card Width | Hover Scale | Margin |
|------------|------------|-------------|--------|
| > 1200px | 16% | 1.25x | 40px |
| 992-1200px | 20% | 1.2x | 30px |
| 768-992px | 33.33% | 1.1x | 15px |
| < 768px | 50% | 1.05x | 5px |

### Mobile Considerations

- Hover effects disabled on touch devices (use `@media (hover: hover)`)
- Scroll becomes swipe gesture
- Arrows hidden (touch scroll is natural)
- Modal becomes full-screen

---

## Customization Guide

### Adding a New Category

```javascript
const CATEGORIES = [
  // ... existing categories
  {
    id: 'new-category',
    title: 'My New Category',
    items: [
      { 
        id: 99, 
        name: 'Template Name', 
        tier: 'Starter', 
        category: 'Type',
        image: '/images/my-image.jpg', // or use gradient
        color: '#hexcolor',
        path: '/portfolio/starter'
      },
    ]
  },
];
```

### Changing the Featured Template

```javascript
const FEATURED = {
  id: 1,
  name: 'New Featured',
  tier: 'Premium',
  category: 'Category',
  description: 'Short description',
  longDesc: 'Longer description for modal',
  image: '/images/featured.jpg',
  color: '#ff6b9d',
  tags: ['Tag1', 'Tag2', 'Tag3'],
  path: '/portfolio/premium'
};
```

### Adding Gradient Backgrounds

For templates without images:
```javascript
const GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  // Add more...
];
```

### Customizing Animations

**Speed:**
```css
/* Faster */
.netflix-card--hovered {
  transition-duration: 0.3s;
}

/* Slower/more dramatic */
.netflix-card--hovered {
  transition-duration: 0.7s;
}
```

**Scale:**
```css
/* More dramatic */
.netflix-card--hovered {
  transform: scale(1.4) translateY(-15px);
}

/* Subtle */
.netflix-card--hovered {
  transform: scale(1.15) translateY(-5px);
}
```

---

## Troubleshooting

### Cards Feel Clunky

**Problem:** Animations aren't smooth

**Solutions:**
1. Add `will-change: transform` to cards
2. Use `transform` instead of `width/height`
3. Check for layout thrashing (animating margin/padding)
4. Ensure images are optimized

### Hover State Sticks

**Problem:** Card stays expanded after mouse leaves

**Fix:** Ensure `onMouseLeave` is set:
```jsx
<div 
  onMouseEnter={() => setIsHovered(true)}
  onMouseLeave={() => setIsHovered(false)}
>
```

### Horizontal Scroll Not Working

**Problem:** Can't scroll rows

**Check:**
```css
.netflix-row-scroll {
  overflow-x: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

.netflix-row-scroll::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}
```

### Modal Not Centering

**Problem:** Info modal off-screen

**Fix:** Check viewport meta tag:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

---

## Performance Tips

1. **Image Optimization**
   - Use WebP format when possible
   - Lazy load images below the fold
   - Use appropriate image sizes

2. **Animation Performance**
   - Only animate `transform` and `opacity`
   - Use `will-change` sparingly
   - Remove `will-change` after animation completes

3. **Code Splitting**
   - Templates page is already lazy-loaded
   - Keep GSAP imports dynamic

---

## Future Enhancements

### Possible Additions

1. **Search/Filter** — Search within rows, filter by tier
2. **Favorites** — Persist "My List" to localStorage
3. **Recently Viewed** — Track viewed templates
4. **Keyboard Navigation** — Arrow keys for browsing
5. **Skeleton Loading** — Shimmer while images load

### Accessibility Improvements

```jsx
// Add keyboard support
<div 
  role="button"
  tabIndex={0}
  onKeyDown={(e) => e.key === 'Enter' && openModal()}
  aria-label={`Preview ${template.name}`}
>
```

---

## Credits

**Design Inspiration:** Netflix UI/UX patterns
**Easing Functions:** [cubic-bezier.com](https://cubic-bezier.com)
**Icons:** Lucide React
**Animations:** CSS Transitions + GSAP for complex sequences

---

*Last updated: February 2026*
