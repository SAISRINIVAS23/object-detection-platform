import { useState, useEffect } from "react";
import api from "../api/axios";
import { FaSearch, FaEye, FaCalendarAlt, FaTimes, FaImage } from "react-icons/fa";

function DetectionLogs() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    
    // Modal states
    const [selectedDetection, setSelectedDetection] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await api.get("/history/");
                setHistory(response.data);
            } catch (err) {
                console.error("Error fetching history logs:", err);
                setError("Failed to load detection logs.");
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const filteredHistory = history.filter((item) => {
        const query = searchQuery.toLowerCase();
        if (!query) return true;
        
        // Match filename
        if (item.image_name.toLowerCase().includes(query)) return true;
        
        // Match detected objects
        const objectsString = (item.detections || [])
            .map((d) => d.object.toLowerCase())
            .join(" ");
        return objectsString.includes(query);
    });

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: "70vh" }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading history...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return <div className="alert alert-danger m-3">{error}</div>;
    }

    return (
        <div className="container-fluid py-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <h2 className="fw-bold text-dark m-0">Detection History</h2>
                    <p className="text-muted m-0">Browse and search through your past image scans</p>
                </div>
                
                {/* Search Bar */}
                <div className="position-relative" style={{ minWidth: "300px" }}>
                    <span className="position-absolute top-50 start-0 translate-middle-y ps-3 text-muted">
                        <FaSearch />
                    </span>
                    <input
                        type="text"
                        className="form-control ps-5 py-2 border-0 shadow-sm"
                        placeholder="Search objects or filenames..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ borderRadius: "10px" }}
                    />
                </div>
            </div>

            {/* Table Container */}
            <div className="card border-0 shadow-sm bg-white" style={{ borderRadius: "16px" }}>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light" style={{ fontSize: "13px" }}>
                                <tr>
                                    <th className="py-3 px-4 text-muted text-uppercase border-0">Preview</th>
                                    <th className="py-3 text-muted text-uppercase border-0">Filename</th>
                                    <th className="py-3 text-muted text-uppercase border-0">Detected Objects</th>
                                    <th className="py-3 text-muted text-uppercase border-0">Date & Time</th>
                                    <th className="py-3 px-4 text-muted text-uppercase border-0 text-end">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredHistory.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-5 text-muted">
                                            {searchQuery ? "No matching detection logs found." : "No detection history found."}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredHistory.map((item) => {
                                        const dateString = new Date(item.created_at).toLocaleString();
                                        const detectionsList = item.detections || [];
                                        
                                        // Get unique object counts
                                        const counts = {};
                                        detectionsList.forEach((d) => {
                                            counts[d.object] = (counts[d.object] || 0) + 1;
                                        });
                                        const uniqueSummary = Object.entries(counts)
                                            .map(([name, count]) => `${count}x ${name}`)
                                            .join(", ");

                                        return (
                                            <tr key={item.id}>
                                                <td className="py-3 px-4">
                                                    <img
                                                        src={`http://127.0.0.1:8000${item.processed_image}`}
                                                        alt={item.image_name}
                                                        className="rounded border shadow-xs"
                                                        style={{ width: "80px", height: "60px", objectFit: "cover", cursor: "pointer" }}
                                                        onClick={() => setSelectedDetection(item)}
                                                        onError={(e) => {
                                                            e.target.src = "https://placehold.co/80x60?text=No+Preview";
                                                        }}
                                                    />
                                                </td>
                                                <td className="py-3 fw-semibold text-dark">
                                                    <span className="d-inline-block text-truncate" style={{ maxWidth: "200px" }}>
                                                        {item.image_name}
                                                    </span>
                                                </td>
                                                <td className="py-3">
                                                    {detectionsList.length === 0 ? (
                                                        <span className="badge bg-secondary">No objects</span>
                                                    ) : (
                                                        <div>
                                                            <div className="d-flex flex-wrap gap-1 mb-1">
                                                                {[...new Set(detectionsList.map((d) => d.object))].slice(0, 3).map((obj) => (
                                                                    <span key={obj} className="badge bg-light text-dark border text-capitalize">
                                                                        {obj}
                                                                    </span>
                                                                ))}
                                                                {new Set(detectionsList.map((d) => d.object)).size > 3 && (
                                                                    <span className="badge bg-primary bg-opacity-10 text-primary">
                                                                        +{new Set(detectionsList.map((d) => d.object)).size - 3} more
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <small className="text-muted d-block text-capitalize" style={{ fontSize: "11px" }}>
                                                                {uniqueSummary}
                                                            </small>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-3 text-muted fw-medium" style={{ fontSize: "14px" }}>
                                                    <div className="d-flex align-items-center">
                                                        <FaCalendarAlt className="me-2 text-secondary" size={12} />
                                                        {dateString}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-end">
                                                    <button
                                                        className="btn btn-outline-primary btn-sm px-3 fw-semibold d-inline-flex align-items-center"
                                                        onClick={() => setSelectedDetection(item)}
                                                    >
                                                        <FaEye className="me-1" /> View Detail
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Custom Modal for Detailed View */}
            {selectedDetection && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered modal-xl">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "16px" }}>
                            <div className="modal-header border-0 bg-light py-3 px-4" style={{ borderTopLeftRadius: "16px", borderTopRightRadius: "16px" }}>
                                <h5 className="modal-title fw-bold text-dark d-flex align-items-center">
                                    <FaImage className="me-2 text-primary" /> Detection Details
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setSelectedDetection(null)} aria-label="Close"></button>
                            </div>
                            <div className="modal-body p-4">
                                <div className="row g-4">
                                    {/* Modal Image */}
                                    <div className="col-lg-8 text-center bg-light rounded-3 p-2 border d-flex align-items-center justify-content-center" style={{ minHeight: "350px" }}>
                                        <img
                                            src={`http://127.0.0.1:8000${selectedDetection.processed_image}`}
                                            alt={selectedDetection.image_name}
                                            className="img-fluid rounded shadow-sm"
                                            style={{ maxHeight: "500px", objectFit: "contain" }}
                                            onError={(e) => {
                                                e.target.src = "https://placehold.co/600x400?text=Error+Loading+Image";
                                            }}
                                        />
                                    </div>
                                    {/* Modal Details */}
                                    <div className="col-lg-4 d-flex flex-column">
                                        <h6 className="fw-bold text-muted text-uppercase mb-3" style={{ fontSize: "11px", letterSpacing: "1px" }}>Metadata</h6>
                                        <div className="mb-4">
                                            <div className="mb-2 text-dark">
                                                <span className="fw-semibold">Filename:</span> 
                                                <div className="text-break bg-light p-2 rounded border mt-1" style={{ fontSize: "13px" }}>
                                                    {selectedDetection.image_name}
                                                </div>
                                            </div>
                                            <div className="text-dark" style={{ fontSize: "14px" }}>
                                                <span className="fw-semibold">Analyzed On:</span> {new Date(selectedDetection.created_at).toLocaleString()}
                                            </div>
                                        </div>

                                        <h6 className="fw-bold text-muted text-uppercase mb-2" style={{ fontSize: "11px", letterSpacing: "1px" }}>Detections Output</h6>
                                        <div className="flex-grow-1 overflow-auto" style={{ maxHeight: "280px" }}>
                                            {(!selectedDetection.detections || selectedDetection.detections.length === 0) ? (
                                                <div className="text-center py-4 text-muted border rounded-3 bg-light">
                                                    No objects were detected.
                                                </div>
                                            ) : (
                                                <div className="list-group list-group-flush">
                                                    {selectedDetection.detections.map((det, index) => (
                                                        <div key={index} className="list-group-item d-flex justify-content-between align-items-center px-0 py-2 border-bottom">
                                                            <span className="text-capitalize fw-semibold text-dark">{det.object}</span>
                                                            <span className="badge bg-primary bg-opacity-10 text-primary fw-bold">
                                                                {Math.round(det.confidence * 100)}% Match
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DetectionLogs;
