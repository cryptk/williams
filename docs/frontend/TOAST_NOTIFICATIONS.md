# Toast Notifications

## Overview
The toast notification system has been implemented to replace browser `alert()` calls with a more modern and user-friendly notification system.

## Features
- **Three notification types:**
  - **Error (Red)**: For errors and failures
  - **Success (Green)**: For successful operations
  - **Info (Blue)**: For informational messages

- **Auto-dismiss**: Toasts automatically disappear after 5 seconds (configurable)
- **Manual dismiss**: Users can close toasts by clicking the × button
- **Non-blocking**: Toasts appear in the top-right corner without blocking user interaction
- **Stacking**: Multiple toasts stack vertically
- **Responsive**: Adapts to mobile screens

## Usage

### In Components

1. **Import the hook:**
```javascript
import { useToast } from "../components/Toast";
```

2. **Use the hook in your component:**
```javascript
export function MyComponent() {
  const { showError, showSuccess, showInfo } = useToast();
  
  // ... your component code
}
```

3. **Display notifications:**
```javascript
// Show error message
showError("Failed to delete item. Please try again.");

// Show success message
showSuccess("Item saved successfully!");

// Show info message
showInfo("No items found to delete");
```

### Custom Duration

You can optionally specify a custom duration (in milliseconds):

```javascript
showError("This will show for 10 seconds", 10000);
showSuccess("This will show for 3 seconds", 3000);
```

## Implementation Details

### Components
- **`Toast.jsx`**: Contains the ToastProvider, useToast hook, and Toast components
- Located in: `frontend/src/components/Toast.jsx`

### Styling
- Toast styles are defined in `frontend/src/styles/main.css`
- Includes animations, responsive design, and color variations

### Integration
- The `ToastProvider` wraps the entire application in `app.jsx`
- All child components have access to the toast notification system via the `useToast` hook

## Examples in Codebase

### Bills Page (`Bills.jsx`)
- Creating/updating bills
- Recording payments
- Deleting bills
- Deleting payments

### Categories Page (`Categories.jsx`)
- Creating categories
- Deleting categories

### Bill Details Page (`BillDetails.jsx`)
- Recording payments
- Deleting payments

## Design Notes

- **Form validation** errors should still be displayed inline with forms, not via toast notifications
- Toast notifications are for **action results** (success/failure) and **informational messages**
- Error messages should be clear and actionable
- Success messages should confirm the action taken
