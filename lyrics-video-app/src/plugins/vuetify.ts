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
          success: '#2a9d6e',
          error: '#d32f2f',
          warning: '#f9a825',
          info: '#1976d2',
          background: '#f5f5f5',
          surface: '#ffffff',
        },
      },
      dark: {
        dark: true,
        colors: {
          primary: '#89adff',
          secondary: '#9b8bff',
          success: '#42c78d',
          error: '#ff7b7b',
          warning: '#ffd36a',
          info: '#72b6ff',
          background: '#283143',
          surface: '#353f56',
          'on-background': '#f2f5ff',
          'on-surface': '#f5f7ff',
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
