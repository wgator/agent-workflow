import OrderingSystem from '../utils/orderingSystem.js'

/**
 * Serviço especializado em operações de ordenação de tasks
 */
class TaskOrderingService {
  /**
   * Normaliza tasks sem campo 'order'
   * @param {Object} tasksData - Dados completos do arquivo tasks.json
   * @returns {Promise<Object>} Dados atualizados (se houver mudanças)
   */
  static async normalizeOrders(tasksData) {
    const tasksWithoutOrder = []
    
    for (const [id, task] of Object.entries(tasksData.tasks)) {
      if (!task.order) {
        tasksWithoutOrder.push({ id, ...task })
      }
    }
    
    if (tasksWithoutOrder.length === 0) {
      console.log('✅ [TaskOrdering] All tasks already have order field')
      return null // Sem mudanças
    }
    
    console.log(`🔧 [TaskOrdering] Normalizing ${tasksWithoutOrder.length} tasks without order`)
    
    // Pegar maior order existente
    const existingOrders = Object.values(tasksData.tasks)
      .filter(t => t.order)
      .map(t => parseFloat(t.order))
    
    let nextOrder = existingOrders.length > 0 
      ? Math.max(...existingOrders) + OrderingSystem.INITIAL_GAP
      : OrderingSystem.INITIAL_GAP
    
    // Atribuir orders sequenciais para tasks sem order
    for (const taskInfo of tasksWithoutOrder) {
      tasksData.tasks[taskInfo.id].order = nextOrder.toString()
      console.log(`🆕 [TaskOrdering] Assigned order ${nextOrder} to task ${taskInfo.id}`)
      nextOrder += OrderingSystem.INITIAL_GAP
    }
    
    console.log(`✅ [TaskOrdering] Normalization complete, updated ${tasksWithoutOrder.length} tasks`)
    return tasksData // Dados modificados
  }
  
  /**
   * Reordena uma task baseado em posição global
   * @param {Object} tasksData - Dados do arquivo
   * @param {string} taskId - ID da task
   * @param {number} position - Nova posição
   * @returns {Object} Task atualizada
   */
  static reorderByPosition(tasksData, taskId, position) {
    if (!tasksData.tasks[taskId]) {
      throw new Error(`Task ${taskId} not found`)
    }
    
    // Converter para array e ordenar
    const tasksArray = OrderingSystem.tasksToOrderedArray(tasksData.tasks)
    
    const currentIndex = tasksArray.findIndex(t => t.id === taskId)
    if (currentIndex === -1) {
      throw new Error(`Task ${taskId} not found in ordered array`)
    }
    
    // Remove da posição atual
    tasksArray.splice(currentIndex, 1)
    
    // Calcular posição final
    const finalPosition = Math.max(0, Math.min(position, tasksArray.length))
    
    // Calcular before/after
    const before = tasksArray[finalPosition - 1]
    const after = tasksArray[finalPosition]
    
    // Calcular nova ordem
    const newOrder = OrderingSystem.calculateNewOrder(
      before?.order,
      after?.order
    )
    
    // Atualizar task
    tasksData.tasks[taskId].order = newOrder
    
    return { id: taskId, ...tasksData.tasks[taskId] }
  }
  
  /**
   * Reordena uma task baseado em referências de outras tasks
   * @param {Object} tasksData - Dados do arquivo
   * @param {string} taskId - ID da task
   * @param {string|null} beforeTaskId - ID da task anterior (ou null para primeira posição)
   * @param {string|null} afterTaskId - ID da task posterior (ou null para última posição)
   * @returns {Object} Task atualizada
   */
  static reorderByReferences(tasksData, taskId, beforeTaskId, afterTaskId) {
    if (!tasksData.tasks[taskId]) {
      throw new Error(`Task ${taskId} not found`)
    }
    
    // Buscar orders das tasks de referência
    let beforeOrder = null
    let afterOrder = null
    
    if (beforeTaskId && tasksData.tasks[beforeTaskId]) {
      beforeOrder = tasksData.tasks[beforeTaskId].order
    }
    
    if (afterTaskId && tasksData.tasks[afterTaskId]) {
      afterOrder = tasksData.tasks[afterTaskId].order
    }
    
    // Calcular nova ordem
    const newOrder = OrderingSystem.calculateNewOrder(beforeOrder, afterOrder)
    
    // Atualizar task
    tasksData.tasks[taskId].order = newOrder
    
    return { id: taskId, ...tasksData.tasks[taskId] }
  }
  
  /**
   * Gera order inicial para nova task
   * @param {Object} tasksData - Dados do arquivo
   * @returns {string} Order inicial
   */
  static generateInitialOrder(tasksData) {
    const tasksArray = Object.values(tasksData.tasks)
    return OrderingSystem.calculateInitialOrder(tasksArray)
  }
}

export default TaskOrderingService
