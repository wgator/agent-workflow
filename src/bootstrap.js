import { mkdir, copyFile, readdir } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import chalk from 'chalk'

const __dirname = dirname(fileURLToPath(import.meta.url))

class Bootstrap {
  constructor() {
    this.templatePath = join(dirname(__dirname), 'templates')
    this.targetPath = process.cwd()
  }

  async init() {
    console.log(chalk.blue('🚀 Inicializando Agent Workflow...\n'))
    
    try {
      // Cria estrutura de diretórios
      await this.createDirectories()
      
      // Copia templates
      await this.copyTemplates()
      
      console.log(chalk.green('\n✅ Agent Workflow inicializado com sucesso!'))
      console.log(chalk.gray('\nPróximos passos:'))
      console.log(chalk.gray('1. Configure o MCP no Claude Desktop'))
      console.log(chalk.gray('2. Edite seu BACKLOG.md'))
      console.log(chalk.gray('3. Execute: agent-workflow start'))
      
    } catch (error) {
      console.error(chalk.red('❌ Erro ao inicializar:'), error.message)
      process.exit(1)
    }
  }

  async createDirectories() {
    const dirs = [
      '.agent',
      '.agent/workspace',
      '.prompts'
    ]
    
    for (const dir of dirs) {
      const path = join(this.targetPath, dir)
      try {
        await mkdir(path, { recursive: true })
        console.log(chalk.green('✓'), chalk.gray(`Criado ${dir}`))
      } catch (error) {
        if (error.code !== 'EEXIST') throw error
        console.log(chalk.yellow('⚠'), chalk.gray(`${dir} já existe`))
      }
    }
  }

  async copyTemplates() {
    // Copia tasks.json
    const tasksSource = join(this.templatePath, 'agent', 'tasks.json')
    const tasksTarget = join(this.targetPath, '.agent', 'tasks.json')
    
    try {
      await copyFile(tasksSource, tasksTarget)
      console.log(chalk.green('✓'), chalk.gray('Criado .agent/tasks.json'))
    } catch (error) {
      if (error.code === 'EEXIST') {
        console.log(chalk.yellow('⚠'), chalk.gray('tasks.json já existe'))
      }
    }
    
    // Copia BACKLOG.md
    const backlogSource = join(this.templatePath, 'BACKLOG.md')
    const backlogTarget = join(this.targetPath, 'BACKLOG.md')
    
    try {
      await copyFile(backlogSource, backlogTarget)
      console.log(chalk.green('✓'), chalk.gray('Criado BACKLOG.md'))
    } catch (error) {
      if (error.code === 'EEXIST') {
        console.log(chalk.yellow('⚠'), chalk.gray('BACKLOG.md já existe'))
      }
    }
    
    // Copia prompts
    const promptsDir = join(this.templatePath, 'prompts')
    const promptFiles = await readdir(promptsDir)
    
    for (const file of promptFiles) {
      if (file.endsWith('.md')) {
        const source = join(promptsDir, file)
        const target = join(this.targetPath, '.prompts', file)
        
        try {
          await copyFile(source, target)
          console.log(chalk.green('✓'), chalk.gray(`Copiado .prompts/${file}`))
        } catch (error) {
          console.log(chalk.yellow('⚠'), chalk.gray(`${file} já existe`))
        }
      }
    }
  }
}

// Executa se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const bootstrap = new Bootstrap()
  bootstrap.init()
}

export default Bootstrap
