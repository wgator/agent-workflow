import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

// PrimeVue
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import 'primeicons/primeicons.css'

// PrimeVue Components
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Drawer from 'primevue/drawer'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ProgressSpinner from 'primevue/progressspinner'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// PrimeVue
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      prefix: 'p',
      darkModeSelector: '.dark',
      cssLayer: false
    }
  }
})

// Registrar componentes globalmente
app.component('p-card', Card)
app.component('p-tag', Tag)
app.component('p-tabs', Tabs)
app.component('p-tablist', TabList)
app.component('p-tab', Tab)
app.component('p-tabpanels', TabPanels)
app.component('p-tabpanel', TabPanel)
app.component('p-button', Button)
app.component('p-inputtext', InputText)
app.component('p-select', Select)
app.component('p-drawer', Drawer)
app.component('p-datatable', DataTable)
app.component('p-column', Column)
app.component('p-progressspinner', ProgressSpinner)

app.mount('#app')
