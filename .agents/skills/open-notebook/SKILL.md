---
name: open-notebook
description: >-
  Alternativa open-source e privada ao Google Notebook LM. Suporte a 18+
  provedores de IA, geração de podcasts multi-speaker, busca full-text e
  vetorial, multimodalidade. Deploy via Docker. Ativar quando o usuário
  pedir implementação de notebook de pesquisa, gestão de conhecimento local,
  ou alternativa self-hosted ao Notebook LM.
source: https://github.com/lfnovo/open-notebook
---

# Open Notebook — Alternativa Open-Source ao Notebook LM

Solução open-source, focada em privacidade, para organizar e interagir
com conhecimento pessoal — como o Google Notebook LM, mas local e extensível.

## Quando Usar

- Usuário quer organizar pesquisa de forma privada
- Usuário quer chatbot sobre seus próprios documentos
- Usuário precisa de alternativa ao Notebook LM sem vendor lock-in
- Criação de podcasts a partir de documentos

## Stack Técnica

- **Backend:** Python + LangChain
- **Frontend:** Next.js + React
- **Database:** SurrealDB v2
- **Deploy:** Docker Compose

## Vantagens sobre Notebook LM

| Feature | Open Notebook | Google Notebook LM |
|---------|---------------|-------------------|
| Privacidade | Self-hosted | Google cloud |
| Provedores IA | 18+ (OpenAI, Anthropic, Ollama...) | Apenas Google |
| Podcast Speakers | 1-4 speakers customizáveis | 2 speakers fixos |
| API | REST API completa | Sem API |
| Deploy | Docker, cloud, local | Apenas Google |
| Custo | Só API de IA | Free tier + assinatura |

## Setup Rápido (Docker)

```bash
curl -o docker-compose.yml https://raw.githubusercontent.com/lfnovo/open-notebook/main/docker-compose.yml
# Configurar OPEN_NOTEBOOK_ENCRYPTION_KEY no .env
docker compose up -d
```

Acesso: http://localhost:8502 (Web UI) | http://localhost:5055 (REST API)

## Recursos

- Suporte multimodal: PDFs, vídeos, áudio, web pages
- Busca full-text + vetorial em todo o conteúdo
- UI multilíngue: Inglês, Português, Chinês, Japonês, Russo, Bengali
