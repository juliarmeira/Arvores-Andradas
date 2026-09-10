---
name: find-skills
description: >-
  Ajuda a descobrir e instalar skills do ecossistema aberto de agentes.
  Usar quando o usuário perguntar como fazer X onde X pode ter um skill existente,
  ou quando pedir para encontrar/buscar skills para uma tarefa específica.
source: https://github.com/vercel-labs/skills/tree/main/skills/find-skills
---

# Find Skills — Descoberta de Skills do Ecossistema

Skill para descobrir e instalar skills do ecossistema aberto de agentes.

## Quando Usar

- Usuario pergunta "como fazer X" onde X pode ter um skill existente
- Usuario pede "encontre um skill para X"
- Usuario quer estender as capacidades do agente
- Usuario menciona que gostaria de ajuda com um domínio específico

## Como Descobrir Skills

### Passo 1: Verificar o Leaderboard

Antes de buscar, verificar https://skills.sh/ para skills populares.

Top skills por domínio:
- **Web development:** vercel-labs/agent-skills (React, Next.js, web design)
- **Frontend design:** anthropics/skills (frontend-design, document-processing)
- **Design avançado:** pbakaus/impeccable, nextlevelbuilder/ui-ux-pro-max-skill
- **Desenvolvimento:** obra/superpowers (metodologia completa)

### Passo 2: Buscar via CLI

```bash
npx skills find [query]
npx skills find --owner <github-owner>
```

### Passo 3: Instalar

```bash
npx skills add <package>
# Para Antigravity:
agy plugin install <github-url>
```

### Passo 4: Atualizar

```bash
npx skills update
```
