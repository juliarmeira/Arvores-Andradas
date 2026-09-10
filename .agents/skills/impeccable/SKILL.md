---
name: impeccable
description: >-
  Design guidance para agentes de IA. 23 comandos de design, 61 regras
  determinísticas para detectar anti-padrões, e iteração ao vivo no browser.
  Ativar quando o usuário pedir criação, revisão, melhoria ou auditoria de
  interfaces visuais, componentes UI, landing pages, dashboards ou qualquer
  frontend.
source: https://github.com/pbakaus/impeccable
---

# Impeccable — Design Excellence para Agentes

Design guidance para agentes de IA: 1 skill, 23 comandos, iteração ao vivo
no browser, e 61 regras determinísticas para design de frontend.

## Princípio Central

Todo modelo treinado nos mesmos templates SaaS produz os mesmos patterns:
Inter para tudo, gradientes roxo-azul, cards dentro de cards, ícones com
bordas arredondadas acima de cada heading.

**Impeccable elimina esses clichês.**

## Anti-Padrões Proibidos

- ❌ Fontes overused: Arial, Inter, system defaults sem curadoria
- ❌ Texto cinza em fundo colorido
- ❌ Preto/cinza puro (sempre tintar com a cor do projeto)
- ❌ Tudo dentro de cards / cards dentro de cards
- ❌ Bounce/elastic easing (parece datado)
- ❌ Ícone tile acima de cada heading

## Comandos Disponíveis

### Setup (fazer primeiro em cada projeto)
- `/impeccable init` — Captura contexto do produto, cria PRODUCT.md, configura live mode

### Fluxo de Criação
- `/impeccable craft` — Fluxo completo: shape → build com iteração visual
- `/impeccable shape` — Planejamento UX/UI antes de codificar
- `/impeccable document` — Gerar DESIGN.md a partir do código existente
- `/impeccable extract` — Extrair componentes e tokens reutilizáveis

### Revisão e Qualidade
- `/impeccable critique` — Review UX: hierarquia, clareza, ressonância emocional
- `/impeccable audit` — Checagem técnica: a11y, performance, responsivo
- `/impeccable polish` — Passe final de alinhamento ao design system

### Ajustes de Tom
- `/impeccable bolder` — Amplificar designs monótonos
- `/impeccable quieter` — Tonalizar designs excessivamente ousados
- `/impeccable distill` — Reduzir ao essencial

### Elementos Específicos
- `/impeccable animate` — Adicionar motion proposital
- `/impeccable colorize` — Introduzir cor estratégica
- `/impeccable typeset` — Corrigir tipografia, hierarquia, sizing
- `/impeccable layout` — Corrigir layout, espaçamento, ritmo visual
- `/impeccable delight` — Adicionar momentos de alegria

### Edge Cases e Robustez
- `/impeccable harden` — Error handling, i18n, text overflow, edge cases
- `/impeccable onboard` — First-run flows, empty states, activation paths
- `/impeccable clarify` — Melhorar copy UX pouco claro
- `/impeccable adapt` — Adaptar para diferentes devices
- `/impeccable optimize` — Melhorias de performance
- `/impeccable overdrive` — Efeitos tecnicamente extraordinários
- `/impeccable live` — Modo de iteração visual no browser

## Exemplos de Uso

```
/impeccable audit blog           # Auditar hub e páginas de post
/impeccable critique landing     # Review de design UX
/impeccable polish settings      # Passe final antes de publicar
/impeccable harden checkout      # Adicionar error handling + edge cases
```

## Workflow Recomendado para Novo Projeto

1. `/impeccable init` — Setup e contexto do produto
2. `/impeccable shape` — Planejar UX antes de codificar
3. Implementar com `/impeccable craft` iterativamente
4. `/impeccable audit` — Checar qualidade técnica
5. `/impeccable polish` — Passe final antes de publicar
