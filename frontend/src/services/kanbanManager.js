// ========================
// KANBAN CONFIGURATION
// ========================
export const KANBAN_COLUMNS = [
  { id: 'backlog', title: 'Backlog', color: 'gray' },
  { id: 'plan', title: 'Plan', color: 'yellow', isProgress: true },
  { id: 'spec', title: 'Spec', color: 'yellow', isProgress: true },
  { id: 'detail', title: 'Detail', color: 'yellow', isProgress: true },
  { id: 'implementation', title: 'Implementation', color: 'yellow', isProgress: true },
  { id: 'test', title: 'Test', color: 'yellow', isProgress: true },
  { id: 'review', title: 'Review', color: 'yellow', isProgress: true },
  { id: 'completed', title: 'Completed', color: 'green' }
]

export const PHASE_COLORS = {
  plan: '#a78bfa',        // purple-400
  spec: '#8b5cf6',        // purple-500
  detail: '#7c3aed',      // purple-600
  implementation: '#6d28d9', // purple-700
  test: '#5b21b6',        // purple-800
  review: '#4c1d95'       // purple-900
}

export const DRAG_CONFIG = {
  animation: 300,
  group: 'tasks',
  itemKey: 'id'
}

// ========================
// KANBAN TASK MANAGER
// ========================
export const KanbanTaskManager = {
  filterTasks(tasks, filters) {
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
  },
  
  organizeTasksByColumn(tasks) {
    const result = {}
    
    KANBAN_COLUMNS.forEach(column => {
      if (column.id === 'backlog') {
        result[column.id] = tasks.filter(t => t.status === 'backlog')
      } else if (column.id === 'completed') {
        result[column.id] = tasks.filter(t => t.status === 'completed')
      } else {
        result[column.id] = tasks.filter(t => 
          t.status === 'active' && t.phase === column.id
        )
      }
      
      // Ordenar por order field (DESC - maior order = primeira posição)
      if (result[column.id]) {
        result[column.id].sort((a, b) => {
          const orderA = parseFloat(a.order || '0')
          const orderB = parseFloat(b.order || '0')
          return orderB - orderA
        })
      }
    })
    
    return result
  },
  
  getVisibleColumns(tasksByColumn, hasActiveFilters) {
    if (!hasActiveFilters) {
      return KANBAN_COLUMNS
    }
    
    return KANBAN_COLUMNS.filter(column => {
      return tasksByColumn[column.id]?.length > 0
    })
  },
  
  calculateStatusAndPhase(targetColumnId) {
    if (targetColumnId === 'backlog') {
      return { status: 'backlog' }
    }
    
    if (targetColumnId === 'completed') {
      return { status: 'completed' }
    }
    
    return { status: 'active', phase: targetColumnId }
  },
  
  getPhaseColor(phase) {
    return PHASE_COLORS[phase] || '#6b7280'
  },
  
  calculateReorderReferences(columnTasks, movingTaskId, newIndex) {
    const filteredTasks = columnTasks.filter(t => t.id !== movingTaskId)
    
    const beforeTask = filteredTasks[newIndex - 1]
    const afterTask = filteredTasks[newIndex]
    
    return {
      beforeTaskId: beforeTask?.id || null,
      afterTaskId: afterTask?.id || null
    }
  }
}
