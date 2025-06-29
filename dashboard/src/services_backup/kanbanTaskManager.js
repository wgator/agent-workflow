import { KANBAN_COLUMNS, PHASE_COLORS, PHASES_SEQUENCE } from './kanbanConfig.js'

/**
 * Gerencia operações relacionadas a tasks no Kanban
 */
class KanbanTaskManager {
  /**
   * Filtra tasks baseado em critérios de busca
   */
  static filterTasks(tasks, filters) {
    let filtered = [...tasks]
    
    if (filters.searchQuery) {
      const search = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(search) ||
        task.category?.toLowerCase().includes(search) ||
        task.status.toLowerCase().includes(search) ||
        task.id.toLowerCase().includes(search)
      )
    }
    
    if (filters.category) {
      filtered = filtered.filter(task => task.category === filters.category)
    }
    
    if (filters.status) {
      filtered = filtered.filter(task => task.status === filters.status)
    }
    
    if (filters.phase) {
      filtered = filtered.filter(task => task.phase === filters.phase)
    }
    
    return filtered
  }
  
  /**
   * Organiza tasks em colunas do Kanban
   */
  static organizeTasksByColumn(tasks) {
    const result = {}
    
    KANBAN_COLUMNS.forEach(column => {
      if (column.id === 'backlog') {
        result[column.id] = tasks.filter(t => t.status === 'backlog')
      } else if (column.id === 'completed') {
        result[column.id] = tasks.filter(t => t.status === 'completed')
      } else {
        // Colunas de progresso
        result[column.id] = tasks.filter(t => 
          t.status === 'active' && t.phase === column.id
        )
      }
      
      // Ordenar por order field (DESC - maior order = primeira posição)
      if (result[column.id]) {
        result[column.id].sort((a, b) => {
          const orderA = parseFloat(a.order || '0')
          const orderB = parseFloat(b.order || '0')
          return orderB - orderA // DESC: maior primeiro
        })
      }
    })
    
    return result
  }
  
  /**
   * Determina quais colunas devem ser visíveis baseado em filtros
   */
  static getVisibleColumns(tasksByColumn, hasActiveFilters) {
    if (!hasActiveFilters) {
      return KANBAN_COLUMNS
    }
    
    // Com filtros: mostrar apenas colunas com tasks
    return KANBAN_COLUMNS.filter(column => {
      return tasksByColumn[column.id]?.length > 0
    })
  }
  
  /**
   * Calcula status e phase baseado na coluna de destino
   */
  static calculateStatusAndPhase(targetColumnId) {
    if (targetColumnId === 'backlog') {
      return { status: 'backlog' }
    }
    
    if (targetColumnId === 'completed') {
      return { status: 'completed' }
    }
    
    // Colunas de progresso
    return { status: 'active', phase: targetColumnId }
  }
  
  /**
   * Obtém cor da fase
   */
  static getPhaseColor(phase) {
    return PHASE_COLORS[phase] || '#6b7280'
  }
  
  /**
   * Obtém próxima fase na sequência
   */
  static getNextPhase(currentPhase) {
    const currentIndex = PHASES_SEQUENCE.indexOf(currentPhase)
    return currentIndex < PHASES_SEQUENCE.length - 1 ? PHASES_SEQUENCE[currentIndex + 1] : null
  }
  
  /**
   * Obtém fase anterior na sequência
   */
  static getPreviousPhase(currentPhase) {
    const currentIndex = PHASES_SEQUENCE.indexOf(currentPhase)
    return currentIndex > 0 ? PHASES_SEQUENCE[currentIndex - 1] : null
  }
  
  /**
   * Calcula referências before/after para reordenação
   */
  static calculateReorderReferences(columnTasks, movingTaskId, newIndex) {
    // Filtrar a task que está sendo movida do array
    const filteredTasks = columnTasks.filter(t => t.id !== movingTaskId)
    
    const beforeTask = filteredTasks[newIndex - 1]
    const afterTask = filteredTasks[newIndex]
    
    return {
      beforeTaskId: beforeTask?.id || null,
      afterTaskId: afterTask?.id || null
    }
  }
}

export default KanbanTaskManager
