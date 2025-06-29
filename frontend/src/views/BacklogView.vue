<script setup>
import { ref, computed } from 'vue'
import ViewHeader from '../components/ViewHeader.vue'
import TaskDetailDrawer from '../components/TaskDetailDrawer.vue'
import { BacklogUtils } from '../services/backlogUtils.js'

const props = defineProps({
  tasks: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update-task', 'delete-task'])

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
  return BacklogUtils.filterTasks(props.tasks, {
    searchQuery: searchQuery.value,
    category: filters.value.category,
    status: filters.value.status,
    phase: filters.value.phase
  })
})

// Methods
function getStatusColor(status) {
  return BacklogUtils.getStatusColor(status)
}

function getPhaseColor(phase) {
  return BacklogUtils.getPhaseColor(phase)
}

function formatDate(dateString) {
  return BacklogUtils.formatDate(dateString)
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