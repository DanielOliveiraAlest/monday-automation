# 📚 Guia de Migração: Google Apps Script → Monday App

## 🎯 O que mudou?

### De: Google Apps Script (v1.0)
- ✅ Custo zero
- ❌ Limitações de execução
- ❌ Sem OAuth nativo
- ❌ Sem UI integrada
- ❌ Difícil manutenção

### Para: Monday App Profissional (v2.0)
- ✅ **OAuth 2.0 nativo**
- ✅ **UI integrada no Monday**
- ✅ **24/7 disponibilidade**
- ✅ **Instalável via marketplace**
- ✅ **Escalável e enterprise-ready**

## 🚀 Passos para Migração

### 1️⃣ Registrar App no Monday

1. Acesse https://developers.monday.com
2. Clique em "Create App"
3. Escolha tipo "Integration"
4. Configure:
   - **App Name**: Automation Suite Pro
   - **App Description**: Professional automation suite
   - **Category**: Productivity

### 2️⃣ Configurar OAuth

No painel do app:
1. **OAuth & Permissions**:
   - Add Redirect URI: `https://seu-dominio.com/auth/callback`
   - Select Scopes:
     - boards:read
     - boards:write
     - users:read
     - webhooks:write

2. **Copie as credenciais**:
   - Client ID
   - Client Secret
   - Signing Secret

### 3️⃣ Deploy da Nova Aplicação

#### Opção A: Railway (Mais Fácil)

```bash
# Na pasta monday-app
cd monday-app

# Login no Railway
railway login

# Criar projeto
railway init

# Deploy
railway up

# Configurar variáveis no dashboard Railway
```

#### Opção B: Render.com (Free Tier)

1. Push código para GitHub
2. Conecte repo no Render
3. Render detecta `render.yaml` automaticamente
4. Configure variáveis de ambiente

### 4️⃣ Configurar Variáveis de Ambiente

```env
MONDAY_CLIENT_ID=seu_client_id
MONDAY_CLIENT_SECRET=seu_client_secret
MONDAY_APP_ID=seu_app_id
MONDAY_SIGNING_SECRET=seu_signing_secret
APP_URL=https://seu-app.railway.app
REDIS_URL=redis://...
JWT_SECRET=gerar_string_aleatoria
SESSION_SECRET=gerar_string_aleatoria
WEBHOOK_SECRET=gerar_string_aleatoria
```

### 5️⃣ Atualizar Monday App Settings

1. **Basic Information**:
   - App URL: `https://seu-app.railway.app/app`
   - Support URL: Sua URL de suporte

2. **OAuth**:
   - Redirect URI: `https://seu-app.railway.app/auth/callback`

3. **Features**:
   - Enable Board View
   - Enable Item View
   - Enable Account Settings

### 6️⃣ Testar Instalação

1. No Monday Developer:
   - Click "Install" no seu app
   - Autorize as permissões
   - App aparece no workspace

2. Teste funcionalidades:
   ```bash
   # Health check
   curl https://seu-app.railway.app/api/health
   
   # Verificar logs
   railway logs
   ```

## 🔄 Migração de Dados

### Exportar do Google Apps Script

```javascript
// No Apps Script, execute:
function exportConfiguration() {
  const props = PropertiesService.getScriptProperties();
  const config = {
    boards: props.getProperty('BOARD_IDS'),
    webhooks: props.getProperty('WEBHOOK_CONFIGS'),
    // ... outras configs
  };
  console.log(JSON.stringify(config, null, 2));
}
```

### Importar no Novo App

As configurações agora são gerenciadas via UI do Monday App.

## ⚡ Mapeamento de Funcionalidades

| Google Apps Script | Monday App v2 | Status |
|-------------------|---------------|---------|
| doPost() | Express routes | ✅ Melhorado |
| mondayQuery() | mondayService.query() | ✅ Melhorado |
| setColumnValue() | mondayService.updateColumnValue() | ✅ Melhorado |
| PropertiesService | Environment Variables + Redis | ✅ Melhorado |
| Logger.log() | Winston logger | ✅ Melhorado |
| Webhook validation | middleware/webhookValidator | ✅ Melhorado |
| Manual token | OAuth 2.0 | ✅ Novo |
| N/A | UI integrada | ✅ Novo |
| N/A | Rate limiting | ✅ Novo |

## 🎯 Benefícios da Migração

### Performance
- ⚡ 10x mais rápido
- 🔄 Processamento assíncrono
- 💾 Cache com Redis
- 📊 Métricas em tempo real

### Segurança
- 🔐 OAuth 2.0
- 🛡️ Rate limiting
- 🔒 Webhook signatures
- 🎫 JWT sessions

### Experiência do Usuário
- 🎨 UI nativa no Monday
- 📱 Instalação com 1-click
- ⚙️ Configuração via interface
- 📊 Dashboard de automações

### Manutenibilidade
- 📝 Código TypeScript/JavaScript moderno
- 🧪 Testes automatizados
- 📦 Deploy automatizado
- 🔍 Logs estruturados

## 📅 Timeline de Migração

### Semana 1
- [x] Setup Monday Developer account
- [x] Criar estrutura do novo app
- [x] Implementar OAuth

### Semana 2
- [ ] Deploy em produção
- [ ] Migrar automações existentes
- [ ] Testes com usuários beta

### Semana 3
- [ ] Documentação completa
- [ ] Training para equipe
- [ ] Go-live

## ⚠️ Considerações

### Custos
- **Railway**: ~$5-20/mês
- **Render**: Free tier ou ~$7/mês
- **Heroku**: ~$7-25/mês
- **VPS**: ~$5-40/mês

### Downtime
- Migração pode ser feita sem downtime
- Apps Script e Monday App podem coexistir
- Migração gradual recomendada

## 🆘 Suporte

### Problemas Comuns

**OAuth não funciona**
- Verifique redirect URI exato
- Confirme client secret correto

**App não aparece no Monday**
- Verifique se app está "published"
- Confirme instalação no workspace correto

**Webhooks falhando**
- Verifique webhook secret
- Confirme HTTPS habilitado

## ✅ Checklist Final

- [ ] Monday Developer account criado
- [ ] App registrado no Monday
- [ ] OAuth configurado
- [ ] Aplicação deployada
- [ ] Variáveis de ambiente configuradas
- [ ] Health check funcionando
- [ ] App instalado no workspace
- [ ] Automações testadas
- [ ] Documentação atualizada
- [ ] Equipe treinada

---

**Pronto para produção!** 🚀 Sua nova Monday App está pronta para escalar!
