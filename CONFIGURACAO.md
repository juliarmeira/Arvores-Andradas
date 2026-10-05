# Configuração das integrações

## 1. Identificação gratuita pelo Pl@ntNet

1. Crie uma conta gratuita em https://my.plantnet.org/.
2. Abra **Settings > API key** e gere a chave.
3. Para uso pelo aplicativo local, não é necessário expor a chave no navegador: ela passa pelo servidor local.
4. No aplicativo, cole a chave em **Etapa 2 > Chave da API** e clique em **Salvar chave**.
5. O plano gratuito permite até 500 identificações por dia.

## 2. Gravação na planilha Google

1. Abra https://script.google.com/ com a mesma conta que edita a planilha.
2. Crie um novo projeto.
3. Copie todo o conteúdo do arquivo `google-apps-script.gs` para o editor e salve.
4. Clique em **Implantar > Nova implantação**.
5. Tipo: **Aplicativo da Web**.
6. Executar como: **você**.
7. Quem pode acessar: **qualquer pessoa com o link**.
8. Autorize o acesso solicitado e copie a URL terminada em `/exec`.
9. No aplicativo, cole essa URL em **Etapa 4 > URL do aplicativo Google Apps Script**.

A planilha configurada é `Controle de compensação - Corte de Árvore`, aba `Página1`, ID `1f03SZqhFe4AbSd-Z4kg_MgBzDxg9ES-nzgLAiZfLDNU`.

## 3. Abrir o aplicativo

Dê dois cliques em `start.bat`. O servidor será iniciado minimizado e o navegador abrirá em http://127.0.0.1:4178.