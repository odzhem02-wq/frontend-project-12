import * as yup from 'yup'

const signupSchema = (t) => yup.object({
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

export default signupSchema