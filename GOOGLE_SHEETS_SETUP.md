# Configuração da Integração com Google Planilhas

Este guia explica como configurar a integração do aplicativo Inventário Arbóreo Andradas com o Google Planilhas.

## 📋 Pré-requisitos

1. Acesso à planilha Google: https://docs.google.com/spreadsheets/d/1A8mIArlQiqcvnIgRGYgSiU5WDF2ClbGYe0XOHiyOciU/edit
2. Permissão de editor na planilha
3. Conta Google ativa

## 🚀 Passo 1: Configurar o Apps Script

1. Abra a planilha Google linkada acima
2. Vá em **Extensões** > **Apps Script**
3. Exclua qualquer código existente no editor
4. Copie e cole todo o conteúdo do arquivo `google-sheets-apps-script.js`
5. Salve o projeto com Ctrl+S
6. Nomeie o projeto como "Inventário Arbóreo API"

## 🚀 Passo 2: Fazer Deploy do Script

1. No editor do Apps Script, clique em **Implantar** > **Nova implantação**
2. Clique em **"Seleccionar tipo"** e escolha **"API Executável"**
3. Em "Quem pode acessar", selecione **"Todos"**
4. Clique em **"Implantar"**
5. **Autorize o acesso** quando solicitado (pode ser necessário revisar permissões)
6. Copie a **URL gerada** (formato: `https://script.google.com/macros/s/SEU_ID/exec`)

## 🚀 Passo 3: Configurar Variáveis de Ambiente

1. Crie ou edite o arquivo `.env` na raiz do projeto
2. Adicione a variável com o ID do script:

```env
GOOGLE_SHEETS_SCRIPT_ID="YOUR_SCRIPT_ID_HERE"
```

**Obs:** O ID já está pré-configurado no arquivo `.env.example`

## 🚀 Passo 4: Reiniciar o Servidor

```bash
# Parar o servidor (Ctrl+C se estiver rodando)
# Reiniciar
npm run dev
```

## 📊 Estrutura da Planilha

A planilha terá uma aba chamada **"Inventário Arbóreo"** com as seguintes colunas:

| Coluna | Descrição |
|--------|-----------|
| ID | Identificador único da árvore |
| Latitude | Coordenada GPS latitude |
| Longitude | Coordenada GPS longitude |
| Endereço | Logradouro completo |
| Ponto de Referência | Referência para localização |
| Local de Plantio | Calçada, Praça, etc. |
| Espécie | Nome popular da espécie |
| Certeza | Nível de certeza da identificação |
| Tipo de Planta | Nativa ou Arbusto/Flor |
| Foto Árvore | URL ou Base64 da foto da árvore |
| Foto Tronco | URL ou Base64 da foto do tronco |
| Foto Folha | URL ou Base64 da foto das folhas |
| Foto Flor/Fruto | URL ou Base64 da foto de flores/frutos |
| Foto Dano | URL ou Base64 da foto de danos |
| Porte | Pequeno, Médio ou Grande |
| Tronco DBH | Fino, Médio ou Grosso |
| [Checklist de Saúde] | Campos TRUE/FALSE para cada item |
| [Interferências] | Campos TRUE/FALSE para cada item |
| Intervenção | Tipo de intervenção necessária |
| Mês Poda | Mês sugerido para poda |
| Histórico Podas | Descrição do histórico |
| Observações | Observações finais |
| Técnico | Nome do técnico responsável |
| Data Criação | Data/hora do cadastro |

## 🔄 Como Funciona a Sincronização

### Sincronização Automática
- Ao **adicionar** uma árvore: dados são salvos localmente e enviados para a planilha em background
- Ao **editar** uma árvore: alterações são sincronizadas automaticamente
- Ao **deletar** uma árvore: registro é removido da planilha

### Sincronização Manual
- Clique no **ícone de sincronização** (nuvem) no cabeçalho
- O app envia árvores locais que não existem na planilha
- O app recebe árvores da planilha que não existem localmente
- Dados locais sempre têm prioridade em caso de conflito

### Status da Conexão
- 🟢 **Verde (Nuvem)**: Conectado ao Google Planilhas
- 🔴 **Vermelho (Nuvem cortada)**: Desconectado, apenas dados locais
- ⚪ **Cinza**: Verificando conexão

## 🔧 Solução de Problemas

### "Erro ao conectar com Google Sheets"
1. Verifique se o Apps Script foi deployado corretamente
2. Verifique se a URL está acessível (abra no navegador)
3. Verifique o console do navegador (F12) para erros
4. Verifique o log do Apps Script em "Execuções"

### "Dados não aparecem na planilha"
1. Verifique se a aba "Inventário Arbóreo" foi criada
2. Verifique se os cabeçalhos estão corretos
3. Execute a função `testAPI()` no editor do Apps Script para testar

### "Fotos não são salvas"
- Fotos em Base64 podem ser muito grandes para a planilha
- Recomenda-se usar URLs de imagens (Google Photos, Imgur, etc.)
- Tamanho máximo recomendado: 100KB por foto

## 📝 Notas Importantes

1. **Dados Locais**: O app sempre funciona offline com dados salvos no navegador
2. **Prioridade**: Dados locais têm prioridade sobre dados da planilha em caso de conflito
3. **Performance**: Evite sincronizar muitas árvores com fotos grandes simultaneamente
4. **Backup**: Recomenda-se exportar CSV/JSON regularmente como backup adicional

## 🔐 Segurança

- O Apps Script está configurado para aceitar requisições de todos
- Em produção, considere adicionar autenticação
- Fotos com dados sensíveis devem ser evitadas
- O script não armazena chaves de API ou dados sensíveis
