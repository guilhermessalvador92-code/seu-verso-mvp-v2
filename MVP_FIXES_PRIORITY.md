# 🚀 MVP FIXES - LISTA PRIORIZADA

**Objetivo**: Fazer o MVP funcionar end-to-end em 24 horas.

---

## 🔴 CRÍTICO (Sem isso, nada funciona)

### 1. Testar Suno API
**Status**: ❌ Não testado
**O que fazer**: 
- Verificar se Suno API Key `bdb9cda0f3656d035c741ae1885e9a46` é válida
- Testar criação de job na Suno
- Confirmar que webhook callback funciona

**Como testar**:
```bash
curl -X POST https://api.suno.ai/api/generate \
  -H "Authorization: Bearer bdb9cda0f3656d035c741ae1885e9a46" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Test music",
    "style": "pop",
    "callback_url": "https://seu-verso-backend.onrender.com/webhooks/suno"
  }'
```

**Tempo estimado**: 30 minutos

---

### 2. Testar Formulário → Banco de Dados
**Status**: ❌ Não testado
**O que fazer**:
- Preencher formulário com nome + whatsapp
- Verificar se dados chegam no banco
- Confirmar que `name` e `whatsapp` estão sendo salvos

**Como testar**:
1. Acesse: https://3000-iicjteoujcg6swhq2c79e-ce173a8c.us1.manus.computer
2. Clique "Criar Minha Música"
3. Preencha: Nome="João", WhatsApp="5511999999999"
4. Clique enviar
5. Verifique no banco se dados foram salvos

**Tempo estimado**: 15 minutos

---

### 3. Testar Webhook Callback
**Status**: ❌ Não testado
**O que fazer**:
- Simular callback da Suno
- Verificar se música é salva no banco
- Confirmar que Fluxuz é chamado

**Como testar**:
```bash
curl -X POST https://seu-verso-backend.onrender.com/webhooks/suno \
  -H "Content-Type: application/json" \
  -d '{
    "code": 200,
    "msg": "Success",
    "data": {
      "callbackType": "complete",
      "task_id": "test-job-id",
      "data": [{
        "id": "music-1",
        "audio_url": "https://example.com/music.mp3",
        "title": "Test Music",
        "duration": 180
      }]
    }
  }'
```

**Tempo estimado**: 15 minutos

---

## 🟡 IMPORTANTE (Sem isso, MVP incompleto)

### 4. Integração Fluxuz - Parametrizar Payload
**Status**: ❌ Não parametrizado
**O que fazer**:
- Definir estrutura exata do JSON para Fluxuz
- Adicionar nome, whatsapp, link da música, título
- Testar envio para webhook Fluxuz

**Payload esperado**:
```json
{
  "nome": "João Silva",
  "whatsapp": "5511999999999",
  "titulo": "Minha Música",
  "link_musica": "https://example.com/music.mp3",
  "link_imagem": "https://example.com/image.jpg"
}
```

**Tempo estimado**: 20 minutos

---

### 5. Deploy Backend no Render
**Status**: ❌ Não deployado
**O que fazer**:
- Conectar repositório GitHub `seu-verso-backend`
- Configurar variáveis de ambiente:
  - `SUNO_API_KEY=bdb9cda0f3656d035c741ae1885e9a46`
  - `FLUXUZ_PUSH_URL=https://crmapi.fluxuz.com.br/w/ffde438a-22a9-4abb-8223-f0adc15412fc`
- Deploy e verificar se está rodando

**Tempo estimado**: 30 minutos

---

### 6. Configurar Webhook Suno
**Status**: ❌ Não configurado
**O que fazer**:
- Acessar dashboard Suno
- Adicionar webhook callback para: `https://seu-verso-backend.onrender.com/webhooks/suno`
- Testar callback

**Tempo estimado**: 15 minutos

---

## 🟢 IMPORTANTE (Melhorias)

### 7. Tratamento de Erros
**Status**: ❌ Não implementado
- Mostrar erros claros ao usuário
- Retry automático em caso de falha
- Logs detalhados

**Tempo estimado**: 30 minutos

---

### 8. Testes Automatizados
**Status**: ❌ Não implementado
- Testar criação de job
- Testar webhook callback
- Testar envio para Fluxuz

**Tempo estimado**: 45 minutos

---

## 📊 RESUMO

| Item | Status | Tempo | Prioridade |
|------|--------|-------|-----------|
| Testar Suno API | ❌ | 30 min | 🔴 CRÍTICO |
| Testar Formulário | ❌ | 15 min | 🔴 CRÍTICO |
| Testar Webhook | ❌ | 15 min | 🔴 CRÍTICO |
| Parametrizar Fluxuz | ❌ | 20 min | 🟡 IMPORTANTE |
| Deploy Backend | ❌ | 30 min | 🟡 IMPORTANTE |
| Configurar Suno | ❌ | 15 min | 🟡 IMPORTANTE |
| Tratamento Erros | ❌ | 30 min | 🟢 MELHORIAS |
| Testes | ❌ | 45 min | 🟢 MELHORIAS |

**Total**: ~3-4 horas para MVP funcional

---

## ✅ CHECKLIST FINAL

- [ ] Suno API Key validada
- [ ] Formulário salvando dados no banco
- [ ] Webhook Suno recebendo callbacks
- [ ] Fluxuz recebendo payloads
- [ ] WhatsApp sendo enviado
- [ ] Backend deployado no Render
- [ ] Fluxo end-to-end testado

