import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import { setupPersistedStores } from './utils/persistedState'

const app = createApp(App)
const pinia = createPinia()

setupPersistedStores(pinia)

app.use(pinia)
app.use(router)
app.mount('#app')
