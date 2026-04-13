import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const NotFoundPage = () => {
  const { t } = useTranslation()

  return (
    <div>
      <h1>{t('notFound.title')}</h1>
      <p>{t('notFound.text')}</p>
      <Link to="/">{t('notFound.link')}</Link>
    </div>
  )
}

export default NotFoundPage