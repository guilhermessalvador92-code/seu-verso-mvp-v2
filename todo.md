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
