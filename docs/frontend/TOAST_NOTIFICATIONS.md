# Toast Notifications

Toast notifications provide non-blocking user feedback in the top-right corner of the screen.

## Notification Types

- **Error (Red)**: `showError(message, duration?)`
- **Success (Green)**: `showSuccess(message, duration?)`
- **Info (Blue)**: `showInfo(message, duration?)`

## Usage

### Import

```javascript
import { useToast } from "../components/Toast";
```

### Get Toast Functions

```javascript
const { showError, showSuccess, showInfo } = useToast();
```

### Show Notifications

```javascript
// With default duration (5000ms)
showSuccess("Bill created successfully!");
showError("Failed to save changes");
showInfo("No items found");

// With custom duration
showError("Connection timeout", 10000);
showSuccess("Saved!", 3000);
```

## Behavior

- **Auto-dismiss**: Default 5 seconds (5000ms)
- **Manual dismiss**: Click × button to close
- **Stacking**: Multiple toasts stack vertically
- **Position**: Top-right corner
