import { useState, useEffect } from "react";
import api from "../api/axios";
import { FaUser, FaEnvelope, FaLock, FaCheckCircle, FaRobot, FaExclamationTriangle } from "react-icons/fa";

function Profile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // Form inputs
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [submitLoading, setSubmitLoading] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get("/auth/profile");
                setProfile(response.data);
                setUsername(response.data.username);
                setEmail(response.data.email);
            } catch (err) {
                console.error("Error fetching profile:", err);
                setError("Failed to fetch profile details.");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMsg("");

        if (password && password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setSubmitLoading(true);
        try {
            const updatePayload = { username, email };
            if (password) {
                updatePayload.password = password;
            }

            const response = await api.put("/auth/profile", updatePayload);
            setSuccessMsg(response.data.message || "Profile updated successfully!");
            
            // Clear passwords
            setPassword("");
            setConfirmPassword("");
            
            // Update local display profile
            setProfile(prev => ({
                ...prev,
                username: response.data.username,
                email: response.data.email
            }));
        } catch (err) {
            console.error("Profile update error:", err);
            setError(err.response?.data?.detail || "Failed to update profile.");
        } finally {
            setSubmitLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: "70vh" }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading profile...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid py-4">
            <div className="mb-4">
                <h2 className="fw-bold text-dark m-0">User Profile</h2>
                <p className="text-muted m-0">Manage your account credentials and details</p>
            </div>

            {successMsg && (
                <div className="alert alert-success d-flex align-items-center mb-4 border-0 bg-success bg-opacity-10 text-success" role="alert">
                    <FaCheckCircle className="me-2" />
                    <div>{successMsg}</div>
                </div>
            )}

            {error && (
                <div className="alert alert-danger d-flex align-items-center mb-4 border-0 bg-danger bg-opacity-10 text-danger" role="alert">
                    <FaExclamationTriangle className="me-2" />
                    <div>{error}</div>
                </div>
            )}

            <div className="row g-4">
                {/* Left side: Profile Summary Card */}
                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm text-center p-4 bg-white" style={{ borderRadius: "16px" }}>
                        <div className="d-flex justify-content-center mb-3">
                            <div className="p-4 bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: "90px", height: "90px" }}>
                                <FaUser size={44} />
                            </div>
                        </div>
                        <h4 className="fw-bold text-dark mb-1">{profile?.username}</h4>
                        <p className="text-muted mb-4">{profile?.email}</p>
                        
                        <hr className="my-3 text-secondary opacity-25" />
                        
                        <div className="d-flex justify-content-around py-2">
                            <div>
                                <h6 className="text-muted mb-1 fw-semibold text-uppercase" style={{ fontSize: "11px", letterSpacing: "1px" }}>Total Uploads</h6>
                                <h3 className="fw-bold text-primary mb-0">{profile?.total_detections}</h3>
                            </div>
                            <div>
                                <h6 className="text-muted mb-1 fw-semibold text-uppercase" style={{ fontSize: "11px", letterSpacing: "1px" }}>Account Type</h6>
                                <h3 className="fw-bold text-success mb-0" style={{ fontSize: "20px", marginTop: "4px" }}>Standard</h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right side: Settings/Edit Form */}
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm p-4 bg-white" style={{ borderRadius: "16px" }}>
                        <h5 className="fw-bold text-dark mb-4">Edit Profile Settings</h5>
                        
                        <form onSubmit={handleSubmit}>
                            <div className="row g-3">
                                {/* Username */}
                                <div className="col-md-6 mb-2">
                                    <label className="form-label fw-semibold text-dark">Username</label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-light text-secondary border">
                                            <FaUser />
                                        </span>
                                        <input
                                            type="text"
                                            className="form-control border"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="col-md-6 mb-2">
                                    <label className="form-label fw-semibold text-dark">Email Address</label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-light text-secondary border">
                                            <FaEnvelope />
                                        </span>
                                        <input
                                            type="email"
                                            className="form-control border"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Password Header */}
                                <div className="col-12 mt-4 mb-2">
                                    <h6 className="fw-bold text-dark border-bottom pb-2">Change Password <small className="text-muted font-normal">(leave blank to keep current password)</small></h6>
                                </div>

                                {/* New Password */}
                                <div className="col-md-6 mb-2">
                                    <label className="form-label fw-semibold text-dark">New Password</label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-light text-secondary border">
                                            <FaLock />
                                        </span>
                                        <input
                                            type="password"
                                            className="form-control border"
                                            placeholder="Enter new password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div className="col-md-6 mb-2">
                                    <label className="form-label fw-semibold text-dark">Confirm Password</label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-light text-secondary border">
                                            <FaLock />
                                        </span>
                                        <input
                                            type="password"
                                            className="form-control border"
                                            placeholder="Confirm new password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="col-12 mt-4">
                                    <button
                                        type="submit"
                                        className="btn btn-primary px-4 fw-semibold"
                                        disabled={submitLoading}
                                    >
                                        {submitLoading ? "Saving Changes..." : "Save Changes"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;
