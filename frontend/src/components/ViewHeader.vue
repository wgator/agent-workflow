<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  tasks: {
    type: Array,
    required: true
  },
  searchQuery: {
    type: String,
    default: ''
  },
  filters: {
    type: Object,
    default: () => ({
      category: null,
      status: null,
      phase: null
    })
  }
})

const emit = defineEmits(['update:searchQuery', 'update:filters'])

// Computed options for dropdowns
const categoryOptions = computed(() => {
  const categories = [...new Set(props.tasks.map(t => t.category).filter(Boolean))]
  return [
    { label: 'Todas as categorias', value: null },
    ...categories.map(cat => ({ label: cat, value: cat }))
  ]
})

const statusOptions = computed(() => {
  const statuses = [...new Set(props.tasks.map(t => t.status).filter(Boolean))]
  return [
    { label: 'Todos os status', value: null },
    ...statuses.map(status => ({ label: status, value: status }))
  ]
})

const phaseOptions = computed(() => {
  const phases = [...new Set(props.tasks.map(t => t.phase).filter(Boolean))]
  return [
    { label: 'Todas as fases', value: null },
    ...phases.map(phase => ({ label: phase, value: phase }))
  ]
})

// Local filter state
const localFilters = ref({ ...props.filters })

// Methods
function updateSearch(value) {
  emit('update:searchQuery', value)
}

function updateFilter(filterType, value) {
  localFilters.value[filterType] = value
  emit('update:filters', { ...localFilters.value })
}
</script>

<template>
  <div class="view-header">
    <h2>{{ title }}</h2>
    
    <div class="header-controls">
      <!-- Filtros -->
      <div class="filters-group">
        <p-select 
          :model-value="localFilters.category"
          @update:model-value="updateFilter('category', $event)"
          :options="categoryOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Categoria"
          class="filter-dropdown"
        />
        
        <p-select 
          :model-value="localFilters.status"
          @update:model-value="updateFilter('status', $event)"
          :options="statusOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Status"
          class="filter-dropdown"
        />
        
        <p-select 
          :model-value="localFilters.phase"
          @update:model-value="updateFilter('phase', $event)"
          :options="phaseOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Fase"
          class="filter-dropdown"
        />
      </div>
      
      <!-- Busca -->
      <p-inputtext 
        :model-value="searchQuery"
        @update:model-value="updateSearch"
        placeholder="Buscar tarefas..." 
        class="search-input"
      />
    </div>
  </div>
</template>

<style scoped>
.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
}

.view-header h2 {
  margin: 0;
  color: #1e293b;
  white-space: nowrap;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.filters-group {
  display: flex;
  gap: 0.75rem;
}

.filter-dropdown {
  min-width: 150px;
}

.search-input {
  width: 300px;
}

/* Responsividade */
@media (max-width: 1024px) {
  .view-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-controls {
    flex-direction: column;
    gap: 1rem;
  }
  
  .filters-group {
    flex-wrap: wrap;
  }
  
  .search-input {
    width: 100%;
  }
  
  .filter-dropdown {
    flex: 1;
    min-width: 120px;
  }
}
</style>