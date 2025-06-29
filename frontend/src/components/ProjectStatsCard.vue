<script setup>
import { computed } from 'vue'
import StatsCard from './StatsCard.vue'

const props = defineProps({
  tasks: {
    type: Array,
    required: true
  }
})

const stats = computed(() => {
  const taskList = props.tasks
  return {
    total: taskList.length,
    active: taskList.filter(t => t.status === 'active').length,
    completed: taskList.filter(t => t.status === 'completed').length,
    backlog: taskList.filter(t => t.status === 'backlog').length
  }
})
</script>

<template>
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
</template>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}
</style>
