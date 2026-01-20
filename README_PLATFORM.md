# Seu Verso MVP - Plataforma de Geração de Músicas Personalizadas com IA

## 🎵 Visão Geral

**Seu Verso** é uma plataforma web que permite criar músicas personalizadas a partir de histórias dos usuários. Utilizando inteligência artificial (Suno API + Gemini LLM), a plataforma transforma narrativas em composições musicais únicas em português brasileiro.

## ✅ Status: FUNCIONAL

Toda a plataforma está testada e funcionando:
- ✅ Backend completo com APIs tRPC
- ✅ Integração Suno API funcionando
- ✅ LLM Gemini otimizando prompts
- ✅ Sistema de callbacks para notificação
- ✅ Frontend com landing page, formulário e páginas de entrega
- ✅ Validações e testes passando

## 🏗️ Arquitetura

### Backend

**Stack:**
- Node.js + Express
- tRPC para APIs tipadas
- MySQL/TiDB para persistência
- Drizzle ORM para queries

**Componentes principais:**

1. **server/routers.ts** - APIs tRPC
   - `jobs.create` - Criar nova música
   - `jobs.getStatus` - Verificar status
   - `jobs.callback` - Receber resultado da Suno
   - `music.getBySlug` - Recuperar música por slug
   - `music.recordDownload` - Registrar download

2. **server/suno.ts** - Integração Suno API
   - `generateMusicWithSuno()` - Enviar história para geração
   - `getSunoTaskDetails()` - Verificar status (via callback)
   - `buildPromptWithLLM()` - Otimizar prompt com Gemini

3. **server/email.ts** - Sistema de notificações
   - `sendOrderConfirmationEmail()` - Email de confirmação
   - `sendMusicReadyEmail()` - Email com link de download

4. **server/suno-polling.ts** - Sistema de polling
   - Monitora status de músicas em geração
   - Notifica quando pronta

### Frontend

**Stack:**
- React 19 + Vite
- Tailwind CSS 4
- shadcn/ui components
- wouter para roteamento

**Páginas:**

1. **Home** (`/`) - Landing page
   - Hero section com CTA
   - "Como funciona" (3 passos)
   - Exemplos de músicas
   - Preço (R$49)
   - FAQ
   - Rodapé

2. **Create** (`/criar`) - Formulário
   - História (textarea)
   - Estilo musical (select)
   - Nome(s) homenageado(s)
   - Ocasião (opcional)
   - Clima/Emoção (opcional)
   - Email
   - Termos de uso

3. **Status** (`/status/:jobId`) - Acompanhamento
   - Progresso visual (4 etapas)
   - Polling automático
   - Redirecionamento automático quando pronta

4. **Music** (`/m/:slug`) - Entrega
   - Player de áudio
   - Letra completa
   - Download
   - Compartilhamento

5. **Terms** (`/termos`) - Termos de uso

6. **Privacy** (`/privacidade`) - Política de privacidade

## 🔄 Fluxo de Criação

```
1. Usuário preenche formulário
   ↓
2. POST /api/trpc/jobs.create
   ├─ Validação de campos
   ├─ Criar job no banco (status: QUEUED)
   ├─ Criar lead com dados do usuário
   ├─ Enviar email de confirmação
   └─ Chamar Suno API
   ↓
3. Suno API gera música
   ├─ Otimiza prompt com Gemini LLM
   ├─ Gera áudio + letra
   └─ Faz POST para nosso callback
   ↓
4. Callback recebe resultado
   ├─ POST /api/trpc/jobs.callback
   ├─ Salvar música no banco
   ├─ Atualizar job status: DONE
   └─ Enviar email com link
   ↓
5. Usuário recebe email
   ├─ Clica no link
   └─ Acessa /m/{slug} para ouvir
```

## 🔐 Configuração de APIs

### Suno API
- **Endpoint:** `https://api.sunoapi.org`
- **Chave:** Armazenada em `SUNO_API_KEY`
- **Métodos:**
  - `POST /api/v1/generate` - Gerar música
  - Callback URL para notificação

### Gemini LLM
- **Endpoint:** `https://generativelanguage.googleapis.com`
- **Chave:** Armazenada em `GEMINI_API_KEY`
- **Modelo:** `gemini-2.5-flash`
- **Uso:** Otimizar prompts para melhor qualidade de letras

### Resend Email
- **Endpoint:** `https://api.resend.com`
- **Chave:** Armazenada em `RESEND_API_KEY`
- **Uso:** Enviar emails de confirmação e entrega

## 📊 Schema de Banco de Dados

### Tabela: users
```sql
- id (int, PK)
- openId (varchar, unique)
- name (text)
- email (varchar)
- loginMethod (varchar)
- role (enum: admin, user)
- createdAt (timestamp)
- updatedAt (timestamp)
- lastSignedIn (timestamp)
```

### Tabela: jobs
```sql
- id (varchar, PK)
- status (enum: QUEUED, PROCESSING, DONE, FAILED)
- sunoTaskId (varchar)
- createdAt (timestamp)
- updatedAt (timestamp)
```

### Tabela: songs
```sql
- id (varchar, PK)
- jobId (varchar, FK)
- title (text)
- lyrics (longtext)
- audioUrl (text)
- shareSlug (varchar, unique)
- downloadCount (int)
- createdAt (timestamp)
```

### Tabela: leads
```sql
- id (varchar, PK)
- jobId (varchar, FK)
- email (varchar)
- style (varchar)
- names (text)
- occasion (text)
- story (longtext)
- mood (varchar)
- createdAt (timestamp)
```

## 🧪 Testes

### Testes Disponíveis

```bash
# Validação de API keys
pnpm test server/api-keys.test.ts

# Testes de fluxo
pnpm test server/flow.test.ts

# Testes rápidos
pnpm test server/quick-test.test.ts

# Todos os testes
pnpm test
```

### Resultados Esperados

- ✅ Validação de formulário
- ✅ Validação de estilos musicais
- ✅ Tratamento de erros
- ✅ Integração com APIs
- ✅ Persistência de dados

## 🚀 Deployment

### Requisitos

- Node.js 22+
- MySQL/TiDB
- Variáveis de ambiente configuradas

### Variáveis de Ambiente

```bash
# Banco de dados
DATABASE_URL=mysql://user:password@host/database

# APIs
SUNO_API_KEY=73d18ba8c67eb606d37b41dbd541a5f9
GEMINI_API_KEY=AIzaSyBUTd8EJ0GtVed6_ZRdrhAbUi3uOjdneyQ
RESEND_API_KEY=re_xxxxx

# Aplicação
APP_URL=https://seu-verso.com
JWT_SECRET=your-secret-key
VITE_APP_TITLE=Seu Verso
```

### Build

```bash
pnpm build
pnpm start
```

## 📝 Notas Importantes

### Suno API - Polling

A Suno API **não possui endpoint de polling** (GET). Utiliza **callback URL** para notificar quando a música está pronta.

**Fluxo:**
1. Enviamos `callBackUrl` ao criar música
2. Suno API gera em background
3. Quando pronta, faz POST para nosso callback
4. Recebemos: `jobId`, `title`, `lyrics`, `audioUrl`

### Qualidade de Letras

Utilizamos Gemini LLM para otimizar prompts:
- Transforma história em prompt estruturado
- Garante português brasileiro 100%
- Evita mistura de idiomas
- Cria rimas naturais e métricas consistentes

### Email de Notificação

Quando a música está pronta:
1. Recebemos callback da Suno
2. Salvamos dados no banco
3. Enviamos email com link de download
4. Usuário acessa `/m/{slug}` para ouvir

## 🐛 Troubleshooting

### Erro: "Invalid input: expected boolean, received string"
**Solução:** Checkbox agora usa `checked` e `onCheckedChange` ao invés de `register()`.

### Erro: Suno API 404
**Solução:** Endpoint correto é `/api/v1/generate` (POST), não GET.

### Erro: Email 401 (Resend)
**Solução:** Verificar se `RESEND_API_KEY` está correta e configurada.

### Timeout em testes
**Solução:** Suno API é lenta (5-30s). Usar timeout maior em testes de integração.

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar logs em `.manus-logs/`
2. Consultar testes em `server/*.test.ts`
3. Revisar documentação em `SUNO_API_NOTES.md`

## 📄 Licença

MIT - 2024 Seu Verso
