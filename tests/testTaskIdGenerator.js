import { 
  generateTaskId, 
  isValidTaskId, 
  extractDateFromTaskId, 
  generateUniqueTaskId 
} from '../src/utils/taskIdGenerator.js'

console.log('=== Testando Gerador de IDs de Tarefas ===\n')

// Teste 1: Geração básica
console.log('1. Geração Básica:')
const id1 = generateTaskId('Implementar PostRepository')
console.log(`   "Implementar PostRepository" => "${id1}"`)

const id2 = generateTaskId('Criar API de Autenticação')
console.log(`   "Criar API de Autenticação" => "${id2}"`)

const id3 = generateTaskId('Fix: Bug no @#$% loader!')
console.log(`   "Fix: Bug no @#$% loader!" => "${id3}"`)

// Teste 2: Validação
console.log('\n2. Validação de IDs:')
console.log(`   "${id1}" é válido? ${isValidTaskId(id1)}`)
console.log(`   "invalid-id" é válido? ${isValidTaskId('invalid-id')}`)
console.log(`   "123456-test" é válido? ${isValidTaskId('123456-test')}`)

// Teste 3: Extração de data
console.log('\n3. Extração de Data:')
const extractedDate = extractDateFromTaskId(id1)
console.log(`   Data de "${id1}": ${extractedDate?.toLocaleDateString('pt-BR')}`)

// Teste 4: IDs únicos
console.log('\n4. Geração de IDs Únicos:')
const existingIds = [
  '250115-implementar-postrepository',
  '250115-implementar-postrepository-1'
]
const uniqueId = generateUniqueTaskId('Implementar PostRepository', existingIds)
console.log(`   IDs existentes: ${existingIds.join(', ')}`)
console.log(`   Novo ID único: "${uniqueId}"`)

// Teste 5: Data específica
console.log('\n5. Geração com Data Específica:')
const customDate = new Date(2025, 0, 20) // 20/Jan/2025
const customId = generateTaskId('Test Task', customDate)
console.log(`   ID para 20/Jan/2025: "${customId}"`)

console.log('\n=== Testes Concluídos ===')
