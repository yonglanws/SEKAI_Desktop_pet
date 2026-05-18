import { createApp } from 'vue'
import App from './App.vue'
import './assets/styles/global.css'
import './assets/styles/variables.css'

const app = createApp(App)

app.config.errorHandler = (err, instance, info) => {
  console.error('[Vue Error]', err, info)
}

app.mount('#app')
