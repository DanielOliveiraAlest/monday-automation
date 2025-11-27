# 📋 Configuração dos Boards - Monday Automation

> **Última atualização**: 2025-01-26

---

## 🎯 Boards de Teste

### Board ORIGEM
- **Nome**: _Board Origem - Automação_
- **Board ID**: `18390046494`
- **URL**: `https://danielcontatofs-team.monday.com/boards/18390046494`
- **Descrição**: Board onde você vai mudar o status (trigger da automação)

### Board DESTINO
- **Nome**: _Board Destino - Automação_
- **Board ID**: `18390046725`
- **URL**: `https://danielcontatofs-team.monday.com/boards/18390046725`
- **Descrição**: Board que receberá a atualização automática de status

---

## 📊 Estrutura dos Boards

### Colunas Necessárias

#### Board ORIGEM
- [ ] Coluna de Status (ex: "Status")
- [ ] Coluna Connect Boards (ex: "Tarefas Relacionadas")
- [ ] Pelo menos 1 item criado

#### Board DESTINO
- [ ] Coluna de Status (ex: "Status")
- [ ] Pelo menos 1 item criado

---

## 🔗 Configuração de Conexão

### Coluna Connect Boards
- **Nome da coluna**: `___________`
- **Column ID**: `___________` (vamos pegar depois via API)
- **Board conectado**: Board DESTINO

### Como criar a coluna Connect Boards:
1. No Board ORIGEM, clique em "+" para adicionar coluna
2. Escolha "Connect Boards"
3. Selecione o Board DESTINO
4. Nomeie a coluna (ex: "Tarefas Relacionadas")

---

## 🧪 Itens de Teste

### Item no Board ORIGEM
- **Item ID**: `___________`
- **Nome**: "Teste de Automação"
- **Status inicial**: "Working on it"
- **Conectado ao item**: [ID do item no destino]

### Item no Board DESTINO
- **Item ID**: `___________`
- **Nome**: "Tarefa Conectada"
- **Status inicial**: "Not Started"

---

## ✅ Checklist de Configuração

- [ ] Board ORIGEM criado/identificado
- [ ] Board DESTINO criado/identificado
- [ ] IDs documentados acima
- [ ] Coluna de Status existe em ambos
- [ ] Coluna Connect Boards criada no ORIGEM
- [ ] Pelo menos 1 item em cada board
- [ ] Itens conectados entre os boards

---

## 📝 Notas

_Adicione aqui qualquer observação importante sobre seus boards_

---

**Próximo passo**: Após preencher este arquivo, prossiga para a Tarefa 1.3
