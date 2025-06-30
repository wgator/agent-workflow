import { mkdir, copyFile, readdir, writeFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import chalk from 'chalk'
import inquirer from 'inquirer'

const __dirname = dirname(fileURLToPath(import.meta.url))

class Bootstrap {
  constructor() {
    this.templatePath = join(dirname(__dirname), 'templates')
    this.targetPath = process.cwd()
  }

  async init() {
    console.log(chalk.blue('🚀 Inicializando Agent Workflow...\n'))
    
    try {
      // Coleta informações do projeto
      const projectInfo = await this.promptProjectInfo()
      
      // Cria estrutura de diretórios
      await this.createDirectories()
      
      // Copia templates com informações do projeto
      await this.copyTemplates(projectInfo)
      
      console.log(chalk.green('\n✅ Agent Workflow inicializado com sucesso!'))
      console.log(chalk.gray('\nPróximos passos:'))
      console.log(chalk.gray('1. Configure o MCP no Claude Desktop'))
      console.log(chalk.gray('2. Execute: agent-workflow start'))
      console.log(chalk.gray('3. Crie suas primeiras tarefas no dashboard'))
      
    } catch (error) {
      console.error(chalk.red('❌ Erro ao inicializar:'), error.message)
      process.exit(1)
    }
  }

  async promptProjectInfo() {
    console.log(chalk.cyan('📝 Vamos configurar seu projeto:\n'))
    
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Nome do projeto:',
        default: process.cwd().split('/').pop(),
        validate: (input) => input.length > 0 || 'Por favor, forneça um nome para o projeto'
      },
      {
        type: 'input',
        name: 'description',
        message: 'Descrição breve do projeto:',
        default: 'Projeto gerenciado com Agent Workflow'
      }
    ])
    
    return answers
  }

  async createDirectories() {
    const dirs = [
      '.agent',
      '.agent/workspace',
      '.agent/templates',
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

  async copyTemplates(projectInfo) {
    // Cria tasks.json com informações do projeto
    const tasksTarget = join(this.targetPath, '.agent', 'tasks.json')
    
    const tasksContent = {
      meta: {
        name: projectInfo.name,
        description: projectInfo.description,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        focus: 'Início do projeto'
      },
      tasks: {}
    }
    
    try {
      await writeFile(tasksTarget, JSON.stringify(tasksContent, null, 2))
      console.log(chalk.green('✓'), chalk.gray('Criado .agent/tasks.json com informações do projeto'))
    } catch (error) {
      if (error.code === 'EEXIST') {
        console.log(chalk.yellow('⚠'), chalk.gray('tasks.json já existe'))
      }
    }
    
    // Copia progress template
    const progressSource = join(this.templatePath, 'agent', 'templates', 'progress-template.md')
    const progressTarget = join(this.targetPath, '.agent', 'templates', 'progress-template.md')
    
    try {
      await copyFile(progressSource, progressTarget)
      console.log(chalk.green('✓'), chalk.gray('Criado .agent/templates/progress-template.md'))
    } catch (error) {
      if (error.code === 'EEXIST') {
        console.log(chalk.yellow('⚠'), chalk.gray('progress-template.md já existe'))
      }
    }
    
    // Copia AGENT_WORKFLOW.md
    const workflowSource = join(this.templatePath, 'AGENT_WORKFLOW.md')
    const workflowTarget = join(this.targetPath, '.prompts', 'AGENT_WORKFLOW.md')
    
    try {
      await copyFile(workflowSource, workflowTarget)
      console.log(chalk.green('✓'), chalk.gray('Criado .prompts/AGENT_WORKFLOW.md'))
    } catch (error) {
      if (error.code === 'EEXIST') {
        console.log(chalk.yellow('⚠'), chalk.gray('AGENT_WORKFLOW.md já existe'))
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
