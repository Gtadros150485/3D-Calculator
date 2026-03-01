import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { projectsAPI, filesAPI } from "../api/client.js";
import ParametersForm from "../components/ParametersForm.jsx";
import PriceBreakdown from "../components/PriceBreakdown.jsx";
import Viewer3D from "../components/Viewer3D.jsx";
import FileUpload from "../components/FileUpload.jsx";
import toast from "react-hot-toast";
import { ArrowLeft, Save, Sparkles, RefreshCw } from "lucide-react";

const POLL_INTERVAL = 2500; // ms

export default function ProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [params, setParams] = useState({});

  const pollRef = useRef(null);
  const saveTimerRef = useRef(null);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  // Load project on mount
  useEffect(() => {
    loadProject();
    return () => {
      clearInterval(pollRef.current);
      clearTimeout(saveTimerRef.current);
    };
  }, [id]);

  // Start/stop polling based on model status
  useEffect(() => {
    if (!project) return;
    const status = project.model_file?.status;
    if (status === "pending" || status === "processing") {
      pollRef.current = setInterval(pollStatus, POLL_INTERVAL);
    } else {
      clearInterval(pollRef.current);
    }
    return () => clearInterval(pollRef.current);
  }, [project?.model_file?.status]);

  const loadProject = async () => {
    try {
      const { data } = await projectsAPI.get(id);
      setProject(data);
      setParams(data.parameters || {});
    } catch {
      toast.error("Project not found");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const pollStatus = async () => {
    try {
      const { data } = await filesAPI.status(id);
      setProject((p) => ({ ...p, model_file: data }));
      if (data.status === "done") {
        clearInterval(pollRef.current);
        toast.success("Model analyzed successfully!");
        // Auto-calculate with new model data
        runCalculation();
      } else if (data.status === "error") {
        clearInterval(pollRef.current);
        toast.error("Model analysis failed: " + data.error_message);
      }
    } catch {
      // Model file may not exist yet
    }
  };

  const handleParamsChange = useCallback((newParams) => {
    setParams(newParams);
    // Debounce: save params + recalculate after 1s of no changes
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      await saveParams(newParams);
      await runCalculation(newParams);
    }, 800);
  }, [id]);

  const saveParams = async (newParams) => {
    try {
      await projectsAPI.update(id, { parameters: newParams });
    } catch {
      // silent
    }
  };

  const runCalculation = async (overrideParams) => {
    setCalculating(true);
    try {
      // Save latest params first
      await projectsAPI.update(id, { parameters: overrideParams || paramsRef.current });
      const { data } = await projectsAPI.calculate(id);
      setProject(data);
    } catch {
      // silent
    } finally {
      setCalculating(false);
    }
  };

  const saveProjectInfo = async (field, value) => {
    setSaving(true);
    try {
      const { data } = await projectsAPI.update(id, { [field]: value });
      setProject(data);
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUploaded = (modelFile) => {
    setProject((p) => ({ ...p, model_file: modelFile }));
  };

  const handleGenerateAI = async () => {
    setGeneratingAI(true);
    try {
      const { data } = await projectsAPI.generateAI(id);
      setProject(data);
      toast.success("AI description generated!");
    } catch {
      toast.error("AI generation failed");
    } finally {
      setGeneratingAI(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading project...</p>
      </div>
    );
  }

  const modelFile = project?.model_file;
  const calc = project?.calculation || {};

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 sticky top-0 z-10">
        <Link to="/" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <input
            className="text-lg font-bold text-gray-900 bg-transparent border-none outline-none w-full truncate hover:bg-gray-50 px-1 rounded"
            defaultValue={project?.name}
            onBlur={(e) => saveProjectInfo("name", e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          {saving && <span>Saving...</span>}
        </div>
      </header>

      {/* 3-column layout */}
      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 57px)" }}>
        {/* LEFT: Parameters */}
        <div className="w-80 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto p-4">
          {/* Project meta */}
          <div className="mb-4 space-y-2">
            <p className="section-title">Project Info</p>
            <div>
              <label className="label">Client</label>
              <input
                className="input"
                defaultValue={project?.client}
                placeholder="Client name"
                onBlur={(e) => saveProjectInfo("client", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Contact</label>
              <input
                className="input"
                defaultValue={project?.contact}
                placeholder="Email or phone"
                onBlur={(e) => saveProjectInfo("contact", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea
                className="input resize-none"
                rows={2}
                defaultValue={project?.notes}
                placeholder="Any notes..."
                onBlur={(e) => saveProjectInfo("notes", e.target.value)}
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 mb-4">
            <p className="section-title">3D Model</p>
            <FileUpload projectId={id} onUploaded={handleFileUploaded} />
            {modelFile && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700 truncate">{modelFile.original_filename}</span>
                  <span className={`px-2 py-0.5 rounded-full font-medium ${
                    modelFile.status === "done" ? "bg-green-100 text-green-700" :
                    modelFile.status === "error" ? "bg-red-100 text-red-700" :
                    "bg-blue-100 text-blue-700 animate-pulse"
                  }`}>
                    {modelFile.status}
                  </span>
                </div>
                {modelFile.status === "done" && (
                  <>
                    <div className="text-gray-500">
                      {modelFile.dim_x?.toFixed(1)} × {modelFile.dim_y?.toFixed(1)} × {modelFile.dim_z?.toFixed(1)} mm
                    </div>
                    <div className="text-gray-500">
                      Volume: {modelFile.volume_cm3?.toFixed(2)} cm³
                    </div>
                    <div className="text-gray-500">
                      Polygons: {modelFile.polygon_count?.toLocaleString()}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="section-title">Production Parameters</p>
            <ParametersForm
              initialParams={params}
              onParamsChange={handleParamsChange}
            />
          </div>
        </div>

        {/* CENTER: 3D Viewer */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 relative">
            <Viewer3D modelFile={modelFile} />
          </div>

          {/* AI Description panel */}
          {(project?.ai_description || project?.ai_commercial_text) && (
            <div className="border-t border-gray-200 bg-white p-4 max-h-48 overflow-y-auto">
              <p className="section-title flex items-center gap-1">
                <span>✨</span> AI Description
              </p>
              {project.ai_description && (
                <p className="text-sm text-gray-700 mb-2">{project.ai_description}</p>
              )}
              {project.ai_commercial_text && (
                <p className="text-sm text-gray-500 italic">{project.ai_commercial_text}</p>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Price breakdown */}
        <div className="w-72 flex-shrink-0 bg-white border-l border-gray-200 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="section-title mb-0">Price Calculation</p>
            <button
              onClick={() => runCalculation()}
              disabled={calculating}
              className="text-gray-400 hover:text-blue-600 transition-colors"
              title="Recalculate"
            >
              <RefreshCw size={14} className={calculating ? "animate-spin" : ""} />
            </button>
          </div>

          {calculating ? (
            <div className="text-center py-8 text-sm text-gray-400 animate-pulse">
              Calculating...
            </div>
          ) : (
            <PriceBreakdown calc={calc} />
          )}

          {/* AI button */}
          <div className="mt-6 border-t border-gray-100 pt-4">
            <button
              onClick={handleGenerateAI}
              disabled={generatingAI}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white font-medium px-4 py-2.5 rounded-lg transition-all disabled:opacity-50"
            >
              <Sparkles size={15} />
              {generatingAI ? "Generating..." : "Generate AI Description"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
