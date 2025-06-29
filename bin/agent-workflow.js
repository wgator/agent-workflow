#!/usr/bin/env node

import { Command } from 'commander'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { spawn } from 'child_process'
import chalk from 'chalk'
import Bootstrap from '../src/bootstrap.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packagePath = join(dirname(__dirname), 'package.json')

// Lê versão do package.json
import { readFileSync } from 'fs'
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'))

const program = new Command()

program
  .name('agent-workflow')
  .description('Sistema de workflow para agentes Claude')
  .version(packageJson.version)

// Comando init
program
  .command('init')
  .description('Inicializa agent-workflow no projeto atual')
  .action(async () => {
    const bootstrap = new Bootstrap()
    await bootstrap.init()
  })

// Comando start
program
  .command('start')
  .description('Inicia o servidor do dashboard')
  .option('-p, --port <port>', 'porta do servidor', '3000')
  .action((options) => {
    console.log(chalk.blue('🚀 Iniciando Agent Workflow Server...\n'))
    
    const serverPath = join(dirname(__dirname), 'src', 'server.js')
    const child = spawn('node', [serverPath], {
      stdio: 'inherit',
      env: { ...process.env, PORT: options.port }
    })
    
    child.on('error', (error) => {
      console.error(chalk.red('❌ Erro ao iniciar servidor:'), error.message)
      process.exit(1)
    })
  })

// Comando status
program
  .command('status')
  .description('Mostra status das tarefas do projeto')
  .action(async () => {
    try {
      const { default: TaskStore } = await import('../src/lib/taskStore.js')
      const store = new TaskStore()
      const tasks = await store.listTasks()
      
      console.log(chalk.blue('\n📊 Status do Projeto\n'))
      
      if (tasks.length === 0) {
        console.log(chalk.gray('Nenhuma tarefa encontrada.'))
        return
      }
      
      const backlog = tasks.filter(t => t.status === 'backlog')
      const active = tasks.filter(t => t.status === 'active')
      const completed = tasks.filter(t => t.status === 'completed')
      
      console.log(chalk.blue(`📋 Backlog: ${backlog.length}`))
      console.log(chalk.yellow(`🚧 Em progresso: ${active.length}`))
      console.log(chalk.green(`✅ Concluídas: ${completed.length}`))
      console.log(chalk.gray(`📊 Total: ${tasks.length}`))
      
      if (active.length > 0) {
        console.log(chalk.blue('\n🚧 Tarefas Ativas:\n'))
        active.forEach(task => {
          console.log(`  • ${chalk.bold(task.id)} - ${task.title}`)
          console.log(`    Fase: ${chalk.yellow(task.phase || 'plan')} | Categoria: ${task.category || 'sem categoria'}`)
        })
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Erro ao ler tarefas:'), error.message)
      process.exit(1)
    }
  })

program.parse()
