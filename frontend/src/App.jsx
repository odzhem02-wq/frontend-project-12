import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import NotFoundPage from './pages/NotFoundPage'
import Header from './components/Header'
import PrivateRoute from './components/PrivateRoute'

const App = () => (
  <>
    <Header />

    <main style={{ padding: '0 20px 20px' }}>
      <Routes>
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<HomePage />} />
        </Route>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </main>

    <ToastContainer
      position="top-right"
      autoClose={3000}
      closeOnClick
      pauseOnHover
    />
  </>
)

export default App