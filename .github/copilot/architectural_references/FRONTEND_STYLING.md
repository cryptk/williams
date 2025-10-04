# Frontend Styling Architecture

## Overview

Williams uses **TailwindCSS v4** as its styling solution. The application uses a utility-first approach with custom theme variables and utility classes for common patterns.

## Why TailwindCSS?

- **Utility-first approach**: Faster development with composable classes
- **Single source of truth**: All styling in one place (tailwind.css)
- **Performance**: Automatic purging of unused CSS in production
- **Consistency**: Enforces design system through theme variables
- **Maintainability**: Self-documenting classes reduce context switching

## Configuration

**Location**: `/frontend/src/styles/tailwind.css`

### TailwindCSS v4 Syntax
- Uses `@import "tailwindcss"` instead of separate layer imports
- Uses `@theme` block for custom theme variables
- Uses `@utility` instead of `@layer utilities` for custom utilities

## Custom Theme Variables

### Colors
```css
--color-primary: #4a90e2      /* Primary action color */
--color-secondary: #50e3c2    /* Secondary accents */
--color-danger: #e74c3c       /* Destructive actions */
--color-success: #2ecc71      /* Success states */
--color-warning: #f39c12      /* Warning states */

--color-bg-page: #f5f7fa      /* Page background */
--color-bg-card: #ffffff      /* Card backgrounds */
--color-bg: #e1e8ed          /* Secondary backgrounds */

--color-text-primary: #333    /* Primary text */
--color-text-secondary: #666  /* Secondary text */
--color-text-muted: #888      /* Muted/disabled text */

--color-border: #e1e8ed       /* Border color */
```

### Usage in Components
Access theme colors with Tailwind classes: `bg-primary`, `text-danger`, `border-border`, etc.

## Custom Utility Classes

### Layout
- `card` - White card with shadow, rounded corners, and padding base

### Buttons
- `btn` - Base button styles (padding, cursor, transitions, disabled state)
- `btn-primary` - Blue primary action button
- `btn-secondary` - Gray secondary button  
- `btn-danger` - Red destructive action button

**Usage**: Always use `btn` with a variant: `class="btn btn-primary"`

### Form Elements
- `form-group` - Form field container with bottom margin
- `form-label` - Label styling (block, margin, font weight)
- `form-input` - Text/number/date inputs with border and focus states
- `form-select` - Select dropdown styling
- `form-textarea` - Textarea with resize and min-height

### Inline Form Elements (BillFormModal)
- `inline-select` - Compact select for inline forms
- `inline-number` - Number input with no spinner arrows
- `inline-date-picker` - Compact date picker for inline forms

### Other
- `error-message` - Error message box with red background and border
- `sr-only` - Screen reader only text (visually hidden)

## Common Patterns

### Status-Based Styling
Use conditional classes for bill status visualization:

```jsx
<div class={`card ${
  status === 'overdue' 
    ? 'bg-gradient-to-br from-red-50 to-white border-l-4 border-danger'
    : status === 'due-today'
    ? 'bg-gradient-to-br from-yellow-50 to-white border-l-4 border-warning'
    : ''
}`}>
```

### Group Hover Effects
Show/hide elements on parent hover:

```jsx
<div class="group">
  <div class="opacity-0 group-hover:opacity-100 transition-opacity">
    {/* Buttons appear on hover */}
  </div>
</div>
```

### Smooth Transitions
For show/hide with animation:

```jsx
<div class={`transition-all duration-300 ${
  isVisible 
    ? 'max-h-32 opacity-100' 
    : 'max-h-0 opacity-0 overflow-hidden'
}`}>
```

### Responsive Layouts
Use Tailwind's responsive prefixes:

```jsx
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* 1 column on mobile, 2 on tablet, 3 on desktop */}
</div>
```

## Modal Sizing System

Modals use a standardized size prop:
- `sm` - 448px (max-w-md) - Confirmations
- `md` - 576px (max-w-xl) - Category forms
- `lg` - 672px (max-w-2xl) - Bill/Payment forms (default)
- `xl` - 896px (max-w-4xl) - Large content

**Usage**: `<Modal size="sm" title="Delete?" ... />`

## Component Structure

### ✅ Correct: Utility Classes
```jsx
// Use Tailwind utilities directly in components
<div class="card p-8 mb-6">
  <h2 class="text-2xl font-bold text-text-primary mb-4">Title</h2>
  <button class="btn btn-primary">Save</button>
</div>
```

### ❌ Avoid: External CSS Files
```jsx
// Don't create separate CSS files for components
import "./MyComponent.css";  // ❌ Don't do this
```

### ✅ Correct: Custom Utilities for Repeated Patterns
```css
/* In tailwind.css - for patterns used across multiple components */
@utility my-pattern {
  padding: 1rem;
  background: white;
  border-radius: 8px;
}
```

## Animations

Two keyframe animations are available:
- `fadeIn` - Fade in from 0 to 100% opacity (0.2s)
- `slideUp` - Slide up from 20px with fade (0.3s)

**Usage**: `animate-[fadeIn_0.2s_ease-out]` or `animate-[slideUp_0.3s_ease-out]`

## External Library Styles

These external libraries include their own CSS:
- `react-toastify` - Toast notifications (imported in Toast.jsx)
- `react-datepicker` - Date picker component (imported in BillFormModal)

These imports are necessary and should remain.

## Best Practices

1. **Use utility classes directly** - Don't create wrapper CSS classes unless the pattern is used in 3+ places
2. **Keep components self-contained** - No separate CSS files per component
3. **Leverage theme colors** - Use `text-primary`, `bg-danger`, etc. instead of arbitrary colors
4. **Use responsive prefixes** - `md:`, `lg:` for breakpoint-specific styling
5. **Add transitions** - Use `transition-all duration-200` for hover effects
6. **Group related elements** - Use `group` and `group-hover:` for parent-child hover interactions

## Troubleshooting

**Issue**: Custom utility not working
- ✅ Check syntax: `@utility` not `@layer utilities` (v4 syntax)
- ✅ Verify utility name is alphanumeric (no special chars like `:`)
- ✅ Use nested `&:hover` or `&:disabled` for pseudo-states

**Issue**: Styles not applying
- ✅ Check for class name typos
- ✅ Verify custom theme variable names match
- ✅ Check if important (`!`) is needed to override specificity

**Issue**: Build errors about missing CSS
- ✅ Remove any `import "./style.css"` from components
- ✅ Only import from `node_modules` (external libraries) or `tailwind.css`

## Adding New Custom Utilities

When a pattern is used in 3+ components, create a custom utility:

```css
@utility my-utility {
  /* Base styles */
  padding: 1rem;
  
  /* Nested pseudo-states */
  &:hover {
    background: var(--color-primary);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
```

**Location**: Add to `/frontend/src/styles/tailwind.css` after existing utilities
