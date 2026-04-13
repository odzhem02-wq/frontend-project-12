import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import { io } from 'socket.io-client'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as yup from 'yup'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import filter from 'leo-profanity'

import {
  setChatData,
  setCurrentChannelId,
  addMessage,
  addChannel,
  removeChannel,
  renameChannel,
} from '../store/chatSlice'

filter.loadDictionary('en')

const sanitizeText = (text) => filter.clean(text)

const HomePage = () => {
  const token = localStorage.getItem('token')
  const username = localStorage.getItem('username')

  const dispatch = useDispatch()
  const { t } = useTranslation()

  const { channels = [], messages = [], currentChannelId } = useSelector(
    (state) => state.chat,
  )

  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  const messageRef = useRef(null)

  const currentMessages = messages.filter(
    (m) => m.channelId === currentChannelId,
  )

  const channelNames = channels.map((c) => c.name)

  useEffect(() => {
    if (!token) return

    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` }

        const [chRes, msgRes] = await Promise.all([
          axios.get('/api/v1/channels', { headers }),
          axios.get('/api/v1/messages', { headers }),
        ])

        const general = chRes.data.find((c) => c.name === 'general')

        dispatch(
          setChatData({
            channels: chRes.data,
            messages: msgRes.data,
            currentChannelId: general?.id ?? chRes.data[0]?.id,
          }),
        )
      } catch {
        toast.error(t('toasts.networkError'))
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    const socket = io()

    socket.on('newMessage', (payload) => dispatch(addMessage(payload)))
    socket.on('newChannel', (payload) => dispatch(addChannel(payload)))
    socket.on('removeChannel', ({ id }) => dispatch(removeChannel(id)))
    socket.on('renameChannel', (payload) => dispatch(renameChannel(payload)))

    return () => socket.disconnect()
  }, [token, dispatch, t])

  if (!token) return <Navigate to="/login" />
  if (loading) return <div>{t('chat.loading')}</div>

  const addSchema = yup.object({
    name: yup
      .string()
      .min(3, t('chat.channelNameLength'))
      .max(20, t('chat.channelNameLength'))
      .notOneOf(channelNames, t('chat.channelExists'))
      .required(t('chat.required')),
  })

  const sendMessage = async (e) => {
    e.preventDefault()

    if (!body.trim()) return

    try {
      await axios.post(
        '/api/v1/messages',
        {
          body: sanitizeText(body),
          channelId: currentChannelId,
          username,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      setBody('')
      messageRef.current?.focus()
    } catch {
      toast.error(t('toasts.networkError'))
    }
  }

  return (
    <div style={{ display: 'flex', padding: '20px' }}>
      {/* CHANNELS */}
      <div style={{ width: '250px' }}>
        <h2>{t('chat.channels')}</h2>

        {/* КНОПКА + */}
        <button onClick={() => setShowAddForm(!showAddForm)}>
          {t('chat.addChannel')}
        </button>

        {/* ФОРМА ДОБАВЛЕНИЯ */}
        {showAddForm && (
          <Formik
            initialValues={{ name: '' }}
            validationSchema={addSchema}
            onSubmit={async (values, { resetForm }) => {
              try {
                const res = await axios.post(
                  '/api/v1/channels',
                  { name: sanitizeText(values.name) },
                  {
                    headers: { Authorization: `Bearer ${token}` },
                  },
                )

                dispatch(setCurrentChannelId(res.data.id))
                toast.success(t('toasts.channelCreated'))

                resetForm()
                setShowAddForm(false)
              } catch {
                toast.error(t('toasts.networkError'))
              }
            }}
          >
            <Form>
              <Field
                name="name"
                placeholder={t('chat.addChannelPlaceholder')}
              />
              <ErrorMessage name="name" component="div" />

              {/* ВАЖНО: Отправить */}
              <button type="submit">{t('chat.send')}</button>
            </Form>
          </Formik>
        )}

        <ul>
          {channels.map((c) => (
            <li key={c.id}>
              <button onClick={() => dispatch(setCurrentChannelId(c.id))}>
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* CHAT */}
      <div style={{ marginLeft: '20px', flex: 1 }}>
        <div>
          {currentMessages.map((m) => (
            <div key={m.id}>
              <b>{m.username}</b>: {m.body}
            </div>
          ))}
        </div>

        {/* ОТПРАВКА СООБЩЕНИЯ */}
        <form onSubmit={sendMessage}>
          <input
            ref={messageRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t('chat.messagePlaceholder')}
            aria-label={t('chat.newMessage')}
          />

          <button type="submit">{t('chat.send')}</button>
        </form>
      </div>
    </div>
  )
}

export default HomePage