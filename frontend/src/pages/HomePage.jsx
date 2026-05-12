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
  const [channelToDelete, setChannelToDelete] = useState(null)

  const inputRef = useRef(null)

  const currentChannel = channels.find(
    (channel) => channel.id === currentChannelId,
  )

  const currentMessages = messages.filter(
    (message) => message.channelId === currentChannelId,
  )

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

        const loadedChannels = channelsResponse.data
        const loadedMessages = messagesResponse.data

        dispatch(
          setChatData({
            channels: loadedChannels,
            messages: loadedMessages,
            currentChannelId: loadedChannels[0]?.id ?? null,
          }),
        )
      }
      catch (error) {
        console.error(error)
      }
      finally {
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
  }, [token, dispatch])

  useEffect(() => {
    inputRef.current?.focus()
  }, [currentChannelId])

  if (!token) {
    return <Navigate to="/login" />
  }

  if (loading) {
    return <div>{t('chat.loading')}</div>
  }

  const validationSchema = yup.object({
    name: yup
      .string()
      .trim()
      .min(3, t('chat.channelNameLength'))
      .max(20, t('chat.channelNameLength'))
      .notOneOf(
        channels.map((channel) => channel.name),
        t('chat.channelExists'),
      )
      .required(t('chat.required')),
  })

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!body.trim()) {
      return
    }

    try {
      await axios.post(
        '/api/v1/messages',
        {
          body: sanitizeText(body),
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
      inputRef.current?.focus()
    }
    catch (error) {
      console.error(error)
      toast.error(t('toasts.networkError'))
    }
  }

  const handleDeleteChannel = async () => {
    try {
      await axios.delete(`/api/v1/channels/${channelToDelete.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setChannelToDelete(null)

      toast.success(t('toasts.channelRemoved'))
    }
    catch (error) {
      console.error(error)
      toast.error(t('toasts.networkError'))
    }
  }

  return (
    <div className="container-fluid h-100">
      <div className="row h-100 bg-white flex-md-row">
        <div className="col-4 col-md-2 border-end pt-5 px-0 bg-light">
          <div className="d-flex justify-content-between align-items-center mb-2 ps-4 pe-2">
            <b>{t('chat.channels')}</b>

            <button
              type="button"
              className="p-0 text-primary btn btn-group-vertical"
              onClick={() => setShowAddForm((prev) => !prev)}
            >
              +
            </button>
          </div>

          {showAddForm && (
            <div className="px-4 mb-3">
              <Formik
                initialValues={{ name: '' }}
                validationSchema={validationSchema}
                onSubmit={async (values, { resetForm }) => {
                  try {
                    const response = await axios.post(
                      '/api/v1/channels',
                      { name: sanitizeText(values.name) },
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
                  }
                  catch (error) {
                    console.error(error)
                    toast.error(t('toasts.networkError'))
                  }
                }}
              >
                <Form>
                  <label
                    htmlFor="new-channel-name"
                    className="form-label"
                  >
                    {t('chat.channelName')}
                  </label>

                  <Field
                    id="new-channel-name"
                    name="name"
                    className="form-control mb-2"
                    placeholder={t('chat.channelName')}
                  />

                  <ErrorMessage
                    name="name"
                    component="div"
                    className="text-danger small mb-2"
                  />

                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                  >
                    {t('chat.send')}
                  </button>
                </Form>
              </Formik>
            </div>
          )}

          <ul className="nav flex-column nav-pills nav-fill px-2">
            {channels.map((channel) => (
              <li
                key={channel.id}
                className="nav-item w-100 mb-1"
              >
                <div className="d-flex">
                  <button
                    type="button"
                    className={`btn w-100 rounded-0 text-start ${
                      channel.id === currentChannelId
                        ? 'btn-secondary'
                        : ''
                    }`}
                    onClick={() => {
                      dispatch(setCurrentChannelId(channel.id))
                    }}
                  >
                    <span className="me-1">#</span>
                    {channel.name}
                  </button>

                  {channel.removable && (
                    <div className="dropdown">
                      <button
                        className="btn btn-secondary dropdown-toggle rounded-0"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        <span className="visually-hidden">
                          {t('chat.channelManagement')}
                        </span>
                      </button>

                      <ul className="dropdown-menu">
                        <li>
                          <button
                            type="button"
                            className="dropdown-item"
                          >
                            {t('chat.rename')}
                          </button>
                        </li>

                        <li>
                          <button
                            type="button"
                            className="dropdown-item"
                            onClick={() => setChannelToDelete(channel)}
                          >
                            {t('chat.remove')}
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="col p-0 h-100">
          <div className="bg-light mb-4 p-3 shadow-sm small">
            <p className="m-0">
              <b>
                #
                {currentChannel?.name}
              </b>
            </p>

            <span className="text-muted">
              {currentMessages.length}
              {' '}
              {t('chat.messagesCount')}
            </span>
          </div>

          <div className="chat-messages overflow-auto px-5">
            {currentMessages.map((message) => (
              <div
                key={message.id}
                className="text-break mb-2"
              >
                <b>{message.username}</b>
                {': '}
                {message.body}
              </div>
            ))}
          </div>

          <div className="mt-auto px-5 py-3">
            <form
              noValidate=""
              className="py-1 border rounded-2"
              onSubmit={handleSubmit}
            >
              <div className="input-group has-validation">
                <input
                  ref={inputRef}
                  name="body"
                  aria-label={t('chat.newMessage')}
                  placeholder={t('chat.messagePlaceholder')}
                  className="border-0 p-0 ps-2 form-control"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />

                <button
                  type="submit"
                  className="btn btn-group-vertical"
                >
                  {t('chat.send')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {channelToDelete && (
        <div
          className="modal modal-show fade d-block"
          tabIndex="-1"
          role="dialog"
        >
          <div
            className="modal-dialog"
            role="document"
          >
            <div className="modal-content">
              <div className="modal-header">
                <div className="modal-title h4">
                  {t('chat.remove')}
                </div>

                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setChannelToDelete(null)}
                />
              </div>

              <div className="modal-body">
                <p className="lead">
                  {t('chat.areYouSure')}
                </p>

                <div className="d-flex justify-content-end">
                  <button
                    type="button"
                    className="me-2 btn btn-secondary"
                    onClick={() => setChannelToDelete(null)}
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