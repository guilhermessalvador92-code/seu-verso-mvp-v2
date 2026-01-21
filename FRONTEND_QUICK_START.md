# 🎵 Como o Frontend Puxa o Arquivo

## Quick Start

O frontend puxar o arquivo de música do Suno envolve 3 etapas:

### 1️⃣ Webhook Salva a URL do Arquivo

Quando Suno faz callback, a URL do arquivo é salva no banco:

```typescript
// server/webhook.ts - linha ~200
const song = await createSong({
  audioUrl: audio_url,  // ← URL do arquivo Suno
  // ...
});
```

### 2️⃣ Frontend Query Puxa a URL

```typescript
// client/src/pages/Music.tsx - linha 14
const { data: song } = trpc.music.getBySlug.useQuery({
  slug: slug || ""
});

// song.audioUrl = "https://cdn.suno.ai/music/{id}.mp3"
```

### 3️⃣ Player Renderiza

```tsx
// client/src/pages/Music.tsx - linha 178
<audio controls src={song.audioUrl} />
```

---

## 📥 Teste Rápido

```bash
# Simular webhook (cria música de teste)
curl -X POST http://localhost:3000/api/webhook/test

# Acessar página
http://localhost:3000/m/{slug-retornado}

# Ver áudio no player ✅
```

---

## 🔍 Fluxo Técnico

### Webhook Recebe Arquivo

```json
{
  "code": 200,
  "data": {
    "data": [
      {
        "audio_url": "https://cdn.suno.ai/6ba...c3a.mp3",
        "title": "Música Teste",
        "prompt": "[Verso]..."
      }
    ]
  }
}
```

### Salva no Banco

```sql
INSERT INTO songs (
  audioUrl,
  title,
  lyrics,
  shareSlug
) VALUES (
  'https://cdn.suno.ai/6ba...c3a.mp3',
  'Música Teste',
  '[Verso]...',
  'abc1234567'
);
```

### Frontend Query

```typescript
// GET /api/trpc/music.getBySlug?input={"slug":"abc1234567"}

// Response:
{
  "audioUrl": "https://cdn.suno.ai/6ba...c3a.mp3",
  "title": "Música Teste",
  "lyrics": "[Verso]...",
  "shareSlug": "abc1234567"
}
```

### Player Renderiza

```html
<audio controls src="https://cdn.suno.ai/6ba...c3a.mp3">
  Seu navegador não suporta...
</audio>
```

---

## ✅ O Que Está Funcionando

| Componente | Status | Teste |
|-----------|--------|-------|
| Webhook salva URL | ✅ | `webhook.test.ts` |
| Query retorna URL | ✅ | `music-not-found.test.ts` |
| Player renderiza | ✅ | `frontend-playback.test.ts` |
| Audio reproduz | ✅ | Browser test |
| Download funciona | ✅ | `frontend-playback.test.ts` |
| Compartilhamento | ✅ | `frontend-playback.test.ts` |

---

## 🎯 Resumo

**Frontend consegue puxar arquivo da Suno em 3 passos:**

1. Webhook salva `audioUrl` → Banco de dados
2. Frontend query → Backend retorna `audioUrl`
3. Player renderiza → Usuario reproduz ▶️

**Tudo pronto!** ✅

---

Para mais detalhes:
- [FRONTEND_PLAYBACK.md](FRONTEND_PLAYBACK.md) - Documentação completa
- [server/frontend-playback.test.ts](server/frontend-playback.test.ts) - Testes com exemplos
- [client/src/pages/Music.tsx](client/src/pages/Music.tsx) - Componente React
