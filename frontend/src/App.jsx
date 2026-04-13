import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import NotFoundPage from './pages/NotFoundPage'
import Header from './components/Header'

const App = () => {
  const token = localStorage.getItem('token')

  return (
    <>
      <Header />

      <main style={{ padding: '0 20px 20px' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/login"
            element={token ? <Navigate to="/" /> : <LoginPage />}
          />
          <Route
            path="/signup"
            element={token ? <Navigate to="/" /> : <SignupPage />}
          />
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
}

export default App