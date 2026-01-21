# Troubleshooting - Resend & Suno Webhook

## 🚨 Problemas Identificados

### 1. **Resend API Key "inválida"** ❌
**Status**: Em ambiente de teste/desenvolvimento, a key é substituída por fallback

**Causa**: 
```typescript
// server/email.ts - linha 5
const RESEND_API_KEY = process.env.RESEND_API_KEY;

// Quando NODE_ENV === "test":
if (!RESEND_API_KEY && process.env.NODE_ENV === "test") {
  // Retorna true sem enviar (mock)
  return true;
}
```

**Impacto**:
- ✅ Em testes: funciona (mock)
- ❌ Em produção SEM `RESEND_API_KEY`: emails não são enviados
- ⚠️ Em produção COM `RESEND_API_KEY`: funciona normalmente

**Solução**:
```bash
# 1. Definir variável de ambiente (OBRIGATÓRIO em produção)
export RESEND_API_KEY=re_xxxxxxxxxxxxx

# 2. Verificar se a key é válida
npm run test -- resend-validation.test.ts

# 3. Se receber erro 401/403, regenerar key em https://resend.com
```

---

### 2. **Webhook Suno não configurado** ❌
**Status**: O `callBackUrl` está sendo enviado para Suno, mas precisa ser a URL correta

**Problema**:
```typescript
// server/routers.ts - linha ~70
const callbackUrl = `${appUrl}/api/callback/job-done`;
// ⬆️ URL INCORRETA - o endpoint é /api/webhook/suno, não /api/callback/job-done
```

A Suno API vai tentar fazer callback para uma rota que **NÃO EXISTE**.

**Rotas Corretas Disponíveis**:
```
✅ POST /api/webhook/suno          (Main callback endpoint)
✅ GET  /api/webhook/health        (Health check)
✅ POST /api/webhook/test          (Test simulation)
```

**Impacto**:
- Suno gera a música ✅
- Tenta chamar webhook ❌ (404)
- Job fica em "PROCESSING" para sempre
- Email nunca é enviado
- Usuário não recebe a música

**Solução**:

Altere [server/routers.ts](server/routers.ts#L70) de:
```typescript
const callbackUrl = `${appUrl}/api/callback/job-done`;
```

Para:
```typescript
const callbackUrl = `${appUrl}/api/webhook/suno`;
```

---

## ✅ Fluxo Correto Esperado

```
1. Usuário submete formulário
   ↓
2. createJob cria registro com status = "QUEUED"
   ↓
3. generateMusicWithSuno é chamado com:
   - callBackUrl: https://seu-domain.com/api/webhook/suno  ✅ CORRETO
   - Suno API retorna taskId
   ↓
4. Suno gera música (pode levar alguns minutos)
   ↓
5. Suno API faz POST para callback URL com resultado:
   POST https://seu-domain.com/api/webhook/suno
   {
     "code": 200,
     "data": {
       "callbackType": "complete",
       "task_id": "suno-task-id",
       "data": [{ "audio_url": "...", "title": "...", ... }]
     }
   }
   ↓
6. Webhook processa resultado:
   - Cria registro de música ✅
   - Atualiza job para "DONE" ✅
   - Fila email de notificação ✅
   ↓
7. Email retry worker envia email ✅
8. Usuário recebe música via link
```

---

## 🔧 Checklist de Configuração

### Para Desenvolvimento Local
- [ ] Definir `RESEND_API_KEY` (opcional, usa mock em test mode)
- [ ] Definir `SUNO_API_KEY` (obrigatório)
- [ ] Definir `APP_URL` (ex: http://localhost:3000)
- [ ] Verificar que callback URL é correta

### Para Produção (Railway/Deploy)
- [ ] ✅ `RESEND_API_KEY` = chave válida de https://resend.com
- [ ] ✅ `SUNO_API_KEY` = chave válida de Suno
- [ ] ✅ `GEMINI_API_KEY` = chave válida do Google
- [ ] ✅ `DATABASE_URL` = MySQL conexão
- [ ] ✅ `APP_URL` = domínio público (ex: https://seu-verso.com)
- [ ] ✅ Webhook URL registrado na Suno: `${APP_URL}/api/webhook/suno`

---

## 🧪 Testes para Validar

```bash
# 1. Verificar Resend API Key
npm run test -- resend-validation.test.ts

# 2. Verificar Webhook
npm run test -- webhook.test.ts

# 3. Verificar fluxo completo E2E
npm run test -- e2e.test.ts

# 4. Simular callback Suno (real)
npm run test -- webhook-suno-real.test.ts
```

---

## 🐛 Debug

### Para ver logs da aplicação:
```bash
# Em desenvolvimento
npm run dev  # Check console for [Suno], [Webhook], [Email] logs

# Em produção (Railway)
# Dashboard → Logs → Real-time viewer
```

### Para testar webhook manualmente:
```bash
curl -X POST http://localhost:3000/api/webhook/test \
  -H "Content-Type: application/json" \
  -d '{"task_id": "test-123", "title": "Test Music"}'
```

### Para verificar email queue:
```bash
# Ver status dos emails pendentes
SELECT * FROM email_queue WHERE status IN ('PENDING', 'FAILED');
```

---

## 📋 Próximas Ações

1. **CRÍTICO**: Corrigir URL do webhook em [server/routers.ts](server/routers.ts#L70)
2. Definir `RESEND_API_KEY` em ambiente de produção
3. Testar fluxo completo (criar música → receber email)
4. Monitorar logs para erros

---

**Status**: 🚨 BLOQUEADO - Aguardando correção do webhook URL
