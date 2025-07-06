# Roadmap - Agent Workflow v3.1

**Data de Criação**: 2025-01-15  
**Objetivo**: Implementar melhorias críticas identificadas nos feedbacks de uso

## 📊 Resumo Executivo

Este roadmap foca nas 4 features de maior impacto identificadas através da análise cruzada dos feedbacks do PLAN e TECHNICAL_DETAILING. Todas as features selecionadas foram mencionadas em ambos os feedbacks, indicando sua importância crítica para o sucesso do workflow.

## 🎯 Features Selecionadas

### 1. Sistema de Dependências e Bloqueios
**Problema**: Tasks podem ficar bloqueadas sem visibilidade clara, causando trabalho desperdiçado  
**Solução**: Sistema explícito de tracking de dependências e bloqueios  
**Impacto**: Evita trabalho em tasks impossíveis de completar

### 2. Progress Files em YAML Estruturado  
**Problema**: Progress files em markdown livre dificultam parsing e handoff  
**Solução**: Formato YAML estruturado com schema definido  
**Impacto**: Melhora comunicação entre agentes e permite automação

### 3. Especificações com Exemplos e Critérios
**Problema**: Specs podem ser ambíguas, causando retrabalho  
**Solução**: Template obrigatório com exemplos I/O e critérios mensuráveis  
**Impacto**: Reduz drasticamente retrabalho e mal-entendidos

### 4. Validação de Estados e Transições
**Problema**: Estados inválidos podem corromper o workflow  
**Solução**: Validações automáticas de estado e transições  
**Impacto**: Mantém integridade do sistema e previne erros

## 📅 Fases de Implementação

### Fase 1: Sistema de Dependências e Bloqueios (5-7 dias)

**Escopo**:
- Adicionar campos de dependência ao tasks.json
- Implementar lógica de detecção de bloqueios
- Criar visualização de grafo de dependências
- Adicionar comandos `/blockers` e `/dependencies`

**Schema Proposto**:
```json
{
  "tasks": {
    "task-id": {
      // campos existentes...
      "dependencies": {
        "depends_on": ["task-id-1", "task-id-2"],
        "blocks": ["task-id-3", "task-id-4"],
        "blocked_by": null,
        "blocked_reason": null,
        "blocked_since": null
      }
    }
  }
}
```

**Entregáveis**:
- [ ] Schema atualizado do tasks.json
- [ ] Lógica de validação de dependências circulares
- [ ] API endpoints para gerenciar dependências
- [ ] Comando `/blockers` implementado
- [ ] Documentação atualizada

### Fase 2: Progress Files em YAML (3-4 dias)

**Escopo**:
- Definir schema YAML para progress files
- Converter template existente
- Criar parser/validator
- Atualizar todos os agentes para usar novo formato

**Schema Proposto**:
```yaml
version: "1.0"
task_id: string
metadata:
  created_at: timestamp
  updated_at: timestamp
  phase: string
  completion: 0-100

progress:
  completed:
    - item: string
      timestamp: timestamp
  
  current:
    description: string
    blockers: []
    
  next_steps:
    - priority: high|medium|low
      description: string

decisions:
  - context: string
    decision: string
    rationale: string
    timestamp: timestamp

handoff_notes: string
```

**Entregáveis**:
- [ ] Schema YAML definido e documentado
- [ ] Template progress-template.yaml
- [ ] Parser/validator implementado
- [ ] Migração de progress files existentes
- [ ] Atualização dos prompts dos agentes

### Fase 3: Especificações com Exemplos (4-5 dias)

**Escopo**:
- Criar template mandatório para specs
- Incluir seções de exemplos I/O
- Adicionar critérios de aceitação estruturados
- Validador de completude de spec

**Template Proposto**:
```markdown
# Specification: [Task Title]

## Contexto
[...]

## Objetivos
[...]

## Exemplos Input/Output
### Exemplo 1: Caso Normal
**Input**:
```json
{...}
```
**Output**:
```json
{...}
```

### Exemplo 2: Edge Case
[...]

## Critérios de Aceitação
- [ ] Critério mensurável 1
- [ ] Critério mensurável 2
- [ ] Performance: < 100ms
- [ ] Cobertura de testes: > 80%

## Constraints Técnicos
- Limite de memória: X
- Rate limits: Y
- Compatibilidade: Z
```

**Entregáveis**:
- [ ] Template de specification estruturado
- [ ] Validador de spec completa
- [ ] Exemplos de specs bem escritas
- [ ] Atualização do prompt SPECIFICATION
- [ ] Guia de boas práticas

### Fase 4: Validação de Estados (3-4 dias)

**Escopo**:
- Implementar validações de estado
- Detectar e prevenir estados inválidos
- Criar sistema de alertas
- Adicionar comando `/validate`

**Validações Principais**:
```javascript
// 1. Apenas uma task ativa
// 2. Progressão correta de fases
// 3. Sem tasks órfãs
// 4. Sem dependências circulares
// 5. Timestamps consistentes
// 6. Files tracking coerente
```

**Entregáveis**:
- [ ] Módulo de validação completo
- [ ] Testes unitários de cada validação
- [ ] Sistema de correção automática (onde possível)
- [ ] Comando `/validate` implementado
- [ ] Logs de auditoria

## 📈 Métricas de Sucesso

### Métricas Quantitativas
- Redução de 50% em tasks bloqueadas não detectadas
- Redução de 30% no tempo de handoff entre agentes
- Redução de 40% em retrabalho por spec ambígua
- Zero estados corrompidos em produção

### Métricas Qualitativas
- Feedback positivo dos agentes sobre clareza
- Menor fricção nas transições de fase
- Maior confiança no estado do sistema
- Melhor visibilidade do progresso real

## 🚀 Próximos Passos

1. **Imediato**: Iniciar implementação do Sistema de Dependências
2. **Paralelo**: Começar design do schema YAML para progress files
3. **Comunicação**: Notificar todos os agentes sobre mudanças vindouras
4. **Documentação**: Criar guias de migração para cada feature

## 📊 Timeline Estimado

| Feature | Início | Duração | Fim |
|---------|---------|---------|-----|
| Sistema de Dependências | Dia 1 | 5-7 dias | Dia 7 |
| Progress YAML | Dia 8 | 3-4 dias | Dia 11 |
| Specs com Exemplos | Dia 12 | 4-5 dias | Dia 16 |
| Validação de Estados | Dia 17 | 3-4 dias | Dia 20 |

**Total Estimado**: 15-20 dias úteis

## 🔄 Revisões

Este roadmap será revisado semanalmente para ajustar prioridades e prazos baseado no progresso real e feedback recebido.

---

*Última atualização: 2025-01-15*