import { useState, useEffect } from "react";
import api from "../api/axios";
import { FaUpload, FaSearch, FaCalendarAlt, FaRobot, FaFilm, FaCamera } from "react-icons/fa";

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get("/dashboard/stats");
                setStats(response.data);
            } catch (err) {
                console.error("Error fetching stats:", err);
                setError("Failed to load dashboard statistics.");
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: "70vh" }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading stats...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return <div className="alert alert-danger m-3">{error}</div>;
    }

    const { 
        total_detections, 
        images_processed, 
        videos_processed, 
        screenshots_saved, 
        total_items_detected, 
        object_counts, 
        active_days, 
        recent_detections 
    } = stats;

    const countsArray = Object.entries(object_counts);
    const maxCount = countsArray.length > 0 ? Math.max(...countsArray.map(([, val]) => val)) : 1;

    return (
        <div className="container-fluid py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark m-0">Dashboard Overview</h2>
                    <p className="text-muted m-0">Real-time statistics of your object detection activity</p>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="row g-4 mb-4">
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm p-3 h-100 bg-white" style={{ borderRadius: "16px" }}>
                        <div className="d-flex align-items-center">
                            <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-3 me-3">
                                <FaUpload size={22} />
                            </div>
                            <div>
                                <h6 className="text-muted mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px", letterSpacing: "1px" }}>Total Detections</h6>
                                <h2 className="fw-bold mb-0 text-dark" style={{ fontSize: "28px" }}>{total_detections}</h2>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card border-0 shadow-sm p-3 h-100 bg-white" style={{ borderRadius: "16px" }}>
                        <div className="d-flex align-items-center">
                            <div className="p-3 bg-success bg-opacity-10 text-success rounded-3 me-3">
                                <FaSearch size={22} />
                            </div>
                            <div>
                                <h6 className="text-muted mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px", letterSpacing: "1px" }}>Images Processed</h6>
                                <h2 className="fw-bold mb-0 text-dark" style={{ fontSize: "28px" }}>{images_processed}</h2>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card border-0 shadow-sm p-3 h-100 bg-white" style={{ borderRadius: "16px" }}>
                        <div className="d-flex align-items-center">
                            <div className="p-3 bg-warning bg-opacity-10 text-warning rounded-3 me-3">
                                <FaFilm size={22} />
                            </div>
                            <div>
                                <h6 className="text-muted mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px", letterSpacing: "1px" }}>Videos Processed</h6>
                                <h2 className="fw-bold mb-0 text-dark" style={{ fontSize: "28px" }}>{videos_processed}</h2>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card border-0 shadow-sm p-3 h-100 bg-white" style={{ borderRadius: "16px" }}>
                        <div className="d-flex align-items-center">
                            <div className="p-3 bg-info bg-opacity-10 text-info rounded-3 me-3">
                                <FaCamera size={22} />
                            </div>
                            <div>
                                <h6 className="text-muted mb-1 text-uppercase fw-semibold" style={{ fontSize: "11px", letterSpacing: "1px" }}>Screenshots Saved</h6>
                                <h2 className="fw-bold mb-0 text-dark" style={{ fontSize: "28px" }}>{screenshots_saved}</h2>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-4">
                {/* Most Common Objects */}
                <div className="col-lg-5">
                    <div className="card border-0 shadow-sm p-4 h-100 bg-white" style={{ borderRadius: "16px" }}>
                        <h5 className="fw-bold text-dark mb-4">Detected Classes</h5>
                        {countsArray.length === 0 ? (
                            <div className="text-center py-5 text-muted">
                                <FaRobot size={48} className="mb-3 text-secondary bg-light p-2 rounded-circle" />
                                <p>No classes detected yet. Upload an image to begin.</p>
                            </div>
                        ) : (
                            <div className="d-flex flex-column gap-3">
                                {countsArray.map(([name, count]) => {
                                    const percent = Math.round((count / maxCount) * 100);
                                    return (
                                        <div key={name}>
                                            <div className="d-flex justify-content-between mb-1">
                                                <span className="text-capitalize fw-semibold text-dark">{name}</span>
                                                <span className="text-muted fw-bold">{count}</span>
                                            </div>
                                            <div className="progress" style={{ height: "8px", borderRadius: "4px" }}>
                                                <div
                                                    className="progress-bar bg-primary"
                                                    role="progressbar"
                                                    style={{ width: `${percent}%`, borderRadius: "4px" }}
                                                    aria-valuenow={percent}
                                                    aria-valuemin="0"
                                                    aria-valuemax="100"
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="col-lg-7">
                    <div className="card border-0 shadow-sm p-4 h-100 bg-white" style={{ borderRadius: "16px" }}>
                        <h5 className="fw-bold text-dark mb-4">Recent Activity</h5>
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light" style={{ fontSize: "12px", borderRadius: "8px" }}>
                                    <tr>
                                        <th className="border-0 text-uppercase text-muted py-3">Image</th>
                                        <th className="border-0 text-uppercase text-muted py-3">Detected Objects</th>
                                        <th className="border-0 text-uppercase text-muted py-3 text-end">Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recent_detections.length === 0 ? (
                                        <tr>
                                            <td colSpan="3" className="text-center py-5 text-muted">
                                                No detections recorded yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        recent_detections.map((detection) => {
                                            const uniqueObjects = [
                                                ...new Set((detection.detections || []).map((d) => d.object)),
                                            ];
                                            const timeString = new Date(detection.created_at).toLocaleString();

                                            return (
                                                <tr key={detection.id}>
                                                    <td className="py-3">
                                                        <div className="d-flex align-items-center">
                                                            <img
                                                                src={detection.processed_image}
                                                                alt={detection.image_name}
                                                                className="rounded-3 border"
                                                                style={{ width: "60px", height: "45px", objectFit: "cover" }}
                                                                onError={(e) => {
                                                                    e.target.src = "https://placehold.co/60x45?text=Image";
                                                                }}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="py-3">
                                                        {uniqueObjects.length === 0 ? (
                                                            <span className="badge bg-secondary">No objects</span>
                                                        ) : (
                                                            <div className="d-flex flex-wrap gap-1">
                                                                {uniqueObjects.slice(0, 3).map((obj) => (
                                                                    <span key={obj} className="badge bg-light text-dark border text-capitalize">
                                                                        {obj}
                                                                    </span>
                                                                ))}
                                                                {uniqueObjects.length > 3 && (
                                                                    <span className="badge bg-primary bg-opacity-10 text-primary">
                                                                        +{uniqueObjects.length - 3} more
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-3 text-end text-muted fw-semibold" style={{ fontSize: "13px" }}>
                                                        {timeString}
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
            </div>
        </div>
    );
}

export default Dashboard;