# Seu Verso - Premium API (Lyrics Wizard)

## Overview

The Premium API allows you to generate custom lyrics before creating music, giving you full control over the final song content.

**Flow:**
1. Generate lyrics (creates a "page" with 2 options)
2. Poll status until lyrics are ready
3. Select your preferred lyrics option
4. Start music generation with the selected lyrics

**Limits:**
- Maximum 3 pages (regenerations) per session
- Each page contains 2 lyrics options

---

## Environment Variables

```bash
# Required
SUNO_API_KEY=your_suno_api_key
BACKEND_URL=https://your-domain.com  # For webhook callbacks
FLUXUZ_PUSH_URL=https://fluxuz-api-url
FLUXUZ_API_TOKEN=your_fluxuz_token

# Optional
SUNO_BASE_URL=https://api.sunoapi.org/api/v1  # Default
PORT=3000
```

---

## API Endpoints

### 1. Generate Lyrics

**POST** `/api/lyrics/generate`

Generate lyrics based on a prompt. Returns a `sessionId` and `taskId`.

**Request:**
```bash
curl -X POST https://your-domain.com/api/lyrics/generate \
  -H "Content-Type: application/json" \
  -d '{
    "wizard": {
      "prompt": "Write a romantic song about a couple meeting under the stars"
    }
  }'
```

**Response:**
```json
{
  "sessionId": "abc123xyz",
  "pageNumber": 1,
  "taskId": "suno-task-id-123",
  "remainingRegens": 2
}
```

**Regenerate (same session):**
```bash
curl -X POST https://your-domain.com/api/lyrics/generate \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "abc123xyz",
    "wizard": {
      "prompt": "Write a romantic song about a couple meeting under the stars, more upbeat"
    }
  }'
```

---

### 2. Check Lyrics Status

**GET** `/api/lyrics/status/:taskId`

Poll this endpoint until `status` is `"success"`.

**Request:**
```bash
curl https://your-domain.com/api/lyrics/status/suno-task-id-123
```

**Response (pending):**
```json
{
  "taskId": "suno-task-id-123",
  "status": "pending",
  "lyrics": null
}
```

**Response (success):**
```json
{
  "taskId": "suno-task-id-123",
  "status": "success",
  "lyrics": [
    {
      "text": "[Verse 1]\nUnder the stars we met...\n[Chorus]\nYou and me...",
      "index": 0
    },
    {
      "text": "[Verse 1]\nBeneath the night sky...\n[Chorus]\nForever together...",
      "index": 1
    }
  ]
}
```

---

### 3. Get Session Data

**GET** `/api/lyrics/session/:sessionId`

Get full session data including all pages and selections.

**Request:**
```bash
curl https://your-domain.com/api/lyrics/session/abc123xyz
```

**Response:**
```json
{
  "sessionId": "abc123xyz",
  "pages": [
    {
      "pageNumber": 1,
      "taskId": "suno-task-id-123",
      "status": "SUCCESS",
      "options": [
        {
          "text": "[Verse 1]\nUnder the stars...",
          "index": 0
        },
        {
          "text": "[Verse 1]\nBeneath the night...",
          "index": 1
        }
      ],
      "createdAt": "2026-02-01T12:00:00.000Z"
    }
  ],
  "selectedPage": null,
  "selectedOption": null,
  "remainingRegens": 2,
  "createdAt": "2026-02-01T12:00:00.000Z",
  "updatedAt": "2026-02-01T12:00:00.000Z"
}
```

---

### 4. Get Specific Page

**GET** `/api/lyrics/session/:sessionId/page/:pageNumber`

Get data for a specific page.

**Request:**
```bash
curl https://your-domain.com/api/lyrics/session/abc123xyz/page/1
```

**Response:**
```json
{
  "pageNumber": 1,
  "taskId": "suno-task-id-123",
  "status": "SUCCESS",
  "options": [
    {
      "text": "[Verse 1]\nUnder the stars...",
      "index": 0
    },
    {
      "text": "[Verse 1]\nBeneath the night...",
      "index": 1
    }
  ],
  "createdAt": "2026-02-01T12:00:00.000Z"
}
```

---

### 5. Select Lyrics Option

**POST** `/api/lyrics/session/:sessionId/select`

Select which lyrics option you want to use for music generation.

**Request:**
```bash
curl -X POST https://your-domain.com/api/lyrics/session/abc123xyz/select \
  -H "Content-Type: application/json" \
  -d '{
    "pageNumber": 1,
    "optionIndex": 0
  }'
```

**Response:**
```json
{
  "success": true,
  "sessionId": "abc123xyz",
  "pageNumber": 1,
  "optionIndex": 0,
  "selectedLyrics": "[Verse 1]\nUnder the stars we met..."
}
```

---

### 6. Start Music Generation

**POST** `/api/music/start`

Start music generation with the selected lyrics (custom mode).

**Request:**
```bash
curl -X POST https://your-domain.com/api/music/start \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "abc123xyz",
    "pageNumber": 1,
    "optionIndex": 0,
    "client": {
      "name": "João Silva",
      "whatsapp": "5511999999999"
    },
    "style": "romantic pop",
    "title": "Under the Stars",
    "model": "chirp-v3-5"
  }'
```

**Response:**
```json
{
  "success": true,
  "taskId": "music-task-id-456",
  "sessionId": "abc123xyz",
  "callbackUrl": "https://your-domain.com/api/webhooks/suno",
  "message": "Music generation started. You will receive a WhatsApp message when ready."
}
```

---

### 7. Check Music Status (Optional)

**GET** `/api/music/status/:taskId`

Optional endpoint to check music generation status.

**Request:**
```bash
curl https://your-domain.com/api/music/status/music-task-id-456
```

**Response:**
```json
{
  "taskId": "music-task-id-456",
  "status": "PROCESSING",
  "message": "Music is being generated. You will receive a WhatsApp message when ready.",
  "createdAt": "2026-02-01T12:05:00.000Z"
}
```

---

## Complete Flow Example

```bash
# 1. Generate lyrics
SESSION_ID=$(curl -s -X POST https://your-domain.com/api/lyrics/generate \
  -H "Content-Type: application/json" \
  -d '{"wizard":{"prompt":"Romantic song about stars"}}' \
  | jq -r '.sessionId')

TASK_ID=$(curl -s -X POST https://your-domain.com/api/lyrics/generate \
  -H "Content-Type: application/json" \
  -d '{"wizard":{"prompt":"Romantic song about stars"}}' \
  | jq -r '.taskId')

echo "Session ID: $SESSION_ID"
echo "Task ID: $TASK_ID"

# 2. Poll status (repeat until success)
while true; do
  STATUS=$(curl -s https://your-domain.com/api/lyrics/status/$TASK_ID | jq -r '.status')
  echo "Status: $STATUS"
  if [ "$STATUS" = "success" ]; then
    break
  fi
  sleep 3
done

# 3. View lyrics options
curl -s https://your-domain.com/api/lyrics/session/$SESSION_ID | jq '.pages[0].options'

# 4. Select option 0
curl -s -X POST https://your-domain.com/api/lyrics/session/$SESSION_ID/select \
  -H "Content-Type: application/json" \
  -d '{"pageNumber":1,"optionIndex":0}' | jq

# 5. Start music generation
curl -s -X POST https://your-domain.com/api/music/start \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId":"'$SESSION_ID'",
    "pageNumber":1,
    "optionIndex":0,
    "client":{"name":"Test User","whatsapp":"5511999999999"},
    "style":"romantic pop",
    "title":"My Custom Song"
  }' | jq

# 6. Wait for WhatsApp notification with the final music!
```

---

## Webhook Behavior

The `/api/webhooks/suno` endpoint:
- **Responds 200 immediately** (no blocking)
- Processes asynchronously using `setImmediate()`
- **Idempotent**: Won't process the same `task_id` twice
- Only processes `callbackType === "complete"` with `code === 200`
- Sends WhatsApp via Fluxuz Push API when music is ready

---

## Error Handling

### 429 - Too Many Regenerations
```json
{
  "error": "Maximum 3 regenerations per session exceeded",
  "sessionId": "abc123xyz",
  "remainingRegens": 0
}
```

### 404 - Session/Page Not Found
```json
{
  "error": "Session not found"
}
```

### 400 - Page Not Ready
```json
{
  "error": "Lyrics not ready yet"
}
```

### 500 - Suno API Error
```json
{
  "error": "Failed to generate lyrics",
  "details": "Suno API error message"
}
```

---

## Legacy Endpoint

The old `/api/create-music` endpoint (if it exists) is now **LEGACY** and should not be used for new integrations. Use the Premium API flow instead for full control over lyrics.

---

## Notes

- Sessions are stored in memory and cleaned up after 24 hours
- Task registry is also in-memory with 24-hour cleanup
- For production, consider using Redis or a database for persistence
- The webhook responds 200 immediately to avoid timeouts
- Fluxuz handles WhatsApp delivery asynchronously

---

## Support

For issues or questions, check:
- `docs/API_CONTRACT.md` - Full API specification
- `docs/EXAMPLES.md` - More examples and use cases
