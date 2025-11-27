# 🐛 Troubleshooting - Monday Automation

> Guia completo de problemas comuns e soluções

---

## 📋 Índice

1. [Problemas de Configuração](#problemas-de-configuração)
2. [Erros de Webhook](#erros-de-webhook)
3. [Erros de API GraphQL](#erros-de-api-graphql)
4. [Problemas de Autenticação](#problemas-de-autenticação)
5. [Problemas de Deploy](#problemas-de-deploy)
6. [Rate Limiting](#rate-limiting)
7. [Debugging](#debugging)

---

## 🔧 Problemas de Configuração

### ❌ Erro: "Script properties not found"

**Sintomas:**
```
ReferenceError: Property 'MONDAY_API_KEY' not found
```

**Causa:** PropertiesService não configurado

**Solução:**
```javascript
// 1. No Apps Script, vá em: Projeto → Configurações do projeto
// 2. Role até "Script Properties"
// 3. Adicione:
//    - MONDAY_API_KEY: seu_token_aqui
//    - WEBHOOK_TOKEN: token_seguro
//    - ALLOWED_BOARDS: 123456,789012

// 4. Ou configure via código (uma vez):
function setupProperties() {
  var scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperties({
    'MONDAY_API_KEY': 'seu_token_aqui',
    'WEBHOOK_TOKEN': 'token_seguro_gerado',
    'ALLOWED_BOARDS': '123456,789012'
  });
  Logger.log('Properties configuradas com sucesso!');
}
```

### ❌ Board IDs Inválidos

**Sintomas:**
- Webhook não dispara
- Erro: "Board not found"

**Solução:**
```javascript
// Testar IDs dos boards
function testBoardIds() {
  var boardId = 123456; // Substitua pelo seu ID
  
  var query = `query {
    boards(ids: [${boardId}]) {
      id
      name
    }
  }`;
  
  var result = mondayQuery(query);
  Logger.log(result);
}
```

**Como encontrar o Board ID correto:**
```
URL do board: https://workspace.monday.com/boards/1234567890
                                                ^^^^^^^^^^
                                                Este é o ID
```

---

## 📡 Erros de Webhook

### ❌ "Webhook not receiving events"

**Checklist:**
1. ✅ Deploy feito como "Web App"?
2. ✅ Acesso definido como "Qualquer pessoa"?
3. ✅ URL copiada corretamente?
4. ✅ Webhook configurado no board correto?
5. ✅ Event type = "change_column_value"?

**Teste manual:**
```bash
# Teste se o endpoint está acessível
curl -X POST "SUA_URL_DO_SCRIPT" \
  -H "Content-Type: application/json" \
  -d '{"challenge":"test123"}'

# Resposta esperada:
{"challenge":"test123"}
```

### ❌ "Challenge not responding"

**Sintomas:**
- Monday.com mostra erro ao criar webhook
- "Challenge failed"

**Solução:**
```javascript
// Verifique se o código tem isso em doPost():
function doPost(e) {
  // Challenge response (DEVE ser a primeira coisa)
  if (e.parameter.challenge) {
    return ContentService.createTextOutput(
      JSON.stringify({ challenge: e.parameter.challenge })
    ).setMimeType(ContentService.MimeType.JSON);
  }
  
  // ... resto do código
}
```

### ❌ "Webhook Token Validation Failed"

**Sintomas:**
```
Error: Unauthorized - Invalid webhook token
```

**Solução:**
```javascript
// 1. Verifique se o token está correto no PropertiesService
function checkWebhookToken() {
  var token = PropertiesService.getScriptProperties().getProperty('WEBHOOK_TOKEN');
  Logger.log('Token configurado: ' + token);
}

// 2. No Monday webhook config, adicione header:
// X-Z-Webhook-Token: mesmo_valor_do_properties

// 3. Teste a validação:
function testTokenValidation() {
  var mockEvent = {
    parameter: {
      'X-Z-Webhook-Token': 'seu_token_aqui'
    }
  };
  
  var isValid = validateWebhookToken(mockEvent);
  Logger.log('Token válido: ' + isValid);
}
```

---

## 🔌 Erros de API GraphQL

### ❌ "Invalid API Key"

**Sintomas:**
```
{
  "errors": [
    {
      "message": "Invalid authentication token"
    }
  ]
}
```

**Solução:**
```javascript
// 1. Gere um novo token no Monday.com
// Avatar → Developers → My Access Tokens → Generate

// 2. Verifique se o token está correto:
function testApiKey() {
  var apiKey = PropertiesService.getScriptProperties().getProperty('MONDAY_API_KEY');
  Logger.log('API Key (primeiros 10 chars): ' + apiKey.substring(0, 10));
  
  // Teste simples
  var query = 'query { me { id name } }';
  var result = mondayQuery(query);
  Logger.log(result);
}
```

### ❌ "Rate Limit Exceeded"

**Sintomas:**
```
{
  "error_code": "ComplexityException",
  "status_code": 429
}
```

**Solução:**
```javascript
// Implementar retry com backoff exponencial
function mondayQueryWithRetry(query, variables, maxRetries = 3) {
  var retries = 0;
  var delay = 1000; // 1 segundo inicial
  
  while (retries < maxRetries) {
    try {
      var result = mondayQuery(query, variables);
      
      // Verificar rate limit
      if (result.error_code === 'ComplexityException') {
        Logger.log('Rate limit atingido. Aguardando ' + delay + 'ms...');
        Utilities.sleep(delay);
        delay *= 2; // Backoff exponencial
        retries++;
        continue;
      }
      
      return result;
      
    } catch (error) {
      Logger.log('Erro na query: ' + error);
      retries++;
      if (retries >= maxRetries) throw error;
      Utilities.sleep(delay);
      delay *= 2;
    }
  }
}
```

### ❌ "Query Complexity Too High"

**Sintomas:**
- Timeout
- Erro 429
- Queries muito grandes

**Solução:**
```javascript
// ❌ Evite queries muito complexas:
query {
  boards {
    items {
      column_values {
        ... on ConnectBoardsValue {
          linked_items {
            column_values {
              ... // Muito profundo!
            }
          }
        }
      }
    }
  }
}

// ✅ Prefira queries focadas:
query {
  items(ids: [123456]) {
    column_values(ids: ["connect_boards"]) {
      ... on ConnectBoardsValue {
        linked_item_ids
      }
    }
  }
}
```

---

## 🔐 Problemas de Autenticação

### ❌ "Authorization Required"

**Sintomas:**
- Erro 401
- "Not authorized"

**Solução:**
```javascript
// Verifique headers da requisição
function mondayQuery(query, variables) {
  var apiKey = PropertiesService.getScriptProperties().getProperty('MONDAY_API_KEY');
  
  var options = {
    method: 'post',
    headers: {
      'Authorization': apiKey,  // ✅ Correto
      // NÃO use: 'Bearer ' + apiKey  // ❌ Errado
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify({ query: query, variables: variables }),
    muteHttpExceptions: true
  };
  
  var response = UrlFetchApp.fetch('https://api.monday.com/v2', options);
  return JSON.parse(response.getContentText());
}
```

### ❌ "Insufficient Permissions"

**Sintomas:**
```
{
  "errors": [
    {
      "message": "Not authorized to access Board"
    }
  ]
}
```

**Solução:**
```
1. Verifique se o usuário do token tem acesso ao board
2. No Monday.com: Board → Compartilhar → Adicione o usuário
3. Ou use um token de admin/owner
```

---

## 🚀 Problemas de Deploy

### ❌ "Deployment Failed"

**Checklist:**
1. ✅ Código sem erros de sintaxe?
2. ✅ Todas as funções estão definidas?
3. ✅ PropertiesService configurado?

**Passo a passo correto:**
```
1. No Apps Script: Implantar → Nova implantação
2. Tipo: Web app
3. Descrição: "v1.0.0" (ou versão atual)
4. Executar como: Eu (seu email)
5. Quem tem acesso: Qualquer pessoa
6. Copiar URL gerada
7. Testar com curl/Postman
```

### ❌ "Permission Denied"

**Sintomas:**
- "You don't have permission to access this script"

**Solução:**
```
1. Apps Script → Implantar → Gerenciar implantações
2. Edite a implantação ativa
3. "Quem tem acesso": Mude para "Qualquer pessoa"
4. Atualizar
```

---

## ⏱️ Rate Limiting

### Limites do Monday.com

| Tipo | Limite |
|------|--------|
| Complexity per minute | 1.000.000 |
| Requests per minute | 60 |
| Mutations per minute | 60 |

**Calcular complexity:**
```graphql
# Cada campo tem um custo
# Use o Developer Playground para ver complexity score

query {
  complexity  # Mostra o custo da query
}
```

**Implementar throttle:**
```javascript
var lastRequestTime = 0;
var minInterval = 1000; // 1 segundo entre requests

function throttledMondayQuery(query, variables) {
  var now = new Date().getTime();
  var timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < minInterval) {
    var waitTime = minInterval - timeSinceLastRequest;
    Logger.log('Throttling: aguardando ' + waitTime + 'ms');
    Utilities.sleep(waitTime);
  }
  
  lastRequestTime = new Date().getTime();
  return mondayQuery(query, variables);
}
```

---

## 🔍 Debugging

### Habilitar Logs Detalhados

```javascript
// Adicione no topo do Code.gs
var DEBUG_MODE = true;

function debugLog(message, data) {
  if (DEBUG_MODE) {
    Logger.log('[DEBUG] ' + message);
    if (data) {
      Logger.log(JSON.stringify(data, null, 2));
    }
  }
}

// Use em todo o código:
function doPost(e) {
  debugLog('Webhook recebido', e);
  // ...
}
```

### Ver Logs de Execução

```
Apps Script → Execuções → Selecione uma execução → Ver logs
```

### Testar Localmente

```javascript
function testLocalExecution() {
  // Simule um evento de webhook
  var mockEvent = {
    postData: {
      contents: JSON.stringify({
        event: {
          type: 'change_column_value',
          boardId: 123456,
          itemId: 789012,
          columnId: 'status',
          value: {
            label: { text: 'Done' }
          }
        }
      })
    },
    parameter: {
      'X-Z-Webhook-Token': 'seu_token_aqui'
    }
  };
  
  var response = doPost(mockEvent);
  Logger.log(response.getContent());
}
```

### Debugar GraphQL Queries

```javascript
// Use o Developer Playground do Monday
// https://your-workspace.monday.com/developers/graphql

// Teste queries antes de implementar:
query {
  items(ids: [123456]) {
    id
    name
    column_values {
      id
      text
      type
    }
  }
}
```

---

## 📞 Quando Nada Funciona

### Checklist Final

```
[ ] PropertiesService configurado corretamente?
[ ] Token do Monday válido e com permissões?
[ ] Deploy feito com "Qualquer pessoa" pode acessar?
[ ] URL do webhook copiada corretamente?
[ ] Board IDs corretos?
[ ] Logs mostram algum erro específico?
[ ] Testou manualmente com curl/Postman?
[ ] Consultou documentação do Monday?
```

### Resetar Tudo

```javascript
// 1. Delete as properties
function resetProperties() {
  PropertiesService.getScriptProperties().deleteAllProperties();
  Logger.log('Properties deletadas');
}

// 2. Reconfigure do zero
function setupFromScratch() {
  var props = PropertiesService.getScriptProperties();
  props.setProperties({
    'MONDAY_API_KEY': 'NOVO_TOKEN',
    'WEBHOOK_TOKEN': 'NOVO_WEBHOOK_TOKEN',
    'ALLOWED_BOARDS': 'ID1,ID2'
  });
  Logger.log('Reconfigurado!');
}

// 3. Faça novo deploy
// Implantar → Nova implantação → Web app

// 4. Reconfigure webhook no Monday
```

---

## 📚 Recursos Úteis

- [Monday API Status](https://status.monday.com/)
- [Developer Community](https://community.monday.com/c/developers/)
- [Apps Script Status](https://www.google.com/appsstatus/)
- [GraphQL Playground](https://monday.com/developers/graphql)

---

**💡 Dica:** Sempre teste em um board de desenvolvimento antes de aplicar em produção!
