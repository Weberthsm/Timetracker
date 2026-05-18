import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import { configureApi } from './services/api'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

configureApi(
  (message) => console.warn('[toast]', message),
  () => router.push('/login'),
)

app.mount('#app')
