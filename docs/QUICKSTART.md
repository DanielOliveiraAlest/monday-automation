# 🚀 Quick Start - Monday Automation

## ✅ Estrutura Criada com Sucesso!

Todos os arquivos base foram criados:

```
monday-automation/
├── ✅ PROGRESS.md          # Tracker de progresso
├── ✅ README.md            # Documentação completa
├── ✅ TROUBLESHOOTING.md   # Guia de problemas
├── ✅ Code.gs              # Webhook handler (implementado)
├── ✅ Monday.gql.js        # GraphQL functions (placeholders)
├── ✅ Secrets.gs           # Config management (implementado)
├── ✅ Tests.gs             # Test functions (placeholder)
└── ✅ QUICKSTART.md        # Este arquivo
```

---

## 🎯 Próximos Passos - Sprint 1

### Tarefa 1.1: Gerar Access Token no Monday ⏭️

**Instruções:**

1. Acesse [Monday.com](https://monday.com)
2. Clique no seu **avatar** (canto superior direito)
3. Vá em **Developers**
4. Clique em **My Access Tokens**
5. Clique em **Generate** 
6. Nome sugerido: `Monday Automation Script`
7. **Copie o token gerado** (você só verá uma vez!)

**Guarde o token em um lugar seguro!**

---

### Tarefa 1.2: Documentar IDs dos Boards

**Como encontrar Board IDs:**

**Método 1: Via URL**
```
https://your-workspace.monday.com/boards/1234567890
                                        ^^^^^^^^^^
                                        Board ID
```

**Método 2: Via Developer Playground**

1. Acesse: https://your-workspace.monday.com/developers/graphql
2. Execute esta query:

```graphql
query {
  boards {
    id
    name
  }
}
```

**Anote os IDs:**
- Board Origem (teste): `___________`
- Board Destino (teste): `___________`

---

### Tarefa 1.3: Criar Projeto no Google Apps Script

**Instruções:**

1. Acesse [script.google.com](https://script.google.com)
2. Clique em **+ Novo projeto**
3. Renomeie para: `Monday Automation`
4. **Não cole o código ainda!** (faremos na tarefa 1.4)

---

### Tarefa 1.4: Criar Estrutura de Arquivos

**No Google Apps Script:**

1. Delete o arquivo `Code.gs` padrão

2. Crie os seguintes arquivos (clique no **+** ao lado de "Arquivos"):

   **a) Code.gs**
   - Copie o conteúdo de `Code.gs` deste projeto
   
   **b) Monday.gql.js**
   - Copie o conteúdo de `Monday.gql.js` deste projeto
   
   **c) Secrets.gs**
   - Copie o conteúdo de `Secrets.gs` deste projeto
   
   **d) Tests.gs** (opcional)
   - Copie o conteúdo de `Tests.gs` deste projeto

3. Salve o projeto (Ctrl+S ou Cmd+S)

---

### Tarefa 1.5: Configurar PropertiesService

**Opção A: Via Interface (Recomendado)**

1. No Apps Script, clique em **⚙️ Configurações do projeto** (sidebar esquerda)
2. Role até **Propriedades do script**
3. Clique em **+ Adicionar propriedade do script**
4. Adicione estas 3 propriedades:

| Propriedade | Valor |
|-------------|-------|
| `MONDAY_API_KEY` | Cole seu token do Monday (Tarefa 1.1) |
| `WEBHOOK_TOKEN` | Gere um token seguro* |
| `ALLOWED_BOARDS` | Seus Board IDs separados por vírgula** |

\* **Token seguro**: Use um gerador de senhas ou execute:
```javascript
// Cole isso no editor e execute:
function generateToken() {
  Logger.log(Utilities.getUuid());
}
```

\*\* **Exemplo**: `1234567890,9876543210`

**Opção B: Via Código (Alternativa)**

1. Em `Secrets.gs`, edite a função `setupSecrets()`
2. Substitua os valores placeholder pelos reais
3. Execute a função `setupSecrets()` (clique em ▶️)
4. **IMPORTANTE**: Delete os tokens do código depois!

---

### Tarefa 1.6: Implementar função doPost

✅ **Já implementado!** 

O arquivo `Code.gs` já contém a função `doPost()` completa.

**Verifique se o código está presente:**

```javascript
function doPost(e) {
  // ... código já implementado
}
```

---

### Tarefa 1.7: Implementar resposta ao challenge

✅ **Já implementado!** 

A resposta ao challenge do Monday está em `Code.gs`:

```javascript
if (e.parameter && e.parameter.challenge) {
  return createJsonResponse({ challenge: e.parameter.challenge });
}
```

---

### Tarefa 1.8: Deploy como Web App

**Instruções:**

1. No Apps Script, clique em **Implantar** → **Nova implantação**

2. Configure:
   - **Tipo**: Web app
   - **Descrição**: `v1.0.0-sprint1`
   - **Executar como**: Eu (seu email)
   - **Quem tem acesso**: **Qualquer pessoa**

3. Clique em **Implantar**

4. **Copie a URL gerada** (algo como):
   ```
   https://script.google.com/macros/s/ABC123.../exec
   ```

5. **Guarde essa URL!** Você vai usá-la no webhook.

---

### Tarefa 1.9: Testar URL com POST manual

**Teste 1: Challenge Response**

```bash
curl -X POST "SUA_URL_AQUI" \
  -H "Content-Type: application/json" \
  -d '{"challenge":"test123"}'
```

**Resposta esperada:**
```json
{"challenge":"test123"}
```

**Teste 2: Health Check**

```bash
curl "SUA_URL_AQUI?health=true"
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2025-01-26T..."
}
```

**Teste 3: Webhook Simulado**

```bash
curl -X POST "SUA_URL_AQUI" \
  -H "Content-Type: application/json" \
  -H "X-Z-Webhook-Token: SEU_WEBHOOK_TOKEN" \
  -d '{
    "event": {
      "type": "change_column_value",
      "boardId": 123456,
      "itemId": 789012,
      "columnId": "status"
    }
  }'
```

**Resposta esperada:**
```json
{
  "status": "success",
  "message": "Webhook processed successfully",
  "version": "1.0.0"
}
```

---

### Tarefa 1.10: Configurar Webhook no Monday

**Instruções:**

1. Acesse Monday.com → **Avatar** → **Developers**

2. Vá em **My Apps** → **Create App** (se for sua primeira app)
   - Nome: `Board Sync Automation`
   - Descrição: `Auto-sync status between boards`

3. Na sua app, vá em **Features** → **Webhooks**

4. Clique em **Create webhook**

5. Configure:
   - **Webhook URL**: Cole a URL do Apps Script (Tarefa 1.8)
   - **Board**: Selecione seu board de ORIGEM (Tarefa 1.2)
   - **Event**: `change_column_value`
   - **Column** (opcional): Selecione a coluna de status

6. Em **Headers**, adicione:
   ```
   Header: X-Z-Webhook-Token
   Value: SEU_WEBHOOK_TOKEN (mesmo do PropertiesService)
   ```

7. Clique em **Create**

8. **Teste**: Mude o status de um item no board
   - Vá em Apps Script → **Execuções**
   - Você deve ver uma execução nova
   - Clique nela para ver os logs

---

## ✅ Checklist Final Sprint 1

Antes de marcar o Sprint 1 como concluído, verifique:

- [ ] Token do Monday gerado e guardado
- [ ] IDs dos boards documentados
- [ ] Projeto criado no Apps Script
- [ ] 4 arquivos .gs criados e código copiado
- [ ] PropertiesService configurado (3 propriedades)
- [ ] Deploy feito como Web App
- [ ] URL do deploy copiada e guardada
- [ ] Teste curl do challenge funcionou
- [ ] Teste curl do health check funcionou
- [ ] Webhook configurado no Monday
- [ ] Header X-Z-Webhook-Token adicionado
- [ ] Teste de mudança de status executado
- [ ] Logs aparecem em Apps Script → Execuções

---

## 🎉 Sprint 1 Completo!

Se todos os itens acima estão ✅, você completou o **Sprint 1**!

**Próximo passo**: Diga **"Começar Sprint 2"** para implementar as funções GraphQL.

---

## 🆘 Problemas?

Consulte [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) para soluções de problemas comuns.

**Erros mais comuns:**

1. **"Property not found"** → Configure PropertiesService (Tarefa 1.5)
2. **"Challenge failed"** → Verifique se `doPost()` está implementado
3. **"Unauthorized"** → Verifique o header X-Z-Webhook-Token
4. **"Board not allowed"** → Adicione o Board ID em ALLOWED_BOARDS

---

**Desenvolvido com ❤️ | Boa sorte no desenvolvimento!**
