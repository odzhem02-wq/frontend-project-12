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
      const removedChannelId = action.payload

      state.channels = state.channels.filter((channel) => channel.id !== removedChannelId)
      state.messages = state.messages.filter((message) => message.channelId !== removedChannelId)

      if (state.currentChannelId === removedChannelId) {
        const generalChannel = state.channels.find((channel) => channel.name === 'general')
        state.currentChannelId = generalChannel?.id ?? state.channels[0]?.id ?? null
      }
    },

    renameChannel: (state, action) => {
      const { id, name } = action.payload

      const channel = state.channels.find((channelItem) => channelItem.id === id)

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