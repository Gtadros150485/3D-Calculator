import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { projectsAPI } from "../api/client.js";
import useAuthStore from "../store/authStore.js";
import toast from "react-hot-toast";
import { Plus, LogOut, Trash2, FolderOpen, Clock } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data } = await projectsAPI.list();
      setProjects(data);
    } catch {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const { data } = await projectsAPI.create({ name: newName.trim() });
      navigate(`/projects/${data.id}`);
    } catch {
      toast.error("Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  const deleteProject = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Delete this project?")) return;
    try {
      await projectsAPI.delete(id);
      setProjects(projects.filter((p) => p.id !== id));
      toast.success("Project deleted");
    } catch {
      toast.error("Failed to delete project");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (project) => {
    const status = project.model_file?.status;
    if (!status) return null;
    const colors = {
      pending: "bg-yellow-100 text-yellow-700",
      processing: "bg-blue-100 text-blue-700",
      done: "bg-green-100 text-green-700",
      error: "bg-red-100 text-red-700",
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[status] || ""}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🖨️</span>
            <div>
              <h1 className="font-bold text-gray-900">3D Cost Calculator</h1>
              <p className="text-xs text-gray-500">Welcome, {user?.username}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-secondary flex items-center gap-2 text-sm">
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Create project */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">My Projects</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            New Project
          </button>
        </div>

        {showForm && (
          <div className="card p-4 mb-6">
            <form onSubmit={createProject} className="flex gap-3">
              <input
                className="input flex-1"
                placeholder="Project name (e.g. Bracket Assembly)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn-primary" disabled={creating}>
                {creating ? "Creating..." : "Create"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {/* Project list */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📂</div>
            <p className="text-gray-500 text-lg">No projects yet</p>
            <p className="text-gray-400 text-sm mt-1">Create your first project to get started</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="card p-5 cursor-pointer hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <FolderOpen size={18} className="text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
                        {getStatusBadge(project)}
                      </div>
                      {project.client && (
                        <p className="text-sm text-gray-500 mt-0.5">Client: {project.client}</p>
                      )}
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                        <Clock size={11} />
                        {formatDate(project.created_at)}
                        {project.calculation?.price_per_unit ? (
                          <span className="ml-3 text-green-600 font-medium">
                            {project.calculation.price_per_unit.toFixed(2)}{" "}
                            {project.calculation.currency}/pc
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => deleteProject(project.id, e)}
                    className="text-gray-300 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
