import { TaskApiService } from './taskApi.js'
import { KanbanService } from './kanbanService.js'

/**
 * Gerencia operações de drag & drop no Kanban
 */
export class DragHandler {
  constructor(tasksByColumn, tasksStore) {
    this.tasksByColumn = tasksByColumn
    this.tasksStore = tasksStore
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
    const updates = KanbanService.calculateStatusAndPhase(targetColumnId)
    
    // Primeiro, atualizar status/phase
    await this.tasksStore.updateTask(task.id, updates)
    
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
          
          // Atualizar ordem no store local
          await this.tasksStore.updateTask(task.id, { 
            order: result.order 
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
    const { beforeTaskId, afterTaskId } = KanbanService.calculateReorderReferences(
      columnTasks, 
      task.id, 
      newIndex
    )
    
    try {
      const result = await TaskApiService.reorderByReferences(task.id, beforeTaskId, afterTaskId)
      
      // Atualizar ordem no store local
      await this.tasksStore.updateTask(task.id, { 
        order: result.order 
      })
    } catch (error) {
      console.error('Reorder failed:', error)
    }
  }
}
