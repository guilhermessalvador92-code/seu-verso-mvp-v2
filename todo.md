# Seu Verso MVP - Project TODO

## ✅ CONCLUÍDO - Fase 1 a 6 (MVP Completo)
- [x] Database Schema & Configuration
- [x] Backend Core (Suno API, Gemini LLM, tRPC)
- [x] Frontend Landing Page
- [x] Frontend Formulário & Status
- [x] Frontend Entrega & Páginas Legais
- [x] Testes & Finalização

## ✅ CONCLUÍDO - Correções & Melhorias
- [x] Webhook Suno API
- [x] Email Retry Logic
- [x] Database Migration Fix
- [x] MVP Simplification
- [x] Remove Email System - WhatsApp Only
- [x] Integração Fluxuz - WhatsApp Push

## ✅ CONCLUÍDO - Melhorias Recentes (Sessão Atual)
- [x] Corrigir lógica Gemini (processar ANTES da Suno)
- [x] Adicionar seleção de idioma (PT-BR, ES, EN-US, EN-GB)
- [x] Expandir ocasiões (6 opções)
- [x] Fallback quando Gemini falhar
- [x] Formulário pré-preenchido para testes
- [x] Página de teste rápido (/quick-test)
- [x] Simplificar payload Fluxuz
- [x] Criar teste de validação do payload
- [x] Criar página de teste end-to-end (/test-e2e)
- [x] Adicionar coluna `language` na tabela `leads`
- [x] Fazer push da migração (pnpm db:push)
- [x] Corrigir payload do teste E2E (adicionar campos obrigatórios)

## 🔴 BLOQUEIO ATUAL - Chave API Suno Inválida
- [ ] Atualizar SUNO_API_KEY (401 Unauthorized - "You do not have access permissions")
- [ ] Testar criação de música end-to-end após atualizar chave
- [ ] Validar envio WhatsApp via Fluxuz

## 📝 RESUMO DO STATUS ATUAL

### ✅ O que está funcionando:
1. **Database**: Schema completo com colunas corretas (incluindo `language`)
2. **Backend**: Routers tRPC funcionais com validação completa
3. **Frontend**: Formulários com todos os campos necessários
4. **Gemini Integration**: Processa história ANTES da Suno
5. **Fluxuz Integration**: Código pronto para enviar WhatsApp
6. **Teste E2E**: Página funcional com polling automático

### ⚠️ O que precisa ser resolvido:
1. **Suno API Key**: Chave atual retorna 401 Unauthorized
2. **Teste completo**: Aguardando nova chave para validar fluxo end-to-end

### 📊 Estrutura do Banco de Dados:
```sql
leads:
  - id (varchar)
  - jobId (varchar)
  - whatsapp (varchar)
  - name (text)
  - style (varchar)
  - occasion (text)
  - story (text)
  - mood (varchar)
  - language (varchar) ✅ ADICIONADO
  - createdAt (timestamp)
```

### 🔄 Fluxo Completo (Pronto para Funcionar):
1. Usuário preenche formulário → Frontend valida
2. Backend cria Job + Lead no banco
3. Gemini processa história → gera prompt otimizado
4. Suno API cria música (BLOQUEADO - precisa nova chave)
5. Webhook recebe callback da Suno
6. Fluxuz envia WhatsApp com link da música

### 📱 Telefone de Teste:
- WhatsApp: +5553846158886

### 🎯 Próximos Passos:
1. Obter nova SUNO_API_KEY válida
2. Atualizar secret no ambiente
3. Testar criação de música
4. Validar envio WhatsApp
5. Salvar checkpoint final
6. Criar roadmap retroativo completo

## 🐛 Bug Crítico - Erro de Sintaxe SQL na Migração
- [x] Identificar arquivo de migração com erro de sintaxe
- [x] Corrigir sintaxe SQL: "IF EXISTS `names` `name` text"
- [x] Limpar migrações antigas
- [x] Regenerar schema limpo
- [x] Testar inicialização do banco

## 🔄 Mudança de Escopo - Remover Gemini do MVP
- [x] Atualizar SUNO_API_KEY com nova chave
- [x] Remover processamento Gemini do fluxo
- [x] Enviar prompt direto para Suno (sem LLM)
- [x] Testar criação de música end-to-end
- [x] Validar envio WhatsApp (aguardando webhook)
