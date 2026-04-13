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

const sanitizeText = (text) => {
  const cleanedByLib = filter.clean(text)

  return cleanedByLib.replace(
    /\b(сука|сучка|блять|хуй|нахуй|ебать|пиздец)\b/gi,
    '****',
  )
}

const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
}

const modalContentStyle = {
  backgroundColor: 'white',
  padding: '20px',
  borderRadius: '8px',
  minWidth: '320px',
  maxWidth: '90%',
}

const HomePage = () => {
  const token = localStorage.getItem('token')
  const username = localStorage.getItem('username')
  const dispatch = useDispatch()
  const chat = useSelector((state) => state.chat)
  const { t } = useTranslation()

  const channels = chat?.channels ?? []
  const messages = chat?.messages ?? []
  const currentChannelId = chat?.currentChannelId

  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  const [showAddForm, setShowAddForm] = useState(false)
  const [openMenuId, setOpenMenuId] = useState(null)

  const [channelToDelete, setChannelToDelete] = useState(null)
  const [channelToRename, setChannelToRename] = useState(null)
  const [deletingChannel, setDeletingChannel] = useState(false)

  const addChannelInputRef = useRef(null)
  const renameChannelInputRef = useRef(null)
  const messageInputRef = useRef(null)
  const messagesEndRef = useRef(null)
  const menuRef = useRef(null)

  const currentChannel = channels.find((channel) => channel.id === currentChannelId)

  const currentMessages = messages.filter(
    (message) => message.channelId === currentChannelId,
  )

  const currentMessagesLength = currentMessages.length
  const channelNames = channels.map((channel) => channel.name.toLowerCase())

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return undefined
    }

    const fetchData = async () => {
      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        }

        const [channelsResponse, messagesResponse] = await Promise.all([
          axios.get('/api/v1/channels', { headers }),
          axios.get('/api/v1/messages', { headers }),
        ])

        const loadedChannels = channelsResponse.data ?? []
        const loadedMessages = messagesResponse.data ?? []

        const generalChannel = loadedChannels.find(
          (channel) => channel.name.toLowerCase() === 'general',
        )

        dispatch(
          setChatData({
            channels: loadedChannels,
            messages: loadedMessages,
            currentChannelId: generalChannel?.id ?? loadedChannels[0]?.id ?? null,
          }),
        )
      } catch (error) {
        console.error(error)
        toast.error(t('toasts.loadError'))
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    const socket = io()

    socket.on('newMessage', (payload) => {
      dispatch(addMessage(payload))
    })

    socket.on('newChannel', (payload) => {
      dispatch(addChannel(payload))
    })

    socket.on('removeChannel', ({ id }) => {
      dispatch(removeChannel(id))
    })

    socket.on('renameChannel', (payload) => {
      dispatch(renameChannel(payload))
    })

    return () => {
      socket.disconnect()
    }
  }, [token, dispatch, t])

  useEffect(() => {
    if (showAddForm && addChannelInputRef.current) {
      addChannelInputRef.current.focus()
    }
  }, [showAddForm])

  useEffect(() => {
    if (channelToRename && renameChannelInputRef.current) {
      renameChannelInputRef.current.focus()
      renameChannelInputRef.current.select()
    }
  }, [channelToRename])

  useEffect(() => {
    if (!loading && messageInputRef.current) {
      messageInputRef.current.focus()
    }
  }, [loading, currentChannelId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentMessagesLength, currentChannelId])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null)
      }
    }

    if (openMenuId !== null) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openMenuId])

  if (!token) {
    return <Navigate to="/login" />
  }

  if (loading) {
    return <div>{t('chat.loading')}</div>
  }

  const addChannelSchema = yup.object({
    name: yup
      .string()
      .trim()
      .min(3, t('chat.channelNameLength'))
      .max(20, t('chat.channelNameLength'))
      .notOneOf(channelNames, t('chat.channelExists'))
      .required(t('chat.required')),
  })

  const renameChannelSchema = yup.object({
    name: yup
      .string()
      .trim()
      .min(3, t('chat.channelNameLength'))
      .max(20, t('chat.channelNameLength'))
      .notOneOf(
        channelNames.filter((name) => name !== channelToRename?.name.toLowerCase()),
        t('chat.channelExists'),
      )
      .required(t('chat.required')),
  })

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!body.trim() || !currentChannelId) {
      return
    }

    setSending(true)

    try {
      const cleanedBody = sanitizeText(body.trim())

      await axios.post(
        '/api/v1/messages',
        {
          body: cleanedBody,
          channelId: currentChannelId,
          username,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      setBody('')
      messageInputRef.current?.focus()
    } catch (error) {
      console.error(error)
      toast.error(t('chat.sendError'))
    } finally {
      setSending(false)
    }
  }

  const handleDeleteChannel = async () => {
    if (!channelToDelete) {
      return
    }

    setDeletingChannel(true)

    try {
      await axios.delete(`/api/v1/channels/${channelToDelete.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      toast.success(t('toasts.channelRemoved'))
      setChannelToDelete(null)
      setOpenMenuId(null)
    } catch (error) {
      console.error(error)
      toast.error(t('toasts.networkError'))
    } finally {
      setDeletingChannel(false)
    }
  }

  return (
    <>
      <div style={{ display: 'flex', gap: '20px', padding: '20px', minHeight: '100vh' }}>
        <div
          style={{
            width: '280px',
            borderRight: '1px solid #ccc',
            paddingRight: '20px',
            overflowWrap: 'anywhere',
          }}
        >
          <h2>{t('chat.channels')}</h2>

          <button
            type="button"
            onClick={() => setShowAddForm((prev) => !prev)}
            style={{ marginBottom: '12px' }}
          >
            {t('chat.addChannel')}
          </button>

          {showAddForm && (
            <Formik
              initialValues={{ name: '' }}
              validationSchema={addChannelSchema}
              onSubmit={async (values, { setSubmitting, resetForm }) => {
                try {
                  const cleanedName = sanitizeText(values.name.trim())

                  const response = await axios.post(
                    '/api/v1/channels',
                    { name: cleanedName },
                    {
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    },
                  )

                  const newChannel = response.data

                  dispatch(setCurrentChannelId(newChannel.id))
                  toast.success(t('toasts.channelCreated'))

                  resetForm()
                  setShowAddForm(false)
                } catch (error) {
                  console.error(error)
                  toast.error(t('toasts.networkError'))
                } finally {
                  setSubmitting(false)
                }
              }}
            >
              {({ isSubmitting }) => (
                <Form style={{ marginBottom: '15px' }}>
                  <label htmlFor="new-channel-name">{t('chat.addChannelPlaceholder')}</label>

                  <div style={{ marginBottom: '6px', display: 'flex', gap: '6px' }}>
                    <Field name="name">
                      {({ field }) => (
                        <input
                          {...field}
                          id="new-channel-name"
                          ref={addChannelInputRef}
                          placeholder={t('chat.addChannelPlaceholder')}
                          disabled={isSubmitting}
                          style={{ flexGrow: 1, minWidth: 0 }}
                        />
                      )}
                    </Field>

                    <button type="submit" disabled={isSubmitting}>
                      OK
                    </button>
                  </div>

                  <ErrorMessage
                    name="name"
                    component="div"
                    style={{ color: 'red', fontSize: '14px' }}
                  />
                </Form>
              )}
            </Formik>
          )}

          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {channels.map((channel) => {
              const isActive = channel.id === currentChannelId

              return (
                <li key={channel.id} style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                    <button
                      type="button"
                      onClick={() => dispatch(setCurrentChannelId(channel.id))}
                      style={{
                        flexGrow: 1,
                        minWidth: 0,
                        textAlign: 'left',
                        border: '1px solid #ccc',
                        backgroundColor: isActive ? '#e9ecef' : 'white',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {`# ${channel.name}`}
                    </button>

                    {channel.removable && (
                      <div
                        style={{ position: 'relative' }}
                        ref={openMenuId === channel.id ? menuRef : null}
                      >
                        <button
                          type="button"
                          aria-label={t('chat.channelManagement')}
                          onClick={() =>
                            setOpenMenuId(openMenuId === channel.id ? null : channel.id)
                          }
                          style={{ cursor: 'pointer' }}
                        >
                          ⋮
                        </button>

                        {openMenuId === channel.id && (
                          <div
                            style={{
                              position: 'absolute',
                              right: 0,
                              top: '100%',
                              backgroundColor: 'white',
                              border: '1px solid #ccc',
                              padding: '4px',
                              zIndex: 10,
                              minWidth: '170px',
                              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setChannelToRename(channel)
                                setOpenMenuId(null)
                              }}
                              style={{
                                display: 'block',
                                width: '100%',
                                textAlign: 'left',
                                marginBottom: '4px',
                                cursor: 'pointer',
                              }}
                            >
                              {t('chat.rename')}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setChannelToDelete(channel)
                                setOpenMenuId(null)
                              }}
                              style={{
                                display: 'block',
                                width: '100%',
                                textAlign: 'left',
                                cursor: 'pointer',
                              }}
                            >
                              {t('chat.delete')}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        <div style={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <h2
            style={{
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
            }}
          >
            {currentChannel ? currentChannel.name : t('chat.chatFallback')}
          </h2>

          <div
            style={{
              marginBottom: '20px',
              overflowY: 'auto',
              maxHeight: '60vh',
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
            }}
          >
            {currentMessages.map((message) => (
              <div
                key={message.id}
                style={{
                  marginBottom: '8px',
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere',
                }}
              >
                <b>{message.username}:</b> {message.body}
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit}>
            <input
              ref={messageInputRef}
              type="text"
              aria-label={t('chat.newMessage')}
              placeholder={t('chat.messagePlaceholder')}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={sending}
              style={{ marginRight: '8px' }}
            />
            <button type="submit" disabled={sending}>
              {t('chat.send')}
            </button>
          </form>
        </div>
      </div>

{channelToRename && (
  <div
    style={modalOverlayStyle}
    onClick={() => setChannelToRename(null)}
  >
    <div
      style={modalContentStyle}
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rename-channel-title"
    >
      <h3 id="rename-channel-title">{t('chat.rename')}</h3>

      <Formik
        initialValues={{ name: channelToRename.name }}
        validationSchema={renameChannelSchema}
        enableReinitialize
        onSubmit={async (values, { setSubmitting }) => {
          try {
            const trimmedName = values.name.trim()
            const cleanedName = sanitizeText(trimmedName)

            await axios.patch(
              `/api/v1/channels/${channelToRename.id}`,
              { name: cleanedName },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            )

            toast.success(t('toasts.channelRenamed'))
            setChannelToRename(null)
          } catch (error) {
            console.error(error)
            toast.error(t('toasts.networkError'))
          } finally {
            setSubmitting(false)
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <label htmlFor="rename-channel-name">{t('chat.addChannelPlaceholder')}</label>

            <div style={{ marginBottom: '10px' }}>
              <Field name="name">
                {({ field }) => (
                  <input
                    {...field}
                    id="rename-channel-name"
                    ref={renameChannelInputRef}
                    placeholder={t('chat.addChannelPlaceholder')}
                    disabled={isSubmitting}
                    style={{ width: '100%' }}
                  />
                )}
              </Field>
            </div>

            <ErrorMessage
              name="name"
              component="div"
              style={{ color: 'red', fontSize: '14px', marginBottom: '10px' }}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setChannelToRename(null)}
                disabled={isSubmitting}
              >
                {t('chat.cancel')}
              </button>
             <button type="submit" disabled={isSubmitting}>
  {t('chat.send')}
</button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  </div>
)}
    </>
  )
}

export default HomePage