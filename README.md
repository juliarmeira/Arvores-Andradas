# Inventário Arbóreo - Andradas

Este é um aplicativo web para gerenciar o inventário de árvores em Andradas, Minas Gerais.

## Sobre

Um aplicativo completo para cadastro e monitoramento de árvores urbanas na cidade de Andradas/MG, incluindo:

- Cadastro de novas árvores (dados de localização, espécie, fotos, condição e calendário de poda)
- Visualização de árvores no mapa
- Catálogo de árvores cadastradas
- Alertas de poda próxima
- Fotos das árvores (frontal, tronco, folhas, flores/frutos, danos)

## Funcionalidades

- **Cadastro de Árvores**: Formulário completo com múltiplos passos para coletar dados detalhados
- **Fotos**: Cada etapa permite registrar fotos específicas da árvore
- **Mapa Interativo**: Visualização geográfica das árvores
- **Sincronização**: Salva dados localmente e sincroniza com Google Sheets (via Apps Script)
- **Catálogo**: Filtra árvores por espécie, bairro, rua e condição
- **Alertas**: Notifica sobre podas próximas

## Tecnologias

- Frontend: HTML5, CSS3 (Tailwind CSS), JavaScript
- Backend: Node.js (server.js), Google Apps Script (para sincronização)
- Banco de dados: LocalStorage e Google Sheets
- Mapas: Leaflet.js

## Como Usar

1. Clone este repositório
2. Abra `index.html` em um navegador moderno
3. Use o menu inferior para navegar entre as páginas
4. Clique no botão "+ Cadastrar" para começar a cadastrar árvores

## Requisitos

- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- GPS/Habilitado de localização (para captura de coordenadas)

## Estrutura de Arquivos

- `index.html` - Página principal (interface do aplicativo)
- `app.js` - Lógica principal do aplicativo (cadastro, mapeamento, dados)
- `server.js` - Servidor Node.js (API para sincronização com Google Sheets)
- `google-sheets-apps-script.js` - Script do Google Apps Script para planilha
- `styles.css` - Arquivo de estilos
- `Referencias/` - Imagens de árvores de exemplo

## Desenvolvimento Local

Para desenvolvimento local com os arquivos script.js e server.ts no VS Code, siga estes passos:

1. Certifique-se de que o Node.js está instalado no seu sistema.
2. Abra o terminal no VS Code, navegue até a raiz do projeto e execute:

```bash
npm init -y
npm i express nodemon concurrently
docker-compose up -d
```

3. No VS Code, com o terminal aberto na raiz do projeto, execute os seguintes comandos em terminais separados:

```bash
npm i
npm run dev
```

4. Para usar as imagens do Google, use:
```bash
chmod -R 755 Referencias/
```

## Histórico de Versões

Este aplicativo evolui continuamente para melhor atender às necessidades da comunidade de Andradas. Contribuições são sempre bem-vindas! Para desenvolver este aplicativo, entre em contato com Júlia R Meira para saber como usar os scripts do Google Sheets e configurar a API para a sua própria organização.

## Contato

Desenvolvido por: Júlia R Meira
E-mail: juliareismeira@gmail.com
