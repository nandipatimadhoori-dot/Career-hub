import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './StudentDashboard.css'

const API_URL = 'http://localhost:8080/api'
const MAX_FILE_SIZE = 20 * 1024 * 1024

const sampleJobs = [
  {
    id: 1,
    title: 'Java Developer Intern',
    company: 'Tech Solutions',
    location: 'Hyderabad',
    type: 'Internship',
    salary: '₹10,000–₹15,000/month',
    skills: ['Java', 'SQL', 'Spring Boot'],
    match: 85,
  },
  {
    id: 2,
    title: 'Frontend Developer',
    company: 'Digital Innovations',
    location: 'Remote',
    type: 'Full-time',
    salary: '₹3–5 LPA',
    skills: ['HTML', 'CSS', 'JavaScript', 'React'],
    match: 75,
  },
  {
    id: 3,
    title: 'Python Developer Intern',
    company: 'AI Labs',
    location: 'Hyderabad',
    type: 'Internship',
    salary: '₹8,000–₹12,000/month',
    skills: ['Python', 'SQL', 'Machine Learning'],
    match: 65,
  },
]

function getToken() {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('jwtToken')
  )
}

function formatReward(reward) {
  return Number(reward || 0).toLocaleString('en-IN')
}

function StudentDashboard() {
  const navigate = useNavigate()

  const [activePage, setActivePage] = useState('Dashboard')
  const [search, setSearch] = useState('')
  const [savedJobs, setSavedJobs] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)

  // Projects posted by the admin are loaded from Spring Boot.
  const [projects, setProjects] = useState([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [projectsError, setProjectsError] = useState('')

  // Submission history is loaded from the backend.
  const [submissions, setSubmissions] = useState([])
  const [submissionsLoading, setSubmissionsLoading] = useState(false)
  const [submissionsError, setSubmissionsError] = useState('')

  const [uploadMessage, setUploadMessage] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const studentSkills = ['Java', 'SQL', 'HTML', 'CSS']

  // Fetch projects from the database when the dashboard opens.
  async function loadProjects(signal) {
    setProjectsLoading(true)
    setProjectsError('')

    try {
      const token = getToken()
      const headers = {}

      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(`${API_URL}/projects`, {
        method: 'GET',
        headers,
        signal,
      })

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error(
            'Access denied. Please log in with a student account.'
          )
        }

        throw new Error(
          `Could not load projects. Server returned ${response.status}.`
        )
      }

      const data = await response.json()

      const publishedProjects = (Array.isArray(data) ? data : []).filter(
        (project) => project.published !== false
      )

      setProjects(publishedProjects)
    } catch (error) {
      if (error.name !== 'AbortError') {
        setProjectsError(
          error.message ||
            'Cannot connect to the backend. Make sure Spring Boot is running.'
        )
      }
    } finally {
      if (!signal?.aborted) {
        setProjectsLoading(false)
      }
    }
  }

  useEffect(() => {
    const controller = new AbortController()

    loadProjects(controller.signal)

    return () => controller.abort()
  }, [])

  // Fetch previously submitted projects from the backend.
  // This requires GET /api/submissions/my in SubmissionController.
  async function loadSubmissions() {
    const token = getToken()

    if (!token) {
      setSubmissionsError('Please log in to view your submissions.')
      return
    }

    setSubmissionsLoading(true)
    setSubmissionsError('')

    try {
      const response = await fetch(`${API_URL}/submissions/my`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Access denied. Please log in again.')
        }

        throw new Error(
          `Could not load submission history (${response.status}).`
        )
      }

      const data = await response.json()
      setSubmissions(Array.isArray(data) ? data : [])
    } catch (error) {
      setSubmissionsError(
        error.message || 'Could not load your submissions.'
      )
    } finally {
      setSubmissionsLoading(false)
    }
  }

  useEffect(() => {
    loadSubmissions()
  }, [])

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase()

    return sampleJobs.filter((job) =>
      `${job.title} ${job.company} ${job.location} ${job.skills.join(' ')}`
        .toLowerCase()
        .includes(query)
    )
  }, [search])

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase()

    return projects.filter((project) => {
      const technologies = Array.isArray(project.technologies)
        ? project.technologies.join(' ')
        : ''

      return `${project.title || ''} ${project.category || ''} ${
        project.description || ''
      } ${technologies}`
        .toLowerCase()
        .includes(query)
    })
  }, [search, projects])

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('jwtToken')
    localStorage.removeItem('user')
    sessionStorage.clear()
    navigate('/login', { replace: true })
  }

  function toggleSavedJob(id) {
    setSavedJobs((previous) =>
      previous.includes(id)
        ? previous.filter((jobId) => jobId !== id)
        : [...previous, id]
    )
  }

  function changePage(page) {
    setActivePage(page)
    setSearch('')
    setSelectedProject(null)
    setUploadMessage('')

    if (page === 'My Submissions' || page === 'Rewards & Earnings') {
      loadSubmissions()
    }
  }

  function openProject(project) {
    setSelectedProject(project)
    setSelectedFile(null)
    setUploadMessage('')
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0]

    setUploadMessage('')
    setSelectedFile(null)

    if (!file) return

    if (!file.name.toLowerCase().endsWith('.zip')) {
      setUploadMessage('Please select a ZIP file.')
      event.target.value = ''
      return
    }

    if (file.size === 0) {
      setUploadMessage('The selected ZIP file is empty.')
      event.target.value = ''
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setUploadMessage('The ZIP file must be 20 MB or smaller.')
      event.target.value = ''
      return
    }

    setSelectedFile(file)
    setUploadMessage(`${file.name} selected successfully.`)
  }

  async function handleSubmitProject(event) {
    event.preventDefault()

    if (isUploading) return

    if (!selectedProject || !selectedFile) {
      setUploadMessage('Please select a project and ZIP file first.')
      return
    }

    const token = getToken()

    if (!token) {
      setUploadMessage('Please log in again before submitting your project.')
      navigate('/login', { replace: true })
      return
    }

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('projectName', selectedProject.title)

    setIsUploading(true)
    setUploadMessage('Uploading project...')

    try {
      const response = await fetch(`${API_URL}/submissions/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error(
            response.status === 401
              ? 'Your session has expired. Please log in again.'
              : 'Access denied. Check your login token and student role.'
          )
        }

        throw new Error(
          data.message || `Upload failed (${response.status}).`
        )
      }

      setSelectedFile(null)
      setUploadMessage(
        data.message || 'Project uploaded successfully!'
      )

      // Load the saved submission from the backend.
      await loadSubmissions()
    } catch (error) {
      setUploadMessage(
        error.message ||
          'Cannot connect to the backend. Make sure Spring Boot is running.'
      )
    } finally {
      setIsUploading(false)
    }
  }

  const jobsToDisplay =
    activePage === 'Saved Jobs'
      ? filteredJobs.filter((job) => savedJobs.includes(job.id))
      : filteredJobs

  const totalEarned = submissions.reduce((total, submission) => {
    const paymentStatus = String(
      submission.paymentStatus || ''
    ).toLowerCase()

    if (paymentStatus === 'paid' || paymentStatus === 'completed') {
      return total + Number(submission.reward || 0)
    }

    return total
  }, 0)

  return (
    <div className="student-dashboard">
      <aside className="dashboard-sidebar">
        <div className="brand">
          <span className="brand-icon">C</span>
          <span>Career Hub</span>
        </div>

        <p className="menu-label">STUDENT MENU</p>

        {[
          ['Dashboard', '⌂'],
          ['Find Jobs', '⌕'],
          ['Projects', '▣'],
          ['My Submissions', '↑'],
          ['Rewards & Earnings', '₹'],
          ['Skill Gap Analysis', '◈'],
          ['Saved Jobs', '♡'],
        ].map(([page, icon]) => (
          <button
            key={page}
            className={`menu-item ${activePage === page ? 'active' : ''}`}
            onClick={() => changePage(page)}
          >
            <span>{icon}</span>
            {page}
          </button>
        ))}

        <div className="sidebar-bottom">
          <p>Build skills. Find opportunities.</p>
          <button className="logout-button" onClick={handleLogout}>
            ↪ Logout
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">YOUR CAREER, YOUR FUTURE</p>
            <h1>
              {activePage === 'Dashboard'
                ? 'Student Dashboard'
                : activePage}
            </h1>
          </div>

          <div className="student-profile">
            <div className="avatar">S</div>
            <div>
              <strong>Student</strong>
              <span>Career Explorer</span>
            </div>
          </div>
        </header>

        {activePage === 'Dashboard' && (
          <section className="welcome-banner">
            <div>
              <p className="banner-label">WELCOME TO CAREER HUB</p>
              <h2>Your next opportunity starts here.</h2>
              <p>
                Explore jobs, discover projects, improve your skills,
                and earn rewards by completing project work.
              </p>

              <button
                className="primary-button"
                onClick={() => changePage('Find Jobs')}
              >
                Explore Jobs →
              </button>

              <button
                className="primary-button"
                style={{ marginLeft: 10 }}
                onClick={() => changePage('Projects')}
              >
                Explore Projects →
              </button>
            </div>

            <div className="banner-art" aria-hidden="true">
              <span>✦</span>
              <div className="art-card">Your future is bright!</div>
              <div className="art-circle">↗</div>
            </div>
          </section>
        )}

        <section className="stats-grid">
          <article className="stat-card">
            <div className="stat-icon purple">▣</div>
            <p>Available Jobs</p>
            <h2>{sampleJobs.length}</h2>
            <span>Sample listings</span>
          </article>

          <article className="stat-card">
            <div className="stat-icon green">✓</div>
            <p>Skills Added</p>
            <h2>{studentSkills.length}</h2>
            <span>Demo profile skills</span>
          </article>

          <article className="stat-card">
            <div className="stat-icon orange">★</div>
            <p>Saved Jobs</p>
            <h2>{savedJobs.length}</h2>
            <span>Your shortlisted jobs</span>
          </article>

          <article className="stat-card">
            <div className="stat-icon blue">₹</div>
            <p>Available Projects</p>
            <h2>{projects.length}</h2>
            <span>Projects posted by admin</span>
          </article>
        </section>

        {activePage === 'Projects' ? (
          <section className="content-card">
            <div className="section-heading">
              <div>
                <h2>Project Marketplace</h2>
                <p>
                  Read problem statements, complete projects, and submit your work.
                </p>
              </div>
              <span className="result-count">
                {filteredProjects.length} projects
              </span>
            </div>

            <input
              className="job-search"
              type="search"
              placeholder="Search projects or technologies..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            {projectsLoading ? (
              <p className="empty-state">Loading projects...</p>
            ) : projectsError ? (
              <p className="empty-state" role="alert">
                {projectsError}
              </p>
            ) : (
              <div className="projects-grid">
                {filteredProjects.map((project) => (
                  <article className="project-card" key={project.id}>
                    <div className="project-icon">💡</div>
                    <p className="project-category">
                      {project.category || 'General'}
                    </p>
                    <h3>{project.title}</h3>
                    <p>{project.description}</p>

                    <div className="skill-tags">
                      {(Array.isArray(project.technologies)
                        ? project.technologies
                        : []
                      ).map((technology) => (
                        <span className="skill-tag" key={technology}>
                          {technology}
                        </span>
                      ))}
                    </div>

                    <p>
                      <strong>Level:</strong> {project.level || 'Not specified'}
                    </p>
                    <p>
                      <strong>Advertised reward:</strong> ₹
                      {formatReward(project.reward)}
                    </p>

                    <button
                      className="primary-button"
                      onClick={() => openProject(project)}
                    >
                      View Project →
                    </button>
                  </article>
                ))}

                {filteredProjects.length === 0 && (
                  <p className="empty-state">No projects found.</p>
                )}
              </div>
            )}
          </section>
        ) : activePage === 'My Submissions' ||
          activePage === 'Rewards & Earnings' ? (
          <section className="content-card">
            <div className="section-heading">
              <div>
                <h2>
                  {activePage === 'My Submissions'
                    ? 'My Project Submissions'
                    : 'Rewards & Earnings'}
                </h2>
                <p>
                  {activePage === 'My Submissions'
                    ? 'Track the status of your uploaded projects.'
                    : 'Track approved submissions and confirmed payments.'}
                </p>
              </div>
            </div>

            {activePage === 'Rewards & Earnings' && (
              <article className="stat-card">
                <p>Total confirmed earnings</p>
                <h2>₹{formatReward(totalEarned)}</h2>
                <span>Only submissions marked as paid are counted.</span>
              </article>
            )}

            {submissionsLoading ? (
              <p className="empty-state">Loading your submissions...</p>
            ) : submissionsError ? (
              <p className="empty-state" role="alert">
                {submissionsError}
              </p>
            ) : submissions.length === 0 ? (
              <p className="empty-state">
                You have no submissions yet. Open Projects and select View
                Project to get started.
              </p>
            ) : (
              <div className="jobs-list">
                {submissions.map((submission) => (
                  <article className="job-card" key={submission.id}>
                    <div className="company-logo">P</div>

                    <div className="job-details">
                      <h3>
                        {submission.projectTitle ||
                          submission.projectName ||
                          'Project submission'}
                      </h3>
                      <p>
                        File:{' '}
                        {submission.fileName ||
                          submission.originalFileName ||
                          'Uploaded ZIP file'}
                      </p>
                      <p>
                        Submitted:{' '}
                        {submission.submittedAt ||
                          submission.createdAt ||
                          'Date not available'}
                      </p>

                      <div className="job-meta">
                        <span>
                          Status: {submission.status || 'Pending review'}
                        </span>
                        <span>
                          Payment: {submission.paymentStatus || 'Not paid'}
                        </span>
                      </div>
                    </div>

                    <div className="job-actions">
                      <strong className="match-score">
                        ₹{formatReward(submission.reward)}
                      </strong>
                      <span className="project-status">
                        Advertised reward
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <button
              className="save-button"
              style={{ marginTop: 16 }}
              onClick={loadSubmissions}
              disabled={submissionsLoading}
            >
              {submissionsLoading ? 'Refreshing...' : 'Refresh Submissions'}
            </button>

            <p className="demo-note">
              Advertised rewards are not confirmed payments. Only amounts
              marked as paid by the backend count toward confirmed earnings.
            </p>
          </section>
        ) : activePage === 'Skill Gap Analysis' ? (
          <section className="content-card">
            <div className="section-heading">
              <div>
                <h2>Your Skill Gap Analysis</h2>
                <p>Compare your skills with a sample job.</p>
              </div>
            </div>

            <div className="skill-summary">
              <h3>Java Developer Intern</h3>
              <p className="match-number">85% sample match</p>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: '85%' }}
                />
              </div>

              <h4>Your current skills</h4>
              <div className="skill-tags">
                {studentSkills.map((skill) => (
                  <span className="skill-tag" key={skill}>
                    ✓ {skill}
                  </span>
                ))}
              </div>

              <h4>Skills to learn for this job</h4>
              <div className="skill-tags">
                <span className="missing-skill">+ Spring Boot</span>
              </div>

              <p className="demo-note">
                This is example data. Real skill-gap results require backend
                integration.
              </p>
            </div>
          </section>
        ) : (
          <section className="content-card">
            <div className="section-heading">
              <div>
                <h2>
                  {activePage === 'Saved Jobs'
                    ? 'Your Saved Jobs'
                    : activePage === 'Find Jobs'
                      ? 'Explore Opportunities'
                      : 'Recommended Jobs'}
                </h2>
                <p>Discover opportunities that fit your career goals.</p>
              </div>

              <span className="result-count">
                {jobsToDisplay.length} jobs
              </span>
            </div>

            <input
              className="job-search"
              type="search"
              placeholder="Search jobs, companies, skills..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            {jobsToDisplay.length === 0 ? (
              <p className="empty-state">
                No jobs found. Try another search or save a job first.
              </p>
            ) : (
              <div className="jobs-list">
                {jobsToDisplay.map((job) => (
                  <article className="job-card" key={job.id}>
                    <div className="company-logo">
                      {job.company.charAt(0)}
                    </div>

                    <div className="job-details">
                      <h3>{job.title}</h3>
                      <p>
                        {job.company} · {job.location}
                      </p>

                      <div className="job-meta">
                        <span>{job.type}</span>
                        <span>{job.salary}</span>
                      </div>

                      <div className="skill-tags">
                        {job.skills.map((skill) => (
                          <span className="skill-tag" key={skill}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="job-actions">
                      <strong className="match-score">
                        {job.match}% match
                      </strong>

                      <button
                        className="save-button"
                        onClick={() => toggleSavedJob(job.id)}
                      >
                        {savedJobs.includes(job.id) ? '♥ Saved' : '♡ Save'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        <footer className="dashboard-footer">
          Career Hub · Your journey towards a better career.
        </footer>

        {selectedProject && (
          <div
            className="project-modal-overlay"
            onClick={(event) => {
              if (
                event.target === event.currentTarget &&
                !isUploading
              ) {
                setSelectedProject(null)
              }
            }}
          >
            <section
              className="project-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="project-modal-title"
            >
              <button
                type="button"
                className="modal-close"
                aria-label="Close project details"
                disabled={isUploading}
                onClick={() => setSelectedProject(null)}
              >
                ✕
              </button>

              <p className="eyebrow">PROJECT DETAILS</p>
              <h2 id="project-modal-title">{selectedProject.title}</h2>
              <span className="project-status">
                {selectedProject.level || 'Not specified'}
              </span>

              <h3>Problem Statement</h3>
              <p>
                {selectedProject.problem ||
                  'No problem statement has been provided.'}
              </p>

              <h3>Project Description</h3>
              <p>
                {selectedProject.description || 'No description provided.'}
              </p>

              <h3>Objectives</h3>
              {Array.isArray(selectedProject.objectives) &&
              selectedProject.objectives.length > 0 ? (
                <ul>
                  {selectedProject.objectives.map((objective, index) => (
                    <li key={`${objective}-${index}`}>{objective}</li>
                  ))}
                </ul>
              ) : (
                <p>No objectives provided.</p>
              )}

              <h3>Required Technologies</h3>
              <div className="skill-tags">
                {(Array.isArray(selectedProject.technologies)
                  ? selectedProject.technologies
                  : []
                ).map((technology) => (
                  <span className="skill-tag" key={technology}>
                    {technology}
                  </span>
                ))}
              </div>

              <h3>Deliverables</h3>
              <ul>
                <li>Complete source code.</li>
                <li>README with installation and run instructions.</li>
                <li>Database setup instructions, if required.</li>
                <li>Working project demonstration.</li>
              </ul>

              <h3>How to run your project</h3>
              <ol>
                <li>Download or create the source code on your computer.</li>
                <li>Install the technologies required by the project.</li>
                <li>Follow the project's README instructions.</li>
                <li>Test the project before preparing your ZIP file.</li>
              </ol>

              <div className="reward-panel">
                <span>Advertised reward</span>
                <strong>₹{formatReward(selectedProject.reward)}</strong>
                <small>
                  {selectedProject.deadline || 'Deadline not specified'}.
                  Payment is not guaranteed; project terms and owner approval
                  must be confirmed.
                </small>
              </div>

              <form onSubmit={handleSubmitProject}>
                <h3>Submit Your Completed Project</h3>
                <p>
                  Select your completed project in ZIP format
                  (maximum 20 MB).
                </p>

                <input
                  type="file"
                  accept=".zip,application/zip"
                  disabled={isUploading}
                  onChange={handleFileChange}
                />

                {selectedFile && (
                  <p className="selected-file">
                    Selected file: {selectedFile.name}
                  </p>
                )}

                {uploadMessage && (
                  <p className="upload-message" role="status">
                    {uploadMessage}
                  </p>
                )}

                <button
                  type="submit"
                  className="primary-button"
                  disabled={!selectedFile || isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Submit Project'}
                </button>
              </form>

              <button
                type="button"
                className="save-button"
                style={{ marginTop: 16 }}
                disabled={isUploading}
                onClick={() => setSelectedProject(null)}
              >
                Close Project
              </button>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}

export default StudentDashboard