import { useTranslation } from 'react-i18next'

const MessageInput = ({ body, setBody, onSubmit, inputRef }) => {
  const { t } = useTranslation()

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', padding: '12px', borderTop: '1px solid #ccc', gap: '8px' }}>
      <label htmlFor="message-input" style={{ display: 'none' }}>{t('chat.newMessage')}</label>
      <input
        id="message-input"
        ref={inputRef}
        type="text"
        name="body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={t('chat.messagePlaceholder')}
        aria-label={t('chat.newMessage')}
        style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
      />
      <button type="submit" disabled={!body.trim()}>
        {t('chat.send')}
      </button>
    </form>
  )
}

export default MessageInput