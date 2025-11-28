# Monday Automation App - Enterprise Edition

## 🚀 Professional Monday.com App with OAuth, Webhooks & 24/7 Availability

### Features
- ✅ **OAuth 2.0 Authentication** - Secure client authorization
- ✅ **24/7 Availability** - Production-ready deployment
- ✅ **Webhook Processing** - Real-time event handling
- ✅ **Multiple Automations** - Extensible automation engine
- ✅ **Enterprise Security** - Rate limiting, CORS, helmet
- ✅ **Scalable Architecture** - Redis caching, horizontal scaling
- ✅ **Monday Marketplace Ready** - Full manifest.json configuration

## 📋 Prerequisites

1. **Monday Developer Account**
   - Go to https://developers.monday.com
   - Create a new app
   - Note your Client ID, Client Secret, and Signing Secret

2. **Hosting Platform** (choose one):
   - Railway (recommended - easy deployment)
   - Render.com (free tier available)
   - Heroku (paid only)
   - AWS/GCP/Azure
   - VPS with Docker

3. **Redis Instance** (optional but recommended)
   - Redis Cloud (free tier)
   - Or included in docker-compose

## 🔧 Installation & Setup

### 1. Clone and Install

```bash
cd monday-app
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
# Monday OAuth
MONDAY_CLIENT_ID=your_client_id_here
MONDAY_CLIENT_SECRET=your_client_secret_here
MONDAY_APP_ID=your_app_id_here
MONDAY_SIGNING_SECRET=your_signing_secret_here

# Your app URL (update after deployment)
APP_URL=https://your-app.railway.app
REDIRECT_URI=https://your-app.railway.app/auth/callback

# Security (generate random strings)
JWT_SECRET=generate_random_string_here
SESSION_SECRET=generate_random_string_here
WEBHOOK_SECRET=generate_random_string_here
```

### 3. Update Manifest

Edit `manifest.json`:
- Replace `YOUR_APP_ID` with your Monday app ID
- Replace `YOUR_CLIENT_ID` with your client ID
- Update `base_url` with your deployment URL

## 🚀 Deployment Options

### Option 1: Railway (Recommended - Easiest)

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login and deploy:
```bash
railway login
railway init
railway up
```

3. Add environment variables in Railway dashboard
4. Get your app URL from Railway

### Option 2: Render.com

1. Push to GitHub
2. Connect GitHub repo to Render
3. Render will auto-deploy using `render.yaml`
4. Add environment variables in Render dashboard

### Option 3: Docker (VPS/Cloud)

```bash
# Build and run
docker-compose up -d

# Or with individual commands
docker build -t monday-app .
docker run -p 3000:3000 --env-file .env monday-app
```

### Option 4: Heroku

```bash
# Install Heroku CLI
# Create app
heroku create your-app-name

# Add Redis
heroku addons:create heroku-redis:hobby-dev

# Set environment variables
heroku config:set MONDAY_CLIENT_ID=xxx
heroku config:set MONDAY_CLIENT_SECRET=xxx
# ... set all variables

# Deploy
git push heroku main
```

## 📱 Monday App Configuration

### 1. Update OAuth Settings in Monday

In your Monday app settings:
- **Redirect URI**: `https://your-app-url.com/auth/callback`
- **Scopes**: Select all required permissions
- **App URL**: `https://your-app-url.com/app`

### 2. Configure Webhooks

The app automatically registers webhooks for:
- Item creation
- Column value changes
- Status changes
- Update creation

### 3. Install in Monday Account

1. Go to Monday marketplace (or your app's install URL)
2. Click "Install"
3. Authorize the app
4. App will appear in your Monday workspace

## 🎯 Available Automations

### 1. Status Synchronization
- Syncs status between connected items
- Trigger: Status column change
- Action: Update connected items' status

### 2. Auto Assignment
- Automatically assigns new items to team members
- Trigger: Item creation
- Action: Assign based on workload/rules

### 3. Dependency Management
- Updates dependent items when prerequisites complete
- Trigger: Status change to "Done"
- Action: Update dependents to "Ready"

### 4. Deadline Alerts
- Sends notifications for approaching deadlines
- Trigger: Daily check
- Action: Send notifications

### 5. Mirror Updates
- Copies updates between related items
- Trigger: Update posted
- Action: Copy to connected items

## 🔌 API Endpoints

- `GET /` - App info
- `GET /app` - Monday iframe UI
- `GET /api/health` - Health check
- `POST /api/auth/authorize` - Start OAuth flow
- `GET /api/auth/callback` - OAuth callback
- `POST /api/auth/refresh` - Refresh token
- `GET /api/boards` - List boards
- `GET /api/items/:boardId` - Get items
- `POST /api/automations/list` - List automations
- `POST /api/automations/:id/execute` - Execute automation
- `POST /api/webhooks/*` - Webhook handlers

## 🛠️ Development

### Local Development

```bash
# Start with nodemon
npm run dev

# Use ngrok for webhook testing
npm run tunnel
```

### Testing

```bash
npm test
```

### Adding New Automations

1. Create automation in `src/services/automationEngine.js`:

```javascript
this.registerAutomation({
  id: 'my_automation',
  name: 'My Automation',
  execute: async (context) => {
    // Your automation logic
    return { success: true };
  }
});
```

2. Add webhook trigger if needed
3. Test locally with ngrok

## 📊 Monitoring

### Health Check
```bash
curl https://your-app.com/api/health
```

### Logs
- Railway: `railway logs`
- Render: Check dashboard
- Docker: `docker logs monday-automation-app`

## 🔒 Security

- ✅ OAuth 2.0 authentication
- ✅ JWT session management
- ✅ Webhook signature validation
- ✅ Rate limiting
- ✅ CORS protection
- ✅ Helmet.js security headers
- ✅ Environment variable management

## 🆘 Troubleshooting

### App not appearing in Monday
- Check OAuth redirect URI matches exactly
- Verify all scopes are granted
- Check app is set to "published" in Monday

### Webhooks not working
- Verify webhook secret matches
- Check ngrok/tunnel is running for local dev
- Ensure HTTPS is enabled in production

### Authentication failing
- Verify client ID and secret
- Check redirect URI configuration
- Ensure JWT secret is set

## 📝 License

MIT

## 🤝 Support

- Documentation: https://developers.monday.com
- Issues: Create GitHub issue
- Email: support@your-company.com

---

**Ready for Production!** 🚀 Deploy and start automating Monday.com workflows!
