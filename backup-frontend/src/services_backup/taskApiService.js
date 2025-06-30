/**
 * Serviço para chamadas de API relacionadas a tasks
 */
class TaskApiService {
  /**
   * Reordena task por posição (método legado)
   */
  static async reorderByPosition(taskId, position) {
    const response = await fetch(`/api/tasks/${taskId}/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ position })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    return response.json()
  }
  
  /**
   * Reordena task por referências (método preferido)
   */
  static async reorderByReferences(taskId, beforeTaskId, afterTaskId) {
    const response = await fetch(`/api/tasks/${taskId}/reorder-between`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        beforeTaskId: beforeTaskId || null,
        afterTaskId: afterTaskId || null
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    return response.json()
  }
}

export default TaskApiService
