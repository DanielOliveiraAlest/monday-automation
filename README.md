# Monday Automation Platform

Documento consolidado que descreve as duas frentes do projeto:

1. **Apps Script (Produção)** – solução já em operação para sincronizar boards via Google Apps Script.
2. **Monday App (Em desenvolvimento)** – nova experiência para a App Marketplace do Monday.com, atualmente dividida entre um backend Express e uma stack serverless em Vercel.

---

## 1. Visão Geral

| Componente | Estado atual | Observações |
|------------|--------------|-------------|
| Apps Script (Legado) | ✅ Produção | Webhooks estáveis, painel de controle, health check e documentação completa. |
| Monday App – Express (`monday-app/`) | 🛠️ Em desenvolvimento | OAuth funcional, webhooks e motor de automações em memória com dados mockados e sem persistência. |
| Monday App – Serverless (`api/`, `lib/`) | 🛠️ Em desenvolvimento | Endpoints em Next.js, cron jobs, Postgres/KV conectados; interface ainda pendente. |

Use esta tabela para orientar priorização: o Apps Script permanece como referência funcional enquanto o app oficial evolui.

---

## 2. Arquiteturas Disponíveis

### 2.1 Apps Script (Produção)

- **Localização:** arquivos `.gs` na raiz (ex.: `Code.gs`, `Automation.gs`, `Monday.gql.js`).
- **Capacidades confirmadas:**
  - Recebimento de webhooks com validação de token e whitelist de boards.
  - Sincronização de status entre itens relacionados.
  - Painel de controle no Monday com setup automatizado.
  - Health check, monitoramento de logs e rotinas de retry.
- **Uso recomendado:** manter automações em produção até que o app Monday seja promovido.

### 2.2 Monday App (Em desenvolvimento)

#### 2.2.1 Backend Express (`monday-app/`)

- Servidor Express com OAuth completo, rotas `/api/automations`, `/api/webhooks`, `/api/auth` e middlewares de segurança.
- Motor de automações em memória (`automationEngine`) com três receitas padrão (sincronização de status, auto-assign mockado, dependências).
- Limitações atuais:
  - Tokens e automações não são persistidos (apenas em memória).
  - Usuários/dados de boards usam placeholders.
  - Logs e estatísticas não são gravados em storage real.
- Próximos passos: conectar a banco/kv, substituir mocks por consultas reais e integrar com UI.

#### 2.2.2 Stack Serverless (`api/`, `lib/`)

- Implementação em Next.js (App Router) com rotas `api/automations`, `api/cron/minute` e engine em `lib/automation-engine.ts`.
- Já integra com **Vercel Postgres** e **Vercel KV**, além de cron jobs para execuções contínuas.
- Faltam: camada de autenticação consolidada, painel frontend e unificação com o backend Express (ou escolha definitiva por esta stack).

---

## 3. Funcionalidades de Automações

| Automação | Apps Script | Express | Serverless |
|-----------|-------------|---------|------------|
| Sync Status entre itens conectados | ✅ Produção | ✅ Implementado (dados reais pendentes) | ✅ Implementado |
| Auto-assign por regras | ➖ Não aplicável | ⚠️ Mock de usuários | 🔄 Planejado |
| Gerar relatórios | ✅ Produção (Apps Script) | 🔄 Planejado | ⚠️ Parcial (estrutura cron) |
| Alertas de prioridade | ✅ Produção (Apps Script) | 🔄 Planejado | ⚠️ Parcial |
| Gestão de dependências | ✅ Produção (Apps Script) | ⚠️ Estrutura com TODOs | 🔄 Planejado |

Legenda: ✅ operacional · ⚠️ implementação parcial · 🔄 pendente · ➖ não previsto na stack.

---

## 4. Setup & Deploy

### 4.1 Apps Script

1. **Criar projeto** em [script.google.com](https://script.google.com) e importar arquivos `.gs`.
2. Configurar **Script Properties** com `MONDAY_API_KEY`, `WEBHOOK_TOKEN`, `ALLOWED_BOARDS` etc.
3. Executar funções de setup (`configureWebhookSecurity`, `setupMondayControlPanel`).
4. Publicar como **Web App** (Deploy > New Deployment) e registrar webhook no Monday com o token configurado.
5. Validar com `testHealthCheck()` e `testWebhookSimulation()`.

### 4.2 Monday App – Express

1. Duplicar `.env.example` para `.env` em `monday-app/` e preencher `MONDAY_CLIENT_ID`, `MONDAY_CLIENT_SECRET`, `JWT_SECRET`, `WEBHOOK_SECRET`, `APP_URL` etc.
2. Instalar dependências (`npm install`) e executar `npm run dev` para ambiente local.
3. Configurar app no [Monday Developer](https://monday.com/developers) apontando para os endpoints locais ou deployados.
4. Revisar automações mockadas em `automationEngine` e adaptar para uso real conforme integrações forem desenvolvidas.

### 4.3 Monday App – Serverless (Vercel)

1. Garantir acesso a **Vercel**; configurar Postgres, KV e Cron no dashboard.
2. Definir variáveis de ambiente (`DATABASE_URL`, `KV_REST_API_URL`, `CRON_SECRET`, `MONDAY_CLIENT_ID`, `MONDAY_CLIENT_SECRET`, etc.).
3. Deployar `api/` com `vercel --prod` ou via GitHub integration.
4. Registrar endpoints e cron jobs: `api/automations` (CRUD), `api/cron/minute` (execução contínua), demais funções conforme forem habilitadas.

---

## 5. Monitoramento, Logs e Suporte

### 5.1 Apps Script

- Monitorar em **Executions** e **Stackdriver Logging**.
- Health check disponível via parâmetro `?health=true` no endpoint do web app.
- Funções de diagnóstico: `testHealthCheck`, `testRetryLogic`, `testMondayControlPanel`.

### 5.2 Monday App

- **Express:** logs via `logger` com integração em `automationEngine` e middlewares.
- **Serverless:** usar `vercel logs`, métricas de cron, registros no Postgres (tabelas `automations`, `executions`) e chaves em KV para cache.
- Configurar alertas (ex.: Slack, email) após consolidar camada de persistência.

### 5.3 Suporte

- Priorizar documentação em `docs/` e guias específicos de setup.
- Manter checklist de troubleshooting (tokens ausentes, webhooks sem resposta, rate limits) com as funções utilitárias já existentes.

---

## 6. Roadmap e Próximos Passos

1. **Documentação:** manter este README alinhado; extrair seções detalhadas para `docs/` quando necessário.
2. **Monday App:**
   - Definir arquitetura alvo (Express vs. Serverless) e unificar código.
   - Persistir tokens de OAuth, automações e logs em Postgres/KV.
   - Trocar mocks por dados reais (usuários, dependências, configurações por board).
   - Construir UI (board view/widget) para configuração direta dentro do Monday.
3. **Qualidade:** adicionar testes unitários/integrados e pipelines de CI.
4. **Observabilidade:** padronizar logs, métricas e alertas para ambas as stacks.

---

## 7. Estrutura do Repositório

```
monday-automation/
├── api/                     # Rotas serverless (Next.js / Vercel)
├── lib/                     # Engine e utilitários compartilhados (serverless)
├── monday-app/              # Backend Express + client build
│   ├── src/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   └── manifest.json        # Configuração do app Monday
├── docs/                    # Guias operacionais e setup do painel
├── *.gs                     # Código Apps Script (produção)
├── README-APP.md            # Documentação específica do app Monday
├── README.md                # (Este arquivo)
└── ...
```

---

## 8. Referências e Contato

- [Developer Docs Monday.com](https://developer.monday.com/)
- [Apps Script Guides](https://developers.google.com/apps-script)
- Dúvidas ou sugestões: abra uma issue ou envie e-mail listado no repositório.

---

**Status resumido:** use Apps Script em produção hoje e contribua para consolidar o Monday App oficial seguindo os próximos passos acima.
