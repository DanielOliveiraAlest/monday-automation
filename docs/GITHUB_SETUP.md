# Configuração do Repositório GitHub

## Instruções para Criar o Repositório

### 1. Criar Repositório no GitHub

1. Acesse [GitHub.com](https://github.com)
2. Clique em "New repository" (botão verde)
3. Configure o repositório:
   - **Repository name**: `monday-automation`
   - **Description**: `Automação Google Apps Script para integração com Monday.com - Sincronização de tarefas e atualizações automáticas`
   - **Visibility**: Public ou Private (sua escolha)
   - **NÃO** marque "Initialize this repository with a README" (já temos um)
   - **NÃO** adicione .gitignore (já criamos um)
   - **NÃO** escolha uma licença por enquanto

### 2. Comandos para Executar Localmente

Após criar o repositório no GitHub, execute estes comandos no terminal:

```bash
# Navegar para o diretório do projeto
cd /home/danieloliveira/Projetos/monday-automation

# Inicializar repositório Git (se ainda não funcionou)
git init

# Configurar usuário Git (substitua pelos seus dados)
git config user.name "Seu Nome"
git config user.email "seu.email@exemplo.com"

# Adicionar todos os arquivos
git add .

# Fazer commit inicial
git commit -m "feat: initial commit - Monday.com automation with Google Apps Script

- Complete Google Apps Script integration with Monday.com API
- Automatic task synchronization and status updates
- Comprehensive documentation and troubleshooting guides
- Board configuration and secrets management
- Unit tests and error handling"

# Adicionar origem remota (substitua USERNAME pelo seu usuário GitHub)
git remote add origin https://github.com/USERNAME/monday-automation.git

# Fazer push inicial
git branch -M main
git push -u origin main
```

### 3. Estrutura do Projeto

O repositório contém:

```
monday-automation/
├── .gitignore              # Arquivos a serem ignorados pelo Git
├── README.md               # Documentação principal
├── QUICKSTART.md           # Guia de início rápido
├── BOARD_CONFIG.md         # Configuração de boards
├── TROUBLESHOOTING.md      # Guia de solução de problemas
├── PROGRESS.md             # Log de progresso do desenvolvimento
├── Code.gs                 # Código principal do Google Apps Script
├── Monday.gql.js           # Queries GraphQL para Monday.com
├── Secrets.gs              # Gerenciamento de credenciais
├── Tests.gs                # Testes unitários
└── GITHUB_SETUP.md         # Este arquivo
```

### 4. Configurações Recomendadas do Repositório

Após criar o repositório, configure:

#### Branch Protection Rules
1. Vá em Settings > Branches
2. Adicione regra para branch `main`:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging

#### Topics/Tags
Adicione estas tags no repositório:
- `google-apps-script`
- `monday-com`
- `automation`
- `javascript`
- `graphql`
- `integration`
- `productivity`

#### Licença Sugerida
Adicione uma licença MIT:

```
MIT License

Copyright (c) 2024 [Seu Nome]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### 5. Próximos Passos

Após configurar o repositório:

1. **Configurar GitHub Actions** (opcional):
   - Criar workflow para validação de código
   - Configurar testes automatizados

2. **Configurar Issues Templates**:
   - Template para bugs
   - Template para feature requests

3. **Criar Pull Request Template**

4. **Configurar GitHub Pages** (se quiser documentação online)

### 6. Comandos Úteis

```bash
# Verificar status
git status

# Adicionar arquivos específicos
git add arquivo.gs

# Fazer commit com mensagem
git commit -m "feat: adicionar nova funcionalidade"

# Fazer push
git push

# Criar nova branch
git checkout -b feature/nova-funcionalidade

# Fazer merge
git checkout main
git merge feature/nova-funcionalidade
```

### 7. Troubleshooting

Se encontrar problemas:

1. **Erro de espaço em disco**: Limpe arquivos temporários
2. **Erro de permissão**: Configure credenciais Git
3. **Erro de push**: Verifique se o repositório remoto existe
4. **Conflitos**: Use `git status` para identificar arquivos em conflito

---

**Nota**: Este arquivo pode ser removido após a configuração inicial do repositório.
