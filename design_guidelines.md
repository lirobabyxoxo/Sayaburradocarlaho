# Design Guidelines for Yakuza Discord Bot

## Design Approach
**Reference-Based Approach**: Drawing inspiration from dark gaming interfaces like Discord's own dark theme, combined with Japanese Yakuza aesthetic elements and demonic/gothic design patterns.

## Core Design Elements

### A. Color Palette
**Primary Colors:**
- Background: 0 0% 8% (deep black)
- Surface: 0 0% 12% (dark gray)
- Text Primary: 0 0% 95% (near white)
- Text Secondary: 0 0% 70% (medium gray)

**Accent Colors:**
- Primary Red: 0 85% 55% (neon red)
- Danger Red: 355 85% 60% (slightly warmer red)
- Success: 120 60% 50% (muted green)
- Warning: 45 85% 55% (amber)

### B. Typography
**Font Families:**
- Primary: 'Inter', system fonts for readability
- Accent: 'JetBrains Mono' for command displays and code blocks

**Hierarchy:**
- Headers: Bold, larger sizing with red accent underlines
- Body: Regular weight, high contrast
- Commands: Monospace, slightly smaller, with syntax highlighting

### C. Layout System
**Spacing Units:** Tailwind units of 2, 4, 8, and 16
- Micro spacing: p-2, m-2
- Standard spacing: p-4, m-4, gap-4
- Section spacing: p-8, m-8
- Large spacing: p-16, m-16

### D. Component Library

**Embeds/Cards:**
- Dark background (0 0% 8%) with subtle red borders
- Rounded corners (rounded-lg)
- Shadow effects for depth
- Red accent lines for hierarchy

**Buttons:**
- Primary: Red background with white text
- Secondary: Transparent with red border
- Danger: Darker red for destructive actions

**Command Display:**
- Monospace font
- Dark code block styling
- Syntax highlighting for prefixes (.) and slashes (/)
- Copy-to-clipboard functionality

**Navigation:**
- Sidebar-style menu
- Dark theme consistency
- Red accent indicators for active states

### E. Visual Elements

**Iconography:**
- Minimal use of emojis: 🔥💀🩸
- Simple, geometric icons
- Red accent colors for important icons

**Branding:**
- Footer: "Yakuza — by liro" in subtle gray
- Consistent dark aesthetic
- Japanese-inspired subtle patterns (very minimal)

## Theme Specifications

**Dark Theme Implementation:**
- Pure dark mode throughout
- High contrast for accessibility
- Red neon accents sparingly used for emphasis
- Subtle gradients from black to dark gray for depth

**Aesthetic Direction:**
- Clean, modern interface with gothic undertones
- Minimalist approach to avoid clutter
- Professional appearance suitable for Discord integration
- Demonic/Yakuza elements through color choice and typography rather than imagery

## Layout Principles
- Single-column layouts for command lists
- Card-based organization for different command categories
- Clear visual separation between admin, roleplay, and utility commands
- Responsive design that works across different Discord clients

This design system ensures a cohesive, professional dark theme that aligns with Discord's interface while maintaining the requested Yakuza aesthetic through strategic use of red accents and dark backgrounds.