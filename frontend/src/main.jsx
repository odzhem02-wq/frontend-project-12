import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { Provider as RollbarProvider, ErrorBoundary } from '@rollbar/react'
import Rollbar from 'rollbar'

import App from './App'
import store from './store'
import './i18n'
import './index.css'

const rollbarConfig = {
  accessToken: '519ef61d787b247cb9a378510f553d23',
  environment: 'development',
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