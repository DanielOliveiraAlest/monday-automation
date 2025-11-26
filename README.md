# Monday Automation - Connected Boards Alternative

> 🚀 **Solução gratuita para sincronização de status entre boards do Monday.com usando webhooks e Google Apps Script**

## 📖 Visão Geral

Este projeto substitui o app "Connected Boards" do Monday.com usando uma solução serverless com **custo zero**. O sistema:

- ✅ Recebe webhooks quando um status muda
- ✅ Identifica itens conectados entre quadros
- ✅ Atualiza automaticamente o status no quadro destino
- ✅ Mantém logs detalhados de todas as operações

## 🏗️ Arquitetura

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│  Monday.com │ Webhook │ Google Apps      │ GraphQL │  Monday.com │
│  (Origem)   │────────>│ Script           │────────>│  (Destino)  │
│             │         │                  │         │             │
└─────────────┘         └──────────────────┘         └─────────────┘
      │                         │                           │
      │                         │                           │
      └─────── Status Change ───┴──── Status Update ────────┘
```

## 🎯 Funcionalidades

### Core
- [x] Recebimento de webhooks do Monday.com
- [x] Validação de segurança (token)
- [x] Leitura de conexões entre boards
- [x] Atualização automática de status
- [x] Logs estruturados

### Segurança
- [x] Validação de webhook token
- [x] Whitelist de boards permitidos
- [x] Secrets gerenciados via PropertiesService
- [x] Retry logic com backoff exponencial

### Observabilidade
- [x] Logs detalhados de cada operação
- [x] Healthcheck endpoint
- [x] Métricas de execução

## 📁 Estrutura do Projeto

```
monday-automation/
├── PROGRESS.md          # Tracker de progresso (auto-atualizado)
├── README.md            # Este arquivo
├── TROUBLESHOOTING.md   # Problemas comuns e soluções
├── Code.gs              # Entrada principal (doPost)
├── Monday.gql.js        # Funções GraphQL
├── Secrets.gs           # Configurações (PropertiesService)
└── Tests.gs             # Testes manuais (opcional)
```

## 🚀 Quick Start

### Pré-requisitos

1. **Conta Monday.com** com acesso de desenvolvedor
2. **Conta Google** para Google Apps Script
3. **Dois boards** para testar (origem e destino)

### Passo 1: Configurar Monday.com

```bash
# 1. Acesse Monday.com → Avatar → Developers
# 2. Vá em "My Access Tokens"
# 3. Clique em "Generate" e dê um nome (ex: "Automation Script")
# 4. Copie o token gerado
```

### Passo 2: Criar Projeto no Google Apps Script

```bash
# 1. Acesse script.google.com
# 2. Clique em "Novo projeto"
# 3. Nomeie como "Monday Automation"
# 4. Copie os arquivos .gs deste repositório
```

### Passo 3: Configurar Secrets

```javascript
// No Google Apps Script, vá em Projeto → Script properties
// Adicione as seguintes propriedades:

MONDAY_API_KEY=seu_token_monday_aqui
WEBHOOK_TOKEN=gere_um_token_seguro_aqui
ALLOWED_BOARDS=board_id_1,board_id_2
```

### Passo 4: Deploy

```bash
# No Google Apps Script:
# 1. Clique em "Implantar" → "Nova implantação"
# 2. Tipo: "Web App"
# 3. Executar como: "Eu"
# 4. Quem tem acesso: "Qualquer pessoa"
# 5. Copie a URL gerada
```

### Passo 5: Configurar Webhook no Monday

```bash
# No Monday.com Developer Center:
# 1. Vá em "Integrations" → "Webhooks"
# 2. Clique em "Create webhook"
# 3. Cole a URL do Apps Script
# 4. Selecione o board de origem
# 5. Event: "change_column_value"
# 6. Adicione o header: X-Z-Webhook-Token = seu_webhook_token
```

## 🔧 Configuração Detalhada

### Variáveis de Ambiente (PropertiesService)

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `MONDAY_API_KEY` | Token de API do Monday.com | `eyJhb...` |
| `WEBHOOK_TOKEN` | Token de segurança do webhook | `secret123` |
| `ALLOWED_BOARDS` | IDs dos boards permitidos (CSV) | `123456,789012` |

### Como obter IDs dos Boards

```javascript
// Opção 1: Na URL do board
https://your-workspace.monday.com/boards/123456789
                                        ^^^^^^^^^^
                                        Board ID

// Opção 2: Via GraphQL no Developer Playground
query {
  boards {
    id
    name
  }
}
```

## 📊 Como Funciona

### Fluxo de Execução

1. **Usuário muda status** no Board A
2. **Monday envia webhook** para o Google Apps Script
3. **Script valida** o token e dados recebidos
4. **Script consulta** via GraphQL quais itens estão conectados
5. **Script atualiza** o status no Board B
6. **Script retorna** sucesso/erro para o Monday

### Exemplo de Payload do Webhook

```json
{
  "event": {
    "type": "change_column_value",
    "boardId": 123456,
    "itemId": 789012,
    "columnId": "status",
    "value": {
      "label": {
        "text": "Done"
      }
    }
  }
}
```

## 🧪 Testes

### Teste Manual via Apps Script

```javascript
function testManual() {
  var mockPayload = {
    event: {
      boardId: 123456,
      itemId: 789012,
      columnId: "status"
    }
  };
  
  var mockRequest = {
    postData: { contents: JSON.stringify(mockPayload) },
    parameter: {}
  };
  
  var response = doPost(mockRequest);
  Logger.log(response.getContent());
}
```

### Teste de Webhook (Postman/curl)

```bash
curl -X POST https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec \
  -H "Content-Type: application/json" \
  -H "X-Z-Webhook-Token: seu_webhook_token" \
  -d '{
    "event": {
      "type": "change_column_value",
      "boardId": 123456,
      "itemId": 789012,
      "columnId": "status"
    }
  }'
```

## 📈 Monitoramento

### Logs

```javascript
// Ver logs no Apps Script
// Execuções → Selecione uma execução → Ver logs

// Exemplo de log:
[INFO] Webhook recebido: boardId=123456, itemId=789012
[INFO] Item conectado encontrado: 345678
[INFO] Status atualizado com sucesso
```

### Healthcheck

```bash
# Endpoint de healthcheck
GET https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?health=true

# Resposta esperada:
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2025-01-26T11:01:00Z"
}
```

## 🔒 Segurança

### Checklist de Segurança

- [x] Nunca exponha tokens no código
- [x] Use PropertiesService para secrets
- [x] Valide webhook token em todas as requisições
- [x] Implemente whitelist de boards
- [x] Use HTTPS (garantido pelo Apps Script)
- [x] Limite rate de requisições

### Validação de Token

```javascript
// Implementado em Code.gs
function validateWebhookToken(e) {
  var receivedToken = e.parameter['X-Z-Webhook-Token'];
  var expectedToken = PropertiesService.getScriptProperties().getProperty('WEBHOOK_TOKEN');
  return receivedToken === expectedToken;
}
```

## 🐛 Troubleshooting

Ver [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) para problemas comuns e soluções.

## 📚 Documentação de Referência

- [Monday.com API Docs](https://developer.monday.com/api-reference)
- [Monday.com Webhooks](https://developer.monday.com/apps/docs/webhooks)
- [Google Apps Script](https://developers.google.com/apps-script)
- [GraphQL Basics](https://graphql.org/learn/)

## 🗺️ Roadmap

### Versão 1.0 (Atual)
- [x] Sprint 1: Infraestrutura básica
- [x] Sprint 2: Integração com API
- [x] Sprint 3: Automação core
- [x] Sprint 4: Produção ready

### Versão 2.0 (Futuro)
- [ ] Suporte a múltiplos tipos de coluna
- [ ] Interface de configuração web
- [ ] Dashboard de monitoramento
- [ ] Suporte a bidirectional sync
- [ ] Histórico de mudanças

## 👥 Contribuindo

Este é um projeto pessoal, mas sugestões são bem-vindas!

## 📄 Licença

MIT License - Use livremente!

## 🆘 Suporte

- **Issues**: Crie uma issue para bugs ou dúvidas
- **Email**: [seu-email]
- **Monday Community**: [link para tópico]

---

**Desenvolvido com ❤️ para economizar custos com integrações Monday.com**
