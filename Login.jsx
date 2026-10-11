import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function Login() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    role: 'STUDENT',
  })

  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('Logging in...')

    try {
      const response = await fetch(
        'http://localhost:8080/api/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
          }),
        }
      )

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          data?.message || data?.error || 'Login failed'
        )
      }

      if (!data?.token) {
        throw new Error('Login response did not contain a token.')
      }

      localStorage.setItem('token', data.token)

      const actualRole = String(
        data.role || data.user?.role || ''
      )
        .replace('ROLE_', '')
        .toUpperCase()

      if (actualRole === 'STUDENT') {
        navigate('/student-dashboard')
      } else if (
        actualRole === 'PROJECT_PROVIDER' ||
        actualRole === 'PROVIDER'
      ) {
        navigate('/provider-dashboard')
      } else if (actualRole === 'ADMIN') {
        navigate('/admin-dashboard')
      } else {
        setMessage('Account role not found. Check the backend login response.')
      }
    } catch (error) {
      setMessage(error.message || 'Could not connect to the backend.')
    }
  }

  return (
    <div className="auth-container">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Welcome Back</h1>
        <p>Login to your Career Hub account.</p>

        <label htmlFor="role">Login as</label>
        <select
          id="role"
          name="role"
          value={form.role}
          onChange={handleChange}
          required
        >
          <option value="STUDENT">Student</option>
          <option value="PROJECT_PROVIDER">Project Provider</option>
        </select>

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Enter your email"
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Enter your password"
          required
        />

        <button type="submit">Login</button>

        {message && <p className="message">{message}</p>}

        <p>
          New to Career Hub? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </div>
  )
}

export default Login