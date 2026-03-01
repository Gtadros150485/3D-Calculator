import { useState, useRef } from "react";
import { filesAPI } from "../api/client.js";
import toast from "react-hot-toast";
import { Upload, File } from "lucide-react";

export default function FileUpload({ projectId, onUploaded }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["stl", "obj", "3mf"].includes(ext)) {
      toast.error("Only STL, OBJ, and 3MF files are supported");
      return;
    }
    setUploading(true);
    try {
      const { data } = await filesAPI.upload(projectId, file);
      toast.success("File uploaded! Processing started...");
      onUploaded(data);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const onInputChange = (e) => {
    handleFile(e.target.files[0]);
    e.target.value = "";
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => !uploading && inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
        dragging
          ? "border-blue-400 bg-blue-50"
          : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
      } ${uploading ? "opacity-60 cursor-not-allowed" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".stl,.obj,.3mf"
        className="hidden"
        onChange={onInputChange}
        disabled={uploading}
      />
      <div className="flex flex-col items-center gap-2">
        {uploading ? (
          <>
            <div className="text-2xl animate-spin">⚙️</div>
            <p className="text-sm font-medium text-blue-600">Uploading...</p>
          </>
        ) : (
          <>
            <Upload size={28} className="text-gray-400" />
            <p className="text-sm font-medium text-gray-600">
              Drop your 3D file here or <span className="text-blue-600">browse</span>
            </p>
            <p className="text-xs text-gray-400">STL, OBJ, 3MF — up to 100 MB</p>
          </>
        )}
      </div>
    </div>
  );
}
