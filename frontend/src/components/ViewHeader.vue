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
  // Obtem array de categorias únicas não vazias
  const categories = [...new Set(props.tasks.map(t => t.category).filter(Boolean))]
  
  // Agrupar categorias por prefixo (antes da /)
  const grouped = {}
  const standalone = []
  
  categories.forEach(cat => {
    if (cat.includes('/')) {
      const [primary, ...rest] = cat.split('/')
      if (!grouped[primary]) {
        grouped[primary] = []
      }
      grouped[primary].push(cat)
    } else {
      standalone.push(cat)
    }
  })
  
  // Construir opções hierárquicas
  const options = [{ label: 'Todas as categorias', value: null }]
  
  // Adicionar categorias agrupadas
  Object.keys(grouped).sort().forEach(primary => {
    // Opção para filtrar por categoria principal (todas as subcategorias)
    options.push({
      label: `${primary} (todas)`,
      value: `${primary}/*`,
      icon: 'pi pi-folder',
      styleClass: 'category-group-header'
    })
    
    // Subcategorias
    grouped[primary].sort().forEach(fullCat => {
      const subCat = fullCat.split('/').slice(1).join('/')
      options.push({
        label: `└─ ${subCat}`,
        value: fullCat,
        icon: 'pi pi-file',
        styleClass: 'category-subcategory',
        parent: primary
      })
    })
  })
  
  // Adicionar categorias standalone
  standalone.sort().forEach(cat => {
    options.push({
      label: cat,
      value: cat,
      icon: 'pi pi-tag'
    })
  })
  
  return options
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

function getCategoryDisplayLabel(value) {
  if (!value) return ''
  
  // Se for filtro de grupo (termina com /*)
  if (value.endsWith('/*')) {
    return value.replace('/*', ' (todas)')
  }
  
  // Se for categoria específica, mostrar completa
  return value
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
          class="filter-dropdown category-dropdown"
        >
          <template #option="slotProps">
            <div class="category-option" :class="slotProps.option.styleClass">
              <i :class="slotProps.option.icon" v-if="slotProps.option.icon"></i>
              <span>{{ slotProps.option.label }}</span>
            </div>
          </template>
          <template #value="slotProps">
            <div v-if="slotProps.value" class="selected-category">
              {{ getCategoryDisplayLabel(slotProps.value) }}
            </div>
            <span v-else>{{ slotProps.placeholder }}</span>
          </template>
        </p-select>
        
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

.category-dropdown {
  min-width: 200px;
}

.search-input {
  width: 300px;
}

/* Category dropdown styling */
.category-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
}

.category-option i {
  font-size: 0.875rem;
  color: #6b7280;
}

.category-group-header {
  font-weight: 600;
  color: #1e293b;
}

.category-group-header i {
  color: #3b82f6;
}

.category-subcategory {
  padding-left: 1.5rem;
  color: #4b5563;
}

.category-subcategory i {
  color: #9ca3af;
}

.selected-category {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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