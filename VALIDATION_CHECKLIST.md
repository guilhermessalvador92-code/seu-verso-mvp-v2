# Setup & Validation Checklist

## 🎯 Objetivo
Validar que **Resend API** e **Suno Webhook** estão funcionando corretamente antes de ir para produção.

---

## 📋 Checklist Pré-Produção

### Variáveis de Ambiente

- [ ] `SUNO_API_KEY` está definida
  ```bash
  echo $SUNO_API_KEY  # Deve mostrar chave não vazia
  ```

- [ ] `GEMINI_API_KEY` está definida
  ```bash
  echo $GEMINI_API_KEY  # Deve mostrar chave não vazia
  ```

- [ ] `RESEND_API_KEY` está definida
  ```bash
  echo $RESEND_API_KEY  # Deve mostrar chave começando com re_
  ```

- [ ] `DATABASE_URL` está definida e válida
  ```bash
  echo $DATABASE_URL  # Deve ser mysql://...
  ```

- [ ] `APP_URL` está definida corretamente
  ```bash
  echo $APP_URL  # Deve ser seu domínio público (ex: https://seu-verso.com)
  ```

- [ ] `JWT_SECRET` está definida (gerada)
  ```bash
  echo $JWT_SECRET  # Deve ser string longa
  ```

---

## 🧪 Testes de Validação

### 1. Testar Resend API
```bash
npm run test -- resend-validation.test.ts

# Saída esperada:
# ✓ should validate Resend API key by sending test email
# ✓ should validate email sending function
# ✅ RESEND_API_KEY configured
```

**Se falhar:**
- Verifique se `RESEND_API_KEY` está correta em https://resend.com
- Tente gerar nova chave se a antiga expirou

---

### 2. Testar Suno API Key
```bash
npm run test -- api-keys.test.ts

# Saída esperada:
# ✓ should have SUNO_API_KEY configured
# ✓ should have GEMINI_API_KEY configured
# ✓ should validate Suno API key format
# ✅ All API keys configured
```

**Se falhar:**
- Verifique que `SUNO_API_KEY` está definida
- Regenere em https://sunoapi.org se necessário

---

### 3. Testar Webhook
```bash
npm run test -- webhook.test.ts

# Saída esperada:
# ✓ should process valid Suno callback
# ✓ should handle Suno error callback
# ✓ should provide webhook URLs
# ✅ All webhook tests passing
```

**Se falhar:**
- Verifique que database está rodando
- Verifique que migrations foram rodadas

---

### 4. Testar E2E Completo
```bash
npm run test -- e2e.test.ts

# Saída esperada:
# ✓ should create job with valid input
# ✓ should retrieve job by ID
# ✓ should get music by slug
# ✓ should have all required API keys
# ✅ E2E flow working
```

---

### 5. Testar Webhook Suno Real
```bash
npm run test -- webhook-suno-real.test.ts

# Saída esperada:
# ✓ should handle Suno callback successfully
# ✓ should create music in database
# ✓ should update job status
# ✓ should handle error callback
# ✅ Webhook Suno integration working
```

---

## 🚀 Deploy Checklist

### Railway / Render

- [ ] Repositório está sincronizado (git push)
- [ ] Todas as variáveis de ambiente estão no dashboard
- [ ] Database migrations foram rodadas
- [ ] Build passou sem erros
- [ ] Servidor está UP (health check)

```bash
# Health check (depois de deploy)
curl https://seu-domain.com/api/webhook/health

# Esperado:
# {"success":true,"status":"ok","message":"Webhook is running"}
```

---

### Verificar URLs

- [ ] Webhook URL está correto em Suno API:
  ```
  ${APP_URL}/api/webhook/suno
  
  Exemplo:
  https://seu-verso.com/api/webhook/suno
  ```

- [ ] Callback URL em production é HTTPS (seguro)
  ```
  https://seu-verso.com/api/webhook/suno  ✅
  http://seu-verso.com/api/webhook/suno   ❌ INSEGURO
  ```

---

## 🧪 Teste Manual End-to-End

### 1. Criar uma música (Frontend)
1. Acesse https://seu-verso.com
2. Clique em "Criar Música"
3. Preencha formulário com:
   - Story: Uma história qualquer
   - Style: Pop
   - Names: João
   - Email: seu-email-pessoal@gmail.com
4. Clique em "Gerar"

**Esperado**: Job criado com status QUEUED

---

### 2. Monitorar Suno
1. Abra database e execute:
```sql
SELECT id, status, createdAt FROM jobs ORDER BY createdAt DESC LIMIT 1;
```

**Esperado**: Status muda de QUEUED → PROCESSING

---

### 3. Aguardar Callback Suno
- Tempo estimado: 2-10 minutos
- Monitor em logs:
```bash
# Se em Railway
# Dashboard → Logs → Filter "Webhook"

# Esperado ver:
# [Webhook] Received Suno callback
# [Webhook] Song created
# [Webhook] Job marked as DONE
```

---

### 4. Verificar Email
1. Abra seu email pessoal
2. Procure por assunto: "🎵 Seu Verso - Sua Música Está Pronta!"

**Esperado**: Email chegou com link para música

---

### 5. Acessar Música
1. Clique no link do email
2. Ou acesse: https://seu-verso.com/m/{slug}

**Esperado**: Página com player de áudio funcionando

---

## 🔍 Troubleshooting

### Job fica em PROCESSING indefinidamente

**Causa**: Suno callback não foi recebido

**Debug**:
```sql
-- Verificar job
SELECT * FROM jobs WHERE status = 'PROCESSING' ORDER BY updatedAt DESC LIMIT 1;

-- Verificar se tem música criada
SELECT * FROM songs WHERE jobId = '{jobId}';

-- Verificar logs em production
```

**Ações**:
1. Verificar se `APP_URL` está correto
2. Verificar se webhook URL foi registrada corretamente na Suno
3. Verificar logs em production para erros

---

### Email não é recebido

**Causa**: Resend API key inválida ou falha na fila

**Debug**:
```sql
-- Ver fila de emails
SELECT id, to, status, lastError FROM email_queue ORDER BY updatedAt DESC LIMIT 5;

-- Verificar se tem erros
SELECT * FROM email_queue WHERE status = 'FAILED';
```

**Ações**:
1. Verifique `RESEND_API_KEY` em production
2. Regenere chave em https://resend.com se necessário
3. Verifique email não está em spam
4. Reprocesse manualmente se necessário

---

### Webhook retorna 404

**Causa**: URL do webhook está incorreta em Suno API

**Solução**:
1. Verifique que o endpoint é: `/api/webhook/suno`
2. NÃO é: `/api/callback/job-done`
3. Reregistre em Suno API
4. Teste com: `POST {APP_URL}/api/webhook/health`

---

## ✅ Sucesso!

Se todos os testes passarem e o fluxo E2E funcionar:

- ✅ Resend API está configurada
- ✅ Suno API está conectada
- ✅ Webhook recebendo callbacks
- ✅ Emails sendo entregues
- ✅ Pronto para produção! 🚀

---

**Data**: 2026-01-21  
**Versão**: 1.0  
**Status**: ✅ Completo
