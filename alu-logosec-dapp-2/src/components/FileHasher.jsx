import { useState, useRef } from "react";
import { hashFile } from "../utils/hash";

export default function FileHasher({ onHash, label = "Upload Image File" }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [hash, setHash] = useState("");
  const [hashing, setHashing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef();

  const processFile = async (f) => {
    if (!f) return;
    setFile(f);
    setHashing(true);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
    const h = await hashFile(f);
    setHash(h);
    setHashing(false);
    if (onHash) onHash(h, f);
  };

  const handleInput = (e) => processFile(e.target.files[0]);
  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    processFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="stack-sm">
      <div
        className={`upload-zone ${dragOver ? "drag-over" : ""}`}
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="upload-icon">📁</div>
        <div className="upload-text">{label}</div>
        <div className="upload-sub">Click to browse or drag and drop · PNG, JPG, SVG, WebP</div>
        {preview && <img src={preview} alt="preview" className="img-preview" />}
      </div>

      <input
        ref={inputRef}
        type="file" accept="image/*"
        style={{ display: "none" }}
        onChange={handleInput}
      />

      {hashing && (
        <div className="alert alert-info" style={{ gap: "0.5rem" }}>
          <span className="spinner" />
          Computing SHA-256 hash in your browser…
        </div>
      )}

      {hash && !hashing && (
        <div className="stack-sm">
          <div className="form-label">Computed SHA-256 Hash (bytes32)</div>
          <div className="hash-display">{hash}</div>
          {file && (
            <div style={{ fontSize: "0.78rem", color: "var(--text-2)" }}>
              {file.name} · {(file.size / 1024).toFixed(1)} KB
            </div>
          )}
        </div>
      )}
    </div>
  );
}
