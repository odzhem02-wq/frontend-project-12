import * as yup from 'yup'

export const addChannelSchema = (t, channelNames) => yup.object({
  name: yup
    .string()
    .trim()
    .min(3, t('chat.channelNameLength'))
    .max(20, t('chat.channelNameLength'))
    .notOneOf(channelNames, t('chat.channelExists'))
    .required(t('chat.required')),
})

export const renameChannelSchema = (t, channelNames, currentName) => yup.object({
  name: yup
    .string()
    .trim()
    .min(3, t('chat.channelNameLength'))
    .max(20, t('chat.channelNameLength'))
    .notOneOf(
      channelNames.filter((name) => name !== currentName),
      t('chat.channelExists')
    )
    .required(t('chat.required')),
})