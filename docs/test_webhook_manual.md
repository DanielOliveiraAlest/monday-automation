# 🧪 Teste Manual do Webhook - Sprint 1.9

## 📋 Objetivo
Testar a URL do endpoint com requisição POST manual para verificar se o challenge do Monday.com está funcionando corretamente.

## 🔧 Como Fazer o Teste

### 1. Obter a URL do Deploy
1. Abra o projeto Google Apps Script
2. Vá para "Deploy" → "Manage deployments"
3. Copie a URL "Web app URL"
4. Deve ser algo como: `https://script.google.com/macros/s/ABCDEFG12345/exec`

### 2. Adicionar o arquivo Test.gs ao seu projeto
1. Copie o conteúdo do arquivo `Test.gs`
2. No Apps Script, crie um novo arquivo chamado "Test"
3. Cole o código
4. Atualize a variável `WEBHOOK_URL` com sua URL real

### 3. Executar os Testes no Apps Script
```javascript
// No editor Apps Script, execute:

// 1. Configurar URL
setWebhookUrl("https://script.google.com/macros/s/SUA_URL_AQUI");

// 2. Teste rápido
runQuickTest();

// 3. Teste completo
runAllTests();
```

### 4. Testes Individuais
```javascript
// Teste individual de cada função
testChallengeResponse();     // Testa challenge
testHealthCheck();           // Testa health check
testWebhookPayload();        // Testa payload real
testInvalidChallenge();      // Testa challenge inválido
testEmptyPayload();          // Testa payload vazio
```

## ✅ Respostas Esperadas

### Challenge Response
```json
{"challenge": "test_challenge_12345"}
```

### Health Check
```json
{"status": "ok", "version": "1.0.0", "timestamp": "2025-01-26T..."}
```

### Webhook Payload
```json
{"status": "success", "message": "Webhook processed successfully", "version": "1.0.0"}
```

## 🐥 Problemas Comuns

### Erro: "No space left on device"
- Limpar espaço: `rm -rf ~/.cache/*`
- Remover node_modules desnecessários

### Erro: "Could not read Username"
- Verificar se a URL está correta
- Testar com GET primeiro

### Erro: "Bad credentials"
- Verificar se o deploy está público
- Re-deploy se necessário

## 📝 Checklist

- [ ] URL do deploy obtida
- [ ] Teste challenge via cURL funciona
- [ ] Teste health check via cURL funciona  
- [ ] Teste payload via cURL funciona
- [ ] Python script funciona
- [ ] Logs no Apps Script mostram as requisições

## 🚀 Próximo Passo

Se todos os testes passarem:
1. ✅ Sprint 1.9 - **COMPLETO**
2. 🔄 Sprint 1.10 - Configurar webhook no Monday.com

---

**URL do seu deploy**: _________________________
**Status dos testes**: _________________________
