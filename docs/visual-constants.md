# Visual Constants (Exact tokens extracted)

Source: `C:\Users\DELL\Documents\Mtaani Kiganjani\src\styles\globals.css` (reference-only)

Fonts
- --font-sans: "DM Sans", ui-sans-serif, system-ui, sans-serif
- --font-heading: "Plus Jakarta Sans", sans-serif
- --font-serif: "Playfair Display", serif

Color tokens (exact HSL values)
- --color-background: hsl(150 10% 97%)
- --color-foreground: hsl(160 30% 8%)
- --color-primary: hsl(152 60% 28%)
- --color-primary-foreground: hsl(0 0% 100%)
- --color-secondary: hsl(210 65% 42%)
- --color-secondary-foreground: hsl(0 0% 100%)
- --color-accent: hsl(42 90% 55%)
- --color-accent-foreground: hsl(42 90% 12%)
- --color-tz-green: hsl(152 60% 28%)
- --color-tz-blue: hsl(210 65% 42%)
- --color-tz-gold: hsl(42 90% 55%)
- --color-border: hsl(150 5% 85%)
- --color-destructive: hsl(0 84% 60%)
- --color-ring: hsl(152 60% 28%)

Radii (exact)
- --radius-xs: 0.25rem
- --radius-sm: 0.375rem
- --radius-md: 0.5rem
- --radius-lg: 0.75rem
- --radius-xl: 1rem
- --radius-2xl: 1.5rem
- --radius-3xl: 2rem

Animation tokens (names + durations)
- --animate-float: float 6s ease-in-out infinite
- --animate-fade-up: fade-up 0.6s ease-out forwards
- --animate-fade-in: fade-in 0.5s ease-out forwards
- --animate-slide-in: slide-in 0.3s ease-out forwards
- --animate-pulse-slow: pulse-slow 3s ease-in-out infinite

Keyframe names (definitions are reference-only)
- `float`, `fade-up`, `fade-in`, `slide-in`, `pulse-slow`, `shimmer`

Custom utilities & component classes to preserve visual behavior
- `.glass-card` / `.glass-card-strong` (backdrop blur, translucent background, border)
- `.gradient-hero`, `.gradient-gold`, `.text-gradient-hero`
- `.gov-border` (gold border)
- `.btn-primary`, `.btn-secondary` (padding, radius, hover transform)
- `.input-field` (padding, border, radius, focus ring)
- `.card`, `.glass-card-strong` (rounded card with shadow)

Notes and guidance
- These values were extracted from the reference `globals.css` and must be reproduced exactly as design tokens in the new implementation (do NOT copy the entire CSS file).
- Prefer storing tokens in a single source-of-truth (e.g., `packages/config/tokens` or `apps/web/styles/tokens.css`) so components reference them consistently.
- Protected files list is in `docs/protected-files.md`. Any change to those files requires pixel regression testing.

If you want, I can now write a tokens file under `C:\Users\DELL\Documents\ekiganja\apps\web\styles\tokens.css` that mirrors these values for the new implementation. Reply "create tokens" to proceed.
