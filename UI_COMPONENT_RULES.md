# Mesozoic Isle – UI Component Rules

This document defines **standard UI component patterns** for the client-facing website.

Following these rules ensures:

- consistent visual design
- predictable layouts
- reusable components
- maintainable code

All components must follow the color and utility rules defined in `UI_COLOR_RULES.md`.

---

# 1. Core Design Philosophy

UI components should follow these principles:

1. **Consistency over creativity**
2. **Reusable patterns**
3. **Clear visual hierarchy**
4. **Minimal color usage**
5. **Readable spacing**

Avoid creating unique styles for every component.

---

# 2. Page Layout Structure

Every page should follow this structure:

```
Header
Hero Section
Content Sections
Call-to-action Section
Footer
```

Example page container:

```
<div class="bg-base min-h-screen">
```

Content container:

```
<div class="max-w-7xl mx-auto px-6">
```

Spacing between sections:

```
py-16
```

---

# 3. Section Structure

Each section should follow a consistent layout.

Example:

```
<section class="py-16">
  <div class="max-w-7xl mx-auto px-6">

    <h2 class="text-3xl font-bold">
      Section Title
    </h2>

    <p class="text-muted mt-2">
      Section description
    </p>

    <div class="mt-8">
      Content here
    </div>

  </div>
</section>
```

Rules:

- section title
- description
- content area

---

# 4. Card Components

Cards are used for:

- attractions
- activities
- accommodations
- packages

Use the predefined card class.

```
card
```

Example:

```
<div class="card">

  <h3 class="text-xl font-bold text-primary">
    Dino Safari Tour
  </h3>

  <p class="text-muted mt-2">
    Guided prehistoric adventure across the island.
  </p>

  <button class="btn-accent mt-4">
    Book Now
  </button>

</div>
```

Rules:

Cards should contain:

- title
- description
- action button (optional)

---

# 5. Button Rules

Only use predefined button classes.

### Primary Button

```
btn-primary
```

Used for:

- navigation actions
- confirmations
- secondary CTAs

Example:

```
<button class="btn-primary">
  View Packages
</button>
```

---

### Accent Button

```
btn-accent
```

Used for **important actions only**:

- booking
- reservations
- purchasing

Example:

```
<button class="btn-accent">
  Book Now
</button>
```

Do not overuse accent buttons.

---

# 6. Navigation Bar

Navigation should include:

- logo
- primary links
- booking button

Example layout:

```
<header class="bg-surface border-b border-base">

  <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

    <div class="text-xl font-bold text-primary">
      Mesozoic Isle
    </div>

    <nav class="flex gap-6">

      <a href="#">Attractions</a>
      <a href="#">Activities</a>
      <a href="#">Accommodation</a>

    </nav>

    <button class="btn-accent">
      Book Now
    </button>

  </div>

</header>
```

---

# 7. Hero Section

Hero sections introduce the website.

Structure:

```
<section class="py-24">

  <div class="max-w-7xl mx-auto px-6 text-center">

    <h1 class="text-5xl font-bold text-primary">
      Welcome to Mesozoic Isle
    </h1>

    <p class="text-muted mt-4 max-w-xl mx-auto">
      Experience prehistoric adventures on our dinosaur-themed island.
    </p>

    <button class="btn-accent mt-8">
      Book Your Adventure
    </button>

  </div>

</section>
```

---

# 8. Grid Layouts

Use grid layouts for cards.

Example:

```
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
```

This keeps the layout responsive.

---

# 9. Typography Rules

Headings:

```
text-5xl → hero
text-3xl → section title
text-xl → card title
```

Paragraphs:

```
text-base
```

Descriptions:

```
text-muted
```

---

# 10. Spacing Rules

Spacing should be consistent.

Standard spacing values:

| Purpose         | Class   |
| --------------- | ------- |
| Section padding | `py-16` |
| Hero padding    | `py-24` |
| Card padding    | `p-6`   |
| Element spacing | `mt-4`  |
| Large spacing   | `mt-8`  |

Avoid arbitrary spacing values.

---

# 11. Image Rules

Images should:

- use `rounded-lg`
- maintain aspect ratio
- not overflow containers

Example:

```
<img class="rounded-lg w-full object-cover">
```

---

# 12. Future Components

Future components may include:

- activity cards
- accommodation listings
- booking forms
- excursion packages

Each new component must follow the design system.

---
