# LegalAid Connect - Indian Law Design System

Quick reference guide for the new design system.

---

## 🎨 Color Palette

### Primary Colors
```
Deep Maroon (primary-900):    #4B1D0F  ████  Authority, Headers
Saffron (secondary-500):      #E07A1F  ████  Warmth, Accents
Gold (accent-500):            #C9A33B  ████  Premium, Highlights
```

### Background Colors
```
Ivory (ivory-100):            #F9F6F1  ████  Page Background
White:                        #FFFFFF  ████  Cards, Panels
Charcoal (charcoal-900):      #2B2B2B  ████  Text Primary
```

### Tricolor (Indian Flag)
```
Saffron:                      #FF9933  ████
White:                        #FFFFFF  ████
Green:                        #138808  ████
```

---

## 📝 Typography Scale

```
Hero Heading:     text-5xl md:text-7xl  font-serif font-bold
Section Heading:  text-4xl md:text-5xl  font-serif font-bold
Card Title:       text-xl md:text-2xl   font-serif font-bold
Body Large:       text-xl               font-sans
Body Regular:     text-base             font-sans
Body Small:       text-sm               font-sans
```

### Font Families
```css
font-serif    → Merriweather, Playfair Display (Headings)
font-sans     → Inter, Nunito Sans (Body)
font-heading  → Poppins (Labels, Buttons)
```

---

## 🎯 Component Classes

### Buttons
```html
<!-- Primary: Gradient with gold shadow -->
<button class="btn-primary">Get Started</button>

<!-- Secondary: White with maroon border -->
<button class="btn-secondary">Learn More</button>

<!-- Gold: Premium accent button -->
<button class="btn-gold">Book Consultation</button>
```

### Cards
```html
<!-- Basic Card -->
<div class="card">Content</div>

<!-- Hover Card -->
<div class="card-hover">Content</div>

<!-- Law-Themed Card (with tricolor top border) -->
<div class="card-law">Content</div>
```

### Text Gradients
```html
<!-- Maroon-Saffron Gradient -->
<span class="gradient-text">Highlighted Text</span>

<!-- Gold Gradient -->
<span class="gradient-text-gold">Premium Text</span>
```

### Decorative Elements
```html
<!-- Tricolor Line -->
<div class="tricolor-line"></div>

<!-- Scales Watermark Background -->
<div class="scales-watermark">Content</div>

<!-- Parchment Background -->
<div class="parchment-bg">Content</div>
```

---

## 🎬 Animations

### Usage
```html
<!-- Fade In -->
<div class="animate-fade-in">Content</div>

<!-- Scale In -->
<div class="animate-scale-in">Content</div>

<!-- Glow Effect -->
<div class="animate-glow">Content</div>

<!-- Slide Up -->
<div class="animate-slide-up">Content</div>
```

### Hover Effects
```html
<!-- Scale on Hover -->
<div class="transform hover:scale-105 transition-all duration-300">

<!-- Gold Shadow on Hover -->
<div class="hover:shadow-gold transition-shadow duration-300">

<!-- Border Color Change -->
<div class="border-2 border-primary-200 hover:border-accent-400">
```

---

## 📐 Layout Patterns

### Hero Section
```html
<section class="relative py-24 px-4 bg-gradient-maroon-saffron scales-watermark overflow-hidden">
  <div class="absolute inset-0 bg-gradient-to-br from-primary-900/90 to-secondary-600/90"></div>
  <div class="max-w-7xl mx-auto text-center relative z-10">
    <h1 class="text-5xl md:text-7xl font-serif font-bold text-white mb-6">
      Your Heading
    </h1>
  </div>
</section>
```

### Feature Card
```html
<div class="card-law text-center group hover:shadow-gold transition-all duration-300">
  <div class="flex justify-center mb-6 transform group-hover:scale-110 transition-transform duration-300">
    <!-- Icon -->
  </div>
  <h3 class="text-xl font-serif font-bold text-primary-900 mb-4">Title</h3>
  <p class="text-charcoal-700 leading-relaxed">Description</p>
</div>
```

### Stats Card
```html
<div class="text-center bg-white/10 backdrop-blur-sm rounded-xl p-6 border-2 border-accent-300/30 hover:bg-white/20 transition-all duration-300">
  <div class="text-4xl md:text-5xl font-serif font-bold text-accent-300 mb-2">
    1000+
  </div>
  <div class="text-ivory-100 font-heading font-semibold">
    Verified Lawyers
  </div>
</div>
```

### Navigation Bar
```html
<nav class="bg-white shadow-maroon border-b-4 border-primary-900 relative">
  <div class="tricolor-line absolute top-0 left-0 right-0"></div>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center h-20">
      <!-- Nav content -->
    </div>
  </div>
</nav>
```

---

## 🎨 Shadow Utilities

```css
shadow-soft     /* Subtle shadow */
shadow-medium   /* Medium shadow */
shadow-large    /* Large shadow */
shadow-gold     /* Gold glow */
shadow-maroon   /* Maroon shadow */
```

---

## 📱 Responsive Grid

```html
<!-- 1 col mobile → 2 col tablet → 4 col desktop -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
  <!-- Items -->
</div>

<!-- 2 col mobile → 4 col desktop -->
<div class="grid grid-cols-2 md:grid-cols-4 gap-6">
  <!-- Items -->
</div>

<!-- 1 col mobile → 3 col desktop -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-10">
  <!-- Items -->
</div>
```

---

## 🔤 Text Colors

```html
<!-- Primary Text -->
<p class="text-charcoal-900">Main content</p>

<!-- Secondary Text -->
<p class="text-charcoal-700">Supporting text</p>

<!-- Accent Text -->
<p class="text-secondary-600">Highlighted text</p>

<!-- Light Text (on dark backgrounds) -->
<p class="text-ivory-100">Light text</p>
```

---

## 🎯 Icon Styling

```html
<!-- Primary Icon -->
<Scale class="w-10 h-10 text-secondary-600" />

<!-- With Hover -->
<Scale class="w-6 h-6 text-secondary-600 group-hover:text-accent-600 transition-colors" />

<!-- In Circle -->
<div class="bg-gradient-to-br from-accent-400 to-secondary-500 w-20 h-20 rounded-full flex items-center justify-center shadow-gold">
  <Scale class="w-10 h-10 text-white" />
</div>
```

---

## 🌟 Special Effects

### Glass Morphism
```html
<div class="bg-white/10 backdrop-blur-sm border-2 border-accent-300/30">
  Content
</div>
```

### Gradient Overlay
```html
<div class="relative">
  <div class="absolute inset-0 bg-gradient-to-br from-primary-900/90 to-secondary-600/90"></div>
  <div class="relative z-10">Content</div>
</div>
```

### Tricolor Border
```html
<div class="relative overflow-hidden">
  <div class="absolute top-0 left-0 right-0 h-1 bg-tricolor"></div>
  Content
</div>
```

---

## 📋 Form Elements

```html
<!-- Input Field -->
<input class="input-field" type="text" />

<!-- Label -->
<label class="form-label">Field Name</label>

<!-- Button Group -->
<div class="flex space-x-4">
  <button class="btn-primary">Submit</button>
  <button class="btn-secondary">Cancel</button>
</div>
```

---

## 🎨 Background Patterns

```html
<!-- Ivory Background -->
<section class="bg-ivory-50">

<!-- White Background -->
<section class="bg-white">

<!-- Gradient Background -->
<section class="bg-gradient-maroon-saffron">

<!-- With Watermark -->
<section class="bg-white scales-watermark">
```

---

## 🔗 Link Styling

```html
<!-- Navigation Link -->
<a class="text-charcoal-700 hover:text-secondary-600 transition-colors font-heading font-semibold">
  Link Text
</a>

<!-- Footer Link -->
<a class="hover:text-accent-300 transition-colors flex items-center">
  <ArrowRight class="w-4 h-4 mr-2" />
  Link Text
</a>
```

---

## 🎯 Quick Copy-Paste Snippets

### Section Header
```html
<div class="text-center mb-16">
  <h2 class="text-4xl md:text-5xl font-serif font-bold text-primary-900 mb-6">
    Section <span class="gradient-text-gold">Title</span>
  </h2>
  <p class="text-xl text-charcoal-700 max-w-3xl mx-auto leading-relaxed">
    Description text goes here.
  </p>
</div>
```

### CTA Button
```html
<a href="/register" class="btn-gold text-lg px-8 py-4 inline-flex items-center">
  Get Started
  <ArrowRight class="w-5 h-5 ml-2" />
</a>
```

### Feature Card
```html
<div class="card-law text-center group">
  <Scale class="w-10 h-10 mx-auto mb-6 text-secondary-600 group-hover:scale-110 transition-transform" />
  <h3 class="text-xl font-serif font-bold text-primary-900 mb-4">Feature Title</h3>
  <p class="text-charcoal-700 leading-relaxed">Feature description.</p>
</div>
```

---

## 🎨 Color Usage Guidelines

| Element | Color | Class |
|---------|-------|-------|
| Page Background | Ivory | `bg-ivory-100` |
| Card Background | White | `bg-white` |
| Primary Headings | Deep Maroon | `text-primary-900` |
| Body Text | Charcoal | `text-charcoal-900` |
| Links | Charcoal → Saffron | `text-charcoal-700 hover:text-secondary-600` |
| Buttons (Primary) | Gradient | `bg-gradient-maroon-saffron` |
| Buttons (Secondary) | White + Maroon Border | `bg-white border-primary-900` |
| Buttons (Accent) | Gold | `bg-accent-500` |
| Icons | Saffron | `text-secondary-600` |
| Borders | Maroon/Gold | `border-primary-200` or `border-accent-400` |

---

**Design System Version:** 1.0.0  
**Last Updated:** November 8, 2025  
**Status:** Active ✅
