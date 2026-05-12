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
  backgroundColor: 'rgba(0, 0, 0, 0.35)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1050,
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
  const [channelToRename, setChannelToRename] = useState(null)
  const [channelToDelete, setChannelToDelete] = useState(null)

  const messageInputRef = useRef(null)
  const addChannelInputRef = useRef(null)

  const currentChannel = channels.find((channel) => channel.id === currentChannelId)

  const currentMessages = messages.filter(
    (message) => message.channelId === currentChannelId,
  )

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
        channelNames.filter((name) => name !== channelToRename?.name),
        t('chat.channelExists'),
      )
      .required(t('chat.required')),
  })

  const handleSendMessage = async (e) => {
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
      toast.error(t('toasts.networkError'))
    } finally {
      setSending(false)
    }
  }

  const handleDeleteChannel = async () => {
    if (!channelToDelete) {
      return
    }

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
    }
  }

  return (
    <div className="container-fluid h-100">
      <div className="row h-100 bg-white flex-md-row" style={{ minHeight: '100vh' }}>
        <div className="col-4 col-md-3 border-end pt-4 px-0 bg-light">
          <div className="d-flex justify-content-between align-items-center mb-2 px-3">
            <b>{t('chat.channels')}</b>

            <button
              type="button"
              className="p-0 text-primary btn btn-group-vertical"
              onClick={() => setShowAddForm((prev) => !prev)}
            >
              {t('chat.addChannel')}
            </button>
          </div>

          {showAddForm && (
            <div className="px-3 mb-3">
              <Formik
                initialValues={{ name: '' }}
                validationSchema={addChannelSchema}
                onSubmit={async (values, { resetForm, setSubmitting }) => {
                  try {
                    const sanitizedName = sanitizeText(values.name.trim())

                    const response = await axios.post(
                      '/api/v1/channels',
                      { name: sanitizedName },
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
                  <Form>
                    <label htmlFor="new-channel-name" className="form-label">
                      {t('chat.channelName')}
                    </label>

                    <Field name="name">
                      {({ field }) => (
                        <input
                          {...field}
                          id="new-channel-name"
                          ref={addChannelInputRef}
                          className="form-control mb-2"
                          placeholder={t('chat.channelName')}
                          disabled={isSubmitting}
                        />
                      )}
                    </Field>

                    <ErrorMessage
                      name="name"
                      component="div"
                      className="text-danger small mb-2"
                    />

                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      disabled={isSubmitting}
                    >
                      {t('chat.send')}
                    </button>
                  </Form>
                )}
              </Formik>
            </div>
          )}

          <ul className="nav flex-column nav-pills nav-fill px-2">
            {channels.map((channel) => {
              const isActive = channel.id === currentChannelId
              const isMenuOpen = openMenuId === channel.id

              return (
                <li key={channel.id} className="nav-item w-100 mb-1">
                  <div className="d-flex">
                    <button
                      type="button"
                      className={`btn w-100 rounded-0 text-start text-truncate ${
                        isActive ? 'btn-secondary' : ''
                      }`}
                      onClick={() => dispatch(setCurrentChannelId(channel.id))}
                    >
                      <span className="me-1">#</span>
                      {channel.name}
                    </button>

                    {channel.removable && (
                      <div className="dropdown">
                        <button
                          type="button"
                          className="btn btn-secondary dropdown-toggle rounded-0"
                          onClick={() => setOpenMenuId(isMenuOpen ? null : channel.id)}
                        >
                          <span className="visually-hidden">
                            {t('chat.channelManagement')}
                          </span>
                          <span aria-hidden="true">{t('chat.channelManagement')}</span>
                        </button>

                        {isMenuOpen && (
                          <ul className="dropdown-menu show">
                            <li>
                              <button
                                type="button"
                                className="dropdown-item"
                                onClick={() => {
                                  setChannelToRename(channel)
                                  setOpenMenuId(null)
                                }}
                              >
                                {t('chat.rename')}
                              </button>
                            </li>

                            <li>
                              <button
                                type="button"
                                className="dropdown-item"
                                onClick={() => {
                                  setChannelToDelete(channel)
                                }}
                              >
                                {t('chat.delete')}
                              </button>
                            </li>
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="col p-0 h-100 d-flex flex-column">
          <div className="bg-light mb-4 p-3 shadow-sm small">
            <p className="m-0">
              <b>
                #
                {' '}
                {currentChannel?.name ?? t('chat.chatFallback')}
              </b>
            </p>

            <span className="text-muted">
              {currentMessages.length}
              {' '}
              {t('chat.messagesCount')}
            </span>
          </div>

          <div className="chat-messages overflow-auto px-5 flex-grow-1">
            {currentMessages.map((message) => (
              <div key={message.id} className="text-break mb-2">
                <b>{message.username}</b>
                {': '}
                {message.body}
              </div>
            ))}
          </div>

          <div className="mt-auto px-5 py-3">
            <form
              noValidate
              className="py-1 border rounded-2"
              onSubmit={handleSendMessage}
            >
              <div className="input-group has-validation">
                <input
                  ref={messageInputRef}
                  name="body"
                  aria-label={t('chat.newMessage')}
                  placeholder={t('chat.messagePlaceholder')}
                  className="border-0 p-0 ps-2 form-control"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  disabled={sending}
                />

                <button
                  type="submit"
                  className="btn btn-group-vertical"
                  disabled={sending}
                >
                  {t('chat.send')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {channelToRename && (
        <div style={modalOverlayStyle}>
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <div className="modal-title h4">
                  {t('chat.renameChannel')}
                </div>

                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setChannelToRename(null)}
                />
              </div>

              <div className="modal-body">
                <Formik
                  initialValues={{ name: channelToRename.name }}
                  enableReinitialize
                  validationSchema={renameChannelSchema}
                  onSubmit={async (values, { setSubmitting }) => {
                    try {
                      const sanitizedName = sanitizeText(values.name.trim())

                      await axios.patch(
                        `/api/v1/channels/${channelToRename.id}`,
                        { name: sanitizedName },
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
                      <label htmlFor="rename-channel-name" className="form-label">
                        {t('chat.channelName')}
                      </label>

                      <Field
                        id="rename-channel-name"
                        name="name"
                        className="form-control mb-2"
                        aria-label={t('chat.channelName')}
                        autoFocus
                      />

                      <ErrorMessage
                        name="name"
                        component="div"
                        className="text-danger small mb-2"
                      />

                      <div className="d-flex justify-content-end">
                        <button
                          type="button"
                          className="me-2 btn btn-secondary"
                          onClick={() => setChannelToRename(null)}
                          disabled={isSubmitting}
                        >
                          {t('chat.cancel')}
                        </button>

                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={isSubmitting}
                        >
                          {t('chat.save')}
                        </button>
                      </div>
                    </Form>
                  )}
                </Formik>
              </div>
            </div>
          </div>
        </div>
      )}

      {channelToDelete && (
        <div style={modalOverlayStyle}>
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <div className="modal-title h4">
                  {t('chat.deleteChannel')}
                </div>

                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => {
                    setChannelToDelete(null)
                    setOpenMenuId(null)
                  }}
                />
              </div>

              <div className="modal-body">
                <p className="lead">{t('chat.areYouSure')}</p>

                <div className="d-flex justify-content-end">
                  <button
                    type="button"
                    className="me-2 btn btn-secondary"
                    onClick={() => {
                      setChannelToDelete(null)
                      setOpenMenuId(null)
                    }}
                  >
                    {t('chat.cancel')}
                  </button>

                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleDeleteChannel}
                  >
                    {t('chat.remove')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HomePage