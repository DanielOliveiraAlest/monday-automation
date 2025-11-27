# 🔧 URL Troubleshooting - Deploy Issues

## ❌ Problema Identificado
URL retorna "Página não encontrada": 
`https://script.google.com/macros/u/1/s/AKfycbxAG1O-HqeSeoEeRUSn0OMa64Djo9fH9GPdUCyS90kGfdEHOu_WqgFyvPy7mJsf4HRT/exec`

## 🔍 Possíveis Causas

### 1. Deploy não está Público
- **Sintoma**: Página não encontrada
- **Causa**: Deploy configurado como "Private" ou "Only myself"
- **Solução**: Re-deploy com acesso público

### 2. Script não foi Deployado
- **Sintoma**: URL inválida
- **Causa**: Apenas salvo, mas não publicado
- **Solução**: Fazer deploy como Web App

### 3. URL Incorreta
- **Sintoma**: Formato errado da URL
- **Causa**: Copiou URL errada
- **Solução**: Verificar URL no "Manage deployments"

## 🚀 Soluções

### ✅ Solução 1: Re-deploy Correto
1. No Apps Script editor: **Deploy** → **Manage deployments**
2. Clique no deploy existente → **Edit**
3. Configure:
   - **Description**: Monday Automation Webhook
   - **Execute as**: Me
   - **Who has access**: Anyone
4. **Deploy**
5. Copie a **Web app URL** (não a URL do editor)

### ✅ Solução 2: Novo Deploy
1. **Deploy** → **New deployment**
2. Type: **Web app**
3. **Description**: Monday Automation
4. **Execute as**: Me
5. **Who has access**: Anyone
6. **Deploy**
7. Copie a URL gerada

### ✅ Solução 3: Verificar Deploy Atual
1. **Deploy** → **Manage deployments**
2. Verificar se há um deploy ativo
3. Se não houver, criar novo deploy

## 🧪 Testar URL Correta

Após re-deploy, teste:
```bash
# Health check
curl "SUA_NOVA_URL?health=true"

# Challenge test
curl -X POST "SUA_NOVA_URL" \
  -H "Content-Type: application/json" \
  -d '{"challenge": "test_123"}'
```

## 📋 URLs Válidas vs Inválidas

### ✅ Formato Correto
```
https://script.google.com/macros/s/ABC123/exec
https://script.google.com/macros/u/1/s/ABC123/exec
```

### ❌ Formato Incorreto
```
https://script.google.com/macros/s/ABC123/edit  (URL do editor)
https://docs.google.com/spreadsheets/...          (Planilha)
```

## 🔧 Verificar no Apps Script

### 1. Menu Deploy
```
Deploy → Manage deployments
```

### 2. Procurar por "Web app"
- Deve aparecer como "Web app"
- Status: "Enabled"
- URL: Começa com `https://script.google.com/macros/`

### 3. Se não houver deploy:
```
Deploy → New deployment → Web app
```

---

## 🚨 Ações Imediatas

1. **Verificar** se há deploy ativo
2. **Re-deploy** com acesso "Anyone" 
3. **Testar** nova URL
4. **Configurar** webhook quando funcionar

---

**Status**: Aguardando re-deploy com acesso público
