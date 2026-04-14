import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import { io } from 'socket.io-client'
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

  const { channels, messages, currentChannelId } = useSelector((state) => state.chat)

  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)

  const [openMenuId, setOpenMenuId] = useState(null)
  const [channelToDelete, setChannelToDelete] = useState(null)

  const messageInputRef = useRef(null)

  const currentMessages = messages.filter((m) => m.channelId === currentChannelId)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` }

        const [channelsRes, messagesRes] = await Promise.all([
          axios.get('/api/v1/channels', { headers }),
          axios.get('/api/v1/messages', { headers }),
        ])

        const general = channelsRes.data.find((c) => c.name === 'general')

        dispatch(
          setChatData({
            channels: channelsRes.data,
            messages: messagesRes.data,
            currentChannelId: general?.id ?? channelsRes.data[0]?.id,
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

    socket.on('newMessage', (data) => dispatch(addMessage(data)))
    socket.on('newChannel', (data) => dispatch(addChannel(data)))
    socket.on('removeChannel', ({ id }) => dispatch(removeChannel(id)))
    socket.on('renameChannel', (data) => dispatch(renameChannel(data)))

    return () => socket.disconnect()
  }, [])

  if (!token) return <Navigate to="/login" />
  if (loading) return <div>{t('chat.loading')}</div>

  const handleSend = async (e) => {
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
        { headers: { Authorization: `Bearer ${token}` } },
      )

      setBody('')
      messageInputRef.current?.focus()
    } catch {
      toast.error(t('chat.sendError'))
    }
  }

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/v1/channels/${channelToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      toast.success(t('toasts.channelRemoved'))
      setChannelToDelete(null)
    } catch {
      toast.error(t('toasts.networkError'))
    }
  }

  return (
    <>
      <div style={{ display: 'flex' }}>
        <div style={{ width: '250px' }}>
          <h3>{t('chat.channels')}</h3>

          <ul>
            {channels.map((channel) => (
              <li key={channel.id}>
                <button onClick={() => dispatch(setCurrentChannelId(channel.id))}>
                  {channel.name}
                </button>

                {channel.removable && (
                  <>
                    <button onClick={() => setOpenMenuId(channel.id)}>
                      {t('chat.channelManagement')}
                    </button>

                    {openMenuId === channel.id && (
                      <div>
                        <button
                          onClick={() => {
                            setChannelToDelete(channel)
                          }}
                        >
                          {t('chat.delete')}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div>
            {currentMessages.map((m) => (
              <div key={m.id}>
                <b>{m.username}</b>: {m.body}
              </div>
            ))}
          </div>

          <form onSubmit={handleSend}>
            <input
              ref={messageInputRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              aria-label={t('chat.newMessage')}
            />
            <button type="submit">{t('chat.send')}</button>
          </form>
        </div>
      </div>

      {channelToDelete && (
        <div>
          <p>{t('chat.areYouSure')}</p>

          <button onClick={() => setChannelToDelete(null)}>
            {t('chat.cancel')}
          </button>

          <button onClick={handleDelete}>
            {t('chat.remove')}
          </button>
        </div>
      )}
    </>
  )
}

export default HomePage