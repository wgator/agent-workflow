# Agent Workflow

Sistema de workflow para coordenação de agentes Claude em projetos de desenvolvimento.

## 🎯 Visão Geral

O Agent Workflow é um framework para orquestrar múltiplos agentes Claude especializados no desenvolvimento de software. Cada agente tem um papel específico no processo de desenvolvimento, trabalhando em cascata desde o planejamento até a revisão de código.

## 🤖 Agentes

O sistema utiliza 6 agentes especializados:

1. **PLAN** - Tech Lead que analisa o projeto e seleciona tarefas
2. **SPECIFICATION** - Arquiteto que define o design de alto nível  
3. **TECHNICAL_DETAILER** - Estrutura arquivos e assinaturas
4. **IMPLEMENTATION** - Implementa o código seguindo o scaffold
5. **TESTER** - Testa e corrige bugs
6. **CODE_REVIEW** - Refatora e aprova para deploy

## 📁 Estrutura do Projeto

```
seu-projeto/
├── .agent/                    # Comunicação entre agentes
│   ├── tasks.json            # Todas as tarefas do projeto
│   ├── workspace/            # Artefatos temporários das tarefas ativas
│   └── templates/            # Templates para documentação
│       └── progress-template.md
└── .prompts/                 # Prompts e regras dos agentes
    ├── 1. PLAN.md
    ├── 2. SPECIFICATION.md
    ├── 3. TECHNICAL_DETAILING.md
    ├── 4. IMPLEMENTATION.md
    ├── 5. TEST.md
    ├── 6. CODE_REVIEW.md
    └── AGENT_WORKFLOW.md    # Livro de regras para todos os agentes
```

## 🆔 Sistema de IDs de Tarefas

O Agent Workflow usa IDs no formato `YYMMDD-nome-curto`:

```
250115-post-repo      # 15/Jan/2025 - PostRepository
250116-auth-middleware # 16/Jan/2025 - Auth Middleware
250117-api-endpoints   # 17/Jan/2025 - API Endpoints
```

**Por que este formato?**
- Ordem cronológica natural
- Fácil para humanos e agentes
- Baixo risco de colisão
- Compatível com sistemas de arquivo

**Como gerar:**
```javascript
const today = new Date()
const yy = today.getFullYear().toString().slice(-2)
const mm = (today.getMonth() + 1).toString().padStart(2, '0')
const dd = today.getDate().toString().padStart(2, '0')
const shortName = taskName.toLowerCase()
  .replace(/[^a-z0-9\s-]/g, '')
  .trim()
  .split(/\s+/)
  .slice(0, 3)
  .join('-')
const taskId = `${yy}${mm}${dd}-${shortName}`
```

## 🚀 Instalação

### 1. Instale o Agent Workflow globalmente:

```bash
npm install -g agent-workflow
```

### 2. Inicialize em seu projeto:

```bash
cd seu-projeto
agent-workflow init
```

O comando `init` irá:
1. Solicitar o **nome** e **descrição** do seu projeto
2. Criar a pasta `.agent/` com estrutura inicial
3. Criar a pasta `.prompts/` com os prompts dos agentes
4. Gerar o arquivo `tasks.json` com as informações do projeto

**Exemplo de inicialização:**
```
🚀 Inicializando Agent Workflow...

📝 Vamos configurar seu projeto:

? Nome do projeto: Meu App Incrível
? Descrição breve do projeto: Sistema de gestão de tarefas com IA

✓ Criado .agent
✓ Criado .agent/workspace
✓ Criado .agent/templates
✓ Criado .prompts
✓ Criado .agent/tasks.json com informações do projeto
✓ Criado .agent/templates/progress-template.md
✓ Criado .prompts/AGENT_WORKFLOW.md
✓ Copiado .prompts/1. PLAN.md
✓ Copiado .prompts/2. SPECIFICATION.md
✓ Copiado .prompts/3. TECHNICAL_DETAILING.md
✓ Copiado .prompts/4. IMPLEMENTATION.md
✓ Copiado .prompts/5. TEST.md
✓ Copiado .prompts/6. CODE_REVIEW.md

✅ Agent Workflow inicializado com sucesso!
```

## 💻 Uso

### Iniciar o Dashboard

```bash
agent-workflow start
```

Acesse http://localhost:3000 para visualizar o dashboard.

### API Endpoints

- `GET /api/tasks` - Lista todas as tarefas
- `GET /api/tasks?status=active` - Lista tarefas ativas
- `GET /api/tasks?category=Storage` - Lista por categoria
- `GET /api/tasks/:id` - Detalhes de uma tarefa
- `POST /api/tasks` - Criar nova tarefa
- `PUT /api/tasks/:id` - Atualizar tarefa
- `DELETE /api/tasks/:id` - Remover tarefa
- `POST /api/tasks/:id/complete` - Completar tarefa
- `GET /api/project` - Informações do projeto (nome, descrição, meta, estatísticas)
- `PUT /api/project/meta` - Atualizar meta e informações do projeto

### Estrutura do tasks.json

```json
{
  "meta": {
    "name": "Meu App Incrível",
    "description": "Sistema de gestão de tarefas com IA",
    "created": "2025-01-15T10:00:00Z",
    "updated": "2025-01-15T10:00:00Z",
    "focus": "Pipeline básico de coleta"
  },
  "tasks": {
    "250115-post-repo": {
      "title": "Implementar PostRepository",
      "status": "active",
      "category": "Storage/Database",
      "created_at": "2025-01-15T10:00:00Z",
      "started_at": "2025-01-15T10:00:00Z",
      "phase": "implementation",
      "phases_completed": ["plan", "spec", "detail"],
      "files": {
        "planned": ["src/repositories/postRepository.js"],
        "created": ["src/repositories/baseRepository.js"],
        "modified": [],
        "tested": []
      },
      "notes": {
        "plan": "Priorizada por ser base para outros módulos",
        "spec": "Usar pattern Repository com classe base",
        "detail": "Adicionar validação de input",
        "implementation": "Tive que criar BaseRepository primeiro"
      }
    }
  }
}
```

## 🔧 Configuração MCP

Para usar com Claude Desktop, adicione ao `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem", "/caminho/do/seu/projeto"]
    }
  }
}
```

## 📋 Workflow dos Agentes

### 1. PLAN
- Analisa tasks.json e código existente
- Cria ID único no formato YYMMDD-nome-curto
- Seleciona tarefa e marca como `status: 'active'`
- Inicia documentação em `workspace/progress-{task-id}.md`
- Atualiza `tasks.json`

### 2. SPECIFICATION  
- Filtra tarefas com `status: 'active'` e `phase: 'spec'`
- Cria design de alto nível
- Salva em `.agent/workspace/spec-{task-id}.md`
- Atualiza phase para 'detail'

### 3. TECHNICAL_DETAILER
- Filtra tarefas com `status: 'active'` e `phase: 'detail'`
- Define estrutura de arquivos
- Cria scaffold em `.agent/workspace/scaffold-{task-id}.md`
- Atualiza phase para 'implementation'

### 4. IMPLEMENTATION
- Filtra tarefas com `status: 'active'` e `phase: 'implementation'`
- Implementa código seguindo scaffold
- Atualiza lista de arquivos criados
- Atualiza phase para 'test'

### 5. TESTER
- Filtra tarefas com `status: 'active'` e `phase: 'test'`
- Escreve e executa testes
- Corrige bugs encontrados
- Atualiza phase para 'review'

### 6. CODE_REVIEW
- Filtra tarefas com `status: 'active'` e `phase: 'review'`
- Refatora código
- Limpa arquivos do workspace/
- Marca tarefa como `status: 'completed'`

## 🎨 Dashboard

O dashboard web oferece:

### Barra Superior
- **Nome do projeto** e descrição configurados durante `init`
- **Foco atual** do projeto (meta editável)
- Botão de refresh para atualizar dados

### Visualização Backlog (Lista)
- Lista todas as tarefas com filtros
- Mostra status, fase e categoria
- Permite edição inline
- Ações rápidas (completar, deletar)

### Visualização Kanban
- Colunas por status: Backlog, Em Progresso, Concluído
- Drag & drop para mudar status
- Badges coloridos por fase
- Visualização compacta

## 💡 Boas Práticas

1. **IDs Consistentes**: Use sempre o formato YYMMDD-nome-curto
2. **Uma Tarefa por Vez**: Agentes devem focar em uma tarefa ativa
3. **Documentação Contínua**: Atualizar progress file a cada marco significativo
4. **Workspace Rico**: Usar workspace para documentação detalhada, não apenas artefatos
5. **Notes Descritivas**: Resumir decisões importantes no tasks.json
6. **Handoff Claro**: Sempre deixar próximos passos explícitos para continuidade
7. **Commits Atômicos**: Cada fase pode gerar um commit Git

### Documentação de Progresso

Todos os agentes devem:
- Copiar `.agent/templates/progress-template.md` ao iniciar uma task
- Manter o arquivo atualizado durante todo o trabalho
- Usar o espaço livre para documentação rica e introspectiva
- Preservar o arquivo como histórico após conclusão

Veja `.prompts/AGENT_WORKFLOW.md` para regras completas.

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.

## 🔗 Links

- [Documentação completa](docs/)
- [Exemplos de uso](examples/)
- [Troubleshooting](docs/troubleshooting.md)
