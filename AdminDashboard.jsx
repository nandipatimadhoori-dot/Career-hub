
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

const API_BASE = "http://localhost:8080/api";
const emptyProject = {
  title: "",
  category: "Web Development",
  description: "",
  problem: "",
  objectives: "",
  technologies: "",
  level: "Beginner",
  reward: "0",
  deadline: "",
};

function AdminDashboard() {
  const navigate = useNavigate();
  const [section, setSection] = useState("Dashboard");
  const [submissions, setSubmissions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [project, setProject] = useState(emptyProject);
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [projectError, setProjectError] = useState("");
  const [projectMessage, setProjectMessage] = useState("");

  const getToken = () =>
    localStorage.getItem("token") ||
    localStorage.getItem("jwtToken");

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const loadSubmissions = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setError("Please log in first.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${API_BASE}/submissions/admin/all`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) {
        throw new Error(
          response.status === 401 || response.status === 403
            ? "Access denied. Log in with an ADMIN account."
            : "Could not load project submissions."
        );
      }
      const data = await response.json();
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProjects = useCallback(async () => {
    const token = getToken();
    setProjectsLoading(true);
    setProjectError("");
    try {
      const response = await fetch(`${API_BASE}/projects`, {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {},
      });
      if (!response.ok) {
        throw new Error("Could not load posted projects.");
      }
      const data = await response.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      setProjectError(err.message || "Unable to load projects.");
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubmissions();
    loadProjects();
  }, [loadSubmissions, loadProjects]);

  const handleProjectChange = (event) => {
    const { name, value } = event.target;
    setProject((previous) => ({ ...previous, [name]: value }));
  };

  const postProject = async (event) => {
    event.preventDefault();
    const token = getToken();

    if (!token) {
      setProjectError("Please log in first.");
      return;
    }
    if (
      !project.title.trim() ||
      !project.description.trim() ||
      !project.problem.trim()
    ) {
      setProjectError("Enter the title, description, and problem statement.");
      return;
    }

    const reward = Number(project.reward);
    if (!Number.isFinite(reward) || reward < 0) {
      setProjectError("Enter a valid non-negative reward.");
      return;
    }

    const payload = {
      title: project.title.trim(),
      category: project.category,
      description: project.description.trim(),
      problem: project.problem.trim(),
      objectives: project.objectives
        .split("\n").map((x) => x.trim()).filter(Boolean),
      technologies: project.technologies
        .split(",").map((x) => x.trim()).filter(Boolean),
      level: project.level,
      reward,
      deadline: project.deadline.trim() || "No deadline specified",
      published: true,
    };

    setPosting(true);
    setProjectError("");
    setProjectMessage("");
    try {
      const response = await fetch(`${API_BASE}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Failed to publish project.");
      }
      setProjectMessage("Project published successfully!");
      setProject(emptyProject);
      await loadProjects();
      setSection("Published Projects");
    } catch (err) {
      setProjectError(err.message || "Unable to publish project.");
    } finally {
      setPosting(false);
    }
  };

  const updateStatus = async (id, status) => {
    const token = getToken();
    if (!token) {
      setError("Please log in first.");
      return;
    }
    setUpdatingId(id);
    setError("");
    setMessage("");
    try {
      const response = await fetch(
        `${API_BASE}/submissions/admin/${id}/status?status=${encodeURIComponent(status)}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Failed to update status.");
      }
      setSubmissions((previous) =>
        previous.map((item) =>
          item.id === id
            ? { ...item, status: data.status || status }
            : item
        )
      );
      setMessage(`Submission #${id} marked as ${data.status || status}.`);
    } catch (err) {
      setError(err.message || "Unable to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const projectName = (item) =>
    item.projectName || item.title || "Untitled project";
  const fileName = (item) =>
    item.originalFileName || item.fileName || "Not available";
  const normalizedStatus = (item) =>
    (item.status || "Pending Review").toLowerCase();

  const pendingCount = submissions.filter((item) =>
    normalizedStatus(item).includes("pending")
  ).length;
  const approvedCount = submissions.filter(
    (item) => normalizedStatus(item) === "approved"
  ).length;
  const rejectedCount = submissions.filter(
    (item) => normalizedStatus(item) === "rejected"
  ).length;

  const menuItems = [
    { name: "Dashboard", icon: "🏠" },
    { name: "Post a Project", icon: "➕" },
    { name: "Published Projects", icon: "📁" },
    { name: "Submissions", icon: "📨" },
  ];

  return (
    <div className="provider-layout">
      <aside className="provider-sidebar">
        <div className="provider-brand">
          <span className="provider-brand-icon">🚀</span>
          <div>
            <h2>Career Hub</h2>
            <small>Admin Panel</small>
          </div>
        </div>

        <div className="provider-profile">
          <div className="provider-avatar">A</div>
          <div>
            <strong>Administrator</strong>
            <small>Project Management</small>
          </div>
        </div>

        <p className="provider-menu-title">WORKSPACE</p>
        <nav className="provider-menu">
          {menuItems.map((item) => (
            <button
              key={item.name}
              type="button"
              className={section === item.name ? "active" : ""}
              onClick={() => setSection(item.name)}
            >
              <span>{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        <button className="provider-logout" onClick={logout}>
          🚪 Logout
        </button>
      </aside>

      <main className="provider-main">
        <header className="provider-topbar">
          <div>
            <h1>{section}</h1>
            <p>Manage projects and review student submissions.</p>
          </div>
          <div className="provider-top-avatar">A</div>
        </header>

        {section === "Dashboard" && (
          <>
            <section className="provider-welcome">
              <div>
                <span className="provider-eyebrow">ADMIN WORKSPACE</span>
                <h2>Welcome, Admin! 👋</h2>
                <p>
                  Publish learning projects, monitor student work, and
                  review project submissions from one place.
                </p>
                <button onClick={() => setSection("Post a Project")}>
                  + Post a Project
                </button>
              </div>
              <div className="provider-welcome-art">📊</div>
            </section>

            <section className="provider-stats">
              <article>
                <span>📁</span>
                <p>Published Projects</p>
                <h2>{projects.length}</h2>
              </article>
              <article>
                <span>📨</span>
                <p>Total Submissions</p>
                <h2>{submissions.length}</h2>
              </article>
              <article>
                <span>⏳</span>
                <p>Pending Review</p>
                <h2>{pendingCount}</h2>
              </article>
            </section>

            <section className="provider-section">
              <div className="provider-section-heading">
                <h2>Recent Published Projects</h2>
                <button onClick={() => setSection("Published Projects")}>
                  View all →
                </button>
              </div>
              {projectsLoading ? (
                <div className="provider-empty">Loading projects...</div>
              ) : projects.length === 0 ? (
                <div className="provider-empty">
                  <span>📂</span>
                  <h3>No projects yet</h3>
                  <p>Publish your first project for students.</p>
                </div>
              ) : (
                <div className="provider-project-grid">
                  {projects.slice(0, 3).map((item) => (
                    <article className="provider-project-card" key={item.id}>
                      <div className="provider-card-top">
                        <span className="provider-project-icon">📘</span>
                        <span className="provider-project-status">Published</span>
                      </div>
                      <p className="provider-category">{item.category}</p>
                      <h3>{projectName(item)}</h3>
                      <p className="provider-description">{item.description}</p>
                      <div className="provider-project-bottom">
                        <strong>₹{Number(item.reward || 0).toLocaleString("en-IN")}</strong>
                        <small>{item.level || "Beginner"}</small>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {section === "Post a Project" && (
          <section className="provider-panel">
            <h2>Post a New Project</h2>
            <p>Publish a project for students to view and complete.</p>

            {projectMessage && (
              <div className="provider-message">{projectMessage}</div>
            )}
            {projectError && (
              <div className="provider-message" role="alert">
                {projectError}
              </div>
            )}

            <form onSubmit={postProject} className="provider-project-form">
              <label>
                Project Title *
                <input name="title" value={project.title} onChange={handleProjectChange}
                  placeholder="Example: Student Career Portal" required />
              </label>

              <label>
                Category
                <select name="category" value={project.category} onChange={handleProjectChange}>
                  <option>Web Development</option>
                  <option>Artificial Intelligence</option>
                  <option>Machine Learning</option>
                  <option>Mobile App Development</option>
                  <option>Database Management</option>
                  <option>Other</option>
                </select>
              </label>

              <label className="provider-full-width">
                Description *
                <textarea name="description" value={project.description} onChange={handleProjectChange}
                  placeholder="Explain what the student needs to build." rows="3" required />
              </label>

              <label className="provider-full-width">
                Problem Statement *
                <textarea name="problem" value={project.problem} onChange={handleProjectChange}
                  placeholder="Describe the problem this project solves." rows="3" required />
              </label>

              <label>
                Objectives (one per line)
                <textarea name="objectives" value={project.objectives} onChange={handleProjectChange}
                  placeholder={"Build the interface\nConnect the database\nTest the application"} rows="3" />
              </label>

              <label>
                Technologies (comma-separated)
                <input name="technologies" value={project.technologies} onChange={handleProjectChange}
                  placeholder="React, Java, Spring Boot, MySQL" />
              </label>

              <label>
                Difficulty Level
                <select name="level" value={project.level} onChange={handleProjectChange}>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </label>

              <label>
                Advertised Reward (₹)
                <input type="number" name="reward" min="0" step="1"
                  value={project.reward} onChange={handleProjectChange} />
              </label>

              <label className="provider-full-width">
                Deadline
                <input name="deadline" value={project.deadline} onChange={handleProjectChange}
                  placeholder="Example: 30 November 2026" />
              </label>

              <button type="submit" className="provider-submit" disabled={posting}>
                {posting ? "Publishing..." : "Publish Project"}
              </button>
            </form>
          </section>
        )}

        {section === "Published Projects" && (
          <section className="provider-section">
            <div className="provider-section-heading">
              <h2>Published Projects</h2>
              <button onClick={loadProjects} disabled={projectsLoading}>
                {projectsLoading ? "Loading..." : "↻ Refresh"}
              </button>
            </div>

            {projectError && projects.length === 0 && (
              <div className="provider-message">{projectError}</div>
            )}
            {projectsLoading ? (
              <div className="provider-empty">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="provider-empty">
                <span>📂</span>
                <h3>No projects have been posted yet</h3>
                <p>Use Post a Project to publish your first project.</p>
              </div>
            ) : (
              <div className="provider-project-grid">
                {projects.map((item) => (
                  <article className="provider-project-card" key={item.id}>
                    <div className="provider-card-top">
                      <span className="provider-project-icon">📘</span>
                      <span className="provider-project-status">Published</span>
                    </div>
                    <p className="provider-category">{item.category || "General"}</p>
                    <h3>{projectName(item)}</h3>
                    <p className="provider-description">{item.description}</p>
                    <p><strong>Problem:</strong> {item.problem || "Not specified"}</p>
                    <p><strong>Technologies:</strong> {(item.technologies || []).join(", ") || "Not specified"}</p>
                    <div className="provider-project-bottom">
                      <strong>₹{Number(item.reward || 0).toLocaleString("en-IN")}</strong>
                      <small>{item.level || "Beginner"}</small>
                    </div>
                    <p><strong>Deadline:</strong> {item.deadline || "Not specified"}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {section === "Submissions" && (
          <section className="provider-section">
            <div className="provider-section-heading">
              <div>
                <h2>Project Submissions</h2>
                <p>Review student ZIP files and update their status.</p>
              </div>
              <button onClick={loadSubmissions} disabled={loading}>
                {loading ? "Loading..." : "↻ Refresh"}
              </button>
            </div>

            <div className="provider-stats">
              <article><span>📨</span><p>Total Submissions</p><h2>{submissions.length}</h2></article>
              <article><span>⏳</span><p>Pending Review</p><h2>{pendingCount}</h2></article>
              <article><span>✅</span><p>Approved</p><h2>{approvedCount}</h2></article>
            </div>

            {message && <div className="provider-message">{message}</div>}
            {error && <div className="provider-message" role="alert">{error}</div>}

            <div className="provider-panel">
              {loading ? (
                <div className="provider-empty">Loading submissions...</div>
              ) : submissions.length === 0 ? (
                <div className="provider-empty">
                  <span>📭</span>
                  <h3>No submissions found</h3>
                  <p>Uploaded student projects will appear here.</p>
                </div>
              ) : (
                <div className="provider-table-wrap">
                  <table className="provider-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Project Name</th>
                        <th>ZIP Filename</th>
                        <th>Status</th>
                        <th>Review Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((item) => {
                        const status = normalizedStatus(item);
                        return (
                          <tr key={item.id}>
                            <td>#{item.id}</td>
                            <td>{projectName(item)}</td>
                            <td>{fileName(item)}</td>
                            <td>
                              <span className={`provider-project-status ${
                                status === "approved" ? "" :
                                status === "rejected" ? "closed" : "in-progress"
                              }`}>
                                {item.status || "Pending Review"}
                              </span>
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button className="provider-submit"
                                  disabled={updatingId !== null}
                                  onClick={() => updateStatus(item.id, "Approved")}>
                                  {updatingId === item.id ? "Updating..." : "Approve"}
                                </button>
                                <button className="reject-button"
                                  disabled={updatingId !== null}
                                  onClick={() => updateStatus(item.id, "Rejected")}>
                                  {updatingId === item.id ? "Updating..." : "Reject"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <p>Rejected submissions: {rejectedCount}</p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
