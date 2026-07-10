import { Formik, Form, Field, ErrorMessage } from 'formik'
import { useTranslation } from 'react-i18next'

const RenameChannelModal = ({ channel, onSubmit, onClose, validationSchema }) => {
  const { t } = useTranslation()

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: 'white', borderRadius: '8px', padding: '24px', minWidth: '320px' }}>
        <h5>{t('chat.renameChannel')}</h5>
        <Formik
          initialValues={{ name: channel.name }}
          validationSchema={validationSchema}
          onSubmit={onSubmit}
        >
          {({ isSubmitting }) => (
            <Form>
              <label htmlFor="rename-channel-name">{t('chat.channelName')}</label>
              <Field
                id="rename-channel-name"
                name="name"
                style={{ width: '100%', padding: '6px', marginTop: '4px', marginBottom: '4px', boxSizing: 'border-box' }}
                autoFocus
              />
              <ErrorMessage name="name" component="div" style={{ color: 'red', fontSize: '12px' }} />
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={onClose}>{t('chat.cancel')}</button>
                <button type="submit" disabled={isSubmitting}>{t('chat.rename')}</button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  )
}

export default RenameChannelModal