#!/usr/bin/env python3
"""
Script para criar repositório GitHub e fazer push
Uso: python3 create_and_push.py <github_token>
"""

import sys
import json
import requests
import subprocess
import os

def create_repo(token, username="danieloliveira"):
    """Criar repositório via API do GitHub"""
    print("🚀 Criando repositório GitHub...")
    
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
        if response.status_code == 201:
            repo_data = response.json()
            print(f"✅ Repositório criado: {repo_data['html_url']}")
            return repo_data
        else:
            print(f"❌ Erro: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Exceção: {e}")
        return None

def push_to_github():
    """Fazer push para GitHub"""
    print("📤 Enviando arquivos para GitHub...")
    
    commands = [
        "cd /home/danieloliveira/Projetos/monday-automation",
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
        print("📋 Uso: python3 create_and_push.py <github_token>")
        print("🔑 Obtenha seu token em: https://github.com/settings/tokens")
        print("🎯 Ou crie manualmente em: https://github.com/new")
        return
    
    token = sys.argv[1]
    username = "danieloliveira"
    
    # Criar repositório
    repo = create_repo(token, username)
    
    if repo:
        print("📦 Repositório criado com sucesso!")
        print("🌐 Acesse:", repo['html_url'])
        
        # Fazer push
        if push_to_github():
            print("🎉 Setup concluído com sucesso!")
            print("📊 Todos os arquivos enviados para o GitHub!")
        else:
            print("❌ Erro no push - execute manualmente:")
            print("   cd /home/danieloliveira/Projetos/monday-automation")
            print("   git push -u origin main")
    else:
        print("❌ Falha ao criar repositório")
        print("📋 Crie manualmente em: https://github.com/new")
        print("📤 Depois execute: git push -u origin main")

if __name__ == "__main__":
    main()
