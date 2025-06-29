/**
 * Sistema de ordenação inspirado no Notion/Linear
 * Usa strings numéricas para permitir interpolação infinita
 */
class OrderingSystem {
  static INITIAL_GAP = 1000
  static MIN_GAP = 0.01
  static REBALANCE_THRESHOLD = 0.001

  /**
   * Calcula nova ordem entre dois elementos (sistema DESC)
   * @param {string|undefined} beforeOrder - Ordem do elemento anterior (maior order)
   * @param {string|undefined} afterOrder - Ordem do elemento posterior (menor order)
   * @returns {string} Nova ordem
   */
  static calculateNewOrder(beforeOrder, afterOrder) {
    const before = parseFloat(beforeOrder || '0')
    const after = parseFloat(afterOrder || '0')
    
    // CASO 1: Primeira posição (sem elemento anterior)
    if (!beforeOrder || before === 0) {
      const newOrder = Math.max(before, after) + this.INITIAL_GAP
      return newOrder.toString()
    }
    
    // CASO 2: Última posição (sem elemento posterior)
    if (!afterOrder || after === 0) {
      const newOrder = Math.max(before / 2, this.MIN_GAP)
      return newOrder.toString()
    }
    
    // CASO 3: Entre dois elementos
    if (before > after) {
      const newOrder = (before + after) / 2
      return newOrder.toString()
    } else {
      // Fallback se houver inconsistência
      const newOrder = before + this.INITIAL_GAP
      return newOrder.toString()
    }
  }

  /**
   * Calcula ordem inicial para nova task (sempre a maior)
   * @param {Array} existingTasks - Tasks existentes
   * @returns {string} Ordem inicial
   */
  static calculateInitialOrder(existingTasks = []) {
    if (existingTasks.length === 0) {
      return this.INITIAL_GAP.toString()
    }
    
    // Pega a maior ordem atual e adiciona GAP (para ficar no topo)
    const maxOrder = Math.max(...existingTasks.map(t => parseFloat(t.order || '0')))
    return (maxOrder + this.INITIAL_GAP).toString()
  }

  /**
   * Verifica se precisa rebalancear
   * @param {Array} orderedTasks - Tasks ordenadas
   * @returns {boolean} Se precisa rebalancear
   */
  static shouldRebalance(orderedTasks) {
    for (let i = 0; i < orderedTasks.length - 1; i++) {
      const current = parseFloat(orderedTasks[i].order || '0')
      const next = parseFloat(orderedTasks[i + 1].order || '0')
      const gap = next - current
      
      if (gap < this.REBALANCE_THRESHOLD) {
        return true
      }
    }
    return false
  }

  /**
   * Rebalanceia todas as orders com gaps uniformes
   * @param {Array} tasksArray - Array de tasks para rebalancear
   * @returns {Array} Tasks com novas orders
   */
  static rebalanceOrders(tasksArray) {
    return tasksArray.map((task, index) => ({
      ...task,
      order: ((index + 1) * this.INITIAL_GAP).toString()
    }))
  }

  /**
   * Ordena array de tasks por order (DESC - maior order = primeira posição)
   * @param {Array} tasks - Tasks para ordenar
   * @returns {Array} Tasks ordenadas
   */
  static sortTasks(tasks) {
    return tasks.sort((a, b) => {
      // 🔧 Tratar undefined/null orders como 0
      const orderA = parseFloat(a.order || '0')
      const orderB = parseFloat(b.order || '0')
      
      // Se orders são iguais, usar created_at como fallback
      if (orderA === orderB) {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0) // DESC também
      }
      
      return orderB - orderA // DESC: maior order = primeira posição
    })
  }

  /**
   * Converte objeto tasks para array ordenado
   * @param {Object} tasksObject - Objeto de tasks do JSON
   * @returns {Array} Array ordenado de tasks com IDs
   */
  static tasksToOrderedArray(tasksObject) {
    const tasksArray = Object.entries(tasksObject || {})
      .map(([id, task]) => ({ id, ...task }))
    
    return this.sortTasks(tasksArray)
  }

  /**
   * Debug: Mostra estado atual das orders
   * @param {Array} tasks - Tasks para debugar
   */
  static debugOrders(tasks) {
    console.log('=== ORDER DEBUG ===')
    tasks.forEach((task, index) => {
      const order = parseFloat(task.order || '0')
      const gap = index > 0 ? order - parseFloat(tasks[index - 1].order || '0') : 'N/A'
      console.log(`${index}: ${task.id} -> order: ${order}, gap: ${gap}`)
    })
    console.log('==================')
  }
}

export default OrderingSystem
