import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const Header = () => {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const { t } = useTranslation()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    navigate('/login')
  }

  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        borderBottom: '1px solid #ccc',
        marginBottom: '20px',
      }}
    >
      <Link
        to="/"
        style={{
          textDecoration: 'none',
          color: 'black',
          fontWeight: 'bold',
          fontSize: '20px',
        }}
      >
        {t('header.brand')}
      </Link>

      {token && (
        <button type="button" onClick={handleLogout}>
          {t('header.logout')}
        </button>
      )}
    </header>
  )
}

export default Header