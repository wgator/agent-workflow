#!/usr/bin/env node

/**
 * Script de teste completo da API REST - v2 com estrutura unificada
 */

import chalk from 'chalk'

const BASE_URL = 'http://localhost:3000/api'

// Helper para fazer requests
async function request(method, path, data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  }
  
  if (data) {
    options.body = JSON.stringify(data)
  }
  
  try {
    const response = await fetch(`${BASE_URL}${path}`, options)
    const text = await response.text()
    
    let result = null
    try {
      result = JSON.parse(text)
    } catch {
      result = text
    }
    
    return {
      ok: response.ok,
      status: response.status,
      data: result
    }
  } catch (error) {
    return {
      ok: false,
      error: error.message
    }
  }
}

// Testes
async function runTests() {
  console.log(chalk.blue('🧪 Iniciando testes da API Agent Workflow v2\n'))
  
  let testsPassed = 0
  let testsFailed = 0
  
  async function test(name, fn) {
    try {
      await fn()
      console.log(chalk.green('✓'), name)
      testsPassed++
    } catch (error) {
      console.log(chalk.red('✗'), name)
      console.log(chalk.red('  →'), error.message)
      testsFailed++
    }
  }
  
  // 1. Health Check
  await test('GET /api/health', async () => {
    const res = await request('GET', '/health')
    if (!res.ok) throw new Error(`Status ${res.status}`)
    if (!res.data.status === 'ok') throw new Error('Status não é ok')
  })
  
  // 2. Project info
  await test('GET /api/project (info inicial)', async () => {
    const res = await request('GET', '/project')
    if (!res.ok) throw new Error(`Status ${res.status}`)
    if (!res.data.meta) throw new Error('Meta não encontrado')
    if (!res.data.stats) throw new Error('Stats não encontrado')
  })
  
  // 3. Criar tarefa no backlog
  await test('POST /api/tasks (criar no backlog)', async () => {
    const res = await request('POST', '/tasks', {
      id: 'storage-connection-pool',
      title: 'Implementar connection pool',
      category: 'Storage/Database',
      description: 'Singleton PostgreSQL com healthcheck'
    })
    if (!res.ok) throw new Error(`Status ${res.status}: ${JSON.stringify(res.data)}`)
    if (res.data.status !== 'backlog') throw new Error('Status inicial deve ser backlog')
    if (!res.data.created_at) throw new Error('created_at não definido')
  })
  
  // 4. Criar outra tarefa
  await test('POST /api/tasks (criar storage-post-repo)', async () => {
    const res = await request('POST', '/tasks', {
      id: 'storage-post-repo',
      title: 'Implementar PostRepository',
      category: 'Storage/Database',
      dependencies: ['storage-connection-pool']
    })
    if (!res.ok) throw new Error(`Status ${res.status}`)
  })
  
  // 5. Listar todas as tarefas
  await test('GET /api/tasks (deve ter 2 tarefas)', async () => {
    const res = await request('GET', '/tasks')
    if (!res.ok) throw new Error(`Status ${res.status}`)
    if (res.data.tasks.length !== 2) throw new Error(`Esperava 2 tarefas, encontrou ${res.data.tasks.length}`)
  })
  
  // 6. Filtrar por status
  await test('GET /api/tasks?status=backlog', async () => {
    const res = await request('GET', '/tasks?status=backlog')
    if (!res.ok) throw new Error(`Status ${res.status}`)
    if (res.data.tasks.length !== 2) throw new Error('Deve retornar 2 tarefas no backlog')
  })
  
  // 7. Ativar tarefa (simula PLAN selecionando)
  await test('PUT /api/tasks/:id (ativar tarefa)', async () => {
    const res = await request('PUT', '/tasks/storage-post-repo', {
      status: 'active'
    })
    if (!res.ok) throw new Error(`Status ${res.status}`)
    if (res.data.status !== 'active') throw new Error('Status não atualizado')
    if (!res.data.started_at) throw new Error('started_at não definido')
    if (res.data.phase !== 'plan') throw new Error('Fase inicial deve ser plan')
  })
  
  // 8. Atualizar fase (simula progresso)
  await test('PUT /api/tasks/:id (mudar para spec)', async () => {
    const res = await request('PUT', '/tasks/storage-post-repo', {
      phase: 'spec',
      notes: {
        plan: 'Priorizada por ser base',
        spec: 'Repository pattern'
      }
    })
    if (!res.ok) throw new Error(`Status ${res.status}`)
    if (res.data.phase !== 'spec') throw new Error('Fase não atualizada')
  })
  
  // 9. Adicionar arquivos
  await test('PUT /api/tasks/:id (adicionar arquivos)', async () => {
    const res = await request('PUT', '/tasks/storage-post-repo', {
      phase: 'implementation',
      files: {
        planned: ['src/repositories/postRepository.js'],
        created: ['src/repositories/baseRepository.js', 'src/repositories/postRepository.js'],
        modified: [],
        tested: []
      }
    })
    if (!res.ok) throw new Error(`Status ${res.status}`)
    if (res.data.files.created.length !== 2) throw new Error('Arquivos não salvos')
  })
  
  // 10. Completar tarefa
  await test('POST /api/tasks/:id/complete', async () => {
    const res = await request('POST', '/tasks/storage-post-repo/complete')
    if (!res.ok) throw new Error(`Status ${res.status}`)
    if (res.data.status !== 'completed') throw new Error('Status deve ser completed')
    if (!res.data.completed_at) throw new Error('completed_at não definido')
  })
  
  // 11. Verificar estatísticas
  await test('GET /api/project (stats atualizadas)', async () => {
    const res = await request('GET', '/project')
    if (!res.ok) throw new Error(`Status ${res.status}`)
    if (res.data.stats.total !== 2) throw new Error('Total incorreto')
    if (res.data.stats.completed !== 1) throw new Error('Completed incorreto')
    if (res.data.stats.backlog !== 1) throw new Error('Backlog incorreto')
  })
  
  // 12. Atualizar meta do projeto
  await test('PUT /api/project/meta', async () => {
    const res = await request('PUT', '/project/meta', {
      focus: 'Pipeline de coleta implementado'
    })
    if (!res.ok) throw new Error(`Status ${res.status}`)
    if (res.data.meta.focus !== 'Pipeline de coleta implementado') throw new Error('Meta não atualizada')
  })
  
  // 13. Filtrar por categoria
  await test('GET /api/tasks?category=Storage/Database', async () => {
    const res = await request('GET', '/tasks?category=Storage/Database')
    if (!res.ok) throw new Error(`Status ${res.status}`)
    if (res.data.tasks.length !== 2) throw new Error('Deve retornar 2 tarefas da categoria')
  })
  
  // 14. Tentar criar tarefa duplicada
  await test('POST /api/tasks (erro: ID duplicado)', async () => {
    const res = await request('POST', '/tasks', {
      id: 'storage-post-repo',
      title: 'Duplicada'
    })
    if (res.ok) throw new Error('Deveria falhar com ID duplicado')
    if (res.status !== 400) throw new Error(`Status incorreto: ${res.status}`)
  })
  
  // 15. Deletar tarefa
  await test('DELETE /api/tasks/:id', async () => {
    const res = await request('DELETE', '/tasks/storage-connection-pool')
    if (!res.ok) throw new Error(`Status ${res.status}`)
    if (res.status !== 204) throw new Error('Deve retornar 204 No Content')
  })
  
  // 16. Verificar que foi deletada
  await test('GET /api/tasks (deve ter 1 tarefa após delete)', async () => {
    const res = await request('GET', '/tasks')
    if (!res.ok) throw new Error(`Status ${res.status}`)
    if (res.data.tasks.length !== 1) throw new Error(`Esperava 1 tarefa, encontrou ${res.data.tasks.length}`)
  })
  
  // Resumo
  console.log('\n' + chalk.blue('📊 Resumo dos Testes'))
  console.log(chalk.green(`✓ Passou: ${testsPassed}`))
  if (testsFailed > 0) {
    console.log(chalk.red(`✗ Falhou: ${testsFailed}`))
    process.exit(1)
  } else {
    console.log(chalk.green('\n🎉 Todos os testes passaram!'))
  }
}

// Verificar se servidor está rodando
async function checkServer() {
  try {
    const res = await fetch(`${BASE_URL}/health`)
    if (!res.ok) throw new Error()
  } catch {
    console.error(chalk.red('❌ Servidor não está rodando!'))
    console.log(chalk.gray('Execute: agent-workflow start'))
    process.exit(1)
  }
}

// Executar
async function main() {
  await checkServer()
  await runTests()
}

main().catch(console.error)
