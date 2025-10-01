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

**State management:**
```jsx
const [toasts, setToasts] = useState([]);

const addToast = (message, type = 'info') => {
  const id = Date.now();
  setToasts(prev => [...prev, { id, message, type }]);
  
  setTimeout(() => {
    removeToast(id);
  }, 5000);  // Auto-dismiss after 5 seconds
};
```

**Why array of toasts:**
- Support multiple simultaneous notifications
- Stack vertically in UI
- Independent dismiss timers

**Why unique ID:**
- Remove specific toast without affecting others
- React key for list rendering
- Handle rapid consecutive notifications

### Toast Context (`src/app.jsx`)

**Why context:**
- Any component can trigger toast
- No prop drilling through component tree
- Single source of truth for toast state

**Implementation:**
```jsx
export const ToastContext = createContext();

export function App() {
  return (
    <ToastContext.Provider value={{ showToast }}>
      <Router>
        {/* routes */}
      </Router>
      <Toast />
    </ToastContext.Provider>
  );
}
```

**Toast component placement:**
- Outside router (shows on all pages)
- Fixed position (top-right of viewport)
- Z-index above all content

### Usage Hook

```jsx
const { showToast } = useContext(ToastContext);
```

**Why custom hook would be better:**
```jsx
// Could create this for cleaner usage
const useToast = () => useContext(ToastContext);

// Then in components:
const { showToast } = useToast();
```

## Usage Patterns

### Success Messages

```jsx
const handleCreateBill = async (billData) => {
  try {
    await billService.createBill(billData);
    showToast('Bill created successfully', 'success');
    navigate('/bills');
  } catch (error) {
    showToast('Failed to create bill', 'error');
  }
};
```

**When to show success toasts:**
- Create, update, delete operations
- Data saved
- Action completed successfully

**Don't show for:**
- Page loads (expected behavior)
- Viewing data (no action taken)

### Error Messages

```jsx
const handleDeleteBill = async (billId) => {
  try {
    await billService.deleteBill(billId);
    showToast('Bill deleted', 'success');
  } catch (error) {
    if (error.response?.status === 404) {
      showToast('Bill not found', 'error');
    } else if (error.response?.status === 403) {
      showToast('You do not have permission to delete this bill', 'error');
    } else {
      showToast('Failed to delete bill', 'error');
    }
  }
};
```

**Error message guidelines:**
- Be specific when possible
- User-friendly language (not "500 Internal Server Error")
- Don't expose sensitive details (stack traces, SQL)

### Warning Messages

```jsx
const handleUpdateBill = async (billData) => {
  if (billData.amount > 1000) {
    showToast('Large bill amount detected', 'warning');
  }
  
  try {
    await billService.updateBill(billData);
    showToast('Bill updated', 'success');
  } catch (error) {
    showToast('Failed to update bill', 'error');
  }
};
```

**When to use warnings:**
- Action succeeded but with caveats
- Potential issue detected
- Non-blocking validation

### Info Messages

```jsx
const handleRefresh = () => {
  showToast('Refreshing data...', 'info');
  fetchBills();
};
```

**When to use info:**
- Background operations
- Status updates
- Helpful tips

## Toast Types

### Available Types

```jsx
showToast(message, 'success');  // Green, checkmark icon
showToast(message, 'error');    // Red, X icon
showToast(message, 'warning');  // Yellow, exclamation icon
showToast(message, 'info');     // Blue, info icon (default)
```

### Styling (CSS)

```css
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

.toast-success { background: #10b981; }
.toast-error { background: #ef4444; }
.toast-warning { background: #f59e0b; }
.toast-info { background: #3b82f6; }
```

**Why fixed position:**
- Always visible
- Doesn't affect layout
- Consistent placement

**Why top-right:**
- Convention (non-intrusive)
- Eye path for left-to-right readers
- Doesn't cover main content

## API Service Integration

### Automatic Error Toasts

```jsx
// In src/services/api.js
const api = axios.create({
  baseURL: '/api/v1',
});

api.interceptors.response.use(
  response => response,
  error => {
    // Could auto-show toast here
    // But better to let components decide message
    return Promise.reject(error);
  }
);
```

**Why components show toasts:**
- Can customize message per context
- "Failed to create bill" vs "Failed to update bill"
- Some errors might not need toasts

**When interceptor is useful:**
- Session expired → show toast and redirect to login
- Server maintenance → show generic toast
- Network down → show connectivity message

## Accessibility

**Current implementation considerations:**
```jsx
<div role="alert" aria-live="polite" className="toast">
  {message}
</div>
```

**Why role="alert":**
- Screen readers announce immediately
- Indicates important message

**Why aria-live="polite":**
- Waits for screen reader to finish current announcement
- "assertive" would interrupt (too aggressive)

**Why aria-atomic="true" helps:**
```jsx
<div role="alert" aria-live="polite" aria-atomic="true">
```
- Reads entire message, not just changes
- Better for dynamic content

## Timing Considerations

### Auto-Dismiss Timeout

```jsx
const TOAST_DURATION = 5000;  // 5 seconds
```

**Why 5 seconds:**
- Long enough to read
- Short enough to not clutter
- Standard UX convention

**When to use longer:**
```jsx
showToast('Please wait while we process your payment...', 'info', 10000);
```
- Complex messages
- Multi-step instructions
- No blocking alternative

**When to not auto-dismiss:**
```jsx
// For errors that require user action
showToast('Your session has expired. Please log in again.', 'error', null);
```

### Stacking Multiple Toasts

```jsx
const handleBulkDelete = async (billIds) => {
  for (const id of billIds) {
    try {
      await deleteBill(id);
      showToast(`Bill ${id} deleted`, 'success');
    } catch (error) {
      showToast(`Failed to delete bill ${id}`, 'error');
    }
  }
};
```

**Potential issue:** Too many toasts

**Better approach:**
```jsx
const handleBulkDelete = async (billIds) => {
  const results = await Promise.allSettled(
    billIds.map(id => deleteBill(id))
  );
  
  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  if (failed === 0) {
    showToast(`All ${succeeded} bills deleted`, 'success');
  } else {
    showToast(`Deleted ${succeeded} bills, ${failed} failed`, 'warning');
  }
};
```

## Common Patterns

### Form Validation

```jsx
const handleSubmit = (data) => {
  // Client-side validation
  if (!data.name) {
    showToast('Bill name is required', 'error');
    return;
  }
  
  // Server-side validation
  try {
    await createBill(data);
    showToast('Bill created', 'success');
  } catch (error) {
    if (error.response?.data?.error) {
      showToast(error.response.data.error, 'error');
    } else {
      showToast('Failed to create bill', 'error');
    }
  }
};
```

### Optimistic Updates

```jsx
const handleTogglePaid = async (billId) => {
  // Show success immediately
  showToast('Bill marked as paid', 'success');
  
  // Update UI
  updateBillInState(billId, { isPaid: true });
  
  try {
    await markBillPaid(billId);
  } catch (error) {
    // Revert on failure
    updateBillInState(billId, { isPaid: false });
    showToast('Failed to mark bill as paid', 'error');
  }
};
```

**Why optimistic:**
- Feels faster
- Better UX for high-latency connections
- Shows success toast immediately

**Trade-off:**
- Might show success then error
- Need to handle rollback

## Testing Considerations

```jsx
// Mock toast context for tests
const mockShowToast = vi.fn();

const wrapper = ({ children }) => (
  <ToastContext.Provider value={{ showToast: mockShowToast }}>
    {children}
  </ToastContext.Provider>
);

test('shows success toast on create', async () => {
  render(<BillForm />, { wrapper });
  
  // Fill form and submit
  await userEvent.click(submitButton);
  
  expect(mockShowToast).toHaveBeenCalledWith('Bill created successfully', 'success');
});
```

## Summary

**Key principles:**
1. Use toasts for non-blocking feedback
2. Auto-dismiss after 5 seconds (adjustable)
3. Type determines styling (success, error, warning, info)
4. Components decide when to show toasts (not automatic)
5. One toast per action (summarize bulk operations)
6. User-friendly messages (not technical errors)

**The toast system is context-based and available globally without prop drilling.**
