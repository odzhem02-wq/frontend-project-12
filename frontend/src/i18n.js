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
        title: 'Войти',
        username: 'Ваш ник',
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
        addChannel: '+',
        addChannelPlaceholder: 'Имя канала',
        channelName: 'Имя канала',
        newChannel: 'Новый канал',
        renameChannel: 'Переименовать канал',
        deleteChannel: 'Удалить канал',
        areYouSure: 'Уверены?',
        cancel: 'Отмена',
        remove: 'Удалить',
        save: 'Отправить',
        rename: 'Переименовать',
        delete: 'Удалить',
        send: 'Отправить',
        newMessage: 'Новое сообщение',
        messagePlaceholder: 'Введите сообщение...',
        sendError: 'Ошибка соединения',
        channelExists: 'Канал уже существует',
        channelNameLength: 'От 3 до 20 символов',
        required: 'Обязательное поле',
        chatFallback: 'Чат',
        channelManagement: 'Управление каналом',
        loading: 'Загрузка...',
      },

      toasts: {
        channelCreated: 'Канал создан',
        channelRenamed: 'Канал переименован',
        channelRemoved: 'Канал удалён',
        networkError: 'Ошибка соединения',
        loadError: 'Не удалось загрузить данные',
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