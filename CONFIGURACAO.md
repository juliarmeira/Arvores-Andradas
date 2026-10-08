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
## 4. Integração da planilha Controle de água

O aplicativo consulta automaticamente a aba `Todos` da planilha `Controle de água` (ID `1BDuNmB5umdQLre8bDE-Ltuk0WCnl9pLT5kYYmFmzW6Y`).

Para habilitar a inclusão de novas coletas:

1. Abra o projeto do Google Apps Script já usado pelo aplicativo.
2. Substitua o código pelo conteúdo atualizado de `google-apps-script.gs`.
3. Clique em **Implantar > Gerenciar implantações**.
4. Edite a implantação, selecione **Nova versão** e clique em **Implantar**.
5. Mantenha **Executar como: você** e **Quem pode acessar: qualquer pessoa com o link**.
6. A URL `/exec` pode continuar a mesma. O aplicativo envia `action: addWaterRecord` para separar as coletas de água dos registros de vistoria.

Se for utilizada uma implantação separada, configure `WATER_SHEETS_WEBHOOK_URL` no ambiente do servidor/Vercel. Sem essa variável, o sistema reutiliza `SHEETS_WEBHOOK_URL`.
