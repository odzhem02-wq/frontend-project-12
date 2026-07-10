import { useTranslation } from 'react-i18next'

const DeleteChannelModal = ({ onConfirm, onClose }) => {
  const { t } = useTranslation()

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: 'white', borderRadius: '8px', padding: '24px', minWidth: '320px' }}>
        <h5>{t('chat.deleteChannel')}</h5>
        <p>{t('chat.areYouSure')}</p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose}>{t('chat.cancel')}</button>
          <button
            type="button"
            onClick={onConfirm}
            style={{ background: 'red', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
          >
            {t('chat.remove')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteChannelModal