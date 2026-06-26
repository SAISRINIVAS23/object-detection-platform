import { useState, useEffect, useRef } from "react";
import api from "../api/axios";
import { FaCamera, FaStop, FaPlay, FaExclamationTriangle, FaRobot, FaSlidersH, FaSave, FaCheck, FaToggleOn, FaToggleOff } from "react-icons/fa";

function WebcamDetection() {
    const [streaming, setStreaming] = useState(false);
    const [confidence, setConfidence] = useState(0.25);
    const [detections, setDetections] = useState([]);
    const [error, setError] = useState("");
    const [captureSuccess, setCaptureSuccess] = useState(false);
    const [captureLoading, setCaptureLoading] = useState(false);
    const [autoSave, setAutoSave] = useState(false); // Auto screenshot capture toggle

    const videoRef = useRef(null);
    const outputCanvasRef = useRef(null);
    const streamRef = useRef(null);
    const frameIntervalRef = useRef(null);
    const currentFrameRef = useRef(""); // Latest base64 frame
    const autoSaveCooldownRef = useRef(false); // Throttle auto-saves

    // Sync streaming state changes
    useEffect(() => {
        if (streaming) {
            startCamera();
        } else {
            stopCamera();
        }
    }, [streaming]);

    // Clean up streams when moving away
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    const startCamera = async () => {
        setError("");
        setDetections([]);
        setCaptureSuccess(false);
        try {
            const constraints = {
                video: { width: 640, height: 480, facingMode: "user" },
                audio: false
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }

            startAnalysisLoop();
        } catch (err) {
            console.error("Camera access error:", err);
            setError("Could not access your webcam. Please verify browser camera permissions.");
            setStreaming(false);
        }
    };

    const stopCamera = () => {
        if (frameIntervalRef.current) {
            clearInterval(frameIntervalRef.current);
            frameIntervalRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        if (outputCanvasRef.current) {
            const context = outputCanvasRef.current.getContext("2d");
            context.clearRect(0, 0, outputCanvasRef.current.width, outputCanvasRef.current.height);
        }

        setDetections([]);
        currentFrameRef.current = "";
    };

    const startAnalysisLoop = () => {
        const hiddenCanvas = document.createElement("canvas");
        hiddenCanvas.width = 640;
        hiddenCanvas.height = 480;
        const hiddenCtx = hiddenCanvas.getContext("2d");

        frameIntervalRef.current = setInterval(async () => {
            if (!videoRef.current || !streamRef.current || videoRef.current.paused) return;

            try {
                hiddenCtx.drawImage(videoRef.current, 0, 0, 640, 480);
                const base64Frame = hiddenCanvas.toDataURL("image/jpeg", 0.7);
                currentFrameRef.current = base64Frame;

                const response = await api.post("/detect/frame", {
                    frame: base64Frame,
                    conf: confidence
                });

                if (response.data.success) {
                    const currentDets = response.data.detections || [];
                    setDetections(currentDets);
                    
                    // Render annotated frame
                    const img = new Image();
                    img.onload = () => {
                        if (outputCanvasRef.current) {
                            const ctx = outputCanvasRef.current.getContext("2d");
                            ctx.drawImage(img, 0, 0, 640, 480);
                        }
                    };
                    img.src = response.data.annotated_frame;

                    // AUTO SCREENSHOT CAPTURE: Auto save to database if objects are found and autoSave is active
                    if (autoSave && currentDets.length > 0 && !autoSaveCooldownRef.current) {
                        autoSaveCooldownRef.current = true;
                        
                        api.post("/detect/webcam", {
                            frame: base64Frame,
                            conf: confidence
                        }).then(() => {
                            setCaptureSuccess(true);
                            setTimeout(() => setCaptureSuccess(false), 2000);

                            const event = new CustomEvent("new-notification", {
                                detail: { text: "Webcam auto-screenshot saved (objects detected)." }
                            });
                            window.dispatchEvent(event);
                        }).catch((e) => {
                            console.error("Auto capture failed:", e);
                        }).finally(() => {
                            // 5 second cooldown between auto captures to prevent flooding the database
                            setTimeout(() => {
                                autoSaveCooldownRef.current = false;
                            }, 5000);
                        });
                    }
                }
            } catch (err) {
                console.error("Frame loop analysis error:", err);
            }
        }, 220);
    };

    const handleManualCapture = async () => {
        if (!streaming || !currentFrameRef.current) return;

        setCaptureLoading(true);
        setCaptureSuccess(false);
        setError("");

        try {
            const response = await api.post("/detect/webcam", {
                frame: currentFrameRef.current,
                conf: confidence
            });

            if (response.data.success) {
                setCaptureSuccess(true);
                setTimeout(() => setCaptureSuccess(false), 2500);

                const event = new CustomEvent("new-notification", {
                    detail: { text: "Webcam screenshot captured and saved successfully." }
                });
                window.dispatchEvent(event);
            }
        } catch (err) {
            console.error("Manual capture save error:", err);
            setError("Failed to save camera screenshot to the database.");
        } finally {
            setCaptureLoading(false);
        }
    };

    return (
        <div className="container-fluid py-4">
            <div className="mb-4">
                <h2 className="fw-bold text-dark m-0">Live Camera</h2>
                <p className="text-muted m-0">Run real-time object detection directly on your webcam feed</p>
            </div>

            {error && (
                <div className="alert alert-danger d-flex align-items-center mb-4 border-0 bg-danger bg-opacity-10 text-danger" role="alert">
                    <FaExclamationTriangle className="me-2" />
                    <div>{error}</div>
                </div>
            )}

            {captureSuccess && (
                <div className="alert alert-success d-flex align-items-center mb-4 border-0 bg-success bg-opacity-10 text-success" role="alert">
                    <FaCheck className="me-2" />
                    <div>Webcam detection frame captured and saved successfully!</div>
                </div>
            )}

            <div className="row g-4">
                {/* Left Column: Live camera feed */}
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm p-4 bg-white" style={{ borderRadius: "16px" }}>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="fw-bold text-dark m-0">Live Stream Output</h5>
                            <div className="d-flex gap-2">
                                {streaming && (
                                    <button 
                                        className="btn btn-success d-flex align-items-center fw-semibold px-3"
                                        onClick={handleManualCapture}
                                        disabled={captureLoading}
                                    >
                                        <FaSave className="me-2" /> 
                                        {captureLoading ? "Saving..." : "Capture & Save"}
                                    </button>
                                )}
                                <button 
                                    className={`btn ${streaming ? "btn-danger" : "btn-primary"} d-flex align-items-center fw-semibold px-4`}
                                    onClick={() => setStreaming(!streaming)}
                                    disabled={captureLoading}
                                >
                                    {streaming ? (
                                        <>
                                            <FaStop className="me-2" /> Stop Stream
                                        </>
                                    ) : (
                                        <>
                                            <FaPlay className="me-2" /> Start Stream
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Video streaming viewports */}
                        <div className="position-relative bg-dark rounded-3 overflow-hidden border d-flex align-items-center justify-content-center" style={{ minHeight: "480px" }}>
                            <video
                                ref={videoRef}
                                className="d-none"
                                width="640"
                                height="480"
                                playsInline
                                muted
                            />

                            <canvas
                                ref={outputCanvasRef}
                                width="640"
                                height="480"
                                className="w-100 h-100 rounded-3"
                                style={{ display: streaming ? "block" : "none", maxWidth: "640px", maxHeight: "480px", objectFit: "contain" }}
                            />

                            {!streaming && (
                                <div className="text-center text-white py-5 px-3">
                                    <div className="p-4 bg-light bg-opacity-10 text-white rounded-circle d-inline-flex mb-3">
                                        <FaCamera size={44} />
                                    </div>
                                    <h5 className="fw-bold text-light">Webcam feed is inactive</h5>
                                    <p className="text-muted mb-0">Click the button above to launch camera and begin detection</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Conf Slider & Current Detections list */}
                <div className="col-lg-4">
                    {/* Configuration Panel */}
                    <div className="card border-0 shadow-sm p-4 bg-white mb-4" style={{ borderRadius: "16px" }}>
                        <h5 className="fw-bold text-dark mb-3 d-flex align-items-center">
                            <FaSlidersH className="me-2 text-primary" /> Configuration
                        </h5>

                        {/* Confidence slider */}
                        <div className="mb-4">
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
                                disabled={captureLoading}
                            />
                        </div>

                        {/* Auto-Save Toggle */}
                        <div className="d-flex align-items-center justify-content-between border-top pt-3">
                            <div>
                                <label className="fw-semibold text-dark mb-0" style={{ cursor: "pointer" }} onClick={() => setAutoSave(!autoSave)}>
                                    Auto Screenshot Capture
                                </label>
                                <div className="text-muted" style={{ fontSize: "11px" }}>Save automatically on object detection</div>
                            </div>
                            <div style={{ cursor: "pointer" }} onClick={() => setAutoSave(!autoSave)}>
                                {autoSave ? (
                                    <FaToggleOn size={32} className="text-success" />
                                ) : (
                                    <FaToggleOff size={32} className="text-secondary" />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Detections Panel */}
                    <div className="card border-0 shadow-sm p-4 bg-white" style={{ borderRadius: "16px", minHeight: "300px" }}>
                        <h5 className="fw-bold text-dark mb-3">Real-time Objects</h5>
                        
                        {!streaming ? (
                            <div className="d-flex flex-column align-items-center justify-content-center h-75 text-center text-muted py-5">
                                <FaRobot size={40} className="mb-2 text-secondary bg-light p-2 rounded-circle" />
                                <p className="mb-0">Start camera feed to view identified items</p>
                            </div>
                        ) : (
                            <div className="d-flex flex-column gap-3">
                                <div className="alert alert-info border-0 py-2 bg-info bg-opacity-10 text-info fw-bold text-center">
                                    Currently showing {detections.length} objects
                                </div>

                                {detections.length === 0 ? (
                                    <div className="text-center py-4 text-muted border rounded-3 bg-light">
                                        Scanning frame...
                                    </div>
                                ) : (
                                    <div className="list-group list-group-flush overflow-auto" style={{ maxHeight: "250px" }}>
                                        {detections.map((det, index) => (
                                            <div key={index} className="list-group-item d-flex justify-content-between align-items-center px-0 py-2 border-bottom">
                                                <span className="fw-bold text-capitalize text-dark" style={{ fontSize: "14px" }}>{det.object}</span>
                                                <span className="badge bg-primary px-2 py-1">
                                                    {Math.round(det.confidence * 100)}%
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
        </div>
    );
}

export default WebcamDetection;
