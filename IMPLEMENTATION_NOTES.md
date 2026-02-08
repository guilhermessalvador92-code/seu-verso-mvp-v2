# Testing the Lyrics Generation + Fluxuz Fix

## What Changed

### 1. Database Schema
- Added `lyricsTaskId` column to the jobs table
- Added helper functions to manage lyrics task IDs

### 2. Fluxuz Integration
The Fluxuz payload now uses the correct format:
```json
{
  "body": "🎵 Sua música personalizada \"[TITLE]\" está pronta!",
  "number": "[WHATSAPP]",
  "externalKey": "job_[JOB_ID]",
  "note": {
    "body": "Lead: [NAME] - Música: [TITLE]",
    "mediaUrl": "[AUDIO_URL]"
  }
}
```

Headers include:
- `Authorization: Bearer ${FLUXUZ_API_TOKEN}`
- `Content-Type: application/json`

### 3. New Job Flow
1. **QUEUED** → Job created
2. **GENERATING_LYRICS** → Call Suno Lyrics API
3. **GENERATING_MUSIC** → Call Suno Music API with generated lyrics
4. **DONE** → Music ready, sent to Fluxuz

### 4. New Endpoints
- `POST /api/webhook/lyrics` - Handles callbacks from Suno Lyrics API

### 5. Fallback Strategy
If lyrics generation fails:
- System automatically falls back to direct music generation
- Uses the original story/prompt instead of generated lyrics
- Ensures the flow continues even if lyrics API is unavailable

## Required Environment Variables

```env
FLUXUZ_API_URL=https://crmapi.fluxuz.com.br/v1/api/external/[YOUR_ID_HERE]/
FLUXUZ_API_TOKEN=[YOUR_TOKEN_HERE]
SUNO_API_KEY=[YOUR_SUNO_KEY]
APP_URL=https://seu-verso-mvp-v2.onrender.com
```

## Database Migration

Run this SQL to add the new column:
```sql
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS "lyricsTaskId" VARCHAR(128);
```

Or use the migration file at:
`drizzle/migrations/0001_add_lyrics_task_id.sql`

## Testing Checklist

### Manual Testing
1. ✅ Build succeeds (`npm run build`)
2. ✅ TypeScript compiles (only 2 pre-existing errors in routes-lyrics.ts)
3. ⏳ Create a new music job via the frontend
4. ⏳ Verify job status changes: QUEUED → GENERATING_LYRICS → GENERATING_MUSIC → DONE
5. ⏳ Check that WhatsApp message is sent via Fluxuz with MP3 attachment
6. ⏳ Verify lyrics in the final song are real generated lyrics, not the prompt

### API Testing
To test the Fluxuz endpoint:
```bash
curl -X POST https://crmapi.fluxuz.com.br/v1/api/external/[ID]/ \
  -H "Authorization: Bearer ${FLUXUZ_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "body": "🎵 Test message",
    "number": "5511999999999",
    "externalKey": "test_123",
    "note": {
      "body": "Test note",
      "mediaUrl": "https://example.com/test.mp3"
    }
  }'
```

## Monitoring

Watch for these log messages:
- `[Jobs] Starting lyrics generation...`
- `[Suno Lyrics] Sending request to generate lyrics`
- `[Webhook Lyrics] Lyrics generated`
- `[Suno Music] Generating with lyrics`
- `[Fluxuz] Sending to WhatsApp`

## Rollback Plan

If issues occur, revert the commit and the system will use the old flow:
- Jobs go directly from QUEUED → PROCESSING → DONE
- Music is generated with the story prompt (no separate lyrics step)
- Fluxuz will still send messages, but may not include MP3 if payload is wrong
