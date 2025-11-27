# 🧪 Guia de Testes Webhook - JavaScript Google Apps Script

## 📋 Visão Geral
Testes completos em JavaScript para validar seu endpoint Monday.com antes de configurar webhooks reais.

## 🚀 Setup Rápido

### 1. Adicionar Test.gs ao Projeto
1. Abra seu projeto Google Apps Script
2. Clique em "+" → "Script"
3. Nomeie como "Test"
4. Copie todo o conteúdo do arquivo `Test.gs`
5. Cole e salve

### 2. Configurar URL
No editor Apps Script, execute:
```javascript
setWebhookUrl("SUA_URL_AQUI");
```

### 3. Executar Testes
```javascript
// Teste rápido (recomendado primeiro)
runQuickTest();

// Teste completo
runAllTests();
```

## 🧪 Testes Disponíveis

### ✅ Teste 1: Challenge Response
- **O que testa**: Resposta ao challenge do Monday.com
- **Por que é crítico**: Monday.com envia challenge para validar webhooks
- **Resultado esperado**: `{"challenge": "test_challenge_12345"}`

### ✅ Teste 2: Health Check
- **O que testa**: Se endpoint está online e funcional
- **Por que é útil**: Verificação rápida de saúde do sistema
- **Resultado esperado**: `{"status":"ok","version":"1.0.0"}`

### ✅ Teste 3: Webhook Payload
- **O que testa**: Processamento de eventos reais do Monday.com
- **Por que é importante**: Valida lógica principal do webhook
- **Resultado esperado**: `{"status":"success","message":"Webhook processed"}`

### ✅ Teste 4: Invalid Challenge
- **O que testa**: Comportamento com challenge incorreto
- **Por que é útil**: Verifica se endpoint não quebra com entradas inválidas

### ✅ Teste 5: Empty Payload
- **O que testa**: Resiliência com payloads vazios
- **Por que é importante**: Testa tratamento de erros

## 📊 Como Interpretar Resultados

### ✅ Todos os testes passam
```
🎉 All tests PASSED! Ready for webhook configuration.
```
**Próximo passo**: Configurar webhook no Monday.com (Sprint 1.10)

### ❌ Alguns testes falham
```
⚠️ Some tests failed. Check the configuration.
```
**Ações**:
1. Verifique se a URL está correta
2. Confirme se o deploy está público
3. Veja os logs para detalhes dos erros

## 🔧 Troubleshooting

### Erro: "No such file or directory"
- Verifique se a URL está atualizada em `WEBHOOK_URL`
- Use `setWebhookUrl()` para configurar

### Erro: "HTTP 404"
- Deploy pode não estar público
- Re-deploy com "Execute as: Me" e "Who has access: Anyone"

### Erro: "Invalid JSON"
- Payload malformado
- Verifique se `doPost()` está tratando JSON corretamente

### Erro: "Challenge failed"
- Verifique se `doPost()` está respondendo corretamente
- Confirme a lógica do challenge na linha 40-43 de Code.gs

## 📝 Logs e Debug

Ative debug mode para mais detalhes:
```javascript
// Em Code.gs, certifique-se que DEBUG_MODE = true
var DEBUG_MODE = true;
```

Logs aparecem em:
- **Apps Script**: Executions → View logs
- **Google Cloud Platform** (se configurado): Logging

## 🚀 Próximos Passos

### Se todos os testes passarem:
1. ✅ Sprint 1.9 completo
2. 🔄 Ir para Sprint 1.10: Configurar webhook no Monday.com

### Se testes falharem:
1. 🔧 Corrigir problemas identificados
2. 🧪 Re-executar testes
3. 📝 Documentar soluções encontradas

---

**Status atual**: Aguardando sua URL do deploy para executar os testes!
