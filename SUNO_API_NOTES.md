# Suno API Integration Notes

## Status: ✅ FUNCIONANDO

### Endpoints Confirmados

**Generate Music (POST)**
```
POST https://api.sunoapi.org/api/v1/generate
Authorization: Bearer {SUNO_API_KEY}
Content-Type: application/json

Payload:
{
  "customMode": true,
  "instrumental": false,
  "model": "V4_5PLUS",
  "callBackUrl": "http://localhost:3000/api/callback",
  "prompt": "Create a happy pop song in Portuguese",
  "style": "Pop",
  "title": "Test Song"
}

Response:
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "d5971f6215ae2b198d4c19223d70452b"
  }
}
```

**Status: Polling não funciona via GET**
- `/api/v1/getDetails?taskId=X` → 404
- `/api/v1/fetch?ids=X` → 404
- `/api/v1/query?ids=X` → 404

### Workaround: Callback URL

A Suno API usa callback para notificar quando a música está pronta. 
Quando a música é gerada, a API faz um POST para o `callBackUrl` fornecido.

Implementar:
1. Endpoint POST `/api/callback/job-done` que recebe os dados da música
2. Armazenar audioUrl, lyrics, title no banco de dados
3. Atualizar status do job para "DONE"
4. Enviar email para o usuário

### API Key
- Status: ✅ Válida e funcionando
- Chave: `73d18ba8c67eb606d37b41dbd541a5f9`

### Próximas Ações
1. Implementar endpoint de callback
2. Testar fluxo completo de criação e notificação
3. Configurar Resend API para envio de emails
