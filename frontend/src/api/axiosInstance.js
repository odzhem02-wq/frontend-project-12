import axios from 'axios'

const token = localStorage.getItem('token')

const instance = axios.create({
  headers: {
    Authorization: `Bearer ${token}`,
  },
})

export default instance