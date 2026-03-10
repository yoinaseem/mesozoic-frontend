# Mesozoic Isle – Tailwind Usage Rules

This document defines **how Tailwind should be used in this project**.

The goal is to avoid:

- messy utility classes
- inconsistent styling
- hardcoded colors

---

# 1. Core Philosophy

Use Tailwind for:

- layout
- spacing
- flex/grid
- typography
- responsiveness

Use custom utilities for:

- colors
- components
- buttons
- cards

---

# 2. Allowed Tailwind Categories

These Tailwind utilities are encouraged.

### Layout

```
flex
grid
items-center
justify-between
gap-6
```

---

### Spacing

```
p-6
px-6
py-16
mt-4
mt-8
```

Use consistent spacing values.

---

### Responsive Design

```
sm:
md:
lg:
xl:
```

Example:

```
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
```

---

### Typography

Allowed typography classes:

```
text-sm
text-base
text-lg
text-xl
text-3xl
text-5xl
font-semibold
font-bold
```

---

# 3. Do NOT Use Tailwind Color Classes

Avoid these:

```
bg-red-500
bg-blue-400
bg-green-300
text-yellow-600
border-gray-200
```

These break the design system.

Instead use:

```
bg-primary
bg-accent
bg-surface
text-primary
text-muted
border-base
```

---

# 4. Avoid Inline Styles

Do NOT write:

```
style="background-color: red"
```

or

```
style={{ color: "#ff0000" }}
```

All styling must come from:

- Tailwind utilities
- global.css classes

---

# 5. Class Length Rule

Avoid extremely long class lists.

Bad example:

```
bg-white border border-gray-200 rounded-lg p-6 shadow-md
```

Preferred:

```
card
```

Use reusable utilities when possible.

---

# 6. Component First Approach

If a pattern appears **more than twice**, create a component.

Example:

Instead of repeating this:

```
<div class="card">
```

Create:

```
<Card>
```

Example React component:

```
<Card title="Dino Safari">
  Explore prehistoric wildlife.
</Card>
```

---

# 7. Responsiveness Rule

Mobile-first design.

Start with mobile:

```
grid-cols-1
```

Then expand:

```
md:grid-cols-2
lg:grid-cols-3
```

---

# 8. Dark Mode

Dark mode should **not be manually styled in components**.

Do NOT write:

```
dark:bg-gray-900
dark:text-white
```

Dark mode is handled through **CSS variables in global.css**.

---

# 9. Naming Consistency

Use consistent naming.

Examples:

Good:

```
card
btn-primary
btn-accent
```

Avoid random class names like:

```
card2
green-button
highlight-box
```

---

# 10. Maintainability Rule

Before adding new styles, ask:

1. Does this already exist?
2. Can it reuse a component?
3. Can it reuse a utility?

If yes → reuse.

If no → create a reusable utility.

---

# 11. Folder Structure Recommendation

Example structure:

```
/components
    Card.tsx
    Button.tsx
    Navbar.tsx

/docs
    UI_COLOR_RULES.md
    UI_COMPONENT_RULES.md
    TAILWIND_USAGE_RULES.md
```

This keeps the project organized.

---

# 12. Final Rule

The UI system should feel like **one coherent design**, not a collection of random styles.

If a new UI element looks visually inconsistent, it should be redesigned to match the system.

---
