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
  const { t } = useTranslation()

  const { channels = [], messages = [], currentChannelId } = useSelector(
    (state) => state.chat,
  )

  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [channelToDelete, setChannelToDelete] = useState(null)
  const [channelToRename, setChannelToRename] = useState(null)
  const [deletingChannel, setDeletingChannel] = useState(false)
  const [renameValue, setRenameValue] = useState('')

  const addChannelInputRef = useRef(null)
  const messageInputRef = useRef(null)
  const messagesEndRef = useRef(null)
  const menuRef = useRef(null)

  const currentChannel = channels.find((channel) => channel.id === currentChannelId)

  const currentMessages = messages.filter(
    (message) => message.channelId === currentChannelId,
  )

  const currentMessagesLength = currentMessages.length
  const channelNames = channels.map((channel) => channel.name)

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

        const generalChannel = loadedChannels.find((channel) => channel.name === 'general')

        dispatch(
          setChatData({
            channels: loadedChannels,
            messages: loadedMessages,
            currentChannelId: generalChannel?.id ?? loadedChannels[0]?.id ?? null,
          }),
        )
      } catch (error) {
        console.error(error)
        toast.error(t('toasts.networkError'))
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

  useEffect(() => {
    if (channelToRename) {
      setRenameValue(channelToRename.name)
    }
  }, [channelToRename])

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

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!body.trim() || !currentChannelId) {
      return
    }

    setSending(true)

    try {
      await axios.post(
        '/api/v1/messages',
        {
          body: sanitizeText(body.trim()),
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
            width: '320px',
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
                  const response = await axios.post(
                    '/api/v1/channels',
                    { name: sanitizeText(values.name.trim()) },
                    {
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    },
                  )

                  const newChannel = response.data

                  dispatch(addChannel(newChannel))
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
                      {t('chat.send')}
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
              const isMenuOpen = openMenuId === channel.id

              return (
                <li key={channel.id} style={{ marginBottom: '8px' }}>
                  <div
                    style={{
                      display: 'flex',
                      gap: '6px',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                    }}
                  >
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
                        style={{ width: '100%' }}
                        ref={isMenuOpen ? menuRef : null}
                      >
                        <button
                          type="button"
                          onClick={() => setOpenMenuId(isMenuOpen ? null : channel.id)}
                          style={{
                            marginTop: '6px',
                            cursor: 'pointer',
                          }}
                        >
                          {t('chat.channelManagement')}
                        </button>

                        {isMenuOpen && (
                          <div
                            style={{
                              marginTop: '6px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                              padding: '8px',
                              border: '1px solid #ccc',
                              backgroundColor: 'white',
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

      {channelToDelete && (
        <div
          style={modalOverlayStyle}
          onClick={() => {
            if (!deletingChannel) {
              setChannelToDelete(null)
            }
          }}
        >
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <h3>{t('chat.deleteChannel')}</h3>
            <p>{t('chat.areYouSure')}</p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setChannelToDelete(null)}
                disabled={deletingChannel}
              >
                {t('chat.cancel')}
              </button>
              <button
                type="button"
                onClick={handleDeleteChannel}
                disabled={deletingChannel}
              >
                {t('chat.remove')}
              </button>
            </div>
          </div>
        </div>
      )}

      {channelToRename && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3>{t('chat.renameChannel')}</h3>

            <form
              onSubmit={async (e) => {
                e.preventDefault()

                const name = sanitizeText(renameValue.trim())

                try {
                  await axios.patch(
                    `/api/v1/channels/${channelToRename.id}`,
                    { name },
                    {
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    },
                  )

                  dispatch(renameChannel({ id: channelToRename.id, name }))
                  toast.success(t('toasts.channelRenamed'))
                  setChannelToRename(null)
                } catch (error) {
                  console.error(error)
                  toast.error(t('toasts.networkError'))
                }
              }}
            >
              <label htmlFor="rename-channel-name">{t('chat.channelName')}</label>
              <input
                id="rename-channel-name"
                name="name"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                aria-label={t('chat.channelName')}
                autoFocus
              />

              <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                <button type="submit">
                  {t('chat.save')}
                </button>

                <button
                  type="button"
                  onClick={() => setChannelToRename(null)}
                >
                  {t('chat.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default HomePage