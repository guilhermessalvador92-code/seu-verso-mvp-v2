# Webhook Fixes Needed

## TypeScript Errors to Fix

### 1. Add missing import for enhanceLyrics
**File**: server/webhook.ts
**Line**: 30
**Fix**: Add `import { enhanceLyrics } from "./_core/gemini";`

### 2. Remove `images` from destructuring
**File**: server/webhook.ts
**Line**: 269
**Current**: `const { callbackType, task_id, data: musicData, images } = data;`
**Fix**: `const { callbackType, task_id, data: musicData } = data;`

### 3. Remove images processing block
**File**: server/webhook.ts
**Lines**: 291-332
**Fix**: Delete the entire `if (Array.isArray(images) && images.length > 0)` block

### 4. Fix null types in enhanceLyrics call
**File**: server/webhook.ts
**Lines**: 388-395
**Fix**: Convert null to undefined:
```typescript
const enhanced = await enhanceLyrics({
  story: lead.story,
  style: lead.style,
  title: title,
  occasion: lead.occasion || undefined,
  mood: lead.mood || undefined,
  originalLyrics: songLyrics,
});
```

### 5. Fix null types in queueMusicReadyEmail call
**File**: server/webhook.ts
**Line**: 453
**Fix**: Add default values:
```typescript
queueMusicReadyEmail(lead.email || '', jobId, firstSong.shareSlug || '', firstSong.title || 'Sua Música').catch(
```

### 6. Fix songs vs song inconsistency
**File**: server/routers.ts (line 152) and client/src/pages/Status.tsx (lines 45-48)
**Fix**: Use `song` instead of `songs` in response

### 7. Remove suno.ts id property
**File**: server/suno.ts (line 233)
**Fix**: Remove `id` from object literal

### 8. Add target ES2020 to tsconfig
**File**: tsconfig.json
**Fix**: Add `"target": "ES2020"` to compilerOptions

## Status
- [ ] All fixes applied
- [ ] TypeScript compilation passes
- [ ] Tests pass
- [ ] Ready to deploy
