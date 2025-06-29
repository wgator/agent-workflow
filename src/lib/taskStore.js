import TaskValidator from './taskValidator.js'
import TaskFileManager from './taskFileManager.js'
import TaskOrderingService from './taskOrderingService.js'
import OrderingSystem from '../utils/orderingSystem.js'

/**
 * Store principal para operações de tasks
 * Coordena outros serviços especializados
 */
class TaskStore {
  constructor(projectPath) {
    this.validator = new TaskValidator()
    this.fileManager = new TaskFileManager(projectPath)
    this.projectPath = projectPath || process.cwd()
  }

  /**
   * Lê dados do arquivo com validação
   */
  async read() {
    await this.fileManager.ensureExists(this.validator.createInitialStructure())
    
    try {
      const data = await this.fileManager.read()
      this.validator.validate(data)
      return data
    } catch (error) {
      console.error('Failed to read tasks.json:', error.message)
      
      // Tenta recuperar do backup
      try {
        const data = await this.fileManager.restoreFromBackup()
        this.validator.validate(data)
        return data
      } catch (backupError) {
        console.error('Backup restore failed:', backupError.message)
        return this.validator.createInitialStructure()
      }
    }
  }

  /**
   * Escreve dados no arquivo com validação
   */
  async write(data) {
    this.validator.validate(data)
    await this.fileManager.write(data)
  }

  /**
   * Normaliza orders de todas as tasks
   * Deve ser chamado apenas na inicialização do servidor
   */
  async normalizeOrders() {
    console.log('🔧 [TaskStore] Starting order normalization...')
    const data = await this.read()
    
    const updatedData = await TaskOrderingService.normalizeOrders(data)
    if (updatedData) {
      await this.write(updatedData)
    }
  }

  /**
   * Cria nova task
   */
  async createTask(taskId, taskData) {
    const data = await this.read()
    
    if (data.tasks[taskId]) {
      throw new Error(`Task ${taskId} already exists`)
    }
    
    const order = TaskOrderingService.generateInitialOrder(data)
    
    data.tasks[taskId] = {
      title: taskData.title,
      status: taskData.status || 'backlog',
      created_at: new Date().toISOString(),
      category: taskData.category || '',
      description: taskData.description || '',
      dependencies: taskData.dependencies || [],
      order,
      ...taskData
    }
    
    await this.write(data)
    return data.tasks[taskId]
  }

  /**
   * Atualiza task existente
   */
  async updateTask(taskId, updates) {
    const data = await this.read()
    const task = data.tasks[taskId]
    
    if (!task) {
      throw new Error(`Task ${taskId} not found`)
    }
    
    // Merge updates
    Object.assign(task, updates)
    
    // Lógica especial para mudanças de status
    if (updates.status === 'active' && !task.started_at) {
      task.started_at = new Date().toISOString()
      task.phase = task.phase || 'plan'
      task.phases_completed = task.phases_completed || []
      task.files = task.files || { planned: [], created: [], modified: [], tested: [] }
      task.notes = task.notes || {}
    }
    
    if (updates.status === 'completed' && !task.completed_at) {
      task.completed_at = new Date().toISOString()
    }
    
    // Atualiza phases_completed se phase mudou
    if (updates.phase && task.phases_completed && !task.phases_completed.includes(updates.phase)) {
      task.phases_completed.push(updates.phase)
    }
    
    await this.write(data)
    return task
  }

  /**
   * Completa uma task
   */
  async completeTask(taskId) {
    return this.updateTask(taskId, { status: 'completed' })
  }

  /**
   * Remove uma task
   */
  async deleteTask(taskId) {
    const data = await this.read()
    
    if (!data.tasks[taskId]) {
      throw new Error(`Task ${taskId} not found`)
    }
    
    const task = data.tasks[taskId]
    delete data.tasks[taskId]
    
    await this.write(data)
    return task
  }

  /**
   * Lista tasks com filtros opcionais
   */
  async listTasks(filter = {}) {
    const data = await this.read()
    const tasks = []
    
    for (const [id, task] of Object.entries(data.tasks)) {
      // Aplica filtros se fornecidos
      if (filter.status && task.status !== filter.status) continue
      if (filter.phase && task.phase !== filter.phase) continue
      if (filter.category && task.category !== filter.category) continue
      
      tasks.push({ id, ...task })
    }
    
    return OrderingSystem.sortTasks(tasks)
  }
  
  /**
   * Obtém uma task específica
   */
  async getTask(taskId) {
    const data = await this.read()
    const task = data.tasks[taskId]
    
    if (!task) {
      throw new Error(`Task ${taskId} not found`)
    }
    
    return { id: taskId, ...task }
  }
  
  /**
   * Atualiza metadados do projeto
   */
  async updateMeta(updates) {
    const data = await this.read()
    Object.assign(data.meta, updates)
    await this.write(data)
    return data.meta
  }
  
  /**
   * Reordena task por posição (método legado)
   */
  async reorderTask(taskId, position) {
    const data = await this.read()
    const updatedTask = TaskOrderingService.reorderByPosition(data, taskId, position)
    await this.write(data)
    return updatedTask
  }
  
  /**
   * Reordena task por referências (método preferido)
   */
  async reorderTaskBetween(taskId, beforeTaskId, afterTaskId) {
    const data = await this.read()
    const updatedTask = TaskOrderingService.reorderByReferences(data, taskId, beforeTaskId, afterTaskId)
    await this.write(data)
    return updatedTask
  }
}

export default TaskStore
