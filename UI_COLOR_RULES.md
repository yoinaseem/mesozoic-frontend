# Mesozoic Isle – UI Color & Design Rules

This document defines the **official color usage rules** for the Mesozoic Isle client website.

The goal is to ensure:

- consistent UI
- predictable design
- easy maintenance
- clean dark/light theme support

Developers should **ONLY use the predefined classes** from `global.css`.

---

# 1. Theme Philosophy

The visual theme is inspired by:

- prehistoric jungle
- fossil stone
- amber resin
- tropical island environments

The palette intentionally limits the UI to **5 core colors**.

Do **NOT introduce random colors** into components.

---

# 2. Color System

| Purpose             | Class                             | Description                    |
| ------------------- | --------------------------------- | ------------------------------ |
| Page background     | `bg-base`                         | Main background of the website |
| Cards / panels      | `bg-surface` or `card`            | UI containers                  |
| Primary brand color | `bg-primary` / `text-primary`     | Main branding color            |
| Secondary UI        | `bg-secondary` / `text-secondary` | Icons, secondary buttons       |
| Call to action      | `bg-accent` / `text-accent`       | Booking buttons, highlights    |
| Text (default)      | `text-base-color`                 | Main readable text             |
| Muted text          | `text-muted`                      | Secondary descriptions         |
| Borders             | `border-base`                     | Subtle UI separators           |

---

# 3. Background Rules

Use these backgrounds consistently.

### Page background

```
bg-base
```

Example:

```
<body class="bg-base">
```

---

### Cards / Panels

Use either:

```
card
```

or

```
bg-surface border-base
```

Cards should **never use random background colors**.

---

# 4. Button Rules

Buttons must follow the predefined styles.

### Primary Button

Used for:

- navigation actions
- confirmations
- main interactions

```
btn-primary
```

Example:

```
<button class="btn-primary">
  View Packages
</button>
```

---

### Accent Button (Booking)

Used **ONLY for important actions** like:

- Book now
- Reserve
- Buy tickets

```
btn-accent
```

Example:

```
<button class="btn-accent">
  Book Your Adventure
</button>
```

This color should **draw attention**, so it should not be overused.

---

# 5. Text Rules

### Main Text

```
text-base-color
```

Used for:

- paragraphs
- headings
- descriptions

---

### Muted Text

```
text-muted
```

Used for:

- subtitles
- small descriptions
- secondary information

Example:

```
<p class="text-muted">
  Guided by expert paleo-rangers.
</p>
```

---

# 6. Heading Rules

Headings should use the **primary color sparingly**.

Example:

```
<h1 class="text-primary">
  Welcome to Mesozoic Isle
</h1>
```

Avoid coloring every heading.

---

# 7. Border Usage

Borders should always use:

```
border-base
```

Example:

```
<div class="border border-base">
```

Never use random Tailwind border colors.

---

# 8. Layout Consistency

Common layout patterns:

### Page container

```
max-w-7xl mx-auto px-6
```

### Section spacing

```
py-16
```

### Card spacing

```
p-6
```

Consistency is more important than creativity.

---

# 9. Dark Mode Rules

Dark mode is controlled by the `.dark` class.

Example:

```
<html class="dark">
```

All colors automatically adapt through CSS variables.

Do **NOT hardcode dark colors inside components**.

---

# 10. What NOT to Do

Do NOT use:

```
bg-red-500
bg-blue-500
bg-green-300
text-yellow-400
```

Avoid using **Tailwind default color utilities** unless absolutely necessary.

Stick to the project theme.

---

# 11. Recommended Component Structure

Example card component:

```
<div class="card">
  <h2 class="text-xl font-bold text-primary">
    Jurassic Safari
  </h2>

  <p class="text-muted mt-2">
    Explore prehistoric wildlife across the island.
  </p>

  <button class="btn-accent mt-4">
    Book Now
  </button>
</div>
```

---

# 12. Design Principle

Follow this rule:

> **Consistency beats creativity in UI systems.**

A limited palette creates a **professional product look**.

---

# 13. Future Expansion

If the design system expands later, new tokens may be added such as:

- warning color
- success color
- error color
- info color

These should also be defined **centrally in `global.css`**.

---
