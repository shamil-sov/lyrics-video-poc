import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'

export default createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#4a76d4',
          secondary: '#7c5cbf',
          great: '#1f8f5f',
          success: '#2a9d6e',
          error: '#d32f2f',
          warning: '#f9a825',
          info: '#1976d2',
          background: '#f5f5f5',
          surface: '#ffffff',
        },
      },
    },
  },
  defaults: {
    VCard: {
      rounded: 'lg',
      elevation: 2,
    },
  },
})
