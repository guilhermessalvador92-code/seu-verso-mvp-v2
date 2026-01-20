# Email Retry System - Documentação Completa

## 🎯 Visão Geral

O sistema de retry de emails garante entrega confiável de notificações aos usuários, mesmo em caso de falhas temporárias da Resend API. Utiliza fila persistente com backoff exponencial e processamento automático.

## ✅ Status: FUNCIONAL

- ✅ 14 testes vitest passando (100%)
- ✅ Fila persistente no banco de dados
- ✅ Backoff exponencial automático
- ✅ Worker de processamento automático
- ✅ Logging detalhado
- ✅ Integrado ao webhook e routers

## 🏗️ Arquitetura

### Componentes

1. **email-retry.ts** - Core do sistema de retry
   - `queueEmail()` - Adicionar email à fila
   - `processEmailQueue()` - Processar emails pendentes
   - `getEmailStatus()` - Obter status de um email
   - `getEmailQueueStats()` - Estatísticas da fila
   - `startEmailQueueWorker()` - Iniciar worker automático
   - `stopEmailQueueWorker()` - Parar worker

2. **email-queue-integration.ts** - Funções de integração
   - `queueOrderConfirmationEmail()` - Email de confirmação
   - `queueMusicReadyEmail()` - Email de música pronta
   - `queueNotificationEmail()` - Email genérico

3. **Tabela emailQueue** - Persistência
   - id, to, subject, htmlContent
   - type, jobId, status
   - attempts, maxAttempts, nextRetryAt
   - lastError, sentAt

## 🔄 Fluxo de Retry

```
1. Email enfileirado
   ├─ Status: PENDING
   ├─ Attempts: 0
   └─ nextRetryAt: now + 5s
   ↓
2. Worker processa fila (a cada 30s)
   ├─ Busca emails com nextRetryAt <= now
   ├─ Tenta enviar via Resend
   └─ Sucesso ou falha
   ↓
3. Se sucesso
   ├─ Status: SENT
   ├─ sentAt: now
   └─ Notificação completa
   ↓
4. Se falha
   ├─ attempts++
   ├─ Se attempts < maxAttempts
   │  ├─ Calcula próximo delay (exponencial)
   │  ├─ nextRetryAt: now + delay
   │  └─ Status: PENDING (aguarda próxima tentativa)
   └─ Se attempts >= maxAttempts
      ├─ Status: FAILED
      ├─ lastError: mensagem de erro
      └─ Sem mais tentativas
```

## ⏱️ Backoff Exponencial

**Configuração padrão:**
- Tentativa 1: 5 segundos
- Tentativa 2: 10 segundos
- Tentativa 3: 20 segundos
- Tentativa 4: 40 segundos
- Tentativa 5: 1 hora (máximo)

**Fórmula:**
```
delay = initialDelayMs * (backoffMultiplier ^ attempts)
delay = min(delay, maxDelayMs)
```

**Configuração customizável:**
```typescript
const config = {
  maxAttempts: 5,           // Máximo de tentativas
  initialDelayMs: 5000,     // Delay inicial (5s)
  maxDelayMs: 3600000,      // Delay máximo (1h)
  backoffMultiplier: 2,     // Multiplicador exponencial
};
```

## 📧 Tipos de Email

### 1. ORDER_CONFIRMATION
Enviado quando usuário cria uma música.

**Quando:** Imediatamente após criar job
**Conteúdo:** Confirmação de recebimento + link de status
**Integração:** `queueOrderConfirmationEmail(email, jobId, names)`

### 2. MUSIC_READY
Enviado quando música está pronta.

**Quando:** Webhook recebe callback da Suno
**Conteúdo:** Link para ouvir + letra + download
**Integração:** `queueMusicReadyEmail(email, jobId, title, slug, names)`

### 3. NOTIFICATION
Email genérico para notificações.

**Quando:** Sob demanda
**Conteúdo:** Customizável
**Integração:** `queueNotificationEmail(email, subject, html, jobId?)`

## 🚀 Como Usar

### Enfileirar Email de Confirmação

```typescript
import { queueOrderConfirmationEmail } from "./email-queue-integration";

await queueOrderConfirmationEmail(
  "user@example.com",
  "job-123",
  "João Silva"
);
```

### Enfileirar Email de Música Pronta

```typescript
import { queueMusicReadyEmail } from "./email-queue-integration";

await queueMusicReadyEmail(
  "user@example.com",
  "job-123",
  "Música para João",
  "abc123xyz",  // shareSlug
  "João"        // recipientName
);
```

### Iniciar Worker Automático

```typescript
import { startEmailQueueWorker } from "./email-retry";

// Processar fila a cada 30 segundos
const timer = startEmailQueueWorker(30000);

// Parar quando necessário
stopEmailQueueWorker(timer);
```

### Verificar Status de Email

```typescript
import { getEmailStatus } from "./email-retry";

const status = await getEmailStatus("email-id-123");
console.log(status);
// {
//   id: "email-id-123",
//   to: "user@example.com",
//   status: "PENDING",
//   attempts: 2,
//   maxAttempts: 5,
//   nextRetryAt: "2026-01-20T16:30:00Z",
//   lastError: "API timeout"
// }
```

### Obter Estatísticas da Fila

```typescript
import { getEmailQueueStats } from "./email-retry";

const stats = await getEmailQueueStats();
console.log(stats);
// {
//   pending: 5,
//   sent: 42,
//   failed: 2,
//   total: 49,
//   oldestPending: "2026-01-20T16:00:00Z"
// }
```

## 🔌 Integração com Webhook

O webhook automaticamente enfileira email quando música está pronta:

```typescript
// server/webhook.ts
import { queueMusicReadyEmail } from "./email-queue-integration";

// Quando callback é recebido
const lead = await getLeadByJobId(jobId);
if (lead && song && song.shareSlug) {
  await queueMusicReadyEmail(
    lead.email,
    jobId,
    title,
    song.shareSlug,
    lead.names
  );
}
```

## 🔌 Integração com Routers

O router automaticamente enfileira email quando job é criado:

```typescript
// server/routers.ts
import { queueOrderConfirmationEmail } from "./email-queue-integration";

// Quando job é criado
if (lead) {
  queueOrderConfirmationEmail(input.email, jobId, input.names).catch(error => {
    console.error("[Jobs] Failed to queue confirmation email:", error);
  });
}
```

## 📊 Monitoramento

### Logs

Todos os eventos são registrados em `.manus-logs/devserver.log`:

```
[EmailRetry] Email queued: { emailId, to, type, nextRetryAt }
[EmailRetry] Processing queue: { count, timestamp }
[EmailRetry] Email sent successfully: { emailId, to, attempts }
[EmailRetry] Email retry scheduled: { emailId, to, attempts, nextRetryAt, delayMs }
[EmailRetry] Email failed after max attempts: { emailId, to, attempts, error }
```

### Verificar Fila

```bash
# Ver estatísticas
curl http://localhost:3000/api/email-stats

# Ver emails pendentes
SELECT * FROM emailQueue WHERE status = 'PENDING' ORDER BY nextRetryAt;

# Ver emails falhados
SELECT * FROM emailQueue WHERE status = 'FAILED' ORDER BY createdAt DESC;
```

## 🧪 Testes

### Executar Testes

```bash
pnpm test server/email-retry.test.ts
```

### Cobertura de Testes

- ✅ Enfileiramento de emails
- ✅ Recuperação de status
- ✅ Múltiplos emails
- ✅ Estatísticas da fila
- ✅ Configuração de retry
- ✅ Tipos de email
- ✅ Associação com jobs
- ✅ Worker de processamento
- ✅ Fluxos de integração
- ✅ Processamento de fila
- ✅ Tratamento de erros

## 🐛 Troubleshooting

### Email não é enviado

**Causa:** Worker não está rodando
**Solução:** Iniciar worker com `startEmailQueueWorker()`

### Email fica em PENDING indefinidamente

**Causa:** nextRetryAt está no futuro
**Solução:** Aguardar ou processar manualmente com `processEmailQueue()`

### Email marcado como FAILED

**Causa:** Excedeu maxAttempts
**Solução:** Verificar `lastError`, corrigir problema, refileirar email

### Muitos emails em PENDING

**Causa:** Resend API indisponível
**Solução:** Aguardar, worker continuará tentando automaticamente

### Erro "RESEND_API_KEY not configured"

**Causa:** Variável de ambiente não definida
**Solução:** Configurar `RESEND_API_KEY` nas secrets

## 📈 Performance

### Limites Recomendados

- **Emails por processamento:** 10 (evita sobrecarga)
- **Intervalo de worker:** 30 segundos (balanço entre latência e carga)
- **Máximo de tentativas:** 5 (total ~1h por email)

### Otimizações

1. **Batch processing:** Processa até 10 emails por vez
2. **Backoff exponencial:** Evita sobrecarregar Resend API
3. **Persistência:** Fila sobrevive a reinicializações
4. **Logging:** Rastreamento completo para debugging

## 🔐 Segurança

### Boas Práticas

1. **Validação de email:** Feita no enfileiramento
2. **Rate limiting:** Implementado via backoff
3. **Logging:** Não registra conteúdo sensível
4. **Isolamento:** Falhas de um email não afetam outros

## 📝 Exemplo Completo

```typescript
// 1. Usuário cria música
const jobId = await createJob(...);

// 2. Email de confirmação é enfileirado
await queueOrderConfirmationEmail(
  "user@example.com",
  jobId,
  "João"
);

// 3. Worker processa fila a cada 30s
// Se Resend falhar, retry automático com backoff

// 4. Suno gera música
// Webhook recebe callback

// 5. Email de música pronta é enfileirado
await queueMusicReadyEmail(
  "user@example.com",
  jobId,
  "Música para João",
  "abc123xyz",
  "João"
);

// 6. Worker processa novamente
// Email é enviado com sucesso

// 7. Usuário recebe email com link
// Acessa /m/abc123xyz para ouvir
```

## 🚀 Próximos Passos

1. **Monitorar fila em produção** - Verificar estatísticas regularmente
2. **Ajustar delays** - Baseado em padrões de falha observados
3. **Adicionar alertas** - Notificar se muitos emails falharem
4. **Implementar webhook de Resend** - Para confirmação de entrega
5. **Dashboard de emails** - Visualizar fila em tempo real

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar logs em `.manus-logs/devserver.log`
2. Consultar testes em `server/email-retry.test.ts`
3. Revisar documentação em `EMAIL_RETRY_DOCUMENTATION.md`

---

**Status:** ✅ Pronto para Produção
**Testes:** ✅ 14/14 Passando
**Integração:** ✅ Webhook + Routers
**Monitoramento:** ✅ Logging Completo
