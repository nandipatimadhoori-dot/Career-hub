import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  Outlet,
} from 'react-router-dom'

import Login from './Pages/Login.jsx'
import Register from './Pages/Register.jsx'
import StudentDashboard from './StudentDashboard'
import AdminDashboard from './AdminDashboard'
import ProviderDashboard from './ProviderDashboard'

import './App.css'

// Protect dashboard routes by checking login token
function ProtectedRoute() {
  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('jwtToken')

  return token ? <Outlet /> : <Navigate to="/login" replace />
}

function Home() {
  return (
    <div className="home">
      <nav>
        <h2>Career Hub</h2>

        <div>
          <Link to="/login">Login</Link>
          <Link to="/register" className="nav-button">
            Get Started
          </Link>
        </div>
      </nav>

      <section className="hero">
        <span className="eyebrow">YOUR CAREER, YOUR FUTURE</span>

        <h1>
          Find Your Dream Job.
          <br />
          <span>Build Your Skills.</span>
        </h1>

        <p>
          Discover suitable jobs, understand your skill gaps, and get
          personalized learning recommendations to prepare for your career.
        </p>

        <Link to="/register" className="primary-button">
          Start Your Journey
        </Link>
      </section>

      <section className="features">
        <article>
          <h3>🎯 Job Matching</h3>
          <p>Discover jobs based on your skills.</p>
        </article>

        <article>
          <h3>📊 Skill Gap Analysis</h3>
          <p>See which required skills you are missing.</p>
        </article>

        <article>
          <h3>📚 Learning Roadmap</h3>
          <p>Get recommendations for skills to learn next.</p>
        </article>
      </section>
    </div>
  )
}

function JobsPlaceholder() {
  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('jwtToken')
    window.location.href = '/login'
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Jobs Dashboard</h1>
        <p>Your jobs dashboard will be built next.</p>

        <button type="button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected dashboard routes */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/student-dashboard"
            element={<StudentDashboard />}
          />

          <Route
            path="/provider-dashboard"
            element={<ProviderDashboard />}
          />

          <Route
            path="/admin-dashboard"
            element={<AdminDashboard />}
          />

          <Route path="/jobs" element={<JobsPlaceholder />} />
        </Route>

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App