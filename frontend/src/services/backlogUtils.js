import { TaskFilters } from '../utils/taskFilters.js'

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
    // Delegar para o utilitário centralizado
    return TaskFilters.filterTasks(tasks, filters)
  }
}
