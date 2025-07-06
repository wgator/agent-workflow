# Agent Workflow v3.0 - Livro de Regras

Sistema de orquestração de agentes para desenvolvimento com MCP filesystem.

## 🎯 Visão Geral

O Agent Workflow coordena 6 agentes especializados:
1. **PLAN** - Seleciona e prioriza tarefas
2. **SPECIFICATION** - Define arquitetura de alto nível
3. **TECHNICAL_DETAILER** - Cria estrutura detalhada
4. **IMPLEMENTATION** - Implementa o código
5. **TESTER** - Cria e executa testes
6. **CODE_REVIEW** - Revisa e finaliza

## 📄 Estrutura do tasks.json

```json
{
  "meta": {
    "name": "Nome do Projeto",
    "description": "Descrição do projeto",
    "created": "2025-01-15T10:00:00Z",
    "updated": "2025-01-15T10:00:00Z",
    "focus": "Objetivo atual do sprint"
  },
  "tasks": {
    "250115-post-repo": {
      "title": "Implementar PostRepository",
      "status": "active", // backlog | active | completed
      "category": "Storage/Database",
      "created_at": "2025-01-15T10:00:00Z",
      "started_at": "2025-01-15T10:00:00Z",
      "completed_at": "2025-01-15T16:00:00Z",
      "phase": "implementation", // plan | spec | detail | implementation | test | review
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
        "detail": "Incluir validação com Joi",
        "implementation": "Tive que criar BaseRepository primeiro"
      }
    }
  }
}
```

## ⚠️ Regras Críticas

1. **Uma task ativa por vez** - Sistema suporta apenas uma task com status:'active'
2. **Progress file obrigatório** - Sempre criar `.agent/workspace/progress-{task-id}.md` ao iniciar
3. **Atualizar ao pausar** - Documentar estado atual e próximos passos antes de parar
4. **Preservar progress files** - Nunca deletar ou arquivar, mantê-los no workspace principal como referência ativa
5. **Filtrar corretamente** - Cada agente deve processar apenas tasks em sua fase

## 🔍 Sistema de Filtragem

Cada agente deve encontrar sua task específica:

```javascript
// PLAN - Encontrar próxima tarefa do backlog
const nextTask = Object.entries(tasks.tasks)
  .find(([id, task]) => task.status === 'backlog')

// SPECIFICATION - Encontrar task ativa em fase spec
const activeSpec = Object.entries(tasks.tasks)
  .find(([id, task]) => task.status === 'active' && task.phase === 'spec')

// TECHNICAL_DETAILER - phase:'detail'
// IMPLEMENTATION - phase:'implementation'
// TESTER - phase:'test'
// CODE_REVIEW - phase:'review'
```

## 📋 Documentação Contínua

### Template Progress (Obrigatório)

1. Copiar `.agent/templates/progress-template.md` para `.agent/workspace/progress-{task-id}.md`
2. Atualizar a cada marco significativo
3. Usar espaço livre para documentação detalhada

### Estrutura Mínima:
- **Decomposição**: Lista de subtarefas com checkboxes
- **Estado Atual**: Onde parou e o que foi feito
- **Contexto & Decisões**: Perguntas, decisões, bloqueios
- **Próximos Passos**: Lista explícita de ações

### Ao finalizar fase:
Adicionar resumo conciso em `notes[phase]` do tasks.json

## 📁 Artefatos por Fase

| Agente | Lê | Cria | Atualiza |
|--------|-----|------|----------|
| PLAN | tasks.json, código | progress-{id}.md | status:'active', phase:'spec' |
| SPECIFICATION | spec anterior | spec-{id}.md | phase:'detail', notes.spec |
| TECHNICAL_DETAILER | spec-{id}.md | scaffold-{id}.md | phase:'implementation', files.planned |
| IMPLEMENTATION | scaffold-{id}.md | código real | phase:'test', files.created/modified |
| TESTER | código criado | testes | phase:'review', files.tested |
| CODE_REVIEW | tudo | review-{id}.md | status:'completed', arquiva workspace |

## 🔄 Fluxo de Atualização

### Ao iniciar fase:
```javascript
task.phase = 'minha_fase'
task.started_at = new Date().toISOString() // se primeira vez
```

### Ao completar fase:
```javascript
task.phases_completed.push('minha_fase')
task.phase = 'proxima_fase' // ou null se CODE_REVIEW
task.notes.minha_fase = 'Resumo do que foi feito'
```

### Ao completar task (CODE_REVIEW):
```javascript
task.status = 'completed'
task.completed_at = new Date().toISOString()
task.phase = null
// Arquivar spec, scaffold, review em workspace/archive/{task-id}/
// Manter progress no workspace principal
```

## 🆔 Sistema de IDs

Formato: `YYMMDD-nome-curto`

```javascript
const taskId = `${yy}${mm}${dd}-${shortName}` // 250115-post-repo
```

## 💡 Boas Práticas Essenciais

1. **Notes descritivas** - Cada fase deve deixar resumo claro em notes
2. **Files atualizados** - Manter lista de arquivos sempre atual
3. **Handoff explícito** - Próximos passos devem permitir continuação imediata
4. **Documentação rica** - Progress file é para pensar, não só executar
5. **Comunicar bloqueios** - Documentar imediatamente com contexto

## 📊 Estrutura de Diretórios

```
.agent/
├── tasks.json              # Estado de todas as tarefas
├── workspace/              # Documentos de trabalho
│   ├── archive/            # Histórico de tarefas completas
│   │   └── {task-id}/     # Arquivos arquivados por task
│   │       ├── spec-*.md
│   │       ├── scaffold-*.md
│   │       └── review-*.md
│   ├── progress-*.md      # Documentação contínua (preservar)
│   ├── spec-*.md          # Especificações ativas
│   ├── scaffold-*.md      # Estruturas ativas
│   └── review-*.md        # Revisões ativas
└── templates/
    └── progress-template.md # Template para progress
```