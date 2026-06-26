import { useState, useEffect, useRef } from "react";
import { FaBell, FaUserCircle, FaUser, FaSignOutAlt, FaChevronDown } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

function Navbar() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("User");
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    
    const notificationsRef = useRef(null);
    const userDropdownRef = useRef(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get("/auth/profile");
                setUsername(response.data.username);
                
                // Show welcome notification if new user (0 total detections)
                if (response.data.total_detections === 0) {
                    setNotifications(prev => [
                        {
                            id: 9999,
                            text: `Welcome to Object Detection Platform, ${response.data.username}! Upload an image to get started.`,
                            read: false,
                            time: "Just now"
                        },
                        ...prev
                    ]);
                }
            } catch (err) {
                console.error("Error fetching user profile in Navbar:", err);
            }
        };
        fetchProfile();

        // Listen for new-notification events dispatched from other pages
        const handleNewNotification = (event) => {
            const newNotif = {
                id: Date.now(),
                text: event.detail.text,
                read: false,
                time: "Just now"
            };
            setNotifications(prev => [newNotif, ...prev]);
            setShowNotifications(true);
        };

        window.addEventListener("new-notification", handleNewNotification);

        // Close dropdowns when clicking outside
        const handleClickOutside = (event) => {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
            if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
                setShowUserDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            window.removeEventListener("new-notification", handleNewNotification);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleBellClick = () => {
        setShowNotifications(!showNotifications);
    };

    const markAllRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    return (
        <nav className="navbar navbar-light bg-white shadow-sm px-4 py-3 d-flex justify-content-between align-items-center position-relative">
            <h4 className="fw-bold text-dark m-0">
                Object Detection Platform
            </h4>

            <div className="d-flex align-items-center gap-4">
                {/* Notification Dropdown Container */}
                <div className="position-relative" ref={notificationsRef}>
                    <div 
                        onClick={handleBellClick} 
                        style={{ cursor: "pointer" }}
                        className="p-1 rounded-circle hover-bg"
                    >
                        <FaBell size={20} className={unreadCount > 0 ? "text-primary animate-bell" : "text-secondary"} />
                        {unreadCount > 0 && (
                            <span 
                                className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" 
                                style={{ fontSize: "10px", padding: "3px 5px", transform: "translate(-30%, -10%)" }}
                            >
                                {unreadCount}
                            </span>
                        )}
                    </div>

                    {showNotifications && (
                        <div 
                            className="card shadow-lg position-absolute border-0 mt-2 bg-white" 
                            style={{ 
                                right: "-10px", 
                                top: "35px", 
                                width: "320px", 
                                zIndex: 1050, 
                                borderRadius: "14px",
                                border: "1px solid rgba(0,0,0,0.08)"
                            }}
                        >
                            <div className="card-body p-3">
                                <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
                                    <span className="fw-bold text-dark" style={{ fontSize: "15px" }}>Notifications</span>
                                    {unreadCount > 0 && (
                                        <button 
                                            className="btn btn-link btn-sm text-decoration-none p-0 fw-semibold text-primary" 
                                            onClick={markAllRead}
                                            style={{ fontSize: "12px" }}
                                        >
                                            Mark all read
                                        </button>
                                    )}
                                </div>
                                <div className="list-group list-group-flush" style={{ maxHeight: "250px", overflowY: "auto" }}>
                                    {notifications.length === 0 ? (
                                        <div className="text-center py-4 text-muted" style={{ fontSize: "13px" }}>
                                            No new notifications
                                        </div>
                                    ) : (
                                        notifications.map(n => (
                                            <div 
                                                key={n.id} 
                                                className={`list-group-item px-0 py-2 border-bottom-0 d-flex align-items-start gap-2 ${n.read ? "opacity-50" : ""}`}
                                                style={{ fontSize: "13px", borderBottom: "1px solid rgba(0,0,0,0.04)" }}
                                            >
                                                <span 
                                                    className={`mt-2 rounded-circle ${n.read ? "bg-secondary" : "bg-primary"}`} 
                                                    style={{ width: "6px", height: "6px", flexShrink: 0 }}
                                                />
                                                <div className="flex-grow-1">
                                                    <div className="text-dark fw-medium">{n.text}</div>
                                                    <small className="text-muted" style={{ fontSize: "10px" }}>{n.time}</small>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* User avatar, name and dropdown menu */}
                <div className="position-relative" ref={userDropdownRef}>
                    <span 
                        className="d-flex align-items-center gap-2 hover-bg py-1 px-2 rounded" 
                        style={{ cursor: "pointer", transition: "background-color 0.2s" }}
                        onClick={() => setShowUserDropdown(!showUserDropdown)}
                    >
                        <FaUserCircle size={24} className="text-secondary" />
                        <span className="fw-semibold text-dark text-capitalize" style={{ fontSize: "15px" }}>
                            {username}
                        </span>
                        <FaChevronDown size={10} className="text-muted" />
                    </span>

                    {showUserDropdown && (
                        <div 
                            className="card shadow-lg position-absolute border-0 mt-2 bg-white" 
                            style={{ 
                                right: 0, 
                                top: "35px", 
                                width: "160px", 
                                zIndex: 1050, 
                                borderRadius: "10px",
                                border: "1px solid rgba(0,0,0,0.08)"
                            }}
                        >
                            <div className="list-group list-group-flush p-1">
                                <button 
                                    className="list-group-item list-group-item-action border-0 rounded py-2 px-3 text-start d-flex align-items-center gap-2"
                                    style={{ fontSize: "14px", background: "none" }}
                                    onClick={() => {
                                        setShowUserDropdown(false);
                                        navigate("/profile");
                                    }}
                                >
                                    <FaUser size={13} className="text-secondary" /> Profile
                                </button>
                                <button 
                                    className="list-group-item list-group-item-action border-0 rounded py-2 px-3 text-start text-danger d-flex align-items-center gap-2"
                                    style={{ fontSize: "14px", background: "none" }}
                                    onClick={() => {
                                        setShowUserDropdown(false);
                                        localStorage.removeItem("token");
                                        window.location.href = "/";
                                    }}
                                >
                                    <FaSignOutAlt size={13} /> Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Micro-bell animation style */}
            <style>{`
                .hover-bg:hover {
                    background-color: rgba(0, 0, 0, 0.04);
                }
                .animate-bell {
                    animation: ring 2s ease infinite;
                }
                @keyframes ring {
                    0% { transform: rotate(0); }
                    5% { transform: rotate(15deg); }
                    10% { transform: rotate(-15deg); }
                    15% { transform: rotate(10deg); }
                    20% { transform: rotate(-10deg); }
                    25% { transform: rotate(5deg); }
                    30% { transform: rotate(-5deg); }
                    35% { transform: rotate(0); }
                    100% { transform: rotate(0); }
                }
            `}</style>
        </nav>
    );
}

export default Navbar;