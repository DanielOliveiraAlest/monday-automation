# 🧪 Guia de Testes - Sprint 2 API Integration

**Objetivo**: Validar todas as funções GraphQL implementadas no Sprint 2

---

## 📋 Pré-requisitos

### 1. Configurar API Key
Antes de executar os testes, você precisa configurar sua API Key do Monday.com:

1. Abra o arquivo `Secrets.gs`
2. Edite a função `setupSecrets()`:
   ```javascript
   properties.setProperties({
     'MONDAY_API_KEY': 'SUA_API_KEY_AQUI',
     'WEBHOOK_TOKEN': 'SEU_TOKEN_WEBHOOK_AQUI',
     'ALLOWED_BOARDS': '18390046494,18390046725'
   });
   ```
3. **Importante**: Substitua os valores com seus dados reais
4. Execute a função `setupSecrets()` UMA VEZ no Apps Script Editor
5. **Após executar**, delete seus tokens do arquivo `Secrets.gs`

### 2. Preparar Boards de Teste
Certifique-se que seus boards estão configurados conforme `BOARD_CONFIG.md`:

- **Board Origem** (ID: 18390046494)
  - Coluna de Status
  - Coluna Connect Boards conectando ao Board Destino
  - Pelo menos 1 item criado
  
- **Board Destino** (ID: 18390046725)
  - Coluna de Status  
  - Pelo menos 1 item criado
  
- **Conexão entre boards**: Pelo menos 1 item no Board Origem conectado a um item no Board Destino

---

## 🚀 Executando os Testes

### Teste 1: Conexão Básica (Tarefa 2.2)

```javascript
// No Apps Script Editor, execute:
testBasicApiConnection()
```

**O que testa**: 
- Conexão com API Monday.com
- Função `mondayQuery()` genérica
- Autenticação via API Key

**Resultado esperado**: 
```
[SUCCESS] ✅ API connection working!
[INFO] User data:
  - ID: 12345678
  - Name: Seu Nome
  - Email: seu.email@exemplo.com
```

---

### Teste 2: Descoberta de Boards

```javascript
// No Apps Script Editor, execute:
discoverBoardStructure()
```

**O que testa**:
- Leitura de estrutura dos boards
- Identificação de colunas (status, connect_boards)
- IDs reais das colunas

**Resultado esperado**:
```
--- Board: Board Origem - Automação (ID: 18390046494) ---
  status: Status (status) ← STATUS COLUMN
  connect_boards: Tarefas Relacionadas (connect_boards) ← CONNECT BOARDS COLUMN
```

---

### Teste 3: Itens de Teste

```javascript
// No Apps Script Editor, execute:
getTestItems()
```

**O que testa**:
- Leitura de itens dos boards
- Valores das colunas
- Status atuais dos itens

---

### Teste 4: Linked Items (Tarefa 2.4)

```javascript
// No Apps Script Editor, execute:
testLinkedItems()
```

**O que testa**:
- Função `getLinkedItemIds()`
- Parsing de colunas connect_boards
- Extração de IDs conectados

**Resultado esperado**:
```
[SUCCESS] ✅ getLinkedItemIds() working!
[INFO] Found 1 linked items: 12345678
```

---

### Teste 5: Status Update (Tarefa 2.6)

```javascript
// No Apps Script Editor, execute:
testStatusUpdate()
```

**O que testa**:
- Função `updateStatus()`
- Mutations GraphQL
- Atualização real de status

**Resultado esperado**:
```
[SUCCESS] ✅ updateStatus() working!
[INFO] Status updated successfully
[SUCCESS] ✅ Status update verified!
```

---

## 🎯 Teste Completo (Recomendado)

```javascript
// No Apps Script Editor, execute:
runAllSprint2Tests()
```

Este executa TODOS os testes em sequência e mostra um resumo final.

---

## 📊 Como Interpretar Resultados

### ✅ Sucesso
```
[SUCCESS] ✅ API connection working!
[INFO] User data found
```

### ❌ Falha Comum
```
[ERROR] No MONDAY_API_KEY configured
```
**Solução**: Execute `setupSecrets()` primeiro

### ❌ Falha de Autenticação
```
[ERROR] Unauthorized (401) - Check API key
```
**Solução**: Verifique se sua API Key está correta

### ❌ Boards Não Encontrados
```
[WARN] No board found with ID: 18390046494
```
**Solução**: Verifique se os board IDs estão corretos e se você tem acesso

---

## 🔧 Troubleshooting

### Problema: "No MONDAY_API_KEY configured"
1. Execute `setupSecrets()` com sua API Key
2. Verifique se executou a função após editar
3. Delete os tokens do arquivo após executar

### Problema: "Rate limit exceeded (429)"
**Solução**: Espere 1 minuto e execute novamente

### Problema: "No items with linked connections found"
1. Certifique-se que há itens conectados entre os boards
2. Use a coluna Connect Boards no Board Origem
3. Conecte pelo menos 1 item ao Board Destino

### Problema: "Status update failed"
1. Verifique se o ID da coluna status está correto
2. Verifique se o status label existe no board
3. Execute `discoverBoardStructure()` para encontrar IDs corretos

---

## 📈 Checklist de Validação

- [ ] API Key configurada via `setupSecrets()`
- [ ] Boards acessíveis com os IDs informados
- [ ] Colunas status e connect_boards existentes
- [ ] Itens criados em ambos os boards
- [ ] Pelo menos 1 conexão entre boards
- [ ] Teste básico de conexão passando
- [ ] Teste de linked items passando
- [ ] Teste de status update passando

---

## 🎉 Após os Testes

Se todos os testes passarem:

1. **Sprint 2 está 100% completo!** ✅
2. Atualize o `PROGRESS.md` para 10/10 tarefas
3. Você está pronto para começar o Sprint 3 (Automação Core)
4. As funções estão prontas para uso no webhook real

Se algum teste falhar:

1. Verifique o troubleshooting acima
2. Corrija a configuração
3. Execute os testes novamente
4. Não avance para o Sprint 3 até que todos passem

---

## 📝 Logs Importantes

Durante os testes, monitore os logs no Apps Script Editor:

- **[INFO]**: Informações gerais
- **[SUCCESS]**: Operações bem-sucedidas  
- **[ERROR]**: Erros que precisam atenção
- **[DEBUG]**: Detalhes técnicos para debugging

Use os logs para identificar e resolver problemas rapidamente!
