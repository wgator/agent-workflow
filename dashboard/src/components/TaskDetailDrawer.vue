<script>
import { ref, watch } from 'vue'

export default {
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    taskId: {
      type: String,
      default: null
    }
  },
  
  emits: ['update:visible', 'update-task', 'delete-task'],
  
  setup(props, { emit }) {
    const taskDetails = ref(null)
    const loadingDetails = ref(false)
    
    // Watch for taskId changes to load details
    watch(() => props.taskId, async (newTaskId) => {
      if (newTaskId) {
        await loadTaskDetails(newTaskId)
      } else {
        taskDetails.value = null
      }
    }, { immediate: true })
    
    // Methods
    async function loadTaskDetails(taskId) {
      if (!taskId) return
      
      loadingDetails.value = true
      try {
        const response = await fetch(`/api/tasks/${taskId}`)
        if (response.ok) {
          taskDetails.value = await response.json()
        } else {
          // Fallback para dados básicos se endpoint não existir
          console.warn('Endpoint /api/tasks/:id não encontrado, usando dados básicos')
          taskDetails.value = { id: taskId }
        }
      } catch (error) {
        console.warn('Erro ao carregar detalhes:', error)
        taskDetails.value = { id: taskId }
      } finally {
        loadingDetails.value = false
      }
    }
    
    function closeDrawer() {
      emit('update:visible', false)
    }
    
    function updateTask(taskId, updates) {
      emit('update-task', taskId, updates)
      // Atualizar dados locais
      if (taskDetails.value) {
        Object.assign(taskDetails.value, updates)
      }
    }
    
    function deleteTask(taskId) {
      emit('delete-task', taskId)
      closeDrawer()
    }
    
    // Helper methods
    function getStatusSeverity(status) {
      const severityMap = {
        'backlog': 'info',
        'active': 'warning', 
        'completed': 'success'
      }
      return severityMap[status] || 'info'
    }
    
    function getPhaseColor(phase) {
      const colors = {
        plan: '#3b82f6',
        spec: '#8b5cf6',
        detail: '#ec4899',
        implementation: '#f59e0b',
        test: '#10b981',
        review: '#06b6d4'
      }
      return colors[phase] || '#6b7280'
    }
    
    function formatDate(dateString) {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleDateString('pt-BR')
    }
    
    return {
      taskDetails,
      loadingDetails,
      closeDrawer,
      updateTask,
      deleteTask,
      getStatusSeverity,
      getPhaseColor,
      formatDate
    }
  }
}
</script>

<template>
  <p-drawer 
    v-model:visible="visible"
    position="right"
    class="task-drawer"
    :modal="false"
    :dismissable="true"
  >
    <template #header>
      <div class="drawer-header">
        <div class="header-content">
          <h3>{{ taskDetails?.title || 'Detalhes da Tarefa' }}</h3>
          <p-button 
            icon="pi pi-times" 
            class="p-button-text p-button-rounded p-button-sm"
            @click="closeDrawer"
          />
        </div>
      </div>
    </template>
    
    <div v-if="loadingDetails" class="loading-state">
      <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
      <p>Carregando detalhes...</p>
    </div>
    
    <div v-else-if="taskDetails" class="task-details">
      <!-- Task Overview Card -->
      <p-card class="overview-card">
        <template #content>
          <div class="task-overview">
            <div class="overview-item">
              <span class="label">ID:</span>
              <code class="task-id">{{ taskDetails.id }}</code>
            </div>
            <div class="overview-item">
              <span class="label">Status:</span>
              <p-tag 
                :value="taskDetails.status" 
                :severity="getStatusSeverity(taskDetails.status)"
              />
            </div>
            <div class="overview-item" v-if="taskDetails.phase">
              <span class="label">Fase:</span>
              <span class="phase-badge" :style="{ backgroundColor: getPhaseColor(taskDetails.phase) }">
                {{ taskDetails.phase }}
              </span>
            </div>
          </div>
        </template>
      </p-card>
      
      <!-- Description -->
      <p-card class="section-card">
        <template #title>
          <i class="pi pi-file-text"></i> Descrição
        </template>
        <template #content>
          <p class="description-text">{{ taskDetails.description || 'Nenhuma descrição fornecida' }}</p>
        </template>
      </p-card>
      
      <!-- Metadata -->
      <p-card class="section-card">
        <template #title>
          <i class="pi pi-info-circle"></i> Metadados
        </template>
        <template #content>
          <div class="metadata-grid">
            <div class="meta-item">
              <label>Categoria:</label>
              <p-tag :value="taskDetails.category || 'Sem categoria'" />
            </div>
            <div class="meta-item">
              <label>Prioridade:</label>
              <span>{{ taskDetails.priority || 'Normal' }}</span>
            </div>
            <div class="meta-item">
              <label>Estimativa:</label>
              <span>{{ taskDetails.estimated_hours ? `${taskDetails.estimated_hours}h` : 'N/A' }}</span>
            </div>
            <div class="meta-item">
              <label>Assignee:</label>
              <span>{{ taskDetails.assignee || 'Não atribuído' }}</span>
            </div>
            <div class="meta-item">
              <label>Due Date:</label>
              <span>{{ taskDetails.due_date ? formatDate(taskDetails.due_date) : 'N/A' }}</span>
            </div>
            <div class="meta-item">
              <label>Criada em:</label>
              <span>{{ formatDate(taskDetails.created_at) }}</span>
            </div>
            <div class="meta-item">
              <label>Atualizada em:</label>
              <span>{{ formatDate(taskDetails.updated_at) }}</span>
            </div>
          </div>
        </template>
      </p-card>
      
      <!-- Dependencies -->
      <p-card v-if="taskDetails.dependencies?.length || taskDetails.blocked_by?.length" class="section-card">
        <template #title>
          <i class="pi pi-link"></i> Dependências
        </template>
        <template #content>
          <div v-if="taskDetails.dependencies?.length" class="dependency-section">
            <h5>Bloqueia:</h5>
            <div class="dependency-tags">
              <p-tag v-for="dep in taskDetails.dependencies" :key="dep" :value="dep" severity="warning" />
            </div>
          </div>
          <div v-if="taskDetails.blocked_by?.length" class="dependency-section">
            <h5>Bloqueada por:</h5>
            <div class="dependency-tags">
              <p-tag v-for="blocker in taskDetails.blocked_by" :key="blocker" :value="blocker" severity="danger" />
            </div>
          </div>
        </template>
      </p-card>
      
      <!-- Labels/Tags -->
      <p-card v-if="taskDetails.labels?.length" class="section-card">
        <template #title>
          <i class="pi pi-tags"></i> Labels
        </template>
        <template #content>
          <div class="labels-container">
            <p-tag v-for="label in taskDetails.labels" :key="label" :value="label" class="label-tag" />
          </div>
        </template>
      </p-card>
      
      <!-- Actions Section -->
      <p-card class="actions-card">
        <template #title>
          <i class="pi pi-cog"></i> Ações
        </template>
        <template #content>
          <!-- Status Management -->
          <div class="action-section">
            <h5>Alterar Status</h5>
            <div class="action-buttons">
              <p-button 
                v-if="taskDetails.status === 'backlog'"
                label="Ativar Tarefa" 
                icon="pi pi-play" 
                class="p-button-success action-btn"
                @click="updateTask(taskDetails.id, { status: 'active' })"
              />
              <p-button 
                v-if="taskDetails.status === 'active'"
                label="Completar" 
                icon="pi pi-check" 
                class="p-button-info action-btn"
                @click="updateTask(taskDetails.id, { status: 'completed' })"
              />
              <p-button 
                v-if="taskDetails.status === 'active'"
                label="Voltar para Backlog" 
                icon="pi pi-arrow-left" 
                class="p-button-secondary action-btn"
                @click="updateTask(taskDetails.id, { status: 'backlog' })"
              />
              <p-button 
                v-if="taskDetails.status === 'completed'"
                label="Reativar" 
                icon="pi pi-refresh" 
                class="p-button-warning action-btn"
                @click="updateTask(taskDetails.id, { status: 'active' })"
              />
            </div>
          </div>
          
          <!-- Phase Management -->
          <div v-if="taskDetails.status === 'active'" class="action-section">
            <h5>Definir Fase</h5>
            <div class="phase-grid">
              <p-button 
                label="Plan" 
                class="phase-btn"
                :class="{ 'p-button-outlined': taskDetails.phase !== 'plan' }"
                @click="updateTask(taskDetails.id, { phase: 'plan' })"
              />
              <p-button 
                label="Spec" 
                class="phase-btn"
                :class="{ 'p-button-outlined': taskDetails.phase !== 'spec' }"
                @click="updateTask(taskDetails.id, { phase: 'spec' })"
              />
              <p-button 
                label="Implement" 
                class="phase-btn"
                :class="{ 'p-button-outlined': taskDetails.phase !== 'implementation' }"
                @click="updateTask(taskDetails.id, { phase: 'implementation' })"
              />
              <p-button 
                label="Test" 
                class="phase-btn"
                :class="{ 'p-button-outlined': taskDetails.phase !== 'test' }"
                @click="updateTask(taskDetails.id, { phase: 'test' })"
              />
              <p-button 
                label="Review" 
                class="phase-btn"
                :class="{ 'p-button-outlined': taskDetails.phase !== 'review' }"
                @click="updateTask(taskDetails.id, { phase: 'review' })"
              />
            </div>
          </div>
          
          <!-- Danger Zone -->
          <div class="action-section danger-zone">
            <h5>Zona de Perigo</h5>
            <p-button 
              label="Remover Tarefa" 
              icon="pi pi-trash" 
              class="p-button-danger action-btn"
              @click="deleteTask(taskDetails.id)"
            />
          </div>
        </template>
      </p-card>
    </div>
  </p-drawer>
</template>

<style scoped>
/* Drawer Header */
.drawer-header {
  width: 100%;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.header-content h3 {
  margin: 0;
  color: #1e293b;
  font-size: 1.125rem;
  font-weight: 600;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #6b7280;
}

/* Task Details */
.task-details {
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Overview Card */
.overview-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.overview-card :deep(.p-card-content) {
  padding: 1rem;
}

.task-overview {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.overview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.overview-item .label {
  font-weight: 500;
  opacity: 0.9;
}

.overview-item .task-id {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
}

/* Section Cards */
.section-card {
  margin-bottom: 0;
}

.section-card :deep(.p-card-title) {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
}

.section-card :deep(.p-card-content) {
  padding: 0 1.5rem 1.5rem 1.5rem;
}

/* Description */
.description-text {
  margin: 0;
  line-height: 1.6;
  color: #4b5563;
}

/* Metadata Grid */
.metadata-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.meta-item:last-child {
  border-bottom: none;
}

.meta-item label {
  font-weight: 500;
  color: #6b7280;
  font-size: 0.875rem;
}

.meta-item span {
  color: #374151;
  font-size: 0.875rem;
}

/* Dependencies */
.dependency-section {
  margin-bottom: 1rem;
}

.dependency-section:last-child {
  margin-bottom: 0;
}

.dependency-section h5 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.dependency-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* Labels */
.labels-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.label-tag {
  font-size: 0.75rem;
}

/* Phase Badge */
.phase-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  border-radius: 9999px;
  color: white;
  font-weight: 500;
}

/* Actions Card */
.actions-card {
  margin-top: auto;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
}

.actions-card :deep(.p-card-title) {
  color: #1e293b;
}

.action-section {
  margin-bottom: 1.5rem;
}

.action-section:last-child {
  margin-bottom: 0;
}

.action-section h5 {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.action-btn {
  justify-content: flex-start;
}

/* Phase Grid */
.phase-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.phase-btn {
  font-size: 0.75rem;
  padding: 0.5rem;
}

/* Danger Zone */
.danger-zone {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
}

.danger-zone h5 {
  color: #dc2626;
  margin-bottom: 0.75rem;
}
</style>