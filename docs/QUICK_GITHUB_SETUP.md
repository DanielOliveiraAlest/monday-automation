# Setup Rápido do GitHub

## 🚀 Passo 1: Criar Repositório no GitHub

1. Acesse: https://github.com/new
2. Configure:
   - **Repository name**: `monday-automation`
   - **Description**: `Automação Google Apps Script para integração com Monday.com`
   - **Public** ✅ (ou Private se preferir)
   - **NÃO** marque: "Add a README file"
   - **NÃO** marque: "Add .gitignore"
   - **NÃO** marque: "Choose a license"

3. Clique em **"Create repository"**

## 📋 Passo 2: Executar Comandos Locais

Copie e cole estes comandos no terminal:

```bash
# Navegar para o projeto
cd /home/danieloliveira/Projetos/monday-automation

# Inicializar Git
git init

# Configurar usuário (já configurado)
git config user.name "Daniel Oliveira"
git config user.email "daniel.oliveira@alest.com.br"

# Adicionar todos os arquivos
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

# Conectar ao GitHub
git remote add origin https://github.com/danieloliveira/monday-automation.git

# Enviar para GitHub
git branch -M main
git push -u origin main
```

## 🎯 Passo 3: Configurar Repositório

Após o push, configure no GitHub:

1. **Topics** (em Settings): Adicione:
   - `google-apps-script`
   - `monday-com`
   - `automation`
   - `javascript`
   - `graphql`

2. **Branch Protection** (Settings > Branches):
   - Proteger branch `main`
   - Requerer pull requests para merges

## ✅ Verificação Final

Se tudo deu certo, você verá:
- Todos os arquivos no repositório
- README.md como página principal
- Licença MIT configurada
- .gitignore funcionando

## 🔧 Se Der Problema de Espaço

Se encontrar erro "No space left on device":

1. Limpe arquivos temporários:
```bash
sudo apt-get clean
rm -rf ~/.cache/*
```

2. Tente novamente em um diretório diferente

## 📞 Ajuda

Se precisar de ajuda:
1. Verifique se o repositório foi criado: https://github.com/danieloliveira/monday-automation
2. Execute `git status` para ver o estado
3. Execute `git log` para ver os commits

---

**Status**: Pronto para executar! 🚀
