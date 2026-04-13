import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  channels: [],
  messages: [],
  currentChannelId: null,
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setChatData: (state, action) => {
      state.channels = action.payload.channels ?? []
      state.messages = action.payload.messages ?? []
      state.currentChannelId = action.payload.currentChannelId ?? null
    },

    setCurrentChannelId: (state, action) => {
      state.currentChannelId = action.payload
    },

    addMessage: (state, action) => {
      state.messages.push(action.payload)
    },

    addChannel: (state, action) => {
      state.channels.push(action.payload)
    },

    removeChannel: (state, action) => {
      const channelId = action.payload

      state.channels = state.channels.filter((c) => c.id !== channelId)

      state.messages = state.messages.filter((m) => m.channelId !== channelId)

      if (state.currentChannelId === channelId) {
        state.currentChannelId = 1
      }
    },

    renameChannel: (state, action) => {
      const { id, name } = action.payload

      const channel = state.channels.find((c) => c.id === id)
      if (channel) {
        channel.name = name
      }
    },
  },
})

export const {
  setChatData,
  setCurrentChannelId,
  addMessage,
  addChannel,
  removeChannel,
  renameChannel,
} = chatSlice.actions

export default chatSlice.reducer