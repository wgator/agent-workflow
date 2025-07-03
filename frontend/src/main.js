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
import TabView from 'primevue/tabview'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Drawer from 'primevue/drawer'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ProgressSpinner from 'primevue/progressspinner'
import Badge from 'primevue/badge'
import Timeline from 'primevue/timeline'
import Chip from 'primevue/chip'
import Accordion from 'primevue/accordion'
import AccordionTab from 'primevue/accordiontab'

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
app.component('p-tab-view', TabView)
app.component('p-tab-panel', TabPanel)
app.component('p-button', Button)
app.component('p-inputtext', InputText)
app.component('p-input-text', InputText)
app.component('p-textarea', Textarea)
app.component('p-select', Select)
app.component('p-drawer', Drawer)
app.component('p-datatable', DataTable)
app.component('p-column', Column)
app.component('p-progressspinner', ProgressSpinner)
app.component('p-badge', Badge)
app.component('p-timeline', Timeline)
app.component('p-chip', Chip)
app.component('p-accordion', Accordion)
app.component('p-accordion-tab', AccordionTab)

app.mount('#app')
