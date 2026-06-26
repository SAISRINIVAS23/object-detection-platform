import { useState, useEffect } from "react";
import api from "../api/axios";
import { FaImage, FaSearch, FaRobot, FaExpand } from "react-icons/fa";

function Gallery() {
    const [galleryData, setGalleryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filterQuery, setFilterQuery] = useState("");
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        const fetchGallery = async () => {
            try {
                const response = await api.get("/gallery/");
                setGalleryData(response.data);
            } catch (err) {
                console.error("Error loading gallery:", err);
                setError("Failed to fetch gallery images.");
            } finally {
                setLoading(false);
            }
        };
        fetchGallery();
    }, []);

    const filteredItems = galleryData.filter((item) => {
        if (!filterQuery) return true;
        const query = filterQuery.toLowerCase();
        return (item.detections || []).some((d) => d.object.toLowerCase().includes(query));
    });

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: "70vh" }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading gallery...</span>
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
                    <h2 className="fw-bold text-dark m-0">Gallery</h2>
                    <p className="text-muted m-0">Visual catalog of your processed detections</p>
                </div>

                {/* Filter input */}
                <div className="position-relative" style={{ minWidth: "260px" }}>
                    <span className="position-absolute top-50 start-0 translate-middle-y ps-3 text-muted">
                        <FaSearch size={14} />
                    </span>
                    <input
                        type="text"
                        className="form-control ps-5 py-2 border-0 shadow-sm"
                        placeholder="Filter by object type (e.g. car)..."
                        value={filterQuery}
                        onChange={(e) => setFilterQuery(e.target.value)}
                        style={{ borderRadius: "10px", fontSize: "14px" }}
                    />
                </div>
            </div>

            {/* Gallery Grid */}
            {filteredItems.length === 0 ? (
                <div className="text-center py-5 bg-white border shadow-sm rounded-4" style={{ minHeight: "300px" }}>
                    <FaImage size={56} className="text-secondary bg-light p-3 rounded-circle mb-3" />
                    <h5 className="fw-bold text-dark">No gallery images found</h5>
                    <p className="text-muted">
                        {filterQuery ? "Try refining your object filter." : "Go to Image Detection to upload and process images."}
                    </p>
                </div>
            ) : (
                <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
                    {filteredItems.map((item) => {
                        const objectsCount = item.detections?.length || 0;
                        const uniqueObjects = [...new Set((item.detections || []).map((d) => d.object))];

                        return (
                            <div className="col" key={item.id}>
                                <div 
                                    className="card border-0 shadow-sm overflow-hidden h-100 position-relative gallery-card bg-white"
                                    style={{ borderRadius: "16px", cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s" }}
                                    onClick={() => setSelectedItem(item)}
                                >
                                    {/* Image */}
                                    <div className="position-relative overflow-hidden bg-light" style={{ height: "200px" }}>
                                        <img
                                            src={`http://127.0.0.1:8000${item.processed_image}`}
                                            alt={item.image_name}
                                            className="w-100 h-100 object-fit-cover transition"
                                            style={{ objectFit: "cover" }}
                                            onError={(e) => {
                                                e.target.src = "https://placehold.co/300x200?text=No+Image";
                                            }}
                                        />
                                        {/* Hover Overlay */}
                                        <div 
                                            className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column justify-content-end p-3 gallery-overlay"
                                            style={{
                                                background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0) 100%)",
                                                opacity: 0,
                                                transition: "opacity 0.2s"
                                            }}
                                        >
                                            <span className="text-white fw-semibold text-truncate mb-1">{item.image_name}</span>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <small className="text-light text-opacity-75">{new Date(item.created_at).toLocaleDateString()}</small>
                                                <span className="badge bg-primary text-capitalize">{objectsCount} {objectsCount === 1 ? 'object' : 'objects'}</span>
                                            </div>
                                        </div>
                                        {/* Corner expand icon */}
                                        <div className="position-absolute top-0 end-0 m-2 p-2 bg-dark bg-opacity-50 text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: "32px", height: "32px" }}>
                                            <FaExpand size={12} />
                                        </div>
                                    </div>

                                    {/* Card Info Details */}
                                    <div className="card-body p-3">
                                        <div className="d-flex flex-wrap gap-1">
                                            {uniqueObjects.length === 0 ? (
                                                <span className="text-muted" style={{ fontSize: "12px" }}>No objects detected</span>
                                            ) : (
                                                uniqueObjects.slice(0, 3).map((obj) => (
                                                    <span key={obj} className="badge bg-light text-dark border text-capitalize" style={{ fontSize: "11px" }}>
                                                        {obj}
                                                    </span>
                                                ))
                                            )}
                                            {uniqueObjects.length > 3 && (
                                                <span className="badge bg-primary bg-opacity-10 text-primary fw-bold" style={{ fontSize: "11px" }}>
                                                    +{uniqueObjects.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Custom Lightbox Modal */}
            {selectedItem && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.8)", zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered modal-xl">
                        <div className="modal-content border-0 bg-transparent text-white">
                            <div className="modal-header border-0 py-2 pe-3">
                                <span className="fw-semibold text-truncate me-3" style={{ fontSize: "16px" }}>{selectedItem.image_name}</span>
                                <button 
                                    type="button" 
                                    className="btn-close btn-close-white" 
                                    onClick={() => setSelectedItem(null)} 
                                    aria-label="Close"
                                ></button>
                            </div>
                            <div className="modal-body p-0 d-flex flex-column flex-lg-row bg-dark rounded-4 overflow-hidden border border-secondary border-opacity-25">
                                {/* Image frame */}
                                <div className="flex-grow-1 bg-black d-flex align-items-center justify-content-center p-3" style={{ minHeight: "350px", maxHeight: "650px" }}>
                                    <img
                                        src={`http://127.0.0.1:8000${selectedItem.processed_image}`}
                                        alt={selectedItem.image_name}
                                        className="img-fluid"
                                        style={{ maxHeight: "600px", objectFit: "contain" }}
                                    />
                                </div>
                                {/* Info panel */}
                                <div className="bg-dark p-4 border-start border-secondary border-opacity-25" style={{ minWidth: "300px", maxWidth: "380px" }}>
                                    <h5 className="fw-bold mb-3 text-white border-bottom border-secondary border-opacity-25 pb-2">Analysis Results</h5>
                                    
                                    <div className="mb-4">
                                        <div className="text-secondary" style={{ fontSize: "12px" }}>TIMESTAMP</div>
                                        <div className="fw-semibold">{new Date(selectedItem.created_at).toLocaleString()}</div>
                                    </div>

                                    <div className="mb-4">
                                        <div className="text-secondary mb-2" style={{ fontSize: "12px" }}>DETECTIONS ({selectedItem.detections?.length || 0})</div>
                                        <div className="overflow-auto" style={{ maxHeight: "350px" }}>
                                            {(!selectedItem.detections || selectedItem.detections.length === 0) ? (
                                                <div className="text-muted py-3 text-center bg-black bg-opacity-25 rounded border border-secondary border-opacity-25">
                                                    No objects detected
                                                </div>
                                            ) : (
                                                <div className="d-flex flex-column gap-2">
                                                    {selectedItem.detections.map((det, index) => (
                                                        <div key={index} className="d-flex justify-content-between align-items-center p-2 rounded bg-black bg-opacity-20 border border-secondary border-opacity-10">
                                                            <span className="text-capitalize fw-semibold text-white">{det.object}</span>
                                                            <span className="badge bg-primary px-2 py-1">
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

            {/* Custom Gallery Hover Styles */}
            <style>{`
                .gallery-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 10px 20px rgba(0,0,0,0.15) !important;
                }
                .gallery-card:hover .gallery-overlay {
                    opacity: 1 !important;
                }
                .gallery-card:hover img {
                    transform: scale(1.05);
                }
                .transition {
                    transition: transform 0.3s ease;
                }
            `}</style>
        </div>
    );
}

export default Gallery;
