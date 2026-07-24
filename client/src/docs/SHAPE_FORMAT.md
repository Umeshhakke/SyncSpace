# Shape Format Documentation

## Overview

All shapes in SyncSpace follow a common format to ensure consistent rendering and synchronization across users.

## Common Properties

Every shape object must have:

| Property | Type   | Description                                      |
| -------- | ------ | ------------------------------------------------ |
| `id`     | string | Unique identifier (use `crypto.randomUUID()`)    |
| `type`   | string | Shape type: `"line"`, `"rectangle"`, or `"text"` |

---

## Line Shape

```javascript
{
  id: "uuid",
  type: "line",
  points: [x1, y1, x2, y2, x3, y3, ...],
  color: "#000000",
  strokeWidth: 5,
  globalCompositeOperation: "source-over" // or "destination-out" for eraser
}
```
