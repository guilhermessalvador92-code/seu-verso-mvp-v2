# Seu Verso MVP - Project TODO

## Fase 1: Database Schema & Configuration
- [x] Atualizar schema com tabelas Job, Song, Lead
- [x] Executar migrations (pnpm db:push)
- [x] Verificar conexão com banco de dados

## Fase 2: Backend Core
- [x] Implementar integração com Suno API
- [x] Implementar geração de prompts com LLM
- [x] Implementar sistema de polling para verificar status
- [x] Implementar routers tRPC para jobs
- [x] Implementar sistema de emails com Resend API

## Fase 3: Frontend - Landing Page
- [x] Criar hero section com CTA
- [x] Criar seção "Como funciona" (3 passos)
- [x] Criar seção "Exemplos" com cards
- [x] Criar seção "Preço" (R$49)
- [x] Criar seção FAQ
- [x] Criar rodapé

## Fase 4: Frontend - Formulário & Status
- [x] Criar formulário principal com validações
- [x] Criar página de status (/status/{jobId})
- [x] Implementar polling automático

## Fase 5: Frontend - Entrega & Páginas Legais
- [x] Criar página de entrega (/m/{slug})
- [x] Criar página /termos
- [x] Criar página /privacidade

## Fase 6: Testes & Finalização
- [x] Criar testes vitest para routers
- [x] Executar testes (9 testes passando)
- [x] Validar build do projeto
- [x] Otimizar performance


## Correções & Testes (Nova Sessão)
- [x] Corrigir erro de validação boolean em routers
- [x] Configurar SUNO_API_KEY nas secrets
- [x] Configurar GEMINI_API_KEY nas secrets
- [x] Testar criação de música com Suno API real (Task ID gerado com sucesso)
- [x] Testar geração de prompt com Gemini LLM (funcionando)
- [x] Testar requisição GET para download de música (funcionando)
- [x] Testar fluxo completo end-to-end (validações passando)
- [x] Validar resposta do Suno com audioUrl (callback implementado)
- [x] Implementar polling automático (ativo)
- [x] Corrigir endpoint de polling (usando callback URL)


## Webhook Suno API (Nova Sessão)
- [x] Criar endpoint webhook para callback
- [x] Implementar validação de payload
- [x] Processar resultado da Suno (audioUrl, lyrics, title)
- [x] Atualizar job status para DONE
- [x] Enviar email de notificação (integrado)
- [x] Testar webhook com curl (6 testes passando)
- [x] Fornecer URL de webhook ao usuário
- [x] Criar documentação completa (WEBHOOK_DOCUMENTATION.md)
