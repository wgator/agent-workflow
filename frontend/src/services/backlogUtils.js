// ========================
// BACKLOG UTILITIES
// ========================
export const BacklogUtils = {
  getStatusColor(status) {
    const colors = {
      backlog: '#3b82f6',    // azul
      active: '#f59e0b',     // amarelo
      completed: '#10b981'   // verde
    }
    return colors[status] || '#6b7280'
  },

  getPhaseColor(phase) {
    const colors = {
      plan: '#a78bfa',        // purple-400 (mais claro)
      spec: '#8b5cf6',        // purple-500
      detail: '#7c3aed',      // purple-600
      implementation: '#6d28d9', // purple-700
      test: '#5b21b6',        // purple-800
      review: '#4c1d95'       // purple-900 (mais escuro)
    }
    return colors[phase] || '#6b7280'
  },

  formatDate(dateString) {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  },

  filterTasks(tasks, filters) {
    let filtered = tasks
    
    // Filter by search query
    if (filters.searchQuery) {
      const search = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(search) ||
        task.category?.toLowerCase().includes(search) ||
        task.status.toLowerCase().includes(search) ||
        task.id.toLowerCase().includes(search)
      )
    }
    
    // Filter by category
    if (filters.category) {
      filtered = filtered.filter(task => task.category === filters.category)
    }
    
    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(task => task.status === filters.status)
    }
    
    // Filter by phase
    if (filters.phase) {
      filtered = filtered.filter(task => task.phase === filters.phase)
    }
    
    return filtered
  }
}
