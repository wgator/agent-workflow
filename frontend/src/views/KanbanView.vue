<script setup>
import { ref, computed } from 'vue'
import draggable from 'vuedraggable'
import ViewHeader from '../components/ViewHeader.vue'
import TaskDetailDrawer from '../components/TaskDetailDrawer.vue'
import { TaskApiService } from '../services/taskApi.js'
import { KanbanTaskManager, KANBAN_COLUMNS, DRAG_CONFIG } from '../services/kanbanManager.js'

// ========================
// PROPS & EMITS
// ========================
const props = defineProps({
  tasks: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['update-task', 'delete-task'])

// ========================
// STATE MANAGEMENT
// ========================
const searchQuery = ref('')
const filters = ref({
  category: null,
  status: null,
  phase: null
})
const selectedTaskId = ref(null)
const drawerVisible = ref(false)

// ========================
// COMPUTED PROPERTIES
// ========================
const filteredTasks = computed(() => {
  return KanbanTaskManager.filterTasks(props.tasks, {
    searchQuery: searchQuery.value,
    category: filters.value.category,
    status: filters.value.status,
    phase: filters.value.phase
  })
})

const tasksByColumn = computed(() => {
  return KanbanTaskManager.organizeTasksByColumn(filteredTasks.value)
})

const hasActiveFilters = computed(() => {
  return !!(searchQuery.value || 
           filters.value.category || 
           filters.value.status || 
           filters.value.phase)
})

const visibleColumns = computed(() => {
  return KanbanTaskManager.getVisibleColumns(tasksByColumn.value, hasActiveFilters.value)
})

// ========================
// EVENT HANDLERS
// ========================
function updateTask(taskId, updates) {
  emit('update-task', taskId, updates)
}

function deleteTask(taskId) {
  emit('delete-task', taskId)
  if (selectedTaskId.value === taskId) {
    drawerVisible.value = false
    selectedTaskId.value = null
  }
}

function onCardClick(task) {
  selectedTaskId.value = task.id
  drawerVisible.value = true
}

function onDrawerVisibilityChange(visible) {
  drawerVisible.value = visible
  if (!visible) {
    selectedTaskId.value = null
  }
}

// ========================
// DRAG & DROP
// ========================
async function onTaskMove(event, targetColumnId) {
  try {
    if (event.added) {
      await handleColumnChange(event.added, targetColumnId)
    }
    
    if (event.moved) {
      await handleSameColumnReorder(event.moved, targetColumnId)
    }
  } catch (error) {
    // Silently handle task move errors
  }
}

async function handleColumnChange(addedEvent, targetColumnId) {
  const task = addedEvent.element
  const newIndex = addedEvent.newIndex
  const updates = KanbanTaskManager.calculateStatusAndPhase(targetColumnId)
  
  updateTask(task.id, updates)
  
  if (newIndex !== undefined) {
    const columnTasks = tasksByColumn.value[targetColumnId] || []
    const beforeTask = columnTasks[newIndex - 1]
    const afterTask = columnTasks[newIndex]
    
    setTimeout(async () => {
      try {
        const result = await TaskApiService.reorderByReferences(
          task.id, 
          beforeTask?.id, 
          afterTask?.id
        )
        
        emit('update-task', task.id, { 
          order: result.order,
          _forceUpdate: Date.now()
        })
      } catch (error) {
        // Silently handle reorder errors
      }
    }, 100)
  }
}

async function handleSameColumnReorder(movedEvent, targetColumnId) {
  const task = movedEvent.element
  const newIndex = movedEvent.newIndex
  
  const columnTasks = tasksByColumn.value[targetColumnId] || []
  const { beforeTaskId, afterTaskId } = KanbanTaskManager.calculateReorderReferences(
    columnTasks, 
    task.id, 
    newIndex
  )
  
  try {
    const result = await TaskApiService.reorderByReferences(task.id, beforeTaskId, afterTaskId)
    
    emit('update-task', task.id, { 
      order: result.order,
      _forceUpdate: Date.now()
    })
  } catch (error) {
    // Silently handle reorder errors
  }
}

function updateColumnTasks(columnId, newTasks) {
  // O vuedraggable gerencia o estado interno automaticamente
}

// ========================
// HELPER FUNCTIONS
// ========================
function getPhaseColor(phase) {
  return KanbanTaskManager.getPhaseColor(phase)
}
</script>

<template>
  <div class="kanban-view">
    <ViewHeader 
      title="Kanban Board"
      :tasks="tasks"
      v-model:search-query="searchQuery"
      v-model:filters="filters"
    />
    
    <div class="kanban-board">
      <div 
        v-for="column in visibleColumns" 
        :key="column.id"
        class="kanban-column"
        :class="[
          `column-${column.color}`,
          { 'column-progress': column.isProgress }
        ]"
      >
        <div class="column-header" :class="`header-${column.color}`">
          <h3>{{ column.title }}</h3>
          <span class="task-count" :class="`count-${column.color}`">
            {{ tasksByColumn[column.id]?.length || 0 }}
          </span>
        </div>
        
        <div class="column-content">
          <!-- Draggable com sintaxe EXATA do dashboard original -->
          <draggable
            :model-value="tasksByColumn[column.id] || []"
            @update:model-value="(newValue) => updateColumnTasks(column.id, newValue)"
            @change="(event) => onTaskMove(event, column.id)"
            :group="DRAG_CONFIG.group"
            :item-key="DRAG_CONFIG.itemKey"
            :animation="DRAG_CONFIG.animation"
            class="draggable-area"
          >
            <template #item="{ element: task }">
              <p-card 
                :key="task.id" 
                class="task-card"
                :class="[
                  `card-${column.color}`,
                  { 'card-progress': column.isProgress }
                ]" @click="onCardClick(task)">
                <template #title>
                  <div class="card-task-title">{{ task.title }}</div>
                </template>
                
                <template #subtitle>
                  <div class="card-task-tags">
                    <p-tag :value="task.category || 'Sem categoria'" severity="info" />
                    <span 
                      v-if="task.phase" 
                      class="card-phase-badge" 
                      :style="{ backgroundColor: getPhaseColor(task.phase) }"
                    >
                      {{ task.phase }}
                    </span>
                  </div>
                </template>
                
                <template #content>
                  <p class="card-task-description">{{ task.description || 'Sem descrição' }}</p>
                  <div class="card-task-footer">
                    <code class="card-task-id">{{ task.id }}</code>
                  </div>
                </template>
              </p-card>
            </template>
          </draggable>
        </div>
      </div>
    </div>
    
    <TaskDetailDrawer 
      :visible="drawerVisible"
      :task-id="selectedTaskId"
      @update:visible="onDrawerVisibilityChange"
      @update-task="updateTask"
      @delete-task="deleteTask"
    />
  </div>
</template>

<style scoped>
.kanban-view {
  padding: 0;
}

.kanban-board {
  display: grid;
  grid-template-columns: repeat(8, minmax(16rem, 1fr));
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 1rem;
}

.kanban-column {
  background: #f8fafc;
  border-radius: 8px;
  padding: 0.8rem;
  min-height: 500px;
  /* min-width: 200px;
  max-width: 35rem; */
}

/* Cores das colunas */
.column-gray { background: #f1f5f9; }
.column-yellow { background: #fffbeb; }
.column-green { background: #f0fdf4; }

/* Headers das colunas */
.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid;
}

.header-gray { border-bottom-color: #94a3b8; }
.header-yellow { border-bottom-color: #f59e0b; }
.header-green { border-bottom-color: #10b981; }

.column-header h3 {
  margin: 0;
  color: #1e293b;
  font-size: 0.9rem;
  font-weight: 600;
}

/* Contadores */
.task-count {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 1.5rem;
  text-align: center;
}

.count-gray { background: #e2e8f0; color: #475569; }
.count-yellow { background: #fef3c7; color: #a16207; }
.count-green { background: #d1fae5; color: #065f46; }

.column-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 200px;
}

.draggable-area {
  min-height: 100px;
  padding: 0.2em!important;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.task-card {
  cursor: pointer;
  transition: all 0.2s;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Estilos para drag & drop */
.task-card.sortable-chosen { transform: rotate(5deg); opacity: 0.8; }
.task-card.sortable-ghost { opacity: 0.3; background: #f1f5f9; }
.task-card.sortable-drag { transform: rotate(5deg); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2); }

/* Bordas dos cards */
.card-gray { border-left: 4px solid #94a3b8; }
.card-yellow { border-left: 4px solid #f59e0b; }
.card-green { border-left: 4px solid #10b981; }

.task-title {
  font-weight: 500;
  color: #1e293b;
  font-size: 0.9rem;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  max-height: calc(1.3em * 3);
}

.task-description {
  margin: 0 0 1rem 0;
  color: #64748b;
  font-size: 0.8rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  max-height: calc(1.4em * 3);
}

.task-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
}

.task-id {
  font-size: 0.75rem;
  color: #94a3b8;
}

.task-tags {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.phase-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 9999px;
  color: white;
  font-weight: 500;
}

/* Task List Container */
.task-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 200px;
}

.draggable-area {
  min-height: 200px;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.draggable-area.drag-over {
  background: rgba(59, 130, 246, 0.05);
  border: 2px dashed #3b82f6;
}

/* PrimeVue Task Cards */
.task-card {
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 8px;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Drag & Drop States */
.task-card.sortable-chosen {
  transform: rotate(5deg);
  opacity: 0.8;
  cursor: grabbing;
}

.task-card.sortable-ghost {
  opacity: 0.3;
  background: #f1f5f9;
  transform: none;
}

.task-card.sortable-drag {
  transform: rotate(5deg);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  z-index: 1000;
}

/* Bordas dos cards por coluna */
.card-gray {
  border-left: 4px solid #94a3b8;
}

.card-yellow {
  border-left: 4px solid #f59e0b;
}

.card-green {
  border-left: 4px solid #10b981;
}

/* Conteúdo dos cards */
.card-task-title {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.9rem;
  line-height: 1.3;
  margin: 0;
}

.card-task-tags {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
  margin: 0;
}

.card-phase-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 9999px;
  color: white;
  font-weight: 500;
}

.card-task-description {
  font-size: 0.8rem;
  color: #64748b;
  line-height: 1.4;
  margin: 0 0 0.75rem 0;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.card-task-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: auto;
}

.card-task-id {
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  color: #94a3b8;
  background: transparent;
  padding: 0;
}

/* Responsive */
@media (max-width: 1024px) {
  .kanban-board { grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr)); }
}

@media (max-width: 768px) {
  .kanban-board { grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); }
}

@media (max-width: 480px) {
  .kanban-board { grid-template-columns: 1fr; }
}
</style>

<style >

.p-card-body  {
  padding: 0.9rem;
}
</style>