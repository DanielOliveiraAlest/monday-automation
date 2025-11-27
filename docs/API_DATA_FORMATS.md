# Monday API Data Formats - Sprint 2 Documentation

**Objetivo**: Documentar os formatos de dados esperados pela API GraphQL do Monday.com para facilitar implementação e debugging.

---

## 📋 Formatos de Dados Principal

### 1. Column Values (Leitura)

#### Status Column
```json
{
  "id": "status",
  "text": "Working on it",
  "value": "{\"label\":\"Working on it\"}"
}
```

#### Connect Boards Column
```json
{
  "id": "connect_boards",
  "text": "Item Conectado 1, Item Conectado 2",
  "value": "{\"linkedPulseIds\":[{\"linkedPulseId\":123456},{\"linkedPulseId\":789012}]}"
}
```

#### Text Column
```json
{
  "id": "text",
  "text": "Texto do item",
  "value": "Texto do item"
}
```

#### Date Column
```json
{
  "id": "date",
  "text": "2025-01-26",
  "value": "\"2025-01-26\""
}
```

---

### 2. Column Values (Escrita/Mutations)

#### Status Column Update
```json
{
  "label": "Done"
}
```

#### Text Column Update
```json
"Novo texto do item"
```

#### Date Column Update
```json
"2025-01-31"
```

#### Connect Boards Column Update
```json
{
  "linkedPulseIds": [
    {"linkedPulseId": 123456},
    {"linkedPulseId": 789012}
  ]
}
```

---

## 🔧 GraphQL Query Examples

### Query Básica - Obter Item
```graphql
query getItem($boardId: ID!, $itemId: ID!) {
  boards(ids: [$boardId]) {
    items_page(limit: 1, query_params: {ids: [$itemId]}) {
      items {
        id
        name
        column_values {
          id
          text
          value
        }
      }
    }
  }
}
```

### Query - Obter Linked Items
```graphql
query getLinkedItems($boardId: ID!, $itemId: ID!, $columnId: String!) {
  boards(ids: [$boardId]) {
    items_page(limit: 1, query_params: {ids: [$itemId]}) {
      items {
        column_values(ids: [$columnId]) {
          value
          text
        }
      }
    }
  }
}
```

---

### Mutation Básica - Atualizar Coluna
```graphql
mutation changeColumnValue($boardId: ID!, $itemId: ID!, $columnId: String!, $value: JSON!) {
  change_column_value(
    board_id: $boardId,
    item_id: $itemId,
    column_id: $columnId,
    value: $value
  ) {
    id
    column_values(ids: [$columnId]) {
      value
      text
    }
  }
}
```

---

## 📊 Estrutura de Resposta

### Resposta de Sucesso
```json
{
  "data": {
    "boards": [
      {
        "items_page": {
          "items": [
            {
              "id": "123456",
              "name": "Nome do Item",
              "column_values": [
                {
                  "id": "status",
                  "text": "Working on it",
                  "value": "{\"label\":\"Working on it\"}"
                }
              ]
            }
          ]
        }
      }
    ]
  },
  "errors": null,
  "status": "success"
}
```

### Resposta com Erro GraphQL
```json
{
  "data": null,
  "errors": [
    {
      "message": "Invalid board ID",
      "locations": [{"line": 2, "column": 3}]
    }
  ],
  "status": "graphql_error"
}
```

---

## 🎯 Exemplos Práticos

### Exemplo 1: Ler Status de um Item
```javascript
// Input
var boardId = 123456;
var itemId = 789012;

// GraphQL Query
var query = `query getItem($boardId: ID!, $itemId: ID!) {
  boards(ids: [$boardId]) {
    items_page(limit: 1, query_params: {ids: [$itemId]}) {
      items {
        column_values(ids: ["status"]) {
          text
          value
        }
      }
    }
  }
}`;

// Resultado Esperado
var statusColumn = result.data.boards[0].items_page.items[0].column_values[0];
var statusText = statusColumn.text; // "Working on it"
var statusValue = JSON.parse(statusColumn.value).label; // "Working on it"
```

### Exemplo 2: Atualizar Status
```javascript
// Input
var boardId = 123456;
var itemId = 789012;
var newStatus = "Done";

// Valor para Mutation
var statusValue = {
  label: newStatus
};

// GraphQL Mutation
var mutation = `mutation changeColumnValue($boardId: ID!, $itemId: ID!, $columnId: String!, $value: JSON!) {
  change_column_value(board_id: $boardId, item_id: $itemId, column_id: "status", value: $value) {
    id
  }
}`;

// Variables
var variables = {
  boardId: boardId.toString(),
  itemId: itemId.toString(),
  columnId: "status",
  value: statusValue
};
```

### Exemplo 3: Obter Items Conectados
```javascript
// Input
var boardId = 123456;
var itemId = 789012;
var connectColumnId = "connect_boards";

// Parse do Resultado
var columnValue = result.data.boards[0].items_page.items[0].column_values[0];
var linkedData = JSON.parse(columnValue.value);
var linkedIds = linkedData.linkedPulseIds.map(item => parseInt(item.linkedPulseId));

// Resultado: [123456, 789012]
```

---

## ⚠️ Pontos de Atenção

1. **IDs sempre como strings** no GraphQL, mas converter para números no JavaScript
2. **Valores de colunas** podem ser strings ou JSON, sempre verificar antes de fazer parse
3. **Connect Boards** retorna um objeto com `linkedPulseIds` array
4. **Status columns** usam formato `{"label": "Status Name"}`
5. **Rate limits**: 100 requisições por minuto para API v2
6. **Sempre incluir headers**: `Authorization` e `API-Version: 2023-10`

---

## 🧪 Funções de Teste Disponíveis

- `testMondayConnection()` - Testa conexão básica com API
- `testGetLinkedItems()` - Testa leitura de itens conectados
- `testStatusUpdate()` - Testa atualização de status
- `testGraphQLQuery()` - Mostra estrutura de queries básicas

**Importante**: Substituir IDs de teste com IDs reais dos seus boards antes de executar.
