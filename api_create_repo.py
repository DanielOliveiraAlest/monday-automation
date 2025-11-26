#!/usr/bin/env python3
"""
Script para criar repositório GitHub via API
Uso: python3 api_create_repo.py <github_token>
"""

import sys
import json
import requests
import subprocess
import os

def create_repo(token, username="danieloliveira"):
    """Criar repositório via API do GitHub"""
    url = "https://api.github.com/user/repos"
    
    payload = {
        "name": "monday-automation",
        "description": "Automação Google Apps Script para integração com Monday.com - Sincronização de tarefas e atualizações automáticas",
        "private": False,
        "has_issues": True,
        "has_projects": True,
        "has_wiki": True,
        "license": "mit",
        "auto_init": False
    }
    
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        repo_data = response.json()
        print(f"✅ Repositório criado: {repo_data['html_url']}")
        return repo_data
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Erro ao criar repositório: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"Response: {e.response.text}")
        return None

def setup_git_and_push(username="danieloliveira"):
    """Configurar Git local e fazer push"""
    commands = [
        "cd /home/danieloliveira/Projetos/monday-automation",
        "rm -rf .git",
        "git init",
        "git config user.name 'Daniel Oliveira'",
        "git config user.email 'daniel.oliveira@alest.com.br'",
        "git config init.defaultBranch main",
        "git add .",
        'git commit -m "feat: initial commit - Monday.com automation with Google Apps Script\n\n- Complete Google Apps Script integration with Monday.com API\n- Automatic task synchronization and status updates\n- Comprehensive documentation and troubleshooting guides\n- Board configuration and secrets management\n- Unit tests and error handling\n- GitHub templates and setup documentation\n- MIT License and proper gitignore configuration"',
        f"git remote add origin https://github.com/{username}/monday-automation.git",
        "git branch -M main",
        "git push -u origin main"
    ]
    
    for cmd in commands:
        print(f"🔧 Executando: {cmd}")
        try:
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            if result.returncode == 0:
                print("✅ Sucesso")
            else:
                print(f"❌ Erro: {result.stderr}")
                return False
        except Exception as e:
            print(f"❌ Exceção: {e}")
            return False
    
    return True

def main():
    if len(sys.argv) < 2:
        print("Uso: python3 api_create_repo.py <github_token>")
        print("Obtenha seu token em: https://github.com/settings/tokens")
        sys.exit(1)
    
    token = sys.argv[1]
    username = "danieloliveira"
    
    print("🚀 Criando repositório GitHub...")
    repo = create_repo(token, username)
    
    if repo:
        print("📦 Configurando Git local...")
        if setup_git_and_push(username):
            print("🎉 Repositório configurado com sucesso!")
            print(f"🌐 Visite: {repo['html_url']}")
        else:
            print("❌ Erro na configuração Git local")
            print("📋 Execute manualmente os comandos em complete_github_setup.sh")
    else:
        print("❌ Falha ao criar repositório")

if __name__ == "__main__":
    main()
