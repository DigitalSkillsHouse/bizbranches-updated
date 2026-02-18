# BizBranches Design System

Simple, scalable, WCAG-friendly. Single source of truth: `app/globals.css`.

---

## 1. Color System

| Role | Token | Light | Usage |
|------|--------|-------|--------|
| **Primary** | `--primary` | `#1d4ed8` | Trust, main actions, links |
| **Primary foreground** | `--primary-foreground` | `#ffffff` | Text on primary |
| **Secondary** | `--secondary` | `#f1f5f9` | Supporting surfaces |
| **Accent** | `--accent` | `#059669` | CTAs (Add Business), success |
| **Muted** | `--muted` | `#f8fafc` | Subtle backgrounds |
| **Muted foreground** | `--muted-foreground` | `#64748b` | Secondary text |
| **Destructive** | `--destructive` | `#dc2626` | Errors, delete |
| **Success** | `--success` | `#059669` | Success states |
| **Warning** | `--warning` | `#d97706` | Warnings |
| **Border** | `--border` | `#e2e8f0` | Borders, dividers |
| **Ring** | `--ring` | `#1d4ed8` | Focus rings |

Use Tailwind: `bg-primary`, `text-muted-foreground`, `border-border`, `bg-success`, `text-warning`, etc.

---

## 2. Typography

- **Font:** Geist Sans (heading + body), via `layout.tsx`.
- **Scale (CSS vars):** `--text-h1` … `--text-h6`, `--text-body`, `--text-body-sm`, `--text-caption`.
- **Utilities:** `.text-display`, `.text-heading`, `.text-subheading`, `.text-body-sm`, `.text-caption`.
- **Base:** `body` uses `--text-body` and `--leading-normal`. `h1`–`h6` use the type scale and `--font-heading`.

---

## 3. Spacing (8px base)

| Token | Value |
|-------|--------|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-10` | 40px |
| `--space-12` | 48px |
| `--space-16` | 64px |

Use in CSS: `padding: var(--space-4);` or Tailwind: `p-4`, `gap-6`, etc.

---

## 4. Border Radius

| Token | Value |
|-------|--------|
| `--radius-sm` | 8px |
| `--radius-md` | 10px |
| `--radius-lg` | 12px |
| `--radius-xl` | 16px |

Tailwind: `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`.

---

## 5. Shadows

| Token | Use |
|-------|-----|
| `--shadow-sm` | Buttons, inputs |
| `--shadow-md` | Buttons hover, dropdowns |
| `--shadow-lg` | Modals, search container |
| `--shadow-card` | Cards default |
| `--shadow-card-hover` | Cards hover |

---

## 6. UI Standards

- **Buttons:** `rounded-md`, `shadow-sm`, hover `shadow-md`, `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`. Primary = `bg-primary`, secondary = `bg-secondary border border-border`.
- **Cards:** `rounded-lg`, `border border-border`, `shadow-card`, hover `shadow-card-hover`. Use `.card-modern` or `.business-card`.
- **Inputs:** `h-10`, `rounded-lg`, `border`, `focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2`.
- **Badges:** `.badge-verified`, `.badge-featured`, `.badge-new`, `.badge-warning`, `.badge-destructive` — all use `--radius-md`, `--space-1` / `--space-2` padding, `--text-caption`.

---

## 7. Focus & Accessibility

Interactive elements (`a`, `button`, `input`, `select`, `textarea`) get global focus: `ring-2 ring-ring ring-offset-2 ring-offset-background`. No outline; use `focus-visible` only. Contrast: primary and accent on white meet WCAG AA for normal/large text.

---

## Extending

- Add new semantic colors in `:root` and `.dark`, then map in `@theme inline` as `--color-*`.
- Add spacing only in 4px steps (e.g. `--space-7` = 28px) if needed.
- Prefer utilities and existing tokens over new one-off values.
