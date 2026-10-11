
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function Register() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'STUDENT',
  })

  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  function handleChange(e) {
    const { name, value } = e.target

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('')
    setIsLoading(true)

    try {
      const response = await fetch(
        'http://localhost:8080/api/auth/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fullName: form.fullName.trim(),
            email: form.email.trim(),
            password: form.password,
            role: form.role,
          }),
        }
      )

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          data?.message ||
          data?.detail ||
          data?.error ||
          `Registration failed (${response.status})`
        )
      }

      setMessage('Registration successful! Please log in.')

      setTimeout(() => {
        navigate('/login')
      }, 1000)
    } catch (error) {
      setMessage(
        error.message || 'Could not connect to the backend.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Create Account</h1>
        <p>Start your career journey with Career Hub.</p>

        <label htmlFor="fullName">Full Name</label>
        <input
          id="fullName"
          type="text"
          name="fullName"
          value={form.fullName}
          onChange={handleChange}
          placeholder="Enter your full name"
          autoComplete="name"
          required
        />

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Enter your email"
          autoComplete="email"
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Create a password"
          minLength={8}
          autoComplete="new-password"
          required
        />

        <label htmlFor="role">Account Type</label>
        <select
          id="role"
          name="role"
          value={form.role}
          onChange={handleChange}
          required
        >
          <option value="STUDENT">Student</option>
          <option value="PROJECT_PROVIDER">
            Project Provider
          </option>
        </select>

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Registering...' : 'Register'}
        </button>

        {message && (
          <p className="message" role="status">
            {message}
          </p>
        )}

        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  )
}

export default Register
