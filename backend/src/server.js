import express from 'express'
import cors from 'cors'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { watch } from 'chokidar'
import TaskStore from './lib/taskStore.js'
import { generateTaskId } from './utils/taskIdGenerator.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

class AgentWorkflowServer {
  constructor(port = 3000) {
    this.port = port
    this.app = express()
    this.taskStore = new TaskStore()
    this.sseClients = new Set()
    
    this.setupMiddleware()
    this.setupRoutes()
    this.setupFileWatcher()
  }

  setupMiddleware() {
    this.app.use(cors())
    this.app.use(express.json())
    
    // Serve o dashboard estático do frontend
    this.app.use(express.static(join(dirname(dirname(__dirname)), 'frontend', 'dist')))
    
    // Remover servir node_modules (voltando para CDN)
  }

  setupRoutes() {
    // Health check
    this.app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', version: '0.1.0' })
    })

    // Listar tarefas
    this.app.get('/api/tasks', async (req, res) => {
      try {
        const { phase, status } = req.query
        const tasks = await this.taskStore.listTasks({ phase, status })
        res.json({ tasks })
      } catch (error) {
        res.status(500).json({ error: error.message })
      }
    })

    // Obter tarefa específica
    this.app.get('/api/tasks/:id', async (req, res) => {
      try {
        const task = await this.taskStore.getTask(req.params.id)
        res.json(task)
      } catch (error) {
        if (error.message.includes('not found')) {
          res.status(404).json({ error: error.message })
        } else {
          res.status(500).json({ error: error.message })
        }
      }
    })

    // Criar tarefa
    this.app.post('/api/tasks', async (req, res) => {
      try {
        const { title, ...taskData } = req.body
        
        if (!title) {
          return res.status(400).json({ error: 'Title is required' })
        }
        
        // Gerar ID automaticamente baseado no título
        const id = generateTaskId(title)
        
        const task = await this.taskStore.createTask(id, { title, ...taskData })
        res.status(201).json({ id, ...task })
      } catch (error) {
        res.status(400).json({ error: error.message })
      }
    })

    // Reordenar tarefa por referências (NOVO - mais preciso)
    this.app.put('/api/tasks/:id/reorder-between', async (req, res) => {
      try {
        const { beforeTaskId, afterTaskId } = req.body
        
        const task = await this.taskStore.reorderTaskBetween(req.params.id, beforeTaskId, afterTaskId)
        res.json(task)
      } catch (error) {
        if (error.message.includes('not found')) {
          res.status(404).json({ error: error.message })
        } else {
          res.status(400).json({ error: error.message })
        }
      }
    })

    // Reordenar tarefa (DEVE vir antes da rota genérica PUT /api/tasks/:id)
    this.app.put('/api/tasks/:id/reorder', async (req, res) => {
      try {
        const { position } = req.body
        
        if (typeof position !== 'number') {
          return res.status(400).json({ error: 'Position must be a number' })
        }
        
        const task = await this.taskStore.reorderTask(req.params.id, position)
        res.json(task)
      } catch (error) {
        if (error.message.includes('not found')) {
          res.status(404).json({ error: error.message })
        } else {
          res.status(400).json({ error: error.message })
        }
      }
    })

    // Completar tarefa (DEVE vir antes da rota genérica PUT /api/tasks/:id)
    this.app.post('/api/tasks/:id/complete', async (req, res) => {
      try {
        const task = await this.taskStore.completeTask(req.params.id)
        res.json({ id: req.params.id, ...task })
      } catch (error) {
        res.status(404).json({ error: error.message })
      }
    })
    
    // Atualizar tarefa (rota genérica deve vir DEPOIS das específicas)
    this.app.put('/api/tasks/:id', async (req, res) => {
      try {
        const task = await this.taskStore.updateTask(req.params.id, req.body)
        res.json({ id: req.params.id, ...task })
      } catch (error) {
        if (error.message.includes('not found')) {
          res.status(404).json({ error: error.message })
        } else {
          res.status(400).json({ error: error.message })
        }
      }
    })

    // Deletar tarefa
    this.app.delete('/api/tasks/:id', async (req, res) => {
      try {
        await this.taskStore.deleteTask(req.params.id)
        res.status(204).send()
      } catch (error) {
        res.status(404).json({ error: error.message })
      }
    })

    // Atualizar meta do projeto
    this.app.put('/api/project/meta', async (req, res) => {
      try {
        const meta = await this.taskStore.updateMeta(req.body)
        res.json({ meta })
      } catch (error) {
        res.status(400).json({ error: error.message })
      }
    })

    // Rota para servir informações do projeto
    this.app.get('/api/project', async (req, res) => {
      try {
        const tasks = await this.taskStore.listTasks()
        const data = await this.taskStore.read()
        const stats = {
          total: tasks.length,
          backlog: tasks.filter(t => t.status === 'backlog').length,
          active: tasks.filter(t => t.status === 'active').length,
          completed: tasks.filter(t => t.status === 'completed').length,
          byStatus: {},
          byCategory: {}
        }
        
        // Conta tarefas por status e categoria
        tasks.forEach(task => {
          stats.byStatus[task.status] = (stats.byStatus[task.status] || 0) + 1
          if (task.category) {
            stats.byCategory[task.category] = (stats.byCategory[task.category] || 0) + 1
          }
        })
        
        res.json({ 
          projectPath: this.taskStore.projectPath,
          meta: data.meta,
          stats 
        })
      } catch (error) {
        res.status(500).json({ error: error.message })
      }
    })

    // Server-Sent Events endpoint para notificar mudanças no arquivo
    this.app.get('/api/events', (req, res) => {
      // Configurar SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      })

      // Adicionar cliente à lista
      this.sseClients.add(res)
      console.log(`📡 SSE client connected. Total: ${this.sseClients.size}`)

      // Enviar heartbeat inicial
      res.write('data: {"type":"connected","message":"File watcher ready"}\n\n')

      // Remover cliente quando desconectar
      req.on('close', () => {
        this.sseClients.delete(res)
        console.log(`📡 SSE client disconnected. Total: ${this.sseClients.size}`)
      })
    })
  }

  setupFileWatcher() {
    const tasksFilePath = join(this.taskStore.projectPath, '.agent', 'tasks.json')
    
    console.log(`👁️  Setting up file watcher for: ${tasksFilePath}`)
    
    this.watcher = watch(tasksFilePath, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50
      }
    })

    this.watcher.on('change', (path) => {
      console.log(`📝 tasks.json changed: ${path}`)
      this.notifyClients({
        type: 'file_changed',
        file: 'tasks.json',
        timestamp: new Date().toISOString()
      })
    })

    this.watcher.on('error', (error) => {
      console.error('❌ File watcher error:', error)
    })
  }

  notifyClients(data) {
    const message = `data: ${JSON.stringify(data)}\n\n`
    
    // Notificar todos os clientes conectados
    for (const client of this.sseClients) {
      try {
        client.write(message)
      } catch (error) {
        // Remove cliente com erro
        this.sseClients.delete(client)
        console.log('📡 Removed disconnected SSE client')
      }
    }
    
    console.log(`📡 Notified ${this.sseClients.size} SSE clients`)
  }

  async start() {
    return new Promise(async (resolve) => {
      // 🔧 Normalizar orders antes de iniciar o servidor
      await this.taskStore.normalizeOrders()
      
      this.server = this.app.listen(this.port, () => {
        console.log(`🚀 Agent Workflow Server running at http://localhost:${this.port}`)
        console.log(`📁 Project path: ${this.taskStore.projectPath}`)
        console.log(`👁️  File watcher active for tasks.json`)
        resolve()
      })
    })
  }

  async stop() {
    return new Promise((resolve) => {
      // Fechar file watcher
      if (this.watcher) {
        this.watcher.close()
        console.log('👁️  File watcher stopped')
      }

      // Fechar todas as conexões SSE
      for (const client of this.sseClients) {
        try {
          client.end()
        } catch (error) {
          // Ignora erros ao fechar conexões
        }
      }
      this.sseClients.clear()

      if (this.server) {
        this.server.close(() => {
          console.log('Server stopped')
          resolve()
        })
      } else {
        resolve()
      }
    })
  }
}

// Executa se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new AgentWorkflowServer(process.env.PORT || 3000)
  server.start()
  
  // Graceful shutdown
  process.on('SIGTERM', async () => {
    await server.stop()
    process.exit(0)
  })
  
  process.on('SIGINT', async () => {
    await server.stop()
    process.exit(0)
  })
}

export default AgentWorkflowServer
