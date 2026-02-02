# Seu Verso - Premium API Examples

## Table of Contents

1. [Basic Flow](#basic-flow)
2. [Regenerating Lyrics](#regenerating-lyrics)
3. [Multiple Sessions](#multiple-sessions)
4. [Error Handling](#error-handling)
5. [JavaScript/TypeScript Client](#javascripttypescript-client)
6. [Python Client](#python-client)

---

## Basic Flow

### Step 1: Generate Lyrics

```bash
curl -X POST https://seuverso.com/api/lyrics/generate \
  -H "Content-Type: application/json" \
  -d '{
    "wizard": {
      "prompt": "Write a birthday song for my mom who loves gardening"
    }
  }'
```

**Response:**
```json
{
  "sessionId": "V1StGXR8_Z5jdHi6B-myT",
  "pageNumber": 1,
  "taskId": "abc123",
  "remainingRegens": 2
}
```

### Step 2: Poll Status

```bash
# Poll every 3 seconds until status is "success"
curl https://seuverso.com/api/lyrics/status/abc123
```

**Response (success):**
```json
{
  "taskId": "abc123",
  "status": "success",
  "lyrics": [
    {
      "text": "[Verse 1]\nIn the garden where flowers grow...",
      "index": 0
    },
    {
      "text": "[Verse 1]\nAmong the roses and the sun...",
      "index": 1
    }
  ]
}
```

### Step 3: Select Lyrics

```bash
curl -X POST https://seuverso.com/api/lyrics/session/V1StGXR8_Z5jdHi6B-myT/select \
  -H "Content-Type: application/json" \
  -d '{
    "pageNumber": 1,
    "optionIndex": 0
  }'
```

### Step 4: Start Music

```bash
curl -X POST https://seuverso.com/api/music/start \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "V1StGXR8_Z5jdHi6B-myT",
    "pageNumber": 1,
    "optionIndex": 0,
    "client": {
      "name": "Maria Silva",
      "whatsapp": "5511987654321"
    },
    "style": "acoustic folk",
    "title": "Mom'\''s Garden Song"
  }'
```

**Response:**
```json
{
  "success": true,
  "taskId": "music-xyz789",
  "sessionId": "V1StGXR8_Z5jdHi6B-myT",
  "callbackUrl": "https://seuverso.com/api/webhooks/suno",
  "message": "Music generation started. You will receive a WhatsApp message when ready."
}
```

---

## Regenerating Lyrics

If you don't like the first set of lyrics, regenerate up to 2 more times:

```bash
# First generation (page 1)
curl -X POST https://seuverso.com/api/lyrics/generate \
  -H "Content-Type: application/json" \
  -d '{"wizard":{"prompt":"Romantic song about Paris"}}'

# Response: sessionId="abc", pageNumber=1, remainingRegens=2

# Second generation (page 2) - same session
curl -X POST https://seuverso.com/api/lyrics/generate \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "abc",
    "wizard": {"prompt": "Romantic song about Paris, more upbeat"}
  }'

# Response: sessionId="abc", pageNumber=2, remainingRegens=1

# Third generation (page 3) - same session
curl -X POST https://seuverso.com/api/lyrics/generate \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "abc",
    "wizard": {"prompt": "Romantic song about Paris, jazz style"}
  }'

# Response: sessionId="abc", pageNumber=3, remainingRegens=0

# Fourth attempt - FAILS
curl -X POST https://seuverso.com/api/lyrics/generate \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "abc",
    "wizard": {"prompt": "Another try"}
  }'

# Response: 429 Too Many Requests
```

---

## Multiple Sessions

You can have multiple independent sessions:

```bash
# Session 1: Birthday song
curl -X POST https://seuverso.com/api/lyrics/generate \
  -d '{"wizard":{"prompt":"Birthday song for dad"}}'
# sessionId: "session-1"

# Session 2: Wedding song
curl -X POST https://seuverso.com/api/lyrics/generate \
  -d '{"wizard":{"prompt":"Wedding song for couple"}}'
# sessionId: "session-2"

# Each session has its own 3-page limit
```

---

## Error Handling

### 429 - Too Many Regenerations

```bash
curl -X POST https://seuverso.com/api/lyrics/generate \
  -d '{"sessionId":"abc","wizard":{"prompt":"Try again"}}'
```

**Response:**
```json
{
  "error": "Maximum 3 regenerations per session exceeded",
  "sessionId": "abc",
  "remainingRegens": 0
}
```

**Solution:** Start a new session.

### 404 - Session Not Found

```bash
curl https://seuverso.com/api/lyrics/session/invalid-session-id
```

**Response:**
```json
{
  "error": "Session not found"
}
```

**Solution:** Check your session ID or create a new session.

### 400 - Page Not Ready

```bash
curl -X POST https://seuverso.com/api/lyrics/session/abc/select \
  -d '{"pageNumber":1,"optionIndex":0}'
```

**Response:**
```json
{
  "error": "Lyrics not ready yet"
}
```

**Solution:** Wait for status to be "success" before selecting.

---

## JavaScript/TypeScript Client

```typescript
interface LyricsClient {
  baseUrl: string;
}

class SeuVersoClient {
  constructor(private baseUrl: string) {}

  async generateLyrics(prompt: string, sessionId?: string) {
    const response = await fetch(`${this.baseUrl}/api/lyrics/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        wizard: { prompt },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to generate lyrics");
    }

    return response.json();
  }

  async pollLyricsStatus(taskId: string, maxAttempts = 60): Promise<any> {
    for (let i = 0; i < maxAttempts; i++) {
      const response = await fetch(`${this.baseUrl}/api/lyrics/status/${taskId}`);
      const data = await response.json();

      if (data.status === "success") {
        return data;
      }

      if (data.status === "failed") {
        throw new Error("Lyrics generation failed");
      }

      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3s
    }

    throw new Error("Timeout waiting for lyrics");
  }

  async selectLyrics(sessionId: string, pageNumber: number, optionIndex: number) {
    const response = await fetch(`${this.baseUrl}/api/lyrics/session/${sessionId}/select`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageNumber, optionIndex }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to select lyrics");
    }

    return response.json();
  }

  async startMusic(params: {
    sessionId: string;
    pageNumber: number;
    optionIndex: number;
    client: { name: string; whatsapp: string };
    style?: string;
    title?: string;
  }) {
    const response = await fetch(`${this.baseUrl}/api/music/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to start music");
    }

    return response.json();
  }
}

// Usage
async function main() {
  const client = new SeuVersoClient("https://seuverso.com");

  // 1. Generate lyrics
  const { sessionId, taskId } = await client.generateLyrics(
    "Write a love song about the ocean"
  );

  console.log(`Session: ${sessionId}, Task: ${taskId}`);

  // 2. Wait for lyrics
  const { lyrics } = await client.pollLyricsStatus(taskId);

  console.log("Lyrics options:");
  lyrics.forEach((l: any, i: number) => {
    console.log(`Option ${i}:\n${l.text}\n`);
  });

  // 3. Select option 0
  await client.selectLyrics(sessionId, 1, 0);

  // 4. Start music
  const result = await client.startMusic({
    sessionId,
    pageNumber: 1,
    optionIndex: 0,
    client: {
      name: "João Silva",
      whatsapp: "5511999999999",
    },
    style: "romantic pop",
    title: "Ocean Love",
  });

  console.log("Music started:", result.taskId);
}

main().catch(console.error);
```

---

## Python Client

```python
import requests
import time
from typing import Optional, Dict, Any

class SeuVersoClient:
    def __init__(self, base_url: str):
        self.base_url = base_url

    def generate_lyrics(self, prompt: str, session_id: Optional[str] = None) -> Dict[str, Any]:
        response = requests.post(
            f"{self.base_url}/api/lyrics/generate",
            json={
                "sessionId": session_id,
                "wizard": {"prompt": prompt}
            }
        )
        response.raise_for_status()
        return response.json()

    def poll_lyrics_status(self, task_id: str, max_attempts: int = 60) -> Dict[str, Any]:
        for _ in range(max_attempts):
            response = requests.get(f"{self.base_url}/api/lyrics/status/{task_id}")
            data = response.json()

            if data["status"] == "success":
                return data

            if data["status"] == "failed":
                raise Exception("Lyrics generation failed")

            time.sleep(3)  # Wait 3 seconds

        raise Exception("Timeout waiting for lyrics")

    def select_lyrics(self, session_id: str, page_number: int, option_index: int) -> Dict[str, Any]:
        response = requests.post(
            f"{self.base_url}/api/lyrics/session/{session_id}/select",
            json={"pageNumber": page_number, "optionIndex": option_index}
        )
        response.raise_for_status()
        return response.json()

    def start_music(
        self,
        session_id: str,
        page_number: int,
        option_index: int,
        client_name: str,
        client_whatsapp: str,
        style: str = "pop",
        title: str = "Custom Song"
    ) -> Dict[str, Any]:
        response = requests.post(
            f"{self.base_url}/api/music/start",
            json={
                "sessionId": session_id,
                "pageNumber": page_number,
                "optionIndex": option_index,
                "client": {
                    "name": client_name,
                    "whatsapp": client_whatsapp
                },
                "style": style,
                "title": title
            }
        )
        response.raise_for_status()
        return response.json()

# Usage
if __name__ == "__main__":
    client = SeuVersoClient("https://seuverso.com")

    # 1. Generate lyrics
    result = client.generate_lyrics("Write a birthday song for my best friend")
    session_id = result["sessionId"]
    task_id = result["taskId"]

    print(f"Session: {session_id}, Task: {task_id}")

    # 2. Wait for lyrics
    lyrics_result = client.poll_lyrics_status(task_id)
    lyrics = lyrics_result["lyrics"]

    print("Lyrics options:")
    for i, lyric in enumerate(lyrics):
        print(f"Option {i}:\n{lyric['text']}\n")

    # 3. Select option 0
    client.select_lyrics(session_id, 1, 0)

    # 4. Start music
    music_result = client.start_music(
        session_id=session_id,
        page_number=1,
        option_index=0,
        client_name="Maria Silva",
        client_whatsapp="5511987654321",
        style="acoustic pop",
        title="Best Friend Birthday"
    )

    print(f"Music started: {music_result['taskId']}")
```

---

## Advanced: Batch Processing

Generate multiple songs in parallel:

```typescript
async function batchGenerate(prompts: string[]) {
  const client = new SeuVersoClient("https://seuverso.com");

  // Start all generations in parallel
  const sessions = await Promise.all(
    prompts.map(prompt => client.generateLyrics(prompt))
  );

  // Wait for all lyrics
  const allLyrics = await Promise.all(
    sessions.map(s => client.pollLyricsStatus(s.taskId))
  );

  // Select first option for all
  await Promise.all(
    sessions.map(s => client.selectLyrics(s.sessionId, 1, 0))
  );

  // Start all music generations
  const musicTasks = await Promise.all(
    sessions.map((s, i) => client.startMusic({
      sessionId: s.sessionId,
      pageNumber: 1,
      optionIndex: 0,
      client: {
        name: `Client ${i + 1}`,
        whatsapp: `551199999999${i}`,
      },
      title: `Song ${i + 1}`,
    }))
  );

  return musicTasks;
}

// Generate 10 songs
batchGenerate([
  "Birthday song for mom",
  "Wedding song for couple",
  "Anniversary song for parents",
  // ... 7 more prompts
]).then(console.log);
```

---

## Tips

1. **Always poll status** - Don't assume lyrics are ready immediately
2. **Handle 429 errors** - Respect the 3-page limit per session
3. **Use meaningful prompts** - More detail = better lyrics
4. **Test with curl first** - Verify endpoints before building clients
5. **Store session IDs** - You'll need them for selection and music generation
6. **Implement retries** - Network errors can happen
7. **Log everything** - Helps debug issues in production

---

## Support

For more information:
- API Contract: `docs/API_CONTRACT.md`
- README: `README-PREMIUM.md`
