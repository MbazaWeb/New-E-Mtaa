# APPENDIX A: REFERENCE FILE STRUCTURE & USAGE

## Folder Structure
```
reference-files/
├── original-codebase/           # Original Mtaani-Kiganjani codebase (REFERENCE ONLY)
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── pages/
│   └── ...
├── specifications/              # Business & technical specifications
│   ├── mtaani-kiganjani-v3-spec.pdf
│   └── requirements.md
├── screenshots/                 # Visual reference & baseline images
│   ├── landing-page.png
│   ├── dashboard.png
│   ├── office-registry.png
│   └── ...
└── README.md                    # Instructions & guidelines
```

## Reference Files README Template

```markdown
# Reference Files - E-MTAA V3.0

## ⚠️ IMPORTANT: THESE ARE REFERENCE ONLY

These files are provided to understand the existing codebase patterns, 
visual design, and structure. **DO NOT COPY** these files directly into the new project.

## How to Use These References

### 1. Visual Design
- Extract color hex codes, font families, and spacing values
- Understand the visual hierarchy and component styling
- Use as baseline for Tailwind token definitions

### 2. Component Patterns
- Understand existing component structure and naming conventions
- See how state management and hooks are used
- Learn about API integration patterns

### 3. Styling & Layout
- Observe how Tailwind CSS classes are used
- Note responsive breakpoint patterns
- Understand dark/light mode implementation if present

### 4. Business Logic
- Understand office hierarchy and street mapping logic
- See how citizen profiles and applications work
- Learn about service workflow and SLA handling

## What NOT to Do

- ❌ Copy entire files verbatim
- ❌ Reuse component names exactly (unless explicitly required)
- ❌ Maintain deprecated patterns without review
- ❌ Copy outdated dependencies or practices

## What TO Do

- ✅ MIMIC the visual style and user experience
- ✅ RECREATE components using modern best practices
- ✅ IMPROVE with TypeScript, better error handling
- ✅ PRESERVE the user experience and workflows
- ✅ MODERNIZE dependencies and security practices

## Extraction Guide

### Colors & Tokens
Search for: `--color-*`, `bg-*`, `text-*` classes
Extract to: `apps/web/styles/tokens.css`

### Typography
Search for: `font-family`, `font-size`, `font-weight`
Extract to: `tailwind.config.ts` under `theme.typography`

### Components
Search for: `export const Component`, `export function Component`
Recreate with: Proper TypeScript, Zod validation, error boundaries

### API Endpoints
Search for: `fetch()`, `axios`, API calls
Recreate with: Proper error handling, loading states, optimistic updates
```

## Protected Files Warning
See [docs/protected-files.md](docs/protected-files.md) for files that should NOT be modified during the refactor.
