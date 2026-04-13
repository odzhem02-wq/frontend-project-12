import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Formik, Form, Field } from 'formik'
import { useTranslation } from 'react-i18next'

const LoginPage = () => {
  const navigate = useNavigate()
  const [authFailed, setAuthFailed] = useState(false)
  const { t } = useTranslation()

  const handleSubmit = async (values, { setSubmitting }) => {
    setAuthFailed(false)

    try {
      const response = await axios.post('/api/v1/login', values)
      const { token, username } = response.data

      localStorage.setItem('token', token)
      localStorage.setItem('username', username)

      navigate('/')
    } catch (error) {
      setAuthFailed(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h1>{t('login.submit')}</h1>

      <Formik
        initialValues={{ username: '', password: '' }}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form>
            <div style={{ marginBottom: '10px' }}>
              <label htmlFor="username">{t('login.username')}</label>
              <div>
                <Field
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                />
              </div>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label htmlFor="password">{t('login.password')}</label>
              <div>
                <Field
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {authFailed && (
              <div style={{ color: 'red', marginBottom: '10px' }}>
                {t('login.errorAuth')}
              </div>
            )}

            <button type="submit" disabled={isSubmitting}>
              {t('login.submit')}
            </button>
          </Form>
        )}
      </Formik>

      <div style={{ marginTop: '12px' }}>
        {t('login.noAccount')} <Link to="/signup">{t('login.signup')}</Link>
      </div>
    </div>
  )
}

export default LoginPage