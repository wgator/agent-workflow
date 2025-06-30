import TaskApiService from './taskApiService.js'
import KanbanTaskManager from './kanbanTaskManager.js'

/**
 * Gerencia operações de drag & drop no Kanban
 */
class KanbanDragHandler {
  constructor(tasksByColumn, updateTask, emit) {
    this.tasksByColumn = tasksByColumn
    this.updateTask = updateTask
    this.emit = emit
  }
  
  /**
   * Manipula eventos de movimento de tasks
   */
  async handleTaskMove(event, targetColumnId) {
    try {
      if (event.added) {
        await this.handleColumnChange(event.added, targetColumnId)
      }
      
      if (event.moved) {
        await this.handleSameColumnReorder(event.moved, targetColumnId)
      }
    } catch (error) {
      console.error('Task move failed:', error)
    }
  }
  
  /**
   * Manipula mudança de coluna
   */
  async handleColumnChange(addedEvent, targetColumnId) {
    const task = addedEvent.element
    const newIndex = addedEvent.newIndex
    const updates = KanbanTaskManager.calculateStatusAndPhase(targetColumnId)
    
    // Primeiro, atualizar status/phase
    this.updateTask(task.id, updates)
    
    // Depois, reordenar se necessário
    if (newIndex !== undefined) {
      const columnTasks = this.tasksByColumn.value[targetColumnId] || []
      const beforeTask = columnTasks[newIndex - 1]
      const afterTask = columnTasks[newIndex]
      
      // Aguardar estado ser atualizado, depois reordenar
      setTimeout(async () => {
        try {
          const result = await TaskApiService.reorderByReferences(
            task.id, 
            beforeTask?.id, 
            afterTask?.id
          )
          
          this.emit('update-task', task.id, { 
            order: result.order,
            _forceUpdate: Date.now()
          })
        } catch (error) {
          console.error('Reorder after column change failed:', error)
        }
      }, 100)
    }
  }
  
  /**
   * Manipula reordenação dentro da mesma coluna
   */
  async handleSameColumnReorder(movedEvent, targetColumnId) {
    const task = movedEvent.element
    const newIndex = movedEvent.newIndex
    
    const columnTasks = this.tasksByColumn.value[targetColumnId] || []
    const { beforeTaskId, afterTaskId } = KanbanTaskManager.calculateReorderReferences(
      columnTasks, 
      task.id, 
      newIndex
    )
    
    try {
      const result = await TaskApiService.reorderByReferences(task.id, beforeTaskId, afterTaskId)
      
      this.emit('update-task', task.id, { 
        order: result.order,
        _forceUpdate: Date.now()
      })
    } catch (error) {
      console.error('Reorder failed:', error)
    }
  }
  
  /**
   * Manipula atualizações de coluna (placeholder)
   */
  handleColumnUpdate(columnId, newTasks) {
    // Deixamos o vuedraggable gerenciar o estado local
    // O update real acontece nos handlers acima
  }
}

export default KanbanDragHandler
