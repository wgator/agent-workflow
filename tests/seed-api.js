#!/usr/bin/env node

/**
 * Script para popular tasks via API
 */

import chalk from 'chalk'

const BASE_URL = 'http://localhost:3000/api'

// Helper para requests
async function request(method, path, data = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  }
  
  if (data) options.body = JSON.stringify(data)
  
  const response = await fetch(`${BASE_URL}${path}`, options)
  
  if (!response.ok && response.status !== 204) {
    const error = await response.text()
    throw new Error(`${method} ${path} failed: ${response.status} - ${error}`)
  }
  
  return response.status === 204 ? null : response.json()
}

// Limpar dados existentes
async function clearAllTasks() {
  console.log(chalk.gray('Limpando dados existentes...'))
  
  const { tasks } = await request('GET', '/tasks')
  
  for (const task of tasks) {
    await request('DELETE', `/tasks/${task.id}`)
  }
  
  console.log(chalk.gray(`  Removidas ${tasks.length} tarefas\n`))
}

// Criar e configurar tarefas
async function seed() {
  console.log(chalk.blue('🌱 Populando via API...\n'))
  
  try {
    // 1. Verificar se servidor está rodando
    await request('GET', '/health')
    
    // 2. Limpar dados
    await clearAllTasks()
    
    // 3. Atualizar meta do projeto
    await request('PUT', '/project/meta', {
      focus: 'Implementar pipeline básico de ETL com coleta, processamento e API'
    })
    
    // 4. Criar tarefas COMPLETADAS
    console.log(chalk.gray('Criando tarefas completadas...'))
    
    // Setup inicial
    await request('POST', '/tasks', {
      id: 'config-initial',
      title: 'Setup inicial do projeto',
      category: 'Setup',
      description: 'Configurar estrutura base, ESLint, Jest'
    })
    await request('PUT', '/tasks/config-initial', { status: 'active' })
    await request('POST', '/tasks/config-initial/complete')
    
    // Connection pool
    await request('POST', '/tasks', {
      id: 'storage-connection-pool',
      title: 'Implementar connection pool PostgreSQL',
      category: 'Storage/Database',
      description: 'Singleton com healthcheck e retry'
    })
    await request('PUT', '/tasks/storage-connection-pool', { status: 'active' })
    await request('PUT', '/tasks/storage-connection-pool', {
      phase: 'implementation',
      files: {
        created: ['src/storage/database/connection.js', 'tests/storage/connection.test.js'],
        tested: ['src/storage/database/connection.js']
      }
    })
    await request('POST', '/tasks/storage-connection-pool/complete')
    
    // Logger
    await request('POST', '/tasks', {
      id: 'utils-logger',
      title: 'Sistema de logging estruturado',
      category: 'Utils',
      description: 'Winston com níveis e formatação JSON'
    })
    await request('PUT', '/tasks/utils-logger', { status: 'active' })
    await request('POST', '/tasks/utils-logger/complete')
    
    // 5. Criar tarefas ATIVAS
    console.log(chalk.gray('Criando tarefas ativas...'))
    
    // PostRepository - em implementation
    await request('POST', '/tasks', {
      id: 'storage-post-repo',
      title: 'Implementar PostRepository',
      category: 'Storage/Repositories',
      description: 'CRUD com deduplicação e queries analíticas. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      dependencies: ['storage-connection-pool']
    })
    await request('PUT', '/tasks/storage-post-repo', {
      status: 'active',
      phase: 'implementation',
      files: {
        planned: ['src/repositories/PostRepository.js', 'src/repositories/base/BaseRepository.js'],
        created: ['src/repositories/base/BaseRepository.js']
      },
      notes: {
        plan: 'Base crítica para todo o sistema',
        spec: 'Repository pattern com TimescaleDB',
        detail: 'Criar base class primeiro',
        implementation: 'BaseRepository pronto, falta PostRepository'
      }
    })
    
    // QueueManager - em test
    await request('POST', '/tasks', {
      id: 'queue-manager',
      title: 'Implementar QueueManager para SQS',
      category: 'Queue/Core',
      description: 'Abstração sobre AWS SQS com retry e DLQ'
    })
    await request('PUT', '/tasks/queue-manager', {
      status: 'active',
      phase: 'test',
      files: {
        created: ['src/queue/QueueManager.js', 'src/queue/messageFormats.js'],
        tested: ['src/queue/messageFormats.js']
      },
      notes: {
        plan: 'Core do sistema de filas',
        spec: 'Abstrair SQS com interface simples',
        implementation: 'Implementado com retry logic',
        test: 'Faltam testes de integração com SQS'
      }
    })
    
    // API Health - em spec
    await request('POST', '/tasks', {
      id: 'api-health',
      title: 'Endpoints de health e status',
      category: 'API/Monitoring',
      description: 'Health checks para K8s e monitoramento'
    })
    await request('PUT', '/tasks/api-health', {
      status: 'active',
      phase: 'spec',
      notes: {
        plan: 'Necessário para deploy',
        spec: 'Incluir checks de DB e Redis'
      }
    })
    
    // 6. Criar BACKLOG
    console.log(chalk.gray('Criando backlog...'))
    
    const backlogTasks = [
      {
        id: 'queue-loader-consumer',
        title: 'Implementar LoaderConsumer',
        category: 'Queue/Consumers',
        description: 'Consumir fila raw-data e salvar no banco',
        dependencies: ['storage-post-repo', 'queue-manager']
      },
      {
        id: 'collector-twitter',
        title: 'Adapter para Twitter/X via Apify',
        category: 'Collectors/Adapters',
        description: 'Integração com Apify para coleta de tweets',
        dependencies: ['queue-manager']
      },
      {
        id: 'core-scheduler',
        title: 'Scheduler para coletas periódicas',
        category: 'Core/Orchestration',
        description: 'Cron jobs distribuídos por projeto',
        dependencies: ['collector-twitter', 'queue-loader-consumer']
      },
      {
        id: 'middleware-sentiment',
        title: 'Middleware de análise de sentimento',
        category: 'Middlewares/NLP',
        description: 'Integração com API de sentiment analysis'
      },
      {
        id: 'api-analytics',
        title: 'API de analytics com agregações',
        category: 'API/Analytics',
        description: 'Endpoints para dashboards com cache Redis',
        dependencies: ['storage-post-repo']
      },
      {
        id: 'collector-instagram',
        title: 'Adapter para Instagram',
        category: 'Collectors/Adapters',
        description: 'Coleta via Apify com rate limit específico'
      },
      {
        id: 'storage-migrations',
        title: 'Sistema de migrations para DB',
        category: 'Storage/Database',
        description: 'Versionamento de schema com rollback'
      },
      {
        id: 'monitoring-grafana',
        title: 'Dashboards Grafana + Prometheus',
        category: 'Monitoring',
        description: 'Métricas de coleta, filas e performance'
      }
    ]
    
    for (const task of backlogTasks) {
      await request('POST', '/tasks', task)
    }
    
    // 7. Buscar estatísticas finais
    const project = await request('GET', '/project')
    
    console.log(chalk.green('\n✅ Seed concluído!\n'))
    console.log(chalk.blue('📊 Resumo:'))
    console.log(chalk.gray(`   Total: ${project.stats.total} tarefas`))
    console.log(chalk.green(`   Completadas: ${project.stats.completed}`))
    console.log(chalk.yellow(`   Ativas: ${project.stats.active}`))
    console.log(chalk.blue(`   Backlog: ${project.stats.backlog}`))
    
    console.log(chalk.gray('\n📁 Categorias:'))
    for (const [cat, count] of Object.entries(project.stats.byCategory)) {
      console.log(chalk.gray(`   ${cat}: ${count}`))
    }
    
    console.log(chalk.gray(`\n📌 Foco: ${project.meta.focus}`))
    
  } catch (error) {
    console.error(chalk.red('❌ Erro:'), error.message)
    console.log(chalk.gray('\nVerifique se o servidor está rodando: agent-workflow start'))
    process.exit(1)
  }
}

// Executar
seed()
