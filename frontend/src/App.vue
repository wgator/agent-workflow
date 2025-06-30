<script setup>
import { ref, onMounted } from 'vue'
import BacklogView from './views/BacklogView.vue'
import KanbanView from './views/KanbanView.vue'
import ProjectStatsCard from './components/ProjectStatsCard.vue'

// State
const loading = ref(false)
const activeView = ref('0')
const tasks = ref([])
const projectMeta = ref({ focus: 'Carregando...' })
const projectInfo = ref({ name: 'Agent Workflow', description: '' })
const toasts = ref([])

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
    if (projectData.meta.name) {
      projectInfo.value.name = projectData.meta.name
      projectInfo.value.description = projectData.meta.description || ''
    }
    
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
    
    // Atualizar apenas a task específica no estado local
    const taskIndex = tasks.value.findIndex(t => t.id === taskId)
    if (taskIndex !== -1) {
      tasks.value[taskIndex] = { ...tasks.value[taskIndex], ...updatedTask }
    } else {
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
</script>

<template>
  <div class="app-container">
    <!-- Navbar -->
    <header class="navbar">
      <div class="navbar-left">
        <div class="navbar-brand">
          <i class="pi pi-sitemap"></i>
          <div class="project-name">
            {{ projectInfo.name }}
            <div class="project-description" v-if="projectInfo.description">
              {{ projectInfo.description }}
            </div>            
          </div>
        </div>

      </div>
      <div class="navbar-info">
        <span class="project-focus">
          <i class="pi pi-bolt"></i>
          {{ projectMeta.focus }}
        </span>
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
      <ProjectStatsCard :tasks="tasks" />
      
      <!-- Tabs -->
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
    
    <!-- Toast -->
    <div class="toast-container">
      <div v-for="toast in toasts" :key="toast.id" class="toast" :class="`toast-${toast.severity}`">
        <strong>{{ toast.summary }}</strong>
        <p>{{ toast.detail }}</p>
      </div>
    </div>
  </div>
</template>

<style>

#app {
  display: flex;
  width: 100%!important;
  max-width: 100%!important;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  width: 100%;
}

.navbar {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.navbar-left {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.navbar-brand i {
  color: #3b82f6;
  font-size: 1.8em
}

.project-name {
  font-size: 1.3rem;
  font-weight: 800;
  line-height: 1em;
  color: #1e293b;
}

.project-description {
  color: #64748b;
  font-size: 0.85rem;
  font-weight: 300;
}

.navbar-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.project-focus {
  color: #475569;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: #f1f5f9;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
}

.project-focus i {
  color: #f59e0b;
  font-size: 0.75rem;
}

.main-content {
  flex: 1;
  padding: 2rem;
  margin: 0 auto;
  width: 100%;
  max-width: 100%;
}

:deep(.p-tab i) {
  margin-right: 0.5rem;
}

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