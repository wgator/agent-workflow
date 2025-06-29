import Ajv from 'ajv'
import addFormats from 'ajv-formats'

/**
 * Serviço de validação de schema para tasks
 */
class TaskValidator {
  constructor() {
    this.schema = {
      type: 'object',
      required: ['meta', 'tasks'],
      properties: {
        meta: {
          type: 'object',
          required: ['updated'],
          properties: {
            updated: { type: 'string', format: 'date-time' },
            focus: { type: 'string' }
          }
        },
        tasks: {
          type: 'object',
          patternProperties: {
            "^[a-z0-9-]+$": {
              type: 'object',
              required: ['title', 'status', 'created_at'],
              properties: {
                title: { type: 'string' },
                status: { 
                  type: 'string',
                  enum: ['backlog', 'active', 'completed']
                },
                category: { type: 'string' },
                description: { type: 'string' },
                dependencies: { 
                  type: 'array', 
                  items: { type: 'string' } 
                },
                created_at: { type: 'string', format: 'date-time' },
                order: { type: 'string' },
                
                // Campos opcionais para tarefas ativas
                phase: { 
                  type: 'string',
                  enum: ['plan', 'spec', 'detail', 'implementation', 'test', 'review']
                },
                started_at: { type: 'string', format: 'date-time' },
                completed_at: { type: 'string', format: 'date-time' },
                phases_completed: {
                  type: 'array',
                  items: { 
                    type: 'string',
                    enum: ['plan', 'spec', 'detail', 'implementation', 'test', 'review']
                  }
                },
                files: {
                  type: 'object',
                  properties: {
                    planned: { type: 'array', items: { type: 'string' } },
                    created: { type: 'array', items: { type: 'string' } },
                    modified: { type: 'array', items: { type: 'string' } },
                    tested: { type: 'array', items: { type: 'string' } }
                  }
                },
                notes: {
                  type: 'object',
                  patternProperties: {
                    "^[a-z]+$": { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    }
    
    const ajv = new Ajv({ allowUnionTypes: true })
    addFormats(ajv)
    this.validator = ajv.compile(this.schema)
  }
  
  /**
   * Valida dados do arquivo tasks.json
   * @param {Object} data - Dados para validar
   * @throws {Error} Se dados são inválidos
   */
  validate(data) {
    if (!this.validator(data)) {
      throw new Error(`Invalid schema: ${JSON.stringify(this.validator.errors)}`)
    }
  }
  
  /**
   * Cria estrutura inicial válida
   * @returns {Object} Estrutura inicial do arquivo
   */
  createInitialStructure() {
    return {
      meta: {
        updated: new Date().toISOString(),
        focus: 'Início do projeto'
      },
      tasks: {}
    }
  }
}

export default TaskValidator
