import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as yup from 'yup'
import { useTranslation } from 'react-i18next'

const SignupPage = () => {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const [signupFailed, setSignupFailed] = useState(false)
  const { t } = useTranslation()

  if (token) {
    return <Navigate to="/" />
  }

  const validationSchema = yup.object({
    username: yup
      .string()
      .min(3, t('signup.usernameLength'))
      .max(20, t('signup.usernameLength'))
      .required(t('signup.required')),
    password: yup
      .string()
      .min(6, t('signup.passwordLength'))
      .required(t('signup.required')),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref('password')], t('signup.passwordsMustMatch'))
      .required(t('signup.required')),
  })

  const handleSubmit = async (values, { setSubmitting }) => {
    setSignupFailed(false)

    try {
      const response = await axios.post('/api/v1/signup', {
        username: values.username,
        password: values.password,
      })

      const { token: newToken, username } = response.data

      localStorage.setItem('token', newToken)
      localStorage.setItem('username', username)

      navigate('/')
    } catch (error) {
      if (error.response?.status === 409) {
        setSignupFailed(true)
      } else {
        console.error(error)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h1>{t('signup.title')}</h1>

      <Formik
        initialValues={{
          username: '',
          password: '',
          confirmPassword: '',
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form>
            <div style={{ marginBottom: '10px' }}>
              <label htmlFor="username">{t('signup.username')}</label>
              <div>
                <Field id="username" name="username" type="text" />
              </div>
              <ErrorMessage
                name="username"
                component="div"
                style={{ color: 'red' }}
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label htmlFor="password">{t('signup.password')}</label>
              <div>
                <Field id="password" name="password" type="password" />
              </div>
              <ErrorMessage
                name="password"
                component="div"
                style={{ color: 'red' }}
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label htmlFor="confirmPassword">{t('signup.confirmPassword')}</label>
              <div>
                <Field
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                />
              </div>
              <ErrorMessage
                name="confirmPassword"
                component="div"
                style={{ color: 'red' }}
              />
            </div>

            {signupFailed && (
              <div style={{ color: 'red', marginBottom: '10px' }}>
                {t('signup.errorUserExists')}
              </div>
            )}

            <button type="submit" disabled={isSubmitting}>
              {t('signup.submit')}
            </button>
          </Form>
        )}
      </Formik>

      <div style={{ marginTop: '12px' }}>
        {t('signup.hasAccount')} <Link to="/login">{t('signup.login')}</Link>
      </div>
    </div>
  )
}

export default SignupPage