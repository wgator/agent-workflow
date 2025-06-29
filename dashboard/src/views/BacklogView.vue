<script>
import { ref, computed, defineAsyncComponent } from 'vue'

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

export default {
  components: {
    ViewHeader: defineAsyncComponent(() => loadModule('./src/components/ViewHeader.vue', options)),
    TaskDetailDrawer: defineAsyncComponent(() => loadModule('./src/components/TaskDetailDrawer.vue', options))
  },
  
  props: {
    tasks: {
      type: Array,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  
  emits: ['update-task', 'delete-task'],
  
  setup(props, { emit }) {
    const searchQuery = ref('')
    const filters = ref({
      category: null,
      status: null,
      phase: null
    })
    const selectedTaskId = ref(null)
    const drawerVisible = ref(false)
    
    // Computed
    const filteredTasks = computed(() => {
      let filtered = props.tasks
      
      // Filter by search query
      if (searchQuery.value) {
        const search = searchQuery.value.toLowerCase()
        filtered = filtered.filter(task => 
          task.title.toLowerCase().includes(search) ||
          task.category?.toLowerCase().includes(search) ||
          task.status.toLowerCase().includes(search) ||
          task.id.toLowerCase().includes(search)
        )
      }
      
      // Filter by category
      if (filters.value.category) {
        filtered = filtered.filter(task => task.category === filters.value.category)
      }
      
      // Filter by status
      if (filters.value.status) {
        filtered = filtered.filter(task => task.status === filters.value.status)
      }
      
      // Filter by phase
      if (filters.value.phase) {
        filtered = filtered.filter(task => task.phase === filters.value.phase)
      }
      
      return filtered
    })
    
    // Methods
    function getStatusColor(status) {
      const colors = {
        backlog: '#3b82f6',    // azul
        active: '#f59e0b',     // amarelo
        completed: '#10b981'   // verde
      }
      return colors[status] || '#6b7280'
    }
    
    function getPhaseColor(phase) {
      const colors = {
        plan: '#a78bfa',        // purple-400 (mais claro)
        spec: '#8b5cf6',        // purple-500
        detail: '#7c3aed',      // purple-600
        implementation: '#6d28d9', // purple-700
        test: '#5b21b6',        // purple-800
        review: '#4c1d95'       // purple-900 (mais escuro)
      }
      return colors[phase] || '#6b7280'
    }
    
    function formatDate(dateString) {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleDateString('pt-BR')
    }
    
    function updateTask(taskId, updates) {
      emit('update-task', taskId, updates)
    }
    
    function deleteTask(taskId) {
      emit('delete-task', taskId)
      // Fechar drawer após deleção
      if (selectedTaskId.value === taskId) {
        drawerVisible.value = false
        selectedTaskId.value = null
      }
    }
    
    function onRowSelect(event) {
      selectedTaskId.value = event.data.id
      drawerVisible.value = true
    }
    
    function onDrawerVisibilityChange(visible) {
      drawerVisible.value = visible
      if (!visible) {
        selectedTaskId.value = null
      }
    }
    
    return {
      searchQuery,
      filters,
      filteredTasks,
      selectedTaskId,
      drawerVisible,
      getStatusColor,
      getPhaseColor,
      formatDate,
      updateTask,
      deleteTask,
      onRowSelect,
      onDrawerVisibilityChange
    }
  }
}
</script>

<template>
  <div class="backlog-view">
    <ViewHeader 
      title="Backlog de Tarefas"
      :tasks="tasks"
      v-model:search-query="searchQuery"
      v-model:filters="filters"
    />
    
    <p-datatable 
      :value="filteredTasks" 
      :paginator="true" 
      :rows="30"
      responsiveLayout="scroll"
      class="p-datatable-sm"
      :loading="loading"
      size="small"
      :rowHover="true"
      selectionMode="single"
      @rowSelect="onRowSelect"
      dataKey="id"
    >
      <p-column field="id" header="ID" style="width: 15%">
        <template #body="slotProps">
          <code>{{ slotProps.data.id }}</code>
        </template>
      </p-column>
      
      <p-column field="title" header="Título" style="width: 35%; max-width: 300px;">
        <template #body="slotProps">
          <div class="task-title">{{ slotProps.data.title }}</div>
          <div class="task-description">{{ slotProps.data.description }}</div>
        </template>
      </p-column>
      
      <p-column field="category" header="Categoria" style="width: 15%" :sortable="true">
        <template #body="slotProps">
          <p-tag :value="slotProps.data.category || 'Sem categoria'" />
        </template>
      </p-column>
      
      <p-column field="status" header="Status" style="width: 10%" :sortable="true">
        <template #body="slotProps">
          <span class="status-badge" :style="{ backgroundColor: getStatusColor(slotProps.data.status) }">
            {{ slotProps.data.status }}
          </span>
        </template>
      </p-column>
      
      <p-column field="phase" header="Fase" style="width: 10%" :sortable="true">
        <template #body="slotProps">
          <span v-if="slotProps.data.phase" class="phase-badge" :style="{ backgroundColor: getPhaseColor(slotProps.data.phase) }">
            {{ slotProps.data.phase }}
          </span>
          <span v-else>-</span>
        </template>
      </p-column>
      
      <p-column field="created_at" header="Criada em" style="width: 15%" :sortable="true">
        <template #body="slotProps">
          {{ formatDate(slotProps.data.created_at) }}
        </template>
      </p-column>
    </p-datatable>
    
    <!-- Task Detail Drawer Component -->
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
.backlog-view {
  padding: 0;
}

.task-title {
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 0.25rem;
  
  /* Ellipsis para uma linha */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.task-description {
  font-size: 0.875rem;
  color: #64748b;
  
  /* Ellipsis para uma linha */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  border-radius: 9999px;
  color: white;
  font-weight: 500;
}

.phase-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  border-radius: 9999px;
  color: white;
  font-weight: 500;
}

/* Menor espaçamento nas linhas */
:deep(.p-datatable-sm .p-datatable-tbody > tr > td) {
  padding: 0.5rem;
  font-size: 0.875rem;
}

:deep(.p-datatable-sm .p-datatable-thead > tr > th) {
  padding: 0.75rem 0.5rem;
  font-size: 0.875rem;
}

/* Forçar layout fixo da tabela para respeitar larguras */
:deep(.p-datatable table) {
  table-layout: fixed;
}

/* Cursor pointer para linhas */
:deep(.p-datatable tbody tr) {
  cursor: pointer;
}

:deep(.p-datatable tbody tr:hover) {
  background-color: #f8fafc;
}
</style>