#!/bin/bash

# Script para criar repositório GitHub e fazer commits
# Usage: ./create_repo.sh <github_username> <github_token>

set -e

USERNAME="${1:-danieloliveira}"
TOKEN="${2:-GITHUB_TOKEN_PLACEHOLDER}"
REPO_NAME="monday-automation"

echo "🚀 Criando repositório GitHub: $REPO_NAME"

# Criar repositório via API do GitHub
echo "📝 Criando repositório via API..."
curl -s -X POST \
  -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos \
  -d '{
    "name": "'$REPO_NAME'",
    "description": "Automação Google Apps Script para integração com Monday.com - Sincronização de tarefas e atualizações automáticas",
    "private": false,
    "has_issues": true,
    "has_projects": true,
    "has_wiki": true,
    "license": "mit",
    "auto_init": false
  }' > /dev/null

echo "✅ Repositório criado com sucesso!"

# Configurar Git local (se possível)
echo "⚙️ Configurando Git local..."
if git init 2>/dev/null; then
    echo "✅ Git inicializado"
    
    # Adicionar arquivos
    git add .
    
    # Commit inicial
    git commit -m "feat: initial commit - Monday.com automation with Google Apps Script

- Complete Google Apps Script integration with Monday.com API
- Automatic task synchronization and status updates
- Comprehensive documentation and troubleshooting guides
- Board configuration and secrets management
- Unit tests and error handling
- GitHub templates and setup documentation
- MIT License and proper gitignore configuration"

    # Adicionar remote
    git remote add origin https://$USERNAME:$TOKEN@github.com/$USERNAME/$REPO_NAME.git
    
    # Push inicial
    git branch -M main
    git push -u origin main
    
    echo "🎉 Repositório configurado e código enviado!"
else
    echo "❌ Erro ao inicializar Git (provavelmente espaço em disco)"
    echo "📋 Você precisará fazer manualmente:"
    echo "   1. git init"
    echo "   2. git add ."
    echo "   3. git commit -m 'initial commit'"
    echo "   4. git remote add origin https://github.com/$USERNAME/$REPO_NAME.git"
    echo "   5. git push -u origin main"
fi

echo "🌐 Repositório disponível em: https://github.com/$USERNAME/$REPO_NAME"
