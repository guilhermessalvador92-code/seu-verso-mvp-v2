# JSON para Fluxuz PUSH - Seu Verso

## Estrutura do Payload

Este é o JSON que você deve inputar no PUSH da Fluxuz para disparar WhatsApp quando a música estiver pronta:

```json
{
  "msg": "Música gerada com sucesso para João Silva",
  "data": {
    "callbackType": "complete",
    "task_id": "abc123xyz789",
    "data": {
      "name": "João Silva",
      "whatsapp": "5511999999999",
      "musicTitle": "Aniversário do João",
      "audioUrl": "https://musicfile.api.box/audio/abc123xyz789.mp3",
      "shareSlug": "abc12xyz",
      "lyrics": "Parabéns João, você é especial...",
      "imageUrl": "https://musicfile.api.box/image/abc123xyz789.jpg"
    }
  }
}
```

## Campos Explicados

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `msg` | string | Mensagem de status | "Música gerada com sucesso para João Silva" |
| `data.callbackType` | string | Tipo de callback (sempre "complete" para música pronta) | "complete" |
| `data.task_id` | string | ID único da tarefa (jobId) | "abc123xyz789" |
| `data.data.name` | string | Nome do usuário | "João Silva" |
| `data.data.whatsapp` | string | WhatsApp com código do país | "5511999999999" |
| `data.data.musicTitle` | string | Título da música gerada | "Aniversário do João" |
| `data.data.audioUrl` | string | URL do arquivo MP3 | "https://musicfile.api.box/audio/abc123xyz789.mp3" |
| `data.data.shareSlug` | string | Slug para compartilhar | "abc12xyz" |
| `data.data.lyrics` | string | Letra da música | "Parabéns João..." |
| `data.data.imageUrl` | string (opcional) | URL da imagem/capa | "https://musicfile.api.box/image/abc123xyz789.jpg" |

## Como Usar no Fluxuz

1. Acesse: `crm.fluxuz.com.br/#/push`
2. Clique em "NOVO PUSH"
3. Configure:
   - **Dados Evento**: 
     - Nome: `trefifs` (ou seu evento)
     - Plataforma: `Personalizado`
     - Envio por: `Fluxuz`
   - **Modelo de Dados**: Cole o JSON acima

4. Na aba **ENVIO**:
   - Selecione "Fechar" (após envio)
   - Mensagem: Configure a mensagem WhatsApp com variáveis

## Variáveis Disponíveis

Use `{{data.data.fieldName}}` para acessar os dados:

```
Olá {{data.data.name}}! 🎵

Sua música "{{data.data.musicTitle}}" está pronta!

🎧 Ouça aqui: {{data.data.audioUrl}}

📱 Compartilhe: https://seu-verso.com/share/{{data.data.shareSlug}}

Aproveite! 🎉
```

## Fluxo Completo

```
1. Usuário entra: Nome + WhatsApp + História
   ↓
2. Seu Verso cria Job + Lead
   ↓
3. Envia para Suno API
   ↓
4. Suno gera música
   ↓
5. Webhook Suno → Seu Verso (Render)
   ↓
6. Seu Verso → Fluxuz (POST /webhook com JSON)
   ↓
7. Fluxuz dispara WhatsApp com link da música
   ↓
8. Usuário recebe: "Sua música está pronta! Ouça aqui: [link]"
```

## Configuração no Render

Adicione as variáveis de ambiente:

```env
FLUXUZ_API_URL=https://api.fluxuz.com.br/webhook
FLUXUZ_API_KEY=sua_chave_api_aqui
```

## Teste Rápido

```bash
curl -X POST https://seu-verso.com/api/fluxuz/test \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "whatsapp": "5511999999999",
    "musicTitle": "Teste",
    "audioUrl": "https://example.com/audio.mp3",
    "shareSlug": "test123"
  }'
```

## Suporte

Dúvidas? Verifique:
- Logs em `https://seu-verso.com/api/status-simple/{jobId}`
- Webhook health: `https://seu-verso.com/api/webhook/health`
