import OrderingSystem from '../src/utils/orderingSystem.js'

console.log('=== Teste do Sistema de Ordenação ===\n')

// Teste 1: Ordem inicial
console.log('1. Ordem inicial (sem tasks):')
const initialOrder = OrderingSystem.calculateInitialOrder([])
console.log(`   Primeira task: ${initialOrder}`)

// Teste 2: Segunda task
console.log('\n2. Segunda task:')
const secondOrder = OrderingSystem.calculateInitialOrder([{ order: '1000' }])
console.log(`   Segunda task: ${secondOrder}`)

// Teste 3: Inserção entre duas tasks
console.log('\n3. Inserção entre duas tasks:')
const betweenOrder = OrderingSystem.calculateNewOrder('1000', '2000')
console.log(`   Entre 1000 e 2000: ${betweenOrder}`)

// Teste 4: Múltiplas inserções
console.log('\n4. Múltiplas inserções:')
const order1 = OrderingSystem.calculateNewOrder('1000', '1500')
const order2 = OrderingSystem.calculateNewOrder('1000', order1)
const order3 = OrderingSystem.calculateNewOrder(order2, order1)
console.log(`   Entre 1000 e 1500: ${order1}`)
console.log(`   Entre 1000 e ${order1}: ${order2}`)
console.log(`   Entre ${order2} e ${order1}: ${order3}`)

// Teste 5: Inserção no início
console.log('\n5. Inserção no início:')
const firstOrder = OrderingSystem.calculateNewOrder(undefined, '1000')
console.log(`   Antes de 1000: ${firstOrder}`)

// Teste 6: Inserção no final
console.log('\n6. Inserção no final:')
const lastOrder = OrderingSystem.calculateNewOrder('5000', undefined)
console.log(`   Depois de 5000: ${lastOrder}`)

// Teste 7: Verificar necessidade de rebalanceamento
console.log('\n7. Verificar rebalanceamento:')
const tasks = [
  { id: '1', order: '1000' },
  { id: '2', order: '1000.5' },
  { id: '3', order: '1000.75' },
  { id: '4', order: '1000.875' },
  { id: '5', order: '1000.9375' }
]
const needsRebalance = OrderingSystem.shouldRebalance(tasks)
console.log(`   Precisa rebalancear? ${needsRebalance}`)

// Teste 8: Rebalancear
if (needsRebalance) {
  console.log('\n8. Rebalanceamento:')
  const rebalanced = OrderingSystem.rebalanceOrders(tasks)
  rebalanced.forEach(t => console.log(`   ${t.id}: ${t.order}`))
}

console.log('\n=== Testes Concluídos ===')
