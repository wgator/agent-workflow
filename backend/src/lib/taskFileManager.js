import { readFile, writeFile, copyFile } from 'fs/promises'
import { join } from 'path'

/**
 * Gerencia operações de arquivo para tasks
 */
class TaskFileManager {
  constructor(projectPath) {
    this.projectPath = projectPath || process.cwd()
    this.tasksPath = join(this.projectPath, '.agent', 'tasks.json')
    this.backupPath = join(this.projectPath, '.agent', 'tasks.backup.json')
  }
  
  /**
   * Garante que o arquivo tasks.json existe
   * @param {Object} initialData - Dados iniciais se arquivo não existir
   */
  async ensureExists(initialData) {
    try {
      await readFile(this.tasksPath)
    } catch (error) {
      if (error.code === 'ENOENT') {
        await writeFile(this.tasksPath, JSON.stringify(initialData, null, 2), 'utf8')
      }
    }
  }
  
  /**
   * Lê dados do arquivo tasks.json
   * @returns {Promise<Object>} Dados do arquivo
   */
  async read() {
    try {
      const content = await readFile(this.tasksPath, 'utf8')
      return JSON.parse(content)
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error('Tasks file not found. Call ensureExists() first.')
      }
      throw new Error(`Failed to read tasks file: ${error.message}`)
    }
  }
  
  /**
   * Escreve dados no arquivo tasks.json com backup
   * @param {Object} data - Dados para escrever
   */
  async write(data) {
    // Atualiza timestamp
    data.meta.updated = new Date().toISOString()
    
    // Cria backup antes de escrever
    await this.createBackup()
    
    // Escreve com formatação consistente
    await writeFile(
      this.tasksPath, 
      JSON.stringify(data, null, 2) + '\n',
      'utf8'
    )
  }
  
  /**
   * Cria backup do arquivo atual
   */
  async createBackup() {
    try {
      await copyFile(this.tasksPath, this.backupPath)
    } catch (error) {
      // Ignora erro se arquivo não existir ainda
      if (error.code !== 'ENOENT') {
        console.warn('Failed to create backup:', error.message)
      }
    }
  }
  
  /**
   * Restaura do backup em caso de erro
   * @returns {Promise<Object>} Dados restaurados
   */
  async restoreFromBackup() {
    try {
      console.log('Attempting to restore from backup...')
      await copyFile(this.backupPath, this.tasksPath)
      return await this.read()
    } catch (backupError) {
      throw new Error(`Backup restore failed: ${backupError.message}`)
    }
  }
}

export default TaskFileManager
