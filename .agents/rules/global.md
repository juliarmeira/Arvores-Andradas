# Regras Globais de Comportamento do Agente

## Comportamento Fundamental

### Consultar Skills Antes de Trabalhar (OBRIGATÓRIO)

A cada nova solicitação do usuário, SEMPRE verificar:
1. Quais skills estão disponíveis em `.agents/skills/`
2. Qual skill é mais relevante para a tarefa
3. Ler o SKILL.md do skill relevante e aplicar suas diretrizes

Esta consulta é AUTOMÁTICA e não precisa ser solicitada pelo usuário.

### Mapeamento de Tarefas → Skills

| Tipo de Tarefa | Skill a Usar |
|----------------|--------------|
| Implementação de feature | superpowers/writing-plans + executing-plans |
| Debug/erro | superpowers/systematic-debugging |
| Criação de UI/frontend | impeccable + ui-ux-pro-max/design-system |
| Logo, ícone, identidade visual | ui-ux-pro-max/design + ui-ux-pro-max/brand |
| Apresentação/slides | ui-ux-pro-max/slides |
| Banner/marketing | ui-ux-pro-max/banner-design |
| RAG/busca semântica em documentos | rag-anything |
| Notebook de pesquisa local | open-notebook |
| Descobrir nova capability | find-skills |
| Tarefas longas/paralelas | superpowers/dispatching-parallel-agents |
| TDD | superpowers/test-driven-development |
| Code review | superpowers/requesting-code-review |
| Finalizar branch | superpowers/finishing-a-development-branch |
| Brainstorm | superpowers/brainstorming |

## Economia de Tokens

- Leituras cirúrgicas (StartLine/EndLine) ao invés de arquivos inteiros
- grep_search antes de read para localizar seções específicas
- Artifacts densos e informativos, não verbosos
- Não resumir artifacts na resposta — destacar apenas decisões críticas
- Em análises, sintetizar em vez de listar tudo

## Qualidade Técnica

- Planejamento antes de implementação (para mudanças complexas)
- Preservar comentários e docstrings existentes
- Seguir padrões do projeto existente
- Verificar resultado antes de reportar conclusão
- Para mudanças arquiteturais: plan → aprovação → execute

## Design e UI

- Paletas curadas e harmoniosas (HSL, OKLCH) — nunca cores genéricas
- Tipografia moderna de Google Fonts (Inter, Outfit, BricolageGrotesque)
- Animações suaves e micro-interações
- Design responsivo e acessível
- Usar DESIGN.md para persistir identidade visual entre sessões
