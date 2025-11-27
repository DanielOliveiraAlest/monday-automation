# 🔧 Configurar Webhook no Monday.com - Sprint 1.10

## 📋 Objetivo
Configurar o primeiro webhook no Monday.com para testar a integração com nosso endpoint Google Apps Script.

## 🎯 Pré-requisitos
- ✅ Sprint 1.9 completo (testes funcionando)
- ✅ URL do deploy do Apps Script
- ✅ Access Token do Monday.com
- ✅ IDs dos boards de teste

## 🚀 Passo a Passo

### 1. Acessar Desenvolvedores Monday.com
1. Faça login no Monday.com
2. Clique em seu avatar → "Developers"
3. Ou acesse diretamente: `https://danielcontatofs-team.monday.com/developers`

### 2. Criar Novo Webhook
1. Em "Developers", clique em "Webhooks"
2. Clique em "Create webhook"
3. Preencha os campos:

#### 📝 Configuração Básica
- **Name**: `Monday Automation Test`
- **Board ID**: `18390046494` (Board ORIGEM)
- **Callback URL**: `https://script.google.com/macros/s/SUA_URL_AQUI/exec`
- **Events**: `Column Value Changed`

#### 🔐 Configuração de Segurança
- **Webhook Token**: Deixe em branco (vamos gerar)
- **Signing Secret**: Deixe em branco (opcional)

### 3. Selecionar Eventos
Marque os seguintes eventos:
- ✅ **Column Value Changed** (disparador principal)
- ✅ **Status Column Changed** (específico para status)
- ❌ Outros eventos (deixe desmarcado por enquanto)

### 4. Configurar Filtros (Opcional mas recomendado)
```
Column Type: Status
Board: Board ORIGEM (18390046494)
```

### 5. Testar Webhook
1. Clique em "Test webhook"
2. Monday.com enviará um challenge para seu endpoint
3. Verifique nos logs do Apps Script se o challenge foi recebido

### 6. Salvar Webhook
1. Se o teste passar, clique em "Create"
2. Anote o **Webhook ID** gerado
3. Copie o **Webhook Token** (se gerado)

## 🧪 Validação do Webhook

### Verificar nos Logs Apps Script
```javascript
// Procure por estes logs:
'=== WEBHOOK RECEIVED ==='
'Challenge received: [challenge_value]'
'Token validation: PASSED'
```

### Teste Manual no Board
1. Vá para o Board ORIGEM
2. Mude o status de qualquer item
3. Verifique se aparece no Apps Script logs

## 📊 Respostas Esperadas

### Challenge Response (Setup)
```json
{"challenge": "valor_gerado_pelo_monday"}
```

### Webhook Event (Real)
```json
{
  "event": {
    "type": "change_column_value",
    "boardId": "18390046494",
    "itemId": "123456789",
    "columnId": "status",
    "value": {"label": {"text": "Done"}}
  }
}
```

## 🔧 Troubleshooting

### ❌ "Webhook verification failed"
- Verifique se a URL está correta
- Confirme se o deploy está público
- Teste com `runQuickTest()` primeiro

### ❌ "No events received"
- Verifique se selecionou os eventos corretos
- Confirme se está mudando a coluna certa
- Check se o board ID está correto

### ❌ "403 Forbidden"
- Verifique permissões do deploy
- Re-deploy com "Anyone" access

### ❌ "Challenge timeout"
- Endpoint pode estar lento
- Verifique se `doPost()` está respondendo rápido

## 📝 Configuração Avançada

### Adicionar Webhook Token
Se quiser segurança extra:
```javascript
// No Apps Script Properties
PropertiesService.getScriptProperties()
  .setProperty('WEBHOOK_TOKEN', 'seu_token_aqui');
```

### Configurar Múltiplos Boards
```javascript
// Em Properties
PropertiesService.getScriptProperties()
  .setProperty('ALLOWED_BOARDS', '18390046494,18390046725');
```

## ✅ Checklist de Validação

- [ ] Webhook criado com sucesso
- [ ] Challenge respondido corretamente
- [ ] Events selecionados (Column Value Changed)
- [ ] Teste manual no board funcionou
- [ ] Logs mostram eventos recebidos
- [ ] Webhook ID anotado
- [ ] Webhook Token salvo (se gerado)

## 🚀 Próximo Passo

Se tudo funcionar:
1. ✅ Sprint 1.10 - **COMPLETO**
2. 🔄 Sprint 2.1 - Implementar chamadas à API Monday.com

---

**Status**: Aguardando criação do webhook no Monday.com
**Webhook ID**: _________________________
**Webhook Token**: _________________________
