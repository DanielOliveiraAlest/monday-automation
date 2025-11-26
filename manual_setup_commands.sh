#!/bin/bash

# Comandos para configuração manual do repositório GitHub
# Execute estes comandos sequencialmente

echo "🚀 Configurando repositório Monday Automation"

# 1. Inicializar Git (se ainda não estiver)
echo "1️⃣ Inicializando Git..."
if [ ! -d ".git" ]; then
    git init
    echo "✅ Git inicializado"
else
    echo "ℹ️ Git já inicializado"
fi

# 2. Configurar usuário (se necessário)
echo "2️⃣ Configurando usuário Git..."
git config user.name "Daniel Oliveira"
git config user.email "daniel.oliveira@alest.com.br"

# 3. Adicionar todos os arquivos
echo "3️⃣ Adicionando arquivos..."
git add .

# 4. Fazer commit inicial
echo "4️⃣ Fazendo commit inicial..."
git commit -m "feat: initial commit - Monday.com automation with Google Apps Script

- Complete Google Apps Script integration with Monday.com API
- Automatic task synchronization and status updates
- Comprehensive documentation and troubleshooting guides
- Board configuration and secrets management
- Unit tests and error handling
- GitHub templates and setup documentation
- MIT License and proper gitignore configuration"

# 5. Adicionar remote (substitua USERNAME pelo seu username GitHub)
echo "5️⃣ Configurando remote..."
USERNAME="danieloliveira"
REPO_NAME="monday-automation"

# Remover remote existente se houver
git remote remove origin 2>/dev/null || true

# Adicionar novo remote
git remote add origin https://github.com/$USERNAME/$REPO_NAME.git

# 6. Push para o repositório
echo "6️⃣ Enviando para GitHub..."
git branch -M main
git push -u origin main

echo "🎉 Repositório configurado com sucesso!"
echo "🌐 Visite: https://github.com/$USERNAME/$REPO_NAME"
