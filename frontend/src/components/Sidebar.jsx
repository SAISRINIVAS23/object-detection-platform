import { NavLink } from "react-router-dom";
import {
    FaHome,
    FaUpload,
    FaVideo,
    FaCamera,
    FaImage,
    FaClipboardList,
    FaUser,
    FaSignOutAlt,
    FaEye
} from "react-icons/fa";

function Sidebar() {
    const handleLogout = () => {
        localStorage.removeItem("token");
        window.location.href = "/";
    };

    return (
        <div className="sidebar">
            <h4 className="mb-5 text-center fw-bold text-primary d-flex align-items-center justify-content-center">
                <FaEye className="me-2" /> Object Detection
            </h4>
            
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? "active" : ""}>
                <FaHome className="me-2"/>
                Dashboard
            </NavLink>

            <NavLink to="/image" className={({ isActive }) => isActive ? "active" : ""}>
                <FaUpload className="me-2"/>
                Image Detection
            </NavLink>

            <NavLink to="/video" className={({ isActive }) => isActive ? "active" : ""}>
                <FaVideo className="me-2"/>
                Video Detection
            </NavLink>

            <NavLink to="/webcam" className={({ isActive }) => isActive ? "active" : ""}>
                <FaCamera className="me-2"/>
                Live Camera
            </NavLink>

            <NavLink to="/logs" className={({ isActive }) => isActive ? "active" : ""}>
                <FaClipboardList className="me-2"/>
                Detection History
            </NavLink>

            <NavLink to="/gallery" className={({ isActive }) => isActive ? "active" : ""}>
                <FaImage className="me-2"/>
                Gallery
            </NavLink>

            <NavLink to="/profile" className={({ isActive }) => isActive ? "active" : ""}>
                <FaUser className="me-2"/>
                Profile
            </NavLink>

            <div className="mt-auto pt-4 border-top border-secondary">
                <button
                    className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center"
                    onClick={handleLogout}
                >
                    <FaSignOutAlt className="me-2"/>
                    Logout
                </button>
            </div>
        </div>
    );
}

export default Sidebar;