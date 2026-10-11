import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './ProviderDashboard.css'

const initialProjects = [
  {
    id: 1,
    title: 'Boutique Business Website',
    category: 'Web Development',
    skills: 'HTML, CSS, JavaScript',
    reward: 1500,
    deadline: '',
    description: 'Build a responsive website for a boutique business.',
    status: 'Open',
  },
  {
    id: 2,
    title: 'AI-Based Job Matching System',
    category: 'Artificial Intelligence',
    skills: 'React, Spring Boot, MySQL',
    reward: 5000,
    deadline: '',
    description: 'Create a job matching and skill gap recommendation system.',
    status: 'Open',
  },
  {
    id: 3,
    title: 'Smart Traffic Management System',
    category: 'AI/ML',
    skills: 'Python, AI, Machine Learning',
    reward: 4000,
    deadline: '',
    description: 'Develop an intelligent traffic management solution.',
    status: 'Open',
  },
]

function ProviderDashboard() {
  const navigate = useNavigate()

  const [activePage, setActivePage] = useState('Dashboard')
  const [projects, setProjects] = useState(initialProjects)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    title: '',
    category: 'Web Development',
    skills: '',
    reward: '',
    deadline: '',
    description: '',
  })

  const [submissions, setSubmissions] = useState([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)

  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('jwtToken')

  function handleFormChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handlePostProject(e) {
    e.preventDefault()

    const newProject = {
      ...form,
      id: Date.now(),
      reward: Number(form.reward),
      status: 'Open',
    }

    setProjects((previous) => [newProject, ...previous])

    setForm({
      title: '',
      category: 'Web Development',
      skills: '',
      reward: '',
      deadline: '',
      description: '',
    })

    setMessage('Project added to this dashboard.')
  }

  async function loadSubmissions() {
    setLoadingSubmissions(true)
    setMessage('')

    try {
      const response = await fetch(
        'http://localhost:8080/api/submissions/admin/all',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          data?.message ||
            'Could not load submissions. Check your provider permissions.'
        )
      }

      setSubmissions(Array.isArray(data) ? data : [])
    } catch (error) {
      setMessage(error.message || 'Could not connect to the backend.')
    } finally {
      setLoadingSubmissions(false)
    }
  }

  function openPage(page) {
    setActivePage(page)
    setMessage('')

    if (page === 'Submissions') {
      loadSubmissions()
    }
  }

  function updateProjectStatus(id, status) {
    setProjects((previous) =>
      previous.map((project) =>
        project.id === id ? { ...project, status } : project
      )
    )
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('jwtToken')
    navigate('/login')
  }

  const menuItems = [
    { name: 'Dashboard', icon: '🏠' },
    { name: 'Post a Project', icon: '➕' },
    { name: 'My Projects', icon: '📁' },
    { name: 'Submissions', icon: '📨' },
  ]

  return (
    <div className="provider-layout">
      <aside className="provider-sidebar">
        <div className="provider-brand">
          <span className="provider-brand-icon">🚀</span>
          <div>
            <h2>Career Hub</h2>
            <small>Project Provider</small>
          </div>
        </div>

        <div className="provider-profile">
          <div className="provider-avatar">P</div>
          <div>
            <strong>Project Provider</strong>
            <small>Manage your projects</small>
          </div>
        </div>

        <p className="provider-menu-title">WORKSPACE</p>

        <nav className="provider-menu">
          {menuItems.map((item) => (
            <button
              key={item.name}
              type="button"
              className={
                activePage === item.name ? 'active' : ''
              }
              onClick={() => openPage(item.name)}
            >
              <span>{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        <button
          className="provider-logout"
          type="button"
          onClick={logout}
        >
          🚪 Logout
        </button>
      </aside>

      <main className="provider-main">
        <header className="provider-topbar">
          <div>
            <h1>{activePage}</h1>
            <p>Manage projects and review student work.</p>
          </div>
          <div className="provider-top-avatar">P</div>
        </header>

        {message && (
          <div className="provider-message" role="status">
            {message}
          </div>
        )}

        {activePage === 'Dashboard' && (
          <>
            <section className="provider-welcome">
              <div>
                <span className="provider-eyebrow">
                  YOUR WORKSPACE
                </span>
                <h2>Welcome, Project Provider! 👋</h2>
                <p>
                  Post opportunities, find student talent, and
                  track project progress from one place.
                </p>
                <button
                  type="button"
                  onClick={() => openPage('Post a Project')}
                >
                  + Post a Project
                </button>
              </div>
              <div className="provider-welcome-art">💼</div>
            </section>

            <section className="provider-stats">
              <article>
                <span>📁</span>
                <p>Total Projects</p>
                <h2>{projects.length}</h2>
              </article>

              <article>
                <span>🟢</span>
                <p>Open Projects</p>
                <h2>
                  {projects.filter((p) => p.status === 'Open').length}
                </h2>
              </article>

              <article>
                <span>📨</span>
                <p>Student Submissions</p>
                <h2>{submissions.length}</h2>
              </article>
            </section>

            <section className="provider-section">
              <div className="provider-section-heading">
                <h2>Recent Projects</h2>
                <button
                  type="button"
                  onClick={() => openPage('My Projects')}
                >
                  View all →
                </button>
              </div>

              <ProjectCards
                projects={projects.slice(0, 3)}
                onStatusChange={updateProjectStatus}
              />
            </section>
          </>
        )}

        {activePage === 'Post a Project' && (
          <section className="provider-panel">
            <h2>Create a New Project</h2>
            <p>
              Describe the work, required skills, reward, and deadline.
            </p>

            <form
              className="provider-project-form"
              onSubmit={handlePostProject}
            >
              <label>
                Project Title
                <input
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  placeholder="Enter project title"
                  required
                />
              </label>

              <label>
                Category
                <select
                  name="category"
                  value={form.category}
                  onChange={handleFormChange}
                >
                  <option>Web Development</option>
                  <option>Artificial Intelligence</option>
                  <option>AI/ML</option>
                  <option>App Development</option>
                  <option>Data Science</option>
                  <option>Other</option>
                </select>
              </label>

              <label>
                Required Skills
                <input
                  name="skills"
                  value={form.skills}
                  onChange={handleFormChange}
                  placeholder="e.g. React, Java, MySQL"
                  required
                />
              </label>

              <label>
                Reward (₹)
                <input
                  name="reward"
                  type="number"
                  min="0"
                  value={form.reward}
                  onChange={handleFormChange}
                  placeholder="Enter reward amount"
                  required
                />
              </label>

              <label>
                Deadline
                <input
                  name="deadline"
                  type="date"
                  value={form.deadline}
                  onChange={handleFormChange}
                />
              </label>

              <label className="provider-full-width">
                Project Description
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  placeholder="Explain the project requirements..."
                  rows="5"
                  required
                />
              </label>

              <button className="provider-submit" type="submit">
                Publish Project
              </button>
            </form>
          </section>
        )}

        {activePage === 'My Projects' && (
          <section className="provider-section">
            <div className="provider-section-heading">
              <h2>Manage Projects</h2>
              <button
                type="button"
                onClick={() => openPage('Post a Project')}
              >
                + Add Project
              </button>
            </div>

            <ProjectCards
              projects={projects}
              onStatusChange={updateProjectStatus}
            />
          </section>
        )}

        {activePage === 'Submissions' && (
          <section className="provider-panel">
            <div className="provider-section-heading">
              <h2>Student Submissions</h2>
              <button
                type="button"
                onClick={loadSubmissions}
              >
                Refresh
              </button>
            </div>

            <p>
              Review ZIP submissions received by the backend.
            </p>

            {loadingSubmissions ? (
              <p>Loading submissions...</p>
            ) : submissions.length === 0 ? (
              <div className="provider-empty">
                <span>📭</span>
                <h3>No submissions to display</h3>
                <p>
                  Submit a project from a student account to test this page.
                </p>
              </div>
            ) : (
              <div className="provider-table-wrap">
                <table className="provider-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Project</th>
                      <th>ZIP File</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((submission) => (
                      <tr key={submission.id}>
                        <td>{submission.id}</td>
                        <td>{submission.projectName}</td>
                        <td>{submission.originalFileName}</td>
                        <td>
                          <span className="provider-status">
                            {submission.status || 'Pending Review'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}

function ProjectCards({ projects, onStatusChange }) {
  if (projects.length === 0) {
    return (
      <div className="provider-empty">
        <span>📁</span>
        <h3>No projects yet</h3>
        <p>Create your first project to get started.</p>
      </div>
    )
  }

  return (
    <div className="provider-project-grid">
      {projects.map((project) => (
        <article className="provider-project-card" key={project.id}>
          <div className="provider-card-top">
            <span className="provider-project-icon">📌</span>
            <span
              className={`provider-project-status ${project.status.toLowerCase()}`}
            >
              {project.status}
            </span>
          </div>

          <p className="provider-category">{project.category}</p>
          <h3>{project.title}</h3>
          <p className="provider-description">
            {project.description}
          </p>

          <div className="provider-skills">
            {project.skills}
          </div>

          <div className="provider-project-bottom">
            <strong>₹{Number(project.reward).toLocaleString('en-IN')}</strong>
            <small>
              {project.deadline
                ? `Due ${project.deadline}`
                : 'Flexible deadline'}
            </small>
          </div>

          <label className="provider-status-label">
            Project Status
            <select
              value={project.status}
              onChange={(e) =>
                onStatusChange(project.id, e.target.value)
              }
            >
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Closed">Closed</option>
            </select>
          </label>
        </article>
      ))}
    </div>
  )
}

export default ProviderDashboard