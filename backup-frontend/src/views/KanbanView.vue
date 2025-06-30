<script>
import { ref, computed, defineAsyncComponent, watch } from 'vue'

// Usar vuedraggable global do CDN (Vue 3 compatible)
const draggable = window.vuedraggable

// Configuração Vue SFC Loader
const { loadModule } = window['vue3-sfc-loader']
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

// ========================
// KANBAN CONFIGURATION
// ========================
const KANBAN_COLUMNS = [
  { id: 'backlog', title: 'Backlog', color: 'gray' },
  { id: 'plan', title: 'Plan', color: 'yellow', isProgress: true },
  { id: 'spec', title: 'Spec', color: 'yellow', isProgress: true },
  { id: 'detail', title: 'Detail', color: 'yellow', isProgress: true },
  { id: 'implementation', title: 'Implementation', color: 'yellow', isProgress: true },
  { id: 'test', title: 'Test', color: 'yellow', isProgress: true },
  { id: 'review', title: 'Review', color: 'yellow', isProgress: true },
  { id: 'completed', title: 'Completed', color: 'green' }
]

const PHASE_COLORS = {
  plan: '#a78bfa',        // purple-400
  spec: '#8b5cf6',        // purple-500
  detail: '#7c3aed',      // purple-600
  implementation: '#6d28d9', // purple-700
  test: '#5b21b6',        // purple-800
  review: '#4c1d95'       // purple-900
}

const DRAG_CONFIG = {
  animation: 300,
  group: 'tasks',
  itemKey: 'id'
}

// ========================
// TASK API SERVICE
// ========================
const TaskApiService = {
  async reorderByReferences(taskId, beforeTaskId, afterTaskId) {
    const response = await fetch(`/api/tasks/${taskId}/reorder-between`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        beforeTaskId: beforeTaskId || null,
        afterTaskId: afterTaskId || null
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    return response.json()
  }
}

// ========================
// KANBAN TASK MANAGER
// ========================
const KanbanTaskManager = {
  filterTasks(tasks, filters) {
    let filtered = [...tasks]
    
    if (filters.searchQuery) {
      const search = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(search) ||
        task.category?.toLowerCase().includes(search) ||
        task.status.toLowerCase().includes(search) ||
        task.id.toLowerCase().includes(search)
      )
    }
    
    if (filters.category) {
      filtered = filtered.filter(task => task.category === filters.category)
    }
    
    if (filters.status) {
      filtered = filtered.filter(task => task.status === filters.status)
    }
    
    if (filters.phase) {
      filtered = filtered.filter(task => task.phase === filters.phase)
    }
    
    return filtered
  },
  
  organizeTasksByColumn(tasks) {
    const result = {}
    
    KANBAN_COLUMNS.forEach(column => {
      if (column.id === 'backlog') {
        result[column.id] = tasks.filter(t => t.status === 'backlog')
      } else if (column.id === 'completed') {
        result[column.id] = tasks.filter(t => t.status === 'completed')
      } else {
        result[column.id] = tasks.filter(t => 
          t.status === 'active' && t.phase === column.id
        )
      }
      
      // Ordenar por order field (DESC - maior order = primeira posição)
      if (result[column.id]) {
        result[column.id].sort((a, b) => {
          const orderA = parseFloat(a.order || '0')
          const orderB = parseFloat(b.order || '0')
          return orderB - orderA
        })
      }
    })
    
    return result
  },
  
  getVisibleColumns(tasksByColumn, hasActiveFilters) {
    if (!hasActiveFilters) {
      return KANBAN_COLUMNS
    }
    
    return KANBAN_COLUMNS.filter(column => {
      return tasksByColumn[column.id]?.length > 0
    })
  },
  
  calculateStatusAndPhase(targetColumnId) {
    if (targetColumnId === 'backlog') {
      return { status: 'backlog' }
    }
    
    if (targetColumnId === 'completed') {
      return { status: 'completed' }
    }
    
    return { status: 'active', phase: targetColumnId }
  },
  
  getPhaseColor(phase) {
    return PHASE_COLORS[phase] || '#6b7280'
  },
  
  calculateReorderReferences(columnTasks, movingTaskId, newIndex) {
    const filteredTasks = columnTasks.filter(t => t.id !== movingTaskId)
    
    const beforeTask = filteredTasks[newIndex - 1]
    const afterTask = filteredTasks[newIndex]
    
    return {
      beforeTaskId: beforeTask?.id || null,
      afterTaskId: afterTask?.id || null
    }
  }
}

// ========================
// DRAG HANDLER
// ========================
const createDragHandler = (tasksByColumn, updateTask, emit) => {
  return {
    async handleTaskMove(event, targetColumnId) {
      try {
        if (event.added) {
          await this.handleColumnChange(event.added, targetColumnId)
        }
        
        if (event.moved) {
          await this.handleSameColumnReorder(event.moved, targetColumnId)
        }
      } catch (error) {
        console.error('Task move failed:', error)
      }
    },
    
    async handleColumnChange(addedEvent, targetColumnId) {
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
            console.error('Reorder after column change failed:', error)
          }
        }, 100)
      }
    },
    
    async handleSameColumnReorder(movedEvent, targetColumnId) {
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
        console.error('Reorder failed:', error)
      }
    }
  }
}

export default {
  components: {
    ViewHeader: defineAsyncComponent(() => loadModule('./src/components/ViewHeader.vue', options)),
    TaskDetailDrawer: defineAsyncComponent(() => loadModule('./src/components/TaskDetailDrawer.vue', options)),
    draggable
  },
  
  props: {
    tasks: {
      type: Array,
      required: true
    }
  },
  
  emits: ['update-task', 'delete-task'],
  
  setup(props, { emit }) {
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
    const dragHandler = createDragHandler(tasksByColumn, updateTask, emit)
    
    function onTaskMove(event, targetColumnId) {
      dragHandler.handleTaskMove(event, targetColumnId)
    }
    
    function updateColumnTasks(columnId, newTasks) {
      // Placeholder - vuedraggable gerencia o estado local
    }
    
    // ========================
    // HELPER FUNCTIONS
    // ========================
    function getPhaseColor(phase) {
      return KanbanTaskManager.getPhaseColor(phase)
    }
    
    // ========================
    // RETURN INTERFACE
    // ========================
    return {
      // Data
      searchQuery,
      filters,
      selectedTaskId,
      drawerVisible,
      
      // Computed
      tasksByColumn,
      visibleColumns,
      
      // Config
      columns: KANBAN_COLUMNS,
      dragConfig: DRAG_CONFIG,
      
      // Methods
      updateTask,
      deleteTask,
      onCardClick,
      onDrawerVisibilityChange,
      getPhaseColor,
      onTaskMove,
      updateColumnTasks
    }
  }
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
          <draggable
            :model-value="tasksByColumn[column.id]"
            @update:model-value="(newValue) => updateColumnTasks(column.id, newValue)"
            @change="(event) => onTaskMove(event, column.id)"
            :group="dragConfig.group"
            :item-key="dragConfig.itemKey"
            :animation="dragConfig.animation"
            class="draggable-area"
          >
            <template #item="{ element: task }">
              <p-card 
                :key="task.id" 
                class="task-card"
                :class="[
                  `card-${column.color}`,
                  { 'card-progress': column.isProgress }
                ]"
                @click="onCardClick(task)"
              >
                <template #title>
                  <div class="task-title">{{ task.title }}</div>
                </template>
                
                <template #subtitle>
                  <div class="task-tags">
                    <p-tag :value="task.category || 'Sem categoria'" />
                    <span 
                      v-if="task.phase" 
                      class="phase-badge" 
                      :style="{ backgroundColor: getPhaseColor(task.phase) }"
                    >
                      {{ task.phase }}
                    </span>
                  </div>
                </template>
                
                <template #content>
                  <p class="task-description">{{ task.description }}</p>
                  <div class="task-meta">
                    <code class="task-id">{{ task.id }}</code>
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
  grid-template-columns: repeat(8, minmax(18rem, 1fr));
  gap: 1rem;
  overflow-x: auto;
  padding-bottom: 1rem;
}

.kanban-column {
  background: #f8fafc;
  border-radius: 8px;
  padding: 1rem;
  min-height: 500px;
  min-width: 200px;
  max-width: 35rem;
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

/* Responsive */
@media (max-width: 1024px) {
  .kanban-board { grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); }
}

@media (max-width: 768px) {
  .kanban-board { grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); }
}

@media (max-width: 480px) {
  .kanban-board { grid-template-columns: 1fr; }
}
</style>
