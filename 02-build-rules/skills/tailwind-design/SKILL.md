---
name: tailwind-design
description: Ground rules for writing Tailwind CSS in any project — token-first colors, contrast/accessibility, layout, and type-scale conventions. Use whenever writing or reviewing Tailwind utility classes, building UI components with Tailwind, setting up a tailwind.config theme, or converting hand-written CSS to Tailwind.
---

# Tailwind design ground rules

Apply these rules whenever writing, editing, or reviewing Tailwind classes.

## 1. Token-first — no arbitrary values

- Colors, spacing, font sizes, and radii come from the `tailwind.config` theme (or `@theme` in Tailwind v4 CSS-first config), never from bracket syntax.
- Bad: `w-[137px]`, `text-[#2c2c2c]`, `mt-[18px]`.
- Good: extend the theme with a named token (`w-content`, `text-ink`, `mt-6`) and use that.
- If a value doesn't fit any existing token, add the token to the config — don't reach for brackets as a one-off escape hatch. Arbitrary values are permitted only for truly one-off, non-reusable cases (e.g. matching a fixed third-party widget's exact pixel offset), and should be rare enough to justify a comment.

## 2. Use Tailwind's color palette — no gray-on-gray, no gray-on-white/black

- Prefer Tailwind's built-in color scale (or the project's themed extension of it) over custom hex values.
- Never pair a gray text color with a gray background, or gray text directly on pure white/black backgrounds — both read as low-contrast and washed out.
- Every text/background pairing must meet WCAG AA contrast (4.5:1 for body text, 3:1 for large text/UI components). If unsure, pick a color pair with a bigger visible step on the scale (e.g. `text-slate-700` on `bg-white`, not `text-slate-400` on `bg-slate-100`).
- No transparency on text. Don't use `text-opacity-*` / `text-*/50`-style alpha modifiers to soften text color — pick a solid, deliberately lighter/darker token instead. Opacity on text degrades contrast unpredictably against whatever sits behind it.

## 3. Layout — flexbox first

- Default to `flex` / `flex-col` / `flex-row` with `gap-*` for layout and spacing between siblings.
- Reach for `grid` only when the layout is genuinely two-dimensional (rows AND columns both matter) — card grids, dashboards, calendar-like layouts.
- Avoid `absolute`/`relative` positioning unless there's no flexbox/grid equivalent: overlays, badges pinned to a corner, tooltips, sticky decorative elements. Positioning children absolutely to fake a layout that flexbox could do directly is a smell.

## 4. Type scale — nothing smaller than `text-base`

- Body copy, labels, buttons, nav items: `text-base` or larger.
- `text-sm` is allowed only for genuine footnote-tier content: captions, timestamps, legal/fine print, metadata under a primary label.
- Never go below `text-sm` (no `text-xs`) unless the user explicitly asks for it — it's a common accessibility failure point.

## Applying this in a new project

1. Confirm Tailwind is installed (`tailwindcss` in `package.json`); if not, set it up first (`npx tailwindcss init` or the v4 CLI/framework-specific install) before writing utility classes.
2. Port the project's existing design tokens (colors, font families, spacing scale) into the Tailwind theme config so "token-first" has real tokens to point at — don't invent new ones that drift from the existing brand/palette.
3. When converting existing hand-written CSS to Tailwind, translate one component/file at a time, replacing custom classes with theme-backed utilities, and delete the superseded CSS in the same pass — don't leave both systems fighting for the same element.
