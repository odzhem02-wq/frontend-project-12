import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { Provider as RollbarProvider, ErrorBoundary } from '@rollbar/react'
import Rollbar from 'rollbar'

import App from './App'
import store from './store'
import './i18n'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'

const rollbarConfig = {
  accessToken: import.meta.env.VITE_ROLLBAR_TOKEN,
  environment: import.meta.env.VITE_ENV || 'development',
  captureUncaught: true,
  captureUnhandledRejections: true,
}

const rollbar = new Rollbar(rollbarConfig)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RollbarProvider instance={rollbar}>
      <ErrorBoundary>
        <Provider store={store}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </Provider>
      </ErrorBoundary>
    </RollbarProvider>
  </React.StrictMode>,
)
