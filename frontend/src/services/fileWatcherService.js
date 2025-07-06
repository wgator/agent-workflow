/**
 * Serviço para monitorar mudanças no arquivo tasks.json via Server-Sent Events
 * Faz reload automático da página quando o arquivo é alterado
 */
class FileWatcherService {
  constructor() {
    this.eventSource = null
    this.isConnected = false
    this.reconnectInterval = null
    this.maxReconnectAttempts = 5
    this.reconnectAttempts = 0
    this.reconnectDelay = 1000 // 1 segundo
  }

  /**
   * Inicia a conexão SSE
   */
  start() {
    if (this.isConnected) {
      console.log('🔄 FileWatcher already connected')
      return
    }

    this.connect()
  }

  /**
   * Para a conexão SSE
   */
  stop() {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }

    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval)
      this.reconnectInterval = null
    }

    this.isConnected = false
    this.reconnectAttempts = 0
    console.log('🔌 FileWatcher disconnected')
  }

  /**
   * Conecta ao endpoint SSE
   */
  connect() {
    try {
      console.log('📡 Connecting to file watcher...')
      
      this.eventSource = new EventSource('/api/events')
      
      this.eventSource.onopen = () => {
        console.log('✅ FileWatcher connected')
        this.isConnected = true
        this.reconnectAttempts = 0
        
        // Limpa timeout de reconexão se estava ativo
        if (this.reconnectInterval) {
          clearTimeout(this.reconnectInterval)
          this.reconnectInterval = null
        }
      }

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('📨 FileWatcher event:', data)
          
          this.handleEvent(data)
        } catch (error) {
          console.error('❌ Error parsing SSE event:', error)
        }
      }

      this.eventSource.onerror = (error) => {
        console.error('❌ FileWatcher connection error:', error)
        this.isConnected = false
        
        // Fecha conexão atual
        if (this.eventSource) {
          this.eventSource.close()
          this.eventSource = null
        }

        // Tenta reconectar
        this.scheduleReconnect()
      }

    } catch (error) {
      console.error('❌ Failed to create EventSource:', error)
      this.scheduleReconnect()
    }
  }

  /**
   * Agenda uma tentativa de reconexão
   */
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`❌ Max reconnect attempts (${this.maxReconnectAttempts}) reached`)
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * this.reconnectAttempts

    console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`)

    this.reconnectInterval = setTimeout(() => {
      this.connect()
    }, delay)
  }

  /**
   * Manipula eventos recebidos via SSE
   */
  handleEvent(data) {
    switch (data.type) {
      case 'connected':
        console.log('🔗 FileWatcher ready:', data.message)
        break

      case 'file_changed':
        if (data.file === 'tasks.json') {
          console.log('📝 tasks.json changed, reloading page...')
          
          // Pequeno delay para garantir que o servidor processou a mudança
          setTimeout(() => {
            window.location.reload()
          }, 200)
        }
        break

      default:
        console.log('🤷 Unknown event type:', data.type)
    }
  }

  /**
   * Verifica se está conectado
   */
  get connected() {
    return this.isConnected
  }
}

// Exporta uma instância singleton
export default new FileWatcherService()
