// ========================
// TASK API SERVICE
// ========================
export const TaskApiService = {
  async reorderByReferences(taskId, beforeTaskId, afterTaskId) {
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
