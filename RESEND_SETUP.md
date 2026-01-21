# Resend API - Configuração & Troubleshooting

## ✅ Setup Rápido

### 1. Criar Account Gratuita
- Acesse: https://resend.com
- Sign up com email (grátis até 100 emails/dia)
- Ir para Dashboard

### 2. Gerar API Key
1. Dashboard → API Keys
2. Clique em "Create API Key"
3. Copie a chave (formato: `re_xxxxxxxxxxxxx`)

### 3. Configurar em Seu Projeto

#### Local Development
```bash
# Arquivo .env ou export
export RESEND_API_KEY=re_xxxxxxxxxxxxx

# Ou em .env.local
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

#### Production (Railway/Render)
1. Vá para seu dashboard (Railway/Render)
2. Environment Variables
3. Adicione: `RESEND_API_KEY=re_xxxxxxxxxxxxx`
4. Redeploy

### 4. Verificar se Funciona
```bash
# Rodar teste de validação
npm run test -- resend-validation.test.ts

# Saída esperada:
# ✓ should validate Resend API key format (15ms)
# ✅ RESEND_API_KEY is configured
```

---

## 🔑 Domínio Verificado (Opcional mas Recomendado)

Por padrão, você pode enviar emails FROM `noreply@seu-verso.com`, mas será marcado como "via resend.com".

Para emails profissionais:

### Se tiver domínio próprio:
1. Resend Dashboard → Domains
2. Adicionar seu domínio (ex: seu-verso.com)
3. Seguir instruções DNS
4. Após verificado, usar: `noreply@seu-verso.com`

### Se não tiver domínio:
- Usar o padrão: `noreply@seu-verso.com` (funciona, mas menos profissional)

---

## 🐛 Problemas Comuns

### Error: "Invalid API Key"
**Causa**: Chave expirou ou formatação incorreta

**Solução**:
1. Gere nova chave em Resend Dashboard
2. Verifique se começa com `re_`
3. Copie exatamente, sem espaços

### Error: "Domain not verified"
**Causa**: Email FROM não foi verificado

**Solução**:
- Verificar domínio em Resend Dashboard
- Ou usar domínio pré-verificado do Resend

### Emails em PENDING infinitamente
**Causa**: Resend API indisponível ou rate limited

**Solução**:
```typescript
// server/email-retry.ts tem retry automático
// Aguarda e tenta novamente
// Cheque logs para erros específicos

SELECT * FROM email_queue 
WHERE status = 'PENDING' 
ORDER BY nextRetryAt DESC;
```

---

## 📊 Monitoramento

### Ver emails enviados
```bash
# Em Resend Dashboard
Emails tab → Veja todas entregas

# Ou no banco:
SELECT * FROM email_queue WHERE status = 'SENT' ORDER BY sentAt DESC;
```

### Ver falhas
```bash
# No banco:
SELECT id, to, subject, lastError, attempts 
FROM email_queue 
WHERE status = 'FAILED' 
ORDER BY updatedAt DESC;
```

---

## 🚀 Teste Manual

```bash
# Enviar email de teste via curl
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer re_xxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "noreply@seu-verso.com",
    "to": "seu-email@gmail.com",
    "subject": "Teste Seu Verso",
    "html": "<h1>Funcionando!</h1>"
  }'
```

---

## 📝 Status da Implementação

| Componente | Status | Local |
|-----------|--------|-------|
| Integração Resend | ✅ Implementado | [server/email.ts](../server/email.ts) |
| Email Retry Queue | ✅ Implementado | [server/email-retry.ts](../server/email-retry.ts) |
| Integração Queue | ✅ Implementado | [server/email-queue-integration.ts](../server/email-queue-integration.ts) |
| Testes Resend | ✅ Implementado | [server/resend-validation.test.ts](../server/resend-validation.test.ts) |
| Worker Automático | ✅ Implementado | Inicializado em [server/_core/index.ts](../server/_core/index.ts) |

---

## ⚙️ Detalhes Técnicos

### Fluxo de Envio
1. `queueEmail()` → Salva email em BD com status PENDING
2. `startEmailQueueWorker()` → Worker começa a processar
3. `sendEmail()` → Chama Resend API
4. Se sucesso: status SENT ✅
5. Se falha: nextRetryAt atualizado, retry automático

### Retry Automático
- Max attempts: 5
- Intervalo: 5 min, 15 min, 1h, 3h (exponencial)
- Worker roda a cada 30 segundos

### Falhas Tratadas
- ✅ Rede indisponível → Retry
- ✅ Resend API down → Retry
- ✅ Rate limit → Retry com backoff
- ❌ Email inválido → FAILED (não retry)
- ❌ API key inválida → FAILED (não retry)

---

**Última atualização**: 2026-01-21
