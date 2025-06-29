/**
 * Gera um ID único para tarefas no formato YYMMDD-nome-curto
 * @param {string} taskName - Nome completo da tarefa
 * @param {Date} date - Data para gerar o ID (opcional, padrão: hoje)
 * @returns {string} ID no formato YYMMDD-nome-curto
 */
export function generateTaskId(taskName, date = new Date()) {
  // Formatar data como YYMMDD
  const yy = date.getFullYear().toString().slice(-2)
  const mm = (date.getMonth() + 1).toString().padStart(2, '0')
  const dd = date.getDate().toString().padStart(2, '0')
  
  // Criar nome curto:
  // 1. Converter para lowercase
  // 2. Remover caracteres especiais (exceto espaços e hífens)
  // 3. Dividir em palavras
  // 4. Filtrar palavras pequenas (preposições, artigos)
  // 5. Pegar no máximo 3 palavras significativas
  // 6. Juntar com hífens
  const stopWords = ['de', 'da', 'do', 'das', 'dos', 'a', 'o', 'as', 'os', 'e', 'ou', 'para', 'com', 'em', 'no', 'na']
  
  const words = taskName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .trim()
    .split(/\s+/)                 // Divide por espaços
  
  // Filtrar palavras significativas (não stopwords ou muito curtas)
  const significantWords = words.filter(word => 
    word.length > 2 || !stopWords.includes(word)
  )
  
  // Se não houver palavras significativas, usar as originais
  const finalWords = significantWords.length > 0 ? significantWords : words
  
  const shortName = finalWords
    .slice(0, 3)                  // Máximo 3 palavras
    .join('-')                    // Junta com hífens
  
  return `${yy}${mm}${dd}-${shortName}`
}

/**
 * Valida se um ID de tarefa está no formato correto
 * @param {string} taskId - ID para validar
 * @returns {boolean} true se válido
 */
export function isValidTaskId(taskId) {
  // Formato: YYMMDD-nome-curto
  const pattern = /^\d{6}-[a-z0-9-]+$/
  return pattern.test(taskId)
}

/**
 * Extrai a data de um ID de tarefa
 * @param {string} taskId - ID da tarefa
 * @returns {Date|null} Data extraída ou null se inválido
 */
export function extractDateFromTaskId(taskId) {
  if (!isValidTaskId(taskId)) return null
  
  const dateStr = taskId.substring(0, 6)
  const yy = parseInt(dateStr.substring(0, 2))
  const mm = parseInt(dateStr.substring(2, 4)) - 1 // Mês em JS é 0-based
  const dd = parseInt(dateStr.substring(4, 6))
  
  // Assumir século 21 para anos 00-99
  const fullYear = 2000 + yy
  
  return new Date(fullYear, mm, dd)
}

/**
 * Gera um ID único garantindo que não existe conflito
 * @param {string} taskName - Nome da tarefa
 * @param {string[]} existingIds - Lista de IDs existentes
 * @returns {string} ID único
 */
export function generateUniqueTaskId(taskName, existingIds = []) {
  let baseId = generateTaskId(taskName)
  let uniqueId = baseId
  let counter = 1
  
  // Se já existe, adicionar sufixo numérico
  while (existingIds.includes(uniqueId)) {
    uniqueId = `${baseId}-${counter}`
    counter++
  }
  
  return uniqueId
}

// Exemplos de uso:
// generateTaskId("Implementar PostRepository") => "250115-implementar-postrepository"
// generateTaskId("Criar API de Autenticação") => "250115-criar-api-autenticacao"
// generateTaskId("Fix: Bug no loader") => "250115-fix-bug-loader"
