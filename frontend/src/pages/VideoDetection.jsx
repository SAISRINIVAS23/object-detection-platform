import { useState, useRef } from "react";
import api from "../api/axios";
import { FaUpload, FaDownload, FaRedo, FaExclamationTriangle, FaRobot, FaSlidersH, FaFilm } from "react-icons/fa";

function VideoDetection() {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [confidence, setConfidence] = useState(0.25);
    const fileInputRef = useRef();

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
            setResult(null);
            setError("");
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const selected = e.dataTransfer.files[0];
        if (selected && selected.type.startsWith("video/")) {
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
            setResult(null);
            setError("");
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        setError("");

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await api.post(`/detect/video?conf=${confidence}`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                timeout: 300000, // Extend timeout for longer video processing
            });
            setResult(response.data);
            
            const event = new CustomEvent("new-notification", {
                detail: { text: `Video "${file.name}" processed: detected ${response.data.detections?.length || 0} object classes.` }
            });
            window.dispatchEvent(event);
        } catch (err) {
            console.error("Video processing error:", err);
            setError(err.response?.data?.detail || "Video detection failed. Ensure the file is not corrupted.");
        } finally {
            setLoading(false);
        }
    };

    const triggerFileSelect = () => {
        fileInputRef.current.click();
    };

    const handleReset = () => {
        setFile(null);
        setPreview("");
        setResult(null);
        setError("");
    };

    const handleDownload = async () => {
        if (!result || !result.processed_video) return;
        try {
            const response = await fetch(result.processed_video);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `detected_${file.name}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (err) {
            console.error("Download failed:", err);
            window.open(result.processed_video, "_blank");
        }
    };

    return (
        <div className="container-fluid py-4">
            <div className="mb-4">
                <h2 className="fw-bold text-dark m-0">Video Detection</h2>
                <p className="text-muted m-0">Upload a video to run YOLO11 frame-by-frame object detection</p>
            </div>

            {error && (
                <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
                    <FaExclamationTriangle className="me-2" />
                    <div>{error}</div>
                </div>
            )}

            {!file ? (
                /* Drag and drop selection */
                <div 
                    className="card border-2 border-dashed d-flex flex-column align-items-center justify-content-center py-5 px-4 text-center bg-white shadow-sm"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    style={{ borderStyle: "dashed", borderRadius: "16px", cursor: "pointer", minHeight: "350px" }}
                    onClick={triggerFileSelect}
                >
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        className="d-none" 
                        accept="video/*"
                        onChange={handleFileChange}
                    />
                    <div className="p-4 bg-primary bg-opacity-10 text-primary rounded-circle mb-3">
                        <FaFilm size={40} />
                    </div>
                    <h5 className="fw-bold text-dark">Drag and drop your video here</h5>
                    <p className="text-muted mb-0">or click to browse from files</p>
                    <span className="text-muted mt-2" style={{ fontSize: "12px" }}>Supports MP4, AVI, MOV</span>
                </div>
            ) : (
                /* Video selected / Results display */
                <div className="row g-4">
                    {/* Left/Middle Column: Player Display */}
                    <div className="col-lg-8">
                        <div className="card border-0 shadow-sm p-4 bg-white mb-4" style={{ borderRadius: "16px" }}>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="fw-bold text-dark m-0">
                                    {result ? "Processed Video Output" : "Original Video Preview"}
                                </h5>
                                <div className="d-flex gap-2">
                                    {result && (
                                        <button className="btn btn-success d-flex align-items-center" onClick={handleDownload}>
                                            <FaDownload className="me-2" /> Download Output
                                        </button>
                                    )}
                                    <button className="btn btn-outline-secondary d-flex align-items-center" onClick={handleReset} disabled={loading}>
                                        <FaRedo className="me-2" /> Reset
                                    </button>
                                </div>
                            </div>

                            <div className="text-center bg-light rounded-3 p-2 border overflow-hidden position-relative d-flex align-items-center justify-content-center" style={{ minHeight: "400px" }}>
                                {loading && (
                                    <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-white bg-opacity-75 z-3">
                                        <div className="spinner-border text-primary mb-3" role="status" style={{ width: "3rem", height: "3rem" }}></div>
                                        <h5 className="fw-bold text-primary">Processing Video Frames...</h5>
                                        <p className="text-muted mb-0">Executing object identification across sequence</p>
                                        <small className="text-muted mt-1">(This may take a minute depending on duration)</small>
                                    </div>
                                )}
                                
                                {result ? (
                                    <video 
                                        src={result.processed_video} 
                                        controls 
                                        className="w-100 rounded shadow-sm"
                                        style={{ maxHeight: "550px" }}
                                    />
                                ) : (
                                    <video 
                                        src={preview} 
                                        controls 
                                        className="w-100 rounded shadow-sm"
                                        style={{ maxHeight: "550px" }}
                                    />
                                )}
                            </div>

                            {!result && !loading && (
                                <div className="text-center mt-4">
                                    <button className="btn btn-primary px-5 py-2 fw-semibold" onClick={handleUpload}>
                                        Analyze Video
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Configurations & Detected Elements */}
                    <div className="col-lg-4">
                        <div className="card border-0 shadow-sm p-4 bg-white mb-4" style={{ borderRadius: "16px" }}>
                            <h5 className="fw-bold text-dark mb-3 d-flex align-items-center">
                                <FaSlidersH className="me-2 text-primary" /> Configuration
                            </h5>
                            
                            <div className="mb-2">
                                <div className="d-flex justify-content-between mb-1">
                                    <label className="form-label text-dark fw-semibold mb-0">Confidence Threshold</label>
                                    <span className="badge bg-primary">{Math.round(confidence * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    className="form-range"
                                    min="0.1"
                                    max="1.0"
                                    step="0.05"
                                    value={confidence}
                                    onChange={(e) => setConfidence(parseFloat(e.target.value))}
                                    disabled={loading || !!result}
                                />
                                <small className="text-muted">Adjust confidence levels required to identify objects.</small>
                            </div>
                        </div>

                        <div className="card border-0 shadow-sm p-4 bg-white" style={{ borderRadius: "16px", minHeight: "250px" }}>
                            <h5 className="fw-bold text-dark mb-3">Video Objects Summary</h5>
                            
                            {!result ? (
                                <div className="d-flex flex-column align-items-center justify-content-center h-75 text-center text-muted py-5">
                                    <FaRobot size={40} className="mb-2 text-secondary bg-light p-2 rounded-circle" />
                                    <p className="mb-0">Process video to display summary objects detected</p>
                                </div>
                            ) : (
                                <div className="d-flex flex-column gap-3">
                                    <div className="alert alert-success border-0 py-2 bg-success bg-opacity-10 text-success fw-bold text-center">
                                        Identified {result.detections?.length || 0} unique classes
                                    </div>
                                    
                                    {result.detections?.length === 0 ? (
                                        <div className="text-center py-4 text-muted border rounded-3 bg-light">
                                            No objects were detected.
                                        </div>
                                    ) : (
                                        <div className="list-group list-group-flush overflow-auto" style={{ maxHeight: "400px" }}>
                                            {result.detections?.map((det, index) => (
                                                <div key={index} className="list-group-item d-flex justify-content-between align-items-center px-0 py-3 border-bottom">
                                                    <div>
                                                        <span className="fw-bold text-capitalize text-dark" style={{ fontSize: "15px" }}>{det.object}</span>
                                                        <div className="text-muted" style={{ fontSize: "12px" }}>Class category</div>
                                                    </div>
                                                    <span className="badge bg-primary rounded-pill px-3 py-2 fw-semibold">
                                                        Avg: {Math.round(det.confidence * 100)}%
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default VideoDetection;
