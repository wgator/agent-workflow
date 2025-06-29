<script>
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'

const { loadModule } = window['vue3-sfc-loader']

// Opções para carregar componentes
const options = {
  moduleCache: { vue: Vue },
  async getFile(url) {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`${res.statusText} (${url})`)
    return await res.text()
  },
  addStyle(textContent) {
    const style = Object.assign(document.createElement('style'), { textContent })
    const ref = document.head.getElementsByTagName('style')[0] || null
    document.head.insertBefore(style, ref)
  }
}

export default {
  components: {
    BacklogView: defineAsyncComponent(() => loadModule('./src/views/BacklogView.vue', options)),
    KanbanView: defineAsyncComponent(() => loadModule('./src/views/KanbanView.vue', options)),
    StatsCard: defineAsyncComponent(() => loadModule('./src/components/StatsCard.vue', options))
  },
  
  setup() {
    // State
    const loading = ref(false)
    const activeView = ref('0')
    const tasks = ref([])
    const projectMeta = ref({ focus: 'Carregando...' })
    const toasts = ref([])

    // Computed
    const stats = computed(() => {
      const taskList = tasks.value
      return {
        total: taskList.length,
        active: taskList.filter(t => t.status === 'active').length,
        completed: taskList.filter(t => t.status === 'completed').length,
        backlog: taskList.filter(t => t.status === 'backlog').length
      }
    })

    // Toast helper
    function showToast(severity, summary, detail) {
      const toast = {
        id: Date.now(),
        severity,
        summary,
        detail
      }
      toasts.value.push(toast)
      setTimeout(() => {
        toasts.value = toasts.value.filter(t => t.id !== toast.id)
      }, 3000)
    }

    // Methods
    async function loadData() {
      loading.value = true
      try {
        // Load tasks
        const tasksRes = await fetch('/api/tasks')
        const tasksData = await tasksRes.json()
        tasks.value = tasksData.tasks
        
        // Load project info
        const projectRes = await fetch('/api/project')
        const projectData = await projectRes.json()
        projectMeta.value = projectData.meta
        
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        showToast('error', 'Erro', 'Não foi possível carregar os dados')
      } finally {
        loading.value = false
      }
    }

    async function updateTask(taskId, updates) {
      try {
        const res = await fetch(`/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        })
        
        if (!res.ok) throw new Error('Falha ao atualizar')
        
        const updatedTask = await res.json()
        
        // 📝 Atualizar apenas a task específica no estado local
        const taskIndex = tasks.value.findIndex(t => t.id === taskId)
        if (taskIndex !== -1) {
          // Manter o ID e fazer merge dos updates
          tasks.value[taskIndex] = { ...tasks.value[taskIndex], ...updatedTask }
        } else {
          // Se não encontrar, recarregar tudo (fallback)
          await loadData()
        }
        
        showToast('success', 'Sucesso', 'Tarefa atualizada')
      } catch (error) {
        console.error('Erro ao atualizar tarefa:', error)
        showToast('error', 'Erro', 'Não foi possível atualizar a tarefa')
      }
    }

    async function deleteTask(taskId) {
      try {
        const res = await fetch(`/api/tasks/${taskId}`, {
          method: 'DELETE'
        })
        
        if (!res.ok) throw new Error('Falha ao deletar')
        
        await loadData()
        showToast('success', 'Sucesso', 'Tarefa removida')
      } catch (error) {
        console.error('Erro ao deletar tarefa:', error)
        showToast('error', 'Erro', 'Não foi possível remover a tarefa')
      }
    }

    // Lifecycle
    onMounted(() => {
      loadData()
    })
    
    return {
      loading,
      activeView,
      tasks,
      projectMeta,
      stats,
      toasts,
      loadData,
      updateTask,
      deleteTask,
      showToast
    }
  }
}
</script>

<template>
  <div class="app-container">
    <!-- Navbar -->
    <header class="navbar">
      <div class="navbar-brand">
        <i class="pi pi-th-large"></i>
        Agent Workflow
      </div>
      <div class="navbar-info">
        <span class="project-focus">{{ projectMeta.focus }}</span>
        <p-button 
          icon="pi pi-refresh" 
          class="p-button-text p-button-sm"
          @click="loadData"
          :loading="loading"
        />
      </div>
    </header>
    
    <!-- Main Content -->
    <main class="main-content">
      <!-- Stats Cards -->
      <div class="stats-grid">
        <StatsCard 
          label="Backlog" 
          :value="stats.backlog" 
          color="#6366f1" 
        />
        <StatsCard 
          label="Em Progresso" 
          :value="stats.active" 
          color="#f59e0b" 
        />
        <StatsCard 
          label="Concluídas" 
          :value="stats.completed" 
          color="#10b981" 
        />
        <StatsCard 
          label="Total de Tarefas" 
          :value="stats.total" 
          color="#6b7280" 
        />
      </div>
      
      <!-- PrimeVue Tabs -->
      <p-tabs v-model:value="activeView">
        <p-tablist>
          <p-tab value="0">
            <i class="pi pi-list"></i>
            Backlog
          </p-tab>
          <p-tab value="1">
            <i class="pi pi-th-large"></i>
            Kanban
          </p-tab>
        </p-tablist>
        
        <p-tabpanels>
          <p-tabpanel value="0">
            <BacklogView 
              :tasks="tasks"
              :loading="loading"
              @update-task="updateTask"
              @delete-task="deleteTask"
            />
          </p-tabpanel>
          
          <p-tabpanel value="1">
            <KanbanView 
              :tasks="tasks"
              @update-task="updateTask"
              @delete-task="deleteTask"
            />
          </p-tabpanel>
        </p-tabpanels>
      </p-tabs>
    </main>
    
    <!-- Simple Toast -->
    <div class="toast-container">
      <div v-for="toast in toasts" :key="toast.id" class="toast" :class="`toast-${toast.severity}`">
        <strong>{{ toast.summary }}</strong>
        <p>{{ toast.detail }}</p>
      </div>
    </div>
  </div>
</template>

<style>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.navbar-brand {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.navbar-brand i {
  color: #3b82f6;
}

.navbar-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.project-focus {
  color: #64748b;
  font-size: 0.875rem;
}

.main-content {
  flex: 1;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

/* Espaçamento dos ícones nas abas */
:deep(.p-tab i) {
  margin-right: 0.5rem;
}

/* Toast Styles */
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toast {
  padding: 1rem;
  border-radius: 8px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 300px;
  animation: slideIn 0.3s ease;
}

.toast-success {
  border-left: 4px solid #10b981;
}

.toast-error {
  border-left: 4px solid #ef4444;
}

.toast-info {
  border-left: 4px solid #3b82f6;
}

.toast strong {
  display: block;
  margin-bottom: 0.25rem;
}

.toast p {
  margin: 0;
  color: #64748b;
  font-size: 0.875rem;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>