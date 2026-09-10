# 🧠 Memória Raiz do Agente — Júlia / Prefeitura de Andradas

> Este arquivo é carregado automaticamente pelo Antigravity em todos os projetos deste workspace.
> Ele contém regras de comportamento permanentes, referências a skills instaladas e orientações de trabalho.

---

## 🔑 Regras de Comportamento Global (SEMPRE ATIVAS)

### 1. Consultar Skills e Agentes Antes de Trabalhar

**ANTES de qualquer implementação**, devo sempre:
1. Verificar quais **skills** e **agentes** estão disponíveis no projeto atual (`.agents/skills/`)
2. Identificar quais skills se aplicam ao contexto da tarefa
3. Ler e aplicar o `SKILL.md` relevante automaticamente, sem precisar ser solicitado
4. Usar as estratégias do skill para economizar tokens e entregar com mais qualidade

Nunca pule esta etapa. A consulta aos skills é parte do workflow padrão.

### 2. Economia de Tokens

- Prefira leituras cirúrgicas (linhas específicas) a leituras integrais de arquivos
- Use grep_search para localizar antes de ler
- Evite repetir conteúdo já presente no contexto
- Em análises, produza resumos densos, não verbosos
- Ao criar artifacts, não os resume na resposta - apenas destaque o que é crítico

### 3. Profissionalismo Técnico

- Sempre analise antes de agir. Planeje com precisão
- Preserve comentários e docstrings existentes
- Siga os padrões do projeto antes de introduzir novos
- Para mudanças complexas: planeje, apresente, aguarde aprovação, execute

### 4. Design de Interfaces (quando aplicável)

- Usar o skill impeccable para auditoria e polish de UI
- Usar o skill design-system para criar sistemas de tokens e componentes
- Usar o skill ui-styling para styling premium com fontes e paletas curadas
- Aplicar DESIGN.md (formato google-labs-code) para persistir identidade visual
- Anti-padrões proibidos: Inter/Arial genéricos, gradientes roxo-azul clichê, cards aninhados, bounce/elastic animation

### 5. Desenvolvimento Orientado a Planos

- Tarefas complexas: usar skill writing-plans, gerar plano, aprovação, executar
- Desenvolvimento paralelo: usar skill dispatching-parallel-agents
- Debug sistemático: usar skill systematic-debugging
- TDD sempre que aplicável: usar skill test-driven-development

### 6. Verificação Antes de Concluir

- Sempre verificar o resultado antes de reportar conclusão
- Usar skill verification-before-completion em tarefas críticas
- Rodar testes disponíveis; reportar falhas com diagnóstico

---

## 🛠️ Skills Instalados (Catálogo Global)

### Metodologia de Desenvolvimento (obra/superpowers)

Skills disponíveis: writing-plans, executing-plans, subagent-driven-development,
dispatching-parallel-agents, test-driven-development, systematic-debugging,
verification-before-completion, requesting-code-review, receiving-code-review,
finishing-a-development-branch, using-git-worktrees, brainstorming, writing-skills

### Design & UI/UX (pbakaus/impeccable)

Comandos: init, craft, shape, critique, audit, polish, bolder, quieter,
animate, overdrive, typeset, colorize, layout, delight, distill, harden,
onboard, clarify, adapt, optimize, live, document, extract

### Design Avançado (nextlevelbuilder/ui-ux-pro-max-skill)

Skills: design (logo/icon/slides/CIP), design-system (tokens/components),
brand (identity/guidelines/palettes), ui-styling (premium styling/fonts),
slides (professional slides), banner-design (multi-format banners)

### Formato de Identidade Visual (google-labs-code/design.md)

Usar DESIGN.md com YAML frontmatter para tokens + markdown para rationale.
Validar com: npx @google/design.md lint DESIGN.md

### RAG Multimodal (HKUDS/RAG-Anything)

Framework all-in-one para RAG com documentos multimodais (PDFs, Office, imagens, tabelas).
Instalação: pip install raganything

### Notebook IA Local (lfnovo/open-notebook)

Alternativa open-source ao Google Notebook LM. Deploy via Docker.
Stack: Python + Next.js + SurrealDB + LangChain

### Descoberta de Skills (vercel-labs/find-skills)

Quando precisar de nova capability: npx skills find [query] | npx skills add <pkg>
Browse: https://skills.sh/

---

## 📁 Estrutura de Customizações

.agents/skills/superpowers/   <- Metodologia de desenvolvimento
.agents/skills/impeccable/    <- Auditoria e polish de UI
.agents/skills/ui-ux-pro-max/ <- Design avancado
.agents/skills/rag-anything/  <- Referência RAG multimodal
.agents/rules/global.md       <- Regras de comportamento

---

Ultima atualizacao: 2026-09-10 | Configurado por: Antigravity
