# 🧪 Seu Verso - Laboratório de Experimentos (LAB)

Este documento consolida todas as funcionalidades, componentes e endpoints criados exclusivamente para o ambiente **LAB** (`lab.*`). Esta estrutura foi desenhada para permitir testes rápidos sem comprometer a estabilidade da produção.

---

## 🚀 Como Funciona a Separação
A detecção de ambiente é feita via hostname no arquivo `client/src/lib/environment.ts`.
- **Produção**: `seuverso.com.br` (ou qualquer outro host padrão)
- **LAB**: Ativado quando o host começa com `lab.` (ex: `lab.seuverso.com.br`)

---

## 🛠️ Componentes Exclusivos (Frontend)

### 1. Layouts e Estrutura
- **`client/src/components/LabLayout.tsx`**: Cópia isolada do layout principal. Permite mudar o Header, Footer ou estilos globais apenas para o LAB.
- **`client/src/components/PlayerLab.tsx`**: Versão experimental do player que inclui:
  - **Seleção de Versões**: Interface de abas para alternar entre as duas músicas geradas (v1 e v2).
  - **Questionário POST**: Overlay que bloqueia o áudio até que o feedback seja enviado.

### 2. Fluxo de Engajamento
- **`client/src/components/PreGenerationFeedback.tsx`**: Questionário exibido durante o status `PROCESSING`. Coleta dados sobre destinatário, emoção e percepção de preço enquanto o usuário espera.

---

## 🔌 Endpoints de API (Backend)

Todos os endpoints experimentais estão centralizados em `server/_core/index.ts`:

| Endpoint | Método | Descrição |
| :--- | :--- | :--- |
| `/api/tester-feedback/pre` | `POST` | Salva dados coletados antes da música ficar pronta. |
| `/api/tester-feedback/post` | `POST` | Salva NPS e comentários coletados após a música ficar pronta. |
| `/api/status-simple/:jobId` | `GET` | Atualizado para retornar a lista completa de músicas (v1 e v2). |

---

## 💾 Persistência Local (Browser)
Para garantir uma experiência fluida, usamos `localStorage` para não repetir perguntas:
- `feedback_pre_done_{jobId}`: Marca que o questionário inicial foi respondido/pulado.
- `feedback_post_done_{jobId}`: Marca que o feedback final foi enviado, liberando o player permanentemente para aquela música.

---

## 📝 Notas de Manutenção
1. **Isolamento**: Sempre que criar uma nova funcionalidade experimental, duplique o componente base e use o sufixo `Lab`.
2. **Limpeza**: Para promover uma função do LAB para a Produção, basta mover a lógica do componente `Lab` para o componente `Production` correspondente.
3. **Logs**: Evite `console.log` em produção. Use a lógica de `isLabEnvironment()` se precisar de logs de debug apenas no laboratório.

---
*Documento gerado em 08 de Fevereiro de 2026.*
