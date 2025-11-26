# Templates para GitHub

## Pull Request Template

Crie o arquivo `.github/pull_request_template.md`:

```markdown
## Descrição

Breve descrição das mudanças realizadas.

## Tipo de Mudança

- [ ] Bug fix (mudança que corrige um problema)
- [ ] Nova funcionalidade (mudança que adiciona funcionalidade)
- [ ] Breaking change (mudança que causa incompatibilidade)
- [ ] Documentação (mudança apenas na documentação)
- [ ] Refatoração (mudança que não adiciona funcionalidade nem corrige bug)

## Checklist

- [ ] Meu código segue os padrões do projeto
- [ ] Realizei uma auto-revisão do meu código
- [ ] Comentei meu código, especialmente em áreas difíceis de entender
- [ ] Fiz mudanças correspondentes na documentação
- [ ] Minhas mudanças não geram novos warnings
- [ ] Adicionei testes que provam que minha correção é efetiva ou que minha funcionalidade funciona
- [ ] Testes unitários novos e existentes passam localmente com minhas mudanças

## Testes

Descreva os testes que você executou para verificar suas mudanças.

## Screenshots (se aplicável)

Adicione screenshots para ajudar a explicar suas mudanças.
```

## Issue Template - Bug Report

Crie o arquivo `.github/ISSUE_TEMPLATE/bug_report.md`:

```markdown
---
name: Bug Report
about: Criar um relatório para nos ajudar a melhorar
title: '[BUG] '
labels: bug
assignees: ''
---

## Descrição do Bug

Uma descrição clara e concisa do que é o bug.

## Para Reproduzir

Passos para reproduzir o comportamento:
1. Vá para '...'
2. Clique em '....'
3. Role para baixo até '....'
4. Veja o erro

## Comportamento Esperado

Uma descrição clara e concisa do que você esperava que acontecesse.

## Screenshots

Se aplicável, adicione screenshots para ajudar a explicar seu problema.

## Ambiente

- OS: [ex: Windows 10]
- Navegador: [ex: Chrome, Safari]
- Versão do Google Apps Script: [ex: V8]

## Contexto Adicional

Adicione qualquer outro contexto sobre o problema aqui.
```

## Issue Template - Feature Request

Crie o arquivo `.github/ISSUE_TEMPLATE/feature_request.md`:

```markdown
---
name: Feature Request
about: Sugerir uma ideia para este projeto
title: '[FEATURE] '
labels: enhancement
assignees: ''
---

## A sua solicitação de funcionalidade está relacionada a um problema? Descreva.

Uma descrição clara e concisa do que é o problema. Ex: Estou sempre frustrado quando [...]

## Descreva a solução que você gostaria

Uma descrição clara e concisa do que você quer que aconteça.

## Descreva alternativas que você considerou

Uma descrição clara e concisa de quaisquer soluções ou funcionalidades alternativas que você considerou.

## Contexto Adicional

Adicione qualquer outro contexto ou screenshots sobre a solicitação de funcionalidade aqui.
```

## GitHub Actions Workflow

Crie o arquivo `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  lint:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: |
        npm install -g @google/clasp
        npm install -g eslint
        
    - name: Lint JavaScript files
      run: |
        eslint *.js *.gs || true
        
    - name: Validate Google Apps Script files
      run: |
        echo "Validating .gs files..."
        for file in *.gs; do
          if [ -f "$file" ]; then
            echo "Checking $file"
            node -c "$file" 2>/dev/null || echo "Warning: $file may have syntax issues"
          fi
        done

  documentation:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Check documentation
      run: |
        echo "Checking if README.md exists..."
        test -f README.md
        echo "Checking if QUICKSTART.md exists..."
        test -f QUICKSTART.md
        echo "Documentation check passed!"
```

## ESLint Configuration

Crie o arquivo `.eslintrc.js`:

```javascript
module.exports = {
  env: {
    browser: true,
    es2021: true,
    googleappsscript: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'script'
  },
  globals: {
    // Google Apps Script globals
    'SpreadsheetApp': 'readonly',
    'DriveApp': 'readonly',
    'UrlFetchApp': 'readonly',
    'PropertiesService': 'readonly',
    'Utilities': 'readonly',
    'Logger': 'readonly',
    'console': 'readonly',
    'Session': 'readonly',
    'ScriptApp': 'readonly',
    'HtmlService': 'readonly',
    'ContentService': 'readonly',
    'LockService': 'readonly',
    'CacheService': 'readonly'
  },
  rules: {
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'no-unused-vars': 'warn',
    'no-console': 'off'
  }
};
```
