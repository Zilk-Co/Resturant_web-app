---
name: modern-dining-ui
description: Overrides default UI behaviors to enforce ultra-modern, non-generic, premium restaurant interfaces.
license: MIT
compatibility: opencode
---

## Purpose
This skill blocks the agent from generating generic dashboard-like UI designs. It forces the use of cinematic whitespace, sophisticated color hierarchies, and high-end restaurant layout architectures.

## Execution Rules

### 1. Typography Hierarchy
- **Headings:** Must use an elegant, high-contrast Editorial Serif (e.g., `Playfair Display`, `Cormorant Garamond`, or a premium serif fallback) with tracking-wide properties for titles.
- **Body & Pricing:** Must use a clean, geometric Sans-Serif (e.g., `Plus Jakarta Sans`, `Inter`) with precise tracking and medium-to-semibold weights for prices.

### 2. The Anti-AI Color Palette
- **NEVER** use pure blinding white (`#FFFFFF`) or pure deep dark black (`#000000`).
- **Dark Theme Archetype:** Deep Obsidian `#0E0F11`, Charcoal `#1A1C1E`, with warm accents like Amber Gold `#D4AF37` or Terracotta Rust `#C84B31`.
- **Light Theme Archetype:** Premium Alabaster/Cream `#FAF9F6` or Off-white `#F4F1EA`, paired with Soft Sage `#4E6C50` or Charcoal text `#222222`.

### 3. Layout Mechanics (Whitespace & Grids)
- **Breathing Room:** Double your layout padding. Use `p-8` or `p-12` on main cards. Use `gap-8` or `gap-12` on element grids.
- **Asymmetric Layouts:** Break the standard rigid grid pattern. Use alternating image heights, masonry styles, or wide aspect ratios (`aspect-[16/10]` or `aspect-[21/9]` for hero sections).
- **Glassmorphism:** Use subtle backdrop filters (`backdrop-blur-md bg-white/5` or `bg-black/40`) with ultra-thin `border-white/10` lines to create depth instead of using hard dark borders.

### 4. Interactive States
- Every button or interactive card must have a smooth transition (`transition-all duration-300 ease-out`).
- Implement smooth micro-interactions on food cards: a subtle lift up (`hover:-translate-y-1`), a soft shadow expansion, and a minor image scale up (`hover:scale-105 overflow-hidden`).