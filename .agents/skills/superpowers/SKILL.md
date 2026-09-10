---
name: superpowers
description: >-
  Metodologia completa de desenvolvimento para agentes de IA. Inclui skills para
  planejamento (writing-plans), execução (executing-plans), desenvolvimento orientado
  a subagentes (subagent-driven-development), TDD, debugging sistemático,
  code review, git worktrees e brainstorming visual. Ativar quando o usuário
  pedir implementação de features, debugging, planejamento de arquitetura ou
  qualquer workflow de engenharia de software.
source: https://github.com/obra/superpowers
---

# Superpowers — Metodologia de Desenvolvimento

Superpowers é uma metodologia completa de desenvolvimento para agentes de IA,
construída sobre um conjunto de skills composáveis.

## Quando Usar Este Skill

Ativar automaticamente quando a tarefa envolver:
- Implementação de novas features (→ writing-plans + executing-plans)
- Bugs e debugging (→ systematic-debugging)
- Múltiplas tarefas paralelas (→ dispatching-parallel-agents)
- Revisão de código (→ requesting-code-review / receiving-code-review)
- Desenvolvimento guiado por testes (→ test-driven-development)
- Sessões de ideação (→ brainstorming)

## Skills Disponíveis

### writing-plans
Criar planos de implementação estruturados antes de codar.
Princípios: YAGNI, DRY, TDD vermelho/verde real.
Subagentes com tarefas claras o suficiente para um júnior entusiasta.

**Uso:** Antes de qualquer implementação complexa, escreva o plano.

### executing-plans
Executar planos aprovados com subagentes.
Inspecionar e revisar o trabalho de cada agente antes de continuar.

### subagent-driven-development
Processo completo de SDD: spec → plano → subagentes → revisão → entrega.
Permite trabalho autônomo por horas sem desviar do plano.

### dispatching-parallel-agents
Quando múltiplas tarefas independentes podem rodar em paralelo.
Maximize throughput com trabalho concurrent.

### test-driven-development
TDD real: escreva o teste que falha, implemente o mínimo para passar,
refatore. Não escreva código sem teste cobrindo o comportamento esperado.

### systematic-debugging
Debugging estruturado: hipótese → experimento → root cause.
Ferramentas: bisect, isolamento, defense-in-depth.

### verification-before-completion
Antes de reportar conclusão: verifique testes, lint, build, comportamento esperado.
Nunca reporte "feito" sem verificar.

### brainstorming
Sessões visuais de brainstorm com servidor local e visualização interativa.

### requesting-code-review
Como preparar e solicitar code review efetivo.

### receiving-code-review
Como processar e aplicar feedback de code review.

### finishing-a-development-branch
Checklist de finalização: testes, docs, PR, merge.

### using-git-worktrees
Usar git worktrees para trabalho paralelo em múltiplas branches.

### writing-skills
Criar novos skills seguindo as melhores práticas.

## Referência de Ferramentas (Antigravity)

Ver `.agents/skills/superpowers/references/antigravity-tools.md` para
referência completa das ferramentas disponíveis no Antigravity.
