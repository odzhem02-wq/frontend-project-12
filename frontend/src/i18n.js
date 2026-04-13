import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  ru: {
    translation: {
      header: {
        brand: 'Hexlet Chat',
        logout: 'Выйти',
      },
      login: {
        title: 'Вход',
        username: 'Имя пользователя',
        password: 'Пароль',
        submit: 'Войти',
        errorAuth: 'Неверные имя пользователя или пароль',
        noAccount: 'Нет аккаунта?',
        signup: 'Регистрация',
      },
      signup: {
        title: 'Регистрация',
        username: 'Имя пользователя',
        password: 'Пароль',
        confirmPassword: 'Подтвердите пароль',
        submit: 'Зарегистрироваться',
        hasAccount: 'Уже есть аккаунт?',
        login: 'Войти',
        errorUserExists: 'Такой пользователь уже существует',
        required: 'Обязательное поле',
        usernameLength: 'От 3 до 20 символов',
        passwordLength: 'Не менее 6 символов',
        passwordsMustMatch: 'Пароли должны совпадать',
      },
      notFound: {
        title: '404',
        text: 'Страница не найдена',
        link: 'На главную',
      },
      chat: {
        channels: 'Каналы',
        addChannel: '+ Добавить канал',
        addChannelPlaceholder: 'Имя канала',
        renameChannel: 'Переименовать канал',
        deleteChannel: 'Удалить канал',
        areYouSure: 'Уверена?',
        cancel: 'Отмена',
        remove: 'Удалить',
        save: 'Сохранить',
        rename: '✏️ Переименовать',
        delete: '❌ Удалить',
        send: 'Отправить',
        messagePlaceholder: 'Введите сообщение...',
        sendError: 'Ошибка при отправке сообщения',
        channelExists: 'Канал уже существует',
        channelNameLength: 'От 3 до 20 символов',
        required: 'Обязательное поле',
        chatFallback: 'Чат',
      },
    },
  },
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ru',
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n