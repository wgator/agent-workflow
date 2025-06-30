const { loadModule } = window['vue3-sfc-loader']

// Options for vue3-sfc-loader
const options = {
  moduleCache: {
    vue: Vue
  },
  async getFile(url) {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`${res.statusText} (${url})`)
    return await res.text()
  },
  addStyle(textContent) {
    const style = Object.assign(document.createElement('style'), { textContent })
    const ref = document.head.getElementsByTagName('style')[0] || null
    document.head.insertBefore(style, ref)
  }
}

// Create Vue app
const { createApp } = Vue

async function initApp() {
  // Load App.vue
  const App = await loadModule('./src/App.vue', options)
  
  // Create app instance
  const app = createApp(App)
  
  
  // Aguardar carregamento do tema Aura
  let attempts = 0
  const maxAttempts = 20
  
  while (!window.PrimeUIX?.Themes?.Aura && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 100))
    attempts++
  }
  
  if (window.PrimeUIX?.Themes?.Aura) {
    app.use(PrimeVue.Config, {
      theme: {
        preset: window.PrimeUIX.Themes.Aura,
        options: {
          darkModeSelector: '.p-dark', // Desabilita detecção automática
          cssLayer: false
        }
      }
    })
  } else {
    app.use(PrimeVue.Config)
  }
  
  // Register PrimeVue components globally
  app.component('p-button', PrimeVue.Button)
  app.component('p-tabs', PrimeVue.Tabs)
  app.component('p-tablist', PrimeVue.TabList)
  app.component('p-tab', PrimeVue.Tab)
  app.component('p-tabpanels', PrimeVue.TabPanels)
  app.component('p-tabpanel', PrimeVue.TabPanel)
  app.component('p-datatable', PrimeVue.DataTable)
  app.component('p-column', PrimeVue.Column)
  app.component('p-tag', PrimeVue.Tag)
  app.component('p-card', PrimeVue.Card)
  app.component('p-inputtext', PrimeVue.InputText)
  app.component('p-drawer', PrimeVue.Drawer)
  app.component('p-dropdown', PrimeVue.Dropdown)
  
  // Force CSS injection by pre-rendering components to trigger style injection
  console.log('✓ Forçando injeção de CSS de todos os componentes...')
  
  // Create temporary components to force style injection
  const forceStyleInjection = () => {
    const tempDiv = document.createElement('div')
    tempDiv.style.cssText = 'position: absolute; left: -9999px; visibility: hidden;'
    document.body.appendChild(tempDiv)
    
    const tempApp = createApp({
      template: `
        <div>
          <p-button>Hidden</p-button>
          <p-tag>Hidden</p-tag>
          <p-card><template #content>Hidden</template></p-card>
          <p-inputtext v-model="text" />
          <p-dropdown v-model="selected" :options="[]" />
          <p-datatable :value="[]"><p-column field="id" header="ID" /></p-datatable>
          <p-drawer v-model:visible="visible">Hidden</p-drawer>
          <p-tabs><p-tablist><p-tab>Hidden</p-tab></p-tablist><p-tabpanels><p-tabpanel>Hidden</p-tabpanel></p-tabpanels></p-tabs>
        </div>
      `,
      data() {
        return {
          text: '',
          visible: false,
          selected: null
        }
      }
    })
    
    tempApp.use(PrimeVue.Config, {
      theme: {
        preset: window.PrimeUIX?.Themes?.Aura || {},
        options: {
          darkModeSelector: '.p-dark',
          cssLayer: false
        }
      }
    })
    tempApp.component('p-button', PrimeVue.Button)
    tempApp.component('p-tag', PrimeVue.Tag)
    tempApp.component('p-card', PrimeVue.Card)
    tempApp.component('p-inputtext', PrimeVue.InputText)
    tempApp.component('p-dropdown', PrimeVue.Dropdown)
    tempApp.component('p-datatable', PrimeVue.DataTable)
    tempApp.component('p-column', PrimeVue.Column)
    tempApp.component('p-drawer', PrimeVue.Drawer)
    tempApp.component('p-tabs', PrimeVue.Tabs)
    tempApp.component('p-tablist', PrimeVue.TabList)
    tempApp.component('p-tab', PrimeVue.Tab)
    tempApp.component('p-tabpanels', PrimeVue.TabPanels)
    tempApp.component('p-tabpanel', PrimeVue.TabPanel)
    
    tempApp.mount(tempDiv)
    
    // Remove temporary elements after a brief delay
    setTimeout(() => {
      tempApp.unmount()
      document.body.removeChild(tempDiv)
      console.log('✓ CSS de todos os componentes injetado com sucesso!')
    }, 100)
  }
  
  // Execute style injection
  forceStyleInjection()
  
  // Mount app
  app.mount('#app')
}

// Initialize
initApp().catch(console.error)