/**
 * Utilitário centralizado para filtros de tarefas
 * Garante consistência entre diferentes views
 */
export const TaskFilters = {
  /**
   * Filtra tarefas baseado em múltiplos critérios
   * @param {Array} tasks - Lista de tarefas
   * @param {Object} filters - Objeto com critérios de filtro
   * @returns {Array} Tarefas filtradas
   */
  filterTasks(tasks, filters) {
    let filtered = [...tasks]
    
    // Filter by search query
    if (filters.searchQuery) {
      const search = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(search) ||
        task.category?.toLowerCase().includes(search) ||
        task.status.toLowerCase().includes(search) ||
        task.id.toLowerCase().includes(search) ||
        task.description?.toLowerCase().includes(search)
      )
    }
    
    // Filter by category with wildcard support
    if (filters.category) {
      filtered = this.filterByCategory(filtered, filters.category)
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
  },
  
  /**
   * Filtra por categoria com suporte a wildcard
   * @param {Array} tasks - Lista de tarefas
   * @param {String} categoryFilter - Filtro de categoria (pode terminar com /*)
   * @returns {Array} Tarefas filtradas
   */
  filterByCategory(tasks, categoryFilter) {
    // Se for filtro wildcard (ex: Storage/*)
    if (categoryFilter.endsWith('/*')) {
      const prefix = categoryFilter.replace('/*', '')
      return tasks.filter(task => 
        task.category && task.category.startsWith(prefix)
      )
    }
    
    // Filtro exato
    return tasks.filter(task => task.category === categoryFilter)
  }
}
