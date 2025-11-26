# 🚀 Setup Rápido do Webhook - Sprint 1.10

## 📋 Opções de Configuração

### 🎯 Opção 1: Interface Monday.com (Recomendado)
Mais fácil e visual, ideal para primeiro webhook.

### 🔧 Opção 2: API via Apps Script
Automatizado, bom para múltiplos webhooks.

---

## 🎯 Opção 1: Interface Monday.com

### Passo 1: Acessar Developers
```
1. Login Monday.com
2. Avatar → Developers
3. Webhooks → Create webhook
```

### Passo 2: Configurar
```
Name: Monday Automation Test
Board ID: 18390046494
Callback URL: https://script.google.com/macros/s/SUA_URL/exec
Events: Column Value Changed
```

### Passo 3: Testar
```
1. Click "Test webhook"
2. Verificar logs Apps Script
3. Se OK, clicar "Create"
```

---

## 🔧 Opção 2: API via Apps Script

### Setup
```javascript
// 1. Configure sua URL
setWebhookUrl("https://script.google.com/macros/s/SUA_URL/exec");

// 2. Valide configuração
validateWebhookConfig();

// 3. Crie webhook automaticamente
testCreateWebhook();
```

### Gerenciar
```javascript
// Listar webhooks
testListWebhooks();

// Deletar webhook
testDeleteWebhook();

// Teste completo
testWebhookCycle();
```

---

## ✅ Validação

### Manualmente
1. Vá ao Board ORIGEM (18390046494)
2. Mude status de qualquer item
3. Verifique logs Apps Script

### Logs Esperados
```
=== WEBHOOK RECEIVED ===
Challenge received: [valor]
Token validation: PASSED
Event data extracted: {...}
Board whitelist: PASSED
```

---

## 🚨 Troubleshooting Rápido

### ❌ "Webhook verification failed"
- URL incorreta? Verifique com `getWebhookUrl()`
- Deploy não público? Re-deploy com "Anyone" access

### ❌ "No events received"
- Eventos selecionados corretamente?
- Mudando coluna certa (Status)?
- Board ID correto?

### ❌ "403 Forbidden"
- Permissões deploy
- Re-deploy necessário

---

## 📝 Checklist Final

- [ ] Webhook criado (interface ou API)
- [ ] Challenge respondido
- [ ] Eventos recebidos ao mudar status
- [ ] Logs mostram eventos
- [ ] Webhook ID anotado

**Próximo passo**: Sprint 2.1 - Implementar chamadas API Monday.com

---

**Status**: _________________________
**Webhook ID**: _________________________
