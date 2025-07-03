<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  taskId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['update:visible', 'update-task', 'delete-task'])

const taskDetails = ref(null)
const loadingDetails = ref(false)

// Constants
const allPhases = ['plan', 'spec', 'detail', 'implementation', 'test', 'review']

// Computed properties
const hasFiles = computed(() => {
  if (!taskDetails.value?.files) return false
  const { planned, created, modified, tested } = taskDetails.value.files
  return (planned?.length > 0) || (created?.length > 0) || 
         (modified?.length > 0) || (tested?.length > 0)
})

const hasNotes = computed(() => {
  return taskDetails.value?.notes && Object.keys(taskDetails.value.notes).length > 0
})

const timelineEvents = computed(() => {
  if (!taskDetails.value) return []
  
  const events = []
  
  // Created event
  if (taskDetails.value.created_at) {
    events.push({
      title: 'Criada',
      date: formatDateTime(taskDetails.value.created_at),
      icon: 'pi pi-plus',
      status: 'created'
    })
  }
  
  // Started event
  if (taskDetails.value.started_at) {
    events.push({
      title: 'Iniciada',
      date: formatDateTime(taskDetails.value.started_at),
      icon: 'pi pi-play',
      status: 'started'
    })
  }
  
  // Completed event
  if (taskDetails.value.completed_at) {
    events.push({
      title: 'Completada',
      date: formatDateTime(taskDetails.value.completed_at),
      icon: 'pi pi-check',
      status: 'completed'
    })
  }
  
  return events
})

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

function getPhaseIcon(phase) {
  const icons = {
    plan: 'pi pi-lightbulb',
    spec: 'pi pi-file-edit',
    detail: 'pi pi-sitemap',
    implementation: 'pi pi-code',
    test: 'pi pi-check-square',
    review: 'pi pi-eye'
  }
  return icons[phase] || 'pi pi-circle'
}

function getPhaseLabel(phase) {
  const labels = {
    plan: 'Planejamento',
    spec: 'Especificação',
    detail: 'Detalhamento',
    implementation: 'Implementação',
    test: 'Testes',
    review: 'Revisão'
  }
  return labels[phase] || phase
}

function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR')
}

function formatDateTime(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  const dateStr = date.toLocaleDateString('pt-BR')
  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${dateStr} às ${timeStr}`
}
</script>

<template>
  <p-drawer 
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    position="right"
    class="task-drawer"
    :modal="false"
    :dismissable="true"
  >
    <template #header>
      <div class="drawer-header">
        <div class="header-content">
          <h3>{{ taskDetails?.title || 'Detalhes da Tarefa' }}</h3>
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
              <span class="label">Fase Atual:</span>
              <span class="phase-badge" :style="{ backgroundColor: getPhaseColor(taskDetails.phase) }">
                {{ taskDetails.phase }}
              </span>
            </div>
            <div class="overview-item" v-if="taskDetails.order !== undefined">
              <span class="label">Ordem:</span>
              <p-badge :value="String(taskDetails.order)" severity="info" />
            </div>
          </div>
        </template>
      </p-card>
      
      <!-- Progress Timeline -->
      <p-card class="section-card" v-if="taskDetails.status !== 'backlog'">
        <template #title>
          <i class="pi pi-chart-line"></i> Progresso
        </template>
        <template #content>
          <!-- Timeline -->
          <div class="timeline-section">
            <p-timeline :value="timelineEvents" layout="horizontal" class="custom-timeline">
              <template #marker="slotProps">
                <span class="timeline-marker" :class="slotProps.item.status">
                  <i :class="slotProps.item.icon"></i>
                </span>
              </template>
              <template #content="slotProps">
                <div class="timeline-content">
                  <p class="timeline-title">{{ slotProps.item.title }}</p>
                  <p class="timeline-date">{{ slotProps.item.date }}</p>
                </div>
              </template>
            </p-timeline>
          </div>
          
          <!-- Phases Progress -->
          <div class="phases-progress" v-if="taskDetails.phases_completed?.length > 0 || taskDetails.phase">
            <h5>Fases Completadas</h5>
            <div class="phase-chips">
              <p-chip 
                v-for="phase in allPhases" 
                :key="phase"
                :label="phase"
                :class="{
                  'completed': taskDetails.phases_completed?.includes(phase),
                  'current': taskDetails.phase === phase
                }"
                :icon="getPhaseIcon(phase)"
              />
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
          <p-textarea 
            v-model="taskDetails.description" 
            :disabled="true"
            rows="3"
            auto-resize
            class="w-full"
            placeholder="Nenhuma descrição fornecida"
          />
        </template>
      </p-card>
      
      <!-- Metadata -->
      <p-card class="section-card">
        <template #title>
          <i class="pi pi-info-circle"></i> Informações
        </template>
        <template #content>
          <div class="metadata-grid">
            <div class="meta-item">
              <label>Categoria:</label>
              <p-input-text 
                v-model="taskDetails.category" 
                :disabled="true"
                placeholder="Sem categoria"
                class="meta-input"
              />
            </div>
            <div class="meta-item">
              <label>Criada em:</label>
              <span class="date-display">
                <i class="pi pi-calendar"></i>
                {{ formatDateTime(taskDetails.created_at) }}
              </span>
            </div>
            <div class="meta-item" v-if="taskDetails.started_at">
              <label>Iniciada em:</label>
              <span class="date-display">
                <i class="pi pi-play"></i>
                {{ formatDateTime(taskDetails.started_at) }}
              </span>
            </div>
            <div class="meta-item" v-if="taskDetails.completed_at">
              <label>Completada em:</label>
              <span class="date-display">
                <i class="pi pi-check-circle"></i>
                {{ formatDateTime(taskDetails.completed_at) }}
              </span>
            </div>
          </div>
        </template>
      </p-card>
      
      <!-- Files -->
      <p-card class="section-card" v-if="hasFiles">
        <template #title>
          <i class="pi pi-folder"></i> Arquivos
        </template>
        <template #content>
          <p-tab-view>
            <p-tab-panel 
              v-if="taskDetails.files?.planned?.length" 
              header="Planejados"
              :pt="{ headerAction: { class: 'file-tab-header' } }"
            >
              <div class="file-list">
                <div v-for="file in taskDetails.files.planned" :key="file" class="file-item">
                  <i class="pi pi-file-o"></i>
                  <span>{{ file }}</span>
                </div>
              </div>
            </p-tab-panel>
            <p-tab-panel 
              v-if="taskDetails.files?.created?.length" 
              header="Criados"
              :pt="{ headerAction: { class: 'file-tab-header' } }"
            >
              <div class="file-list">
                <div v-for="file in taskDetails.files.created" :key="file" class="file-item created">
                  <i class="pi pi-file"></i>
                  <span>{{ file }}</span>
                </div>
              </div>
            </p-tab-panel>
            <p-tab-panel 
              v-if="taskDetails.files?.modified?.length" 
              header="Modificados"
              :pt="{ headerAction: { class: 'file-tab-header' } }"
            >
              <div class="file-list">
                <div v-for="file in taskDetails.files.modified" :key="file" class="file-item modified">
                  <i class="pi pi-file-edit"></i>
                  <span>{{ file }}</span>
                </div>
              </div>
            </p-tab-panel>
            <p-tab-panel 
              v-if="taskDetails.files?.tested?.length" 
              header="Testados"
              :pt="{ headerAction: { class: 'file-tab-header' } }"
            >
              <div class="file-list">
                <div v-for="file in taskDetails.files.tested" :key="file" class="file-item tested">
                  <i class="pi pi-check-square"></i>
                  <span>{{ file }}</span>
                </div>
              </div>
            </p-tab-panel>
          </p-tab-view>
        </template>
      </p-card>
      
      <!-- Notes -->
      <p-card class="section-card" v-if="hasNotes">
        <template #title>
          <i class="pi pi-comment"></i> Notas por Fase
        </template>
        <template #content>
          <p-accordion>
            <p-accordion-tab 
              v-for="(note, phase) in taskDetails.notes" 
              :key="phase"
              :header="getPhaseLabel(phase)"
              :pt="{ 
                header: { 
                  class: phase === taskDetails.phase ? 'current-phase-note' : '' 
                } 
              }"
            >
              <template #headericon>
                <i :class="getPhaseIcon(phase)"></i>
              </template>
              <p-textarea 
                v-model="taskDetails.notes[phase]" 
                :disabled="true"
                size="small"
                auto-resize
                rows="2"
                class="w-full note-textarea"
              />
            </p-accordion-tab>
          </p-accordion>
        </template>
      </p-card>
      
      <!-- Dependencies -->
      <p-card v-if="taskDetails.dependencies?.length" class="section-card">
        <template #title>
          <i class="pi pi-link"></i> Dependências
        </template>
        <template #content>
          <div class="dependency-section">
            <p-chip 
              v-for="dep in taskDetails.dependencies" 
              :key="dep" 
              :label="dep" 
              removable
              :pt="{ root: { class: 'dependency-chip' } }"
              @remove="() => {}"
            />
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
                label="Detail" 
                class="phase-btn"
                :class="{ 'p-button-outlined': taskDetails.phase !== 'detail' }"
                @click="updateTask(taskDetails.id, { phase: 'detail' })"
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
  min-width: 120px;
}

.meta-item span {
  color: #374151;
  font-size: 0.875rem;
}

.meta-input {
  flex: 1;
  max-width: 60%;
}

.date-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-display i {
  font-size: 0.875rem;
  color: #9ca3af;
}

/* Timeline Section */
.timeline-section {
  margin-bottom: 2rem;
}

.custom-timeline :deep(.p-timeline-event-opposite) {
  display: none;
}

.timeline-marker {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: #e5e7eb;
  color: #6b7280;
}

.timeline-marker.created {
  background: #dbeafe;
  color: #3b82f6;
}

.timeline-marker.started {
  background: #fef3c7;
  color: #f59e0b;
}

.timeline-marker.completed {
  background: #d1fae5;
  color: #10b981;
}

.timeline-content {
  text-align: center;
  margin-top: 0.5rem;
}

.timeline-title {
  font-weight: 600;
  font-size: 0.875rem;
  margin: 0;
  color: #374151;
}

.timeline-date {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0.25rem 0 0 0;
}

/* Phases Progress */
.phases-progress {
  margin-top: 1.5rem;
}

.phases-progress h5 {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.phase-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.phase-chips :deep(.p-chip) {
  background: #f3f4f6;
  color: #6b7280;
  border: 1px solid #e5e7eb;
}

.phase-chips :deep(.p-chip.completed) {
  background: #d1fae5;
  color: #065f46;
  border-color: #a7f3d0;
}

.phase-chips :deep(.p-chip.current) {
  background: #fef3c7;
  color: #92400e;
  border-color: #fde68a;
  font-weight: 600;
}

/* Files Section */
.file-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #f9fafb;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #374151;
}

.file-item i {
  color: #6b7280;
}

.file-item.created i {
  color: #10b981;
}

.file-item.modified i {
  color: #f59e0b;
}

.file-item.tested i {
  color: #3b82f6;
}

/* File tabs */
:deep(.file-tab-header) {
  font-size: 0.875rem !important;
}

.p-textarea {
  width: 100%
}

/* Notes Section */
.note-textarea {
  /* font-size: 0.875rem; */
}

:deep(.current-phase-note) {
  background: #fef3c7 !important;
}

/* Dependencies */
.dependency-section {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

:deep(.dependency-chip) {
  background: #fef3c7 !important;
  color: #92400e !important;
  border: 1px solid #fde68a !important;
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

<style>
/* Largura do drawer */
.task-drawer, .p-drawer {
  width: 40vw !important;
  min-width: 25rem !important;
  max-width: 1000px !important;
}

@media (max-width: 768px) {
  .task-drawer, .p-drawer {
    width: 100% !important;
    min-width: unset !important;
  }
}
</style>