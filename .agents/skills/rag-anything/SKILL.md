---
name: rag-anything
description: >-
  Framework all-in-one para RAG (Retrieval-Augmented Generation) multimodal.
  Processa PDFs, documentos Office, imagens, tabelas, equações matemáticas.
  Baseado em LightRAG com knowledge graph cross-modal. Ativar quando o usuário
  pedir implementação de busca semântica, RAG, chatbot sobre documentos,
  ou processamento de documentos multimodais.
source: https://github.com/HKUDS/RAG-Anything
---

# RAG-Anything — Framework RAG Multimodal All-in-One

Framework abrangente para RAG que processa qualquer tipo de documento,
incluindo conteúdo multimodal (texto, imagens, tabelas, equações).

## Quando Usar

- Usuário quer implementar busca sobre documentos (PDFs, DOCX, etc.)
- Usuário quer chatbot que responde sobre uma base de conhecimento
- Processamento de documentos com imagens, tabelas ou equações
- Sistema de knowledge management empresarial

## Pipeline de Processamento

```
Document Parsing → Content Analysis → Knowledge Graph → Intelligent Retrieval
     |                   |                  |                   |
  MinerU          VLM para imagens    Cross-modal           Vector+Graph
  Universal       Tabelas/dados       Entities             Fusion Search
  formats         Math parser         Relationships
```

## Instalação

```bash
pip install raganything
# ou com uv:
uv add raganything
```

Requisitos: Python 3.10+

## Features Principais

- **Universal Document Support:** PDF, DOCX, PPTX, XLSX, imagens, etc.
- **Specialized Content Analysis:**
  - Visual Content Analyzer (VLM para imagens)
  - Structured Data Interpreter (tabelas, dados)
  - Mathematical Expression Parser (LaTeX)
  - Extensible Modality Handler (plugin para novos tipos)
- **Multimodal Knowledge Graph:** Entidades cross-modais + relacionamentos
- **Hybrid Retrieval:** Vector similarity + graph traversal + modality-aware ranking

## Modos de Operação

1. **MinerU-based parsing:** Parsing de alta fidelidade de documentos complexos
2. **Direct content injection:** Bypass do parsing, inserção de listas de conteúdo pré-processadas
3. **VLM-Enhanced Query:** Quando documentos têm imagens, integra VLM para análise visual

## Referência Técnica

- Paper: https://arxiv.org/abs/2510.12323
- Baseado em: https://github.com/HKUDS/LightRAG
- Comunidade: Discord https://discord.gg/yF2MmDJyGJ
