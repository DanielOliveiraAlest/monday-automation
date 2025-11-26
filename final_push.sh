#!/bin/bash

# Script final para push do repositório GitHub
# Execute APÓS criar o repositório em github.com/new

echo "🚀 Finalizando setup do GitHub..."

# Configurar remote (substitua se necessário)
git remote add origin https://github.com/danieloliveira/monday-automation.git

# Fazer push
git branch -M main
git push -u origin main

echo "✅ Repositório enviado com sucesso!"
echo "🌐 Visite: https://github.com/danieloliveira/monday-automation"
