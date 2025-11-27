#!/bin/bash

# Script completo para setup do GitHub
# Execute este script quando tiver espaço suficiente no disco

set -e

echo "🚀 Setup Completo do GitHub - Monday Automation"
echo "=============================================="

# Configurações
USERNAME="danieloliveira"
REPO_NAME="monday-automation"
PROJECT_DIR="/home/danieloliveira/Projetos/monday-automation"

echo "📁 Diretório do projeto: $PROJECT_DIR"

# 1. Verificar se estamos no diretório certo
cd "$PROJECT_DIR"
echo "✅ Diretório atual: $(pwd)"

# 2. Limpar e inicializar Git
echo "🧹 Limpando repositório Git anterior..."
rm -rf .git

echo "🔧 Inicializando Git..."
git init
git config user.name "Daniel Oliveira"
git config user.email "daniel.oliveira@alest.com.br"
git config init.defaultBranch main

# 3. Adicionar arquivos
echo "📝 Adicionando arquivos ao Git..."
git add .

# 4. Verificar status
echo "🔍 Status do Git:"
git status --porcelain

# 5. Commit inicial
echo "💾 Fazendo commit inicial..."
git commit -m "feat: initial commit - Monday.com automation with Google Apps Script

- Complete Google Apps Script integration with Monday.com API
- Automatic task synchronization and status updates
- Comprehensive documentation and troubleshooting guides
- Board configuration and secrets management
- Unit tests and error handling
- GitHub templates and setup documentation
- MIT License and proper gitignore configuration

This commit includes:
• Core automation logic (Code.gs)
• GraphQL queries for Monday.com (Monday.gql.js)
• Secure credentials management (Secrets.gs)
• Unit tests (Tests.gs)
• Complete documentation suite
• GitHub setup templates and guides
• MIT License and proper .gitignore"

# 6. Configurar remote
echo "🔗 Configurando remote do GitHub..."
git remote remove origin 2>/dev/null || true
git remote add origin "https://github.com/$USERNAME/$REPO_NAME.git"

# 7. Configurar branch main
echo "🌿 Configurando branch main..."
git branch -M main

# 8. Push para GitHub
echo "📤 Enviando para GitHub..."
echo "Se pedir senha, use seu GitHub Personal Access Token"
git push -u origin main

# 9. Verificação final
echo "✅ Verificando repositório..."
git log --oneline -1
git remote -v

echo ""
echo "🎉 Setup concluído com sucesso!"
echo "🌐 Repositório disponível em: https://github.com/$USERNAME/$REPO_NAME"
echo ""
echo "📋 Próximos passos:"
echo "   1. Visite o repositório no GitHub"
echo "   2. Configure topics/tags se desejar"
echo "   3. Configure branch protection rules"
echo "   4. Adicione collaborators se necessário"
echo ""
echo "📚 Documentação criada:"
echo "   • README.md - Overview completo"
echo "   • QUICKSTART.md - Guia de início rápido"
echo "   • BOARD_CONFIG.md - Configuração de boards"
echo "   • TROUBLESHOOTING.md - Solução de problemas"
echo "   • GITHUB_SETUP.md - Instruções detalhadas"
echo "   • GITHUB_TEMPLATES.md - Templates para Issues/PRs"
