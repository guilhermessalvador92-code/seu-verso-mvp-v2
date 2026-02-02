# Seu Verso - Premium API Contract

## Base URL

```
https://your-domain.com/api
```

---

## Authentication

Currently, no authentication is required for the Premium API endpoints. In production, consider adding API keys or JWT tokens.

---

## Endpoints

### Lyrics Generation

#### POST /lyrics/generate

Generate lyrics based on a wizard prompt.

**Request Body:**
```typescript
{
  sessionId?: string;  // Optional: reuse existing session
  wizard: {
    prompt: string;    // Required: description of desired lyrics
  };
}
```

**Response (200):**
```typescript
{
  sessionId: string;        // Session identifier
  pageNumber: number;       // Page number (1-3)
  taskId: string;           // Suno task ID for polling
  remainingRegens: number;  // Remaining regenerations (0-2)
}
```

**Response (429):**
```typescript
{
  error: string;            // "Maximum 3 regenerations per session exceeded"
  sessionId?: string;
  remainingRegens: number;  // 0
}
```

**Response (500):**
```typescript
{
  error: string;
  details?: string;
}
```

---

#### GET /lyrics/status/:taskId

Check lyrics generation status.

**Parameters:**
- `taskId` (path): Suno task ID

**Response (200):**
```typescript
{
  taskId: string;
  status: "pending" | "success" | "failed";
  lyrics?: Array<{
    text: string;   // Full lyrics text
    index: number;  // Option index (0 or 1)
  }>;
}
```

**Response (500):**
```typescript
{
  error: string;
  details?: string;
}
```

---

#### GET /lyrics/session/:sessionId

Get full session data.

**Parameters:**
- `sessionId` (path): Session identifier

**Response (200):**
```typescript
{
  sessionId: string;
  pages: Array<{
    pageNumber: number;
    taskId: string;
    status: "PENDING" | "SUCCESS" | "FAILED";
    options: Array<{
      text: string;
      index: number;
    }>;
    createdAt: string;  // ISO 8601
  }>;
  selectedPage?: number;
  selectedOption?: number;
  remainingRegens: number;
  createdAt: string;  // ISO 8601
  updatedAt: string;  // ISO 8601
}
```

**Response (404):**
```typescript
{
  error: "Session not found";
}
```

---

#### GET /lyrics/session/:sessionId/page/:pageNumber

Get specific page data.

**Parameters:**
- `sessionId` (path): Session identifier
- `pageNumber` (path): Page number (1-3)

**Response (200):**
```typescript
{
  pageNumber: number;
  taskId: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  options: Array<{
    text: string;
    index: number;
  }>;
  createdAt: string;  // ISO 8601
}
```

**Response (400):**
```typescript
{
  error: "Invalid page number";
}
```

**Response (404):**
```typescript
{
  error: "Page not found";
}
```

---

#### POST /lyrics/session/:sessionId/select

Select a lyrics option.

**Parameters:**
- `sessionId` (path): Session identifier

**Request Body:**
```typescript
{
  pageNumber: number;   // Required: 1-3
  optionIndex: number;  // Required: 0 or 1
}
```

**Response (200):**
```typescript
{
  success: true;
  sessionId: string;
  pageNumber: number;
  optionIndex: number;
  selectedLyrics: string;  // Full lyrics text
}
```

**Response (400):**
```typescript
{
  error: "Missing required fields: pageNumber, optionIndex" |
         "Lyrics not ready yet";
}
```

**Response (404):**
```typescript
{
  error: "Session not found" |
         "Page not found" |
         "Invalid option index";
}
```

---

### Music Generation

#### POST /music/start

Start music generation with selected lyrics (custom mode).

**Request Body:**
```typescript
{
  sessionId: string;      // Required
  pageNumber: number;     // Required: 1-3
  optionIndex: number;    // Required: 0 or 1
  client: {
    name: string;         // Required
    whatsapp: string;     // Required: digits only
  };
  style?: string;         // Optional: music style (default: "pop")
  title?: string;         // Optional: song title (default: "Custom Song")
  model?: string;         // Optional: Suno model (default: "chirp-v3-5")
}
```

**Response (200):**
```typescript
{
  success: true;
  taskId: string;         // Music generation task ID
  sessionId: string;
  callbackUrl: string;    // Webhook URL
  message: string;
}
```

**Response (400):**
```typescript
{
  error: "Missing required fields: sessionId, pageNumber, optionIndex" |
         "Missing required client fields: name, whatsapp" |
         "Lyrics not ready yet";
}
```

**Response (404):**
```typescript
{
  error: "Session not found" |
         "Page not found" |
         "Invalid option index";
}
```

**Response (500):**
```typescript
{
  error: "Failed to start music generation";
  details?: string;
}
```

---

#### GET /music/status/:taskId

Check music generation status (optional polling).

**Parameters:**
- `taskId` (path): Music task ID

**Response (200):**
```typescript
{
  taskId: string;
  status: "PROCESSING";
  message: string;
  createdAt: string;  // ISO 8601
}
```

**Response (404):**
```typescript
{
  error: "Task not found";
}
```

---

### Webhooks

#### POST /webhooks/suno

Suno API callback endpoint. **Internal use only.**

**Behavior:**
- Responds `200 { "received": true }` immediately
- Processes asynchronously via `setImmediate()`
- Idempotent: won't process same `task_id` twice
- Only processes `callbackType === "complete"` with `code === 200`
- Sends WhatsApp via Fluxuz when music is ready

**Request Body (from Suno):**
```typescript
{
  code: number;              // 200 for success
  callbackType: string;      // "text" | "first" | "complete"
  task_id: string;
  audio_url?: string;        // Present on "complete"
  video_url?: string;        // Optional
}
```

**Response (200):**
```typescript
{
  received: true;
}
```

---

## Data Models

### LyricsSession

```typescript
interface LyricsSession {
  sessionId: string;
  pages: Map<number, LyricsPage>;
  selectedPage?: number;
  selectedOption?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### LyricsPage

```typescript
interface LyricsPage {
  pageNumber: number;
  taskId: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  options: LyricsOption[];
  createdAt: Date;
}
```

### LyricsOption

```typescript
interface LyricsOption {
  text: string;
  index: number;
}
```

### MusicTask

```typescript
interface MusicTask {
  name: string;
  whatsapp: string;
  sessionId: string;
  createdAt: Date;
}
```

---

## Rate Limits

- **Lyrics regenerations**: Maximum 3 pages per session
- **Session lifetime**: 24 hours (auto-cleanup)
- **Task registry lifetime**: 24 hours (auto-cleanup)

---

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad request (missing/invalid fields) |
| 404 | Resource not found |
| 429 | Too many requests (regeneration limit) |
| 500 | Internal server error |

---

## Idempotency

The webhook endpoint (`/webhooks/suno`) is idempotent:
- Tracks processed `task_id` values in memory
- Won't send duplicate WhatsApp messages
- Cleanup happens every 24 hours

---

## Asynchronous Processing

The webhook responds **200 immediately** and processes in the background:
```typescript
res.status(200).json({ received: true });

setImmediate(async () => {
  // Process webhook data
  // Send WhatsApp
  // Cleanup registry
});
```

This prevents Suno API timeouts and ensures reliable delivery.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SUNO_API_KEY` | ✅ | - | Suno API key |
| `SUNO_BASE_URL` | ❌ | `https://api.sunoapi.org/api/v1` | Suno API base URL |
| `BACKEND_URL` | ✅ | - | Backend URL for webhooks |
| `FLUXUZ_PUSH_URL` | ✅ | - | Fluxuz Push API URL |
| `FLUXUZ_API_TOKEN` | ✅ | - | Fluxuz API token |
| `PORT` | ❌ | `3000` | Server port |

---

## Legacy Endpoints

The following endpoints are **LEGACY** and should not be used:
- `/api/create-music` (if exists)

Use the Premium API flow instead.
