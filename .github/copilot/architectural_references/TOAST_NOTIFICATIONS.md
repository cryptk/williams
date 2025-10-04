# Toast Notification System

## Why Toast Notifications

**Purpose:** Non-blocking user feedback for actions
- Success confirmations (bill created, payment recorded)
- Error messages (network failure, validation error)
- Warnings (approaching due date)
- Informational messages

**Advantages over alert():**
- Non-blocking (user can continue working)
- Styled consistently with application
- Auto-dismiss after timeout
- Stack multiple messages
- Position control

## Architecture

### Component Structure (`src/components/Toast.jsx`)

Manages array of toast messages with auto-dismiss timers. Each toast has unique ID for independent removal.

**Why array:** Support multiple simultaneous notifications that stack vertically.

### Toast Context (`src/app.jsx`)

Toast context provides `showToast` function globally without prop drilling. Toast component placed outside router for visibility on all pages.

### Usage

```jsx
const { showToast } = useContext(ToastContext);
showToast('Bill created successfully', 'success');
```

## Usage Patterns

### Success Messages
Show after create/update/delete operations:
```jsx
await billService.createBill(billData);
showToast('Bill created successfully', 'success');
```

### Error Messages
Provide user-friendly messages, not technical errors:
```jsx
catch (error) {
    if (error.response?.status === 404) {
        showToast('Bill not found', 'error');
    } else {
        showToast('Failed to delete bill', 'error');
    }
}
```

### Warning Messages
For actions that succeeded with caveats:
```jsx
if (billData.amount > 1000) {
    showToast('Large bill amount detected', 'warning');
}
```

### Info Messages
For background operations or status updates:
```jsx
showToast('Refreshing data...', 'info');
```

## Toast Types

Available types with associated styling:
- `success` - Green, checkmark icon
- `error` - Red, X icon
- `warning` - Yellow, exclamation icon
- `info` - Blue, info icon (default)

**Position:** Fixed top-right, z-index 1000, doesn't affect layout.

## API Service Integration

Components show toasts rather than API interceptors to allow context-specific messages ("Failed to create bill" vs "Failed to update bill").

**Exception:** Global errors like session expiration could use interceptor for consistency.

## Accessibility

Current implementation uses `role="alert"` and `aria-live="polite"` for screen reader announcements. Consider adding `aria-atomic="true"` to read entire message.

## Timing Considerations

**Auto-dismiss:** 5 seconds (standard UX convention)

**Longer timeout:** For complex messages or multi-step instructions
```jsx
showToast('Processing payment...', 'info', 10000);
```

**No auto-dismiss:** For errors requiring user action
```jsx
showToast('Session expired. Please log in.', 'error', null);
```

### Bulk Operations
Summarize results instead of showing toast for each item:
```jsx
// Good: Single summary toast
showToast(`Deleted ${succeeded} bills, ${failed} failed`, 'warning');

// Bad: Multiple toasts
billIds.forEach(id => showToast(`Bill ${id} deleted`, 'success'));
```

## Common Patterns

### Form Validation
```jsx
// Client-side validation
if (!data.name) {
    showToast('Bill name is required', 'error');
    return;
}

// Server-side validation errors
catch (error) {
    showToast(error.response?.data?.error || 'Failed to create bill', 'error');
}
```

### Optimistic Updates
Show success immediately, revert on failure:
```jsx
showToast('Bill marked as paid', 'success');
updateBillInState(billId, { isPaid: true });

try {
    await markBillPaid(billId);
} catch (error) {
    updateBillInState(billId, { isPaid: false });
    showToast('Failed to mark bill as paid', 'error');
}
```

## Summary

**Key principles:**
1. Use toasts for non-blocking feedback
2. Auto-dismiss after 5 seconds (adjustable)
3. Type determines styling (success, error, warning, info)
4. Components decide when to show toasts
5. Summarize bulk operations
6. User-friendly messages, not technical errors
