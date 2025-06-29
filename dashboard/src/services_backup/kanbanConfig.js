/**
 * Configurações e constantes do Kanban
 */
export const KANBAN_COLUMNS = [
  { id: 'backlog', title: 'Backlog', color: 'gray' },
  { id: 'plan', title: 'Plan', color: 'yellow', isProgress: true },
  { id: 'spec', title: 'Spec', color: 'yellow', isProgress: true },
  { id: 'detail', title: 'Detail', color: 'yellow', isProgress: true },
  { id: 'implementation', title: 'Implementation', color: 'yellow', isProgress: true },
  { id: 'test', title: 'Test', color: 'yellow', isProgress: true },
  { id: 'review', title: 'Review', color: 'yellow', isProgress: true },
  { id: 'completed', title: 'Completed', color: 'green' }
]

export const PHASE_COLORS = {
  plan: '#a78bfa',        // purple-400
  spec: '#8b5cf6',        // purple-500
  detail: '#7c3aed',      // purple-600
  implementation: '#6d28d9', // purple-700
  test: '#5b21b6',        // purple-800
  review: '#4c1d95'       // purple-900
}

export const PHASES_SEQUENCE = ['plan', 'spec', 'detail', 'implementation', 'test', 'review']

export const DRAG_CONFIG = {
  animation: 300,
  group: 'tasks',
  itemKey: 'id'
}
