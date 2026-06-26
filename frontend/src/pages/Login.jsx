import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaRobot } from "react-icons/fa";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();

        setLoading(true);
        setError("");

        try {
            const response = await api.post("/auth/login", {
                email,
                password,
            });

            login(response.data.access_token);

            navigate("/dashboard");

        } catch (err) {
    console.log("Login Error:", err);

    if (err.response) {
        console.log("Status:", err.response.status);
        console.log("Data:", err.response.data);

        setError(JSON.stringify(err.response.data));
    } else {
        console.log(err.message);
        setError(err.message);
    }
}
        setLoading(false);
    };

    return (
        <div className="container-fluid login-page">

            <div className="row vh-100">

                <div className="col-lg-6 left-panel d-flex justify-content-center align-items-center">

                    <div className="text-center">

                        <FaRobot size={140} color="#0d6efd"/>

                        <h2 className="mt-4 fw-bold">
                            Object Detection Platform
                        </h2>

                        <p className="text-muted">
                            TensorFlow + FastAPI + React
                        </p>

                    </div>

                </div>

                <div className="col-lg-6 d-flex justify-content-center align-items-center">

                    <div className="login-card shadow">

                        <h2 className="mb-2">
                            Welcome Back 👋
                        </h2>

                        <p className="text-muted mb-4">
                            Login to continue
                        </p>

                        {error && (
                            <div className="alert alert-danger">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleLogin}>

                            <div className="mb-3">

                                <label>Email</label>

                                <div className="input-group">

                                    <span className="input-group-text">
                                        <FaEnvelope/>
                                    </span>

                                    <input
                                        type="email"
                                        className="form-control"
                                        placeholder="Enter Email"
                                        value={email}
                                        onChange={(e)=>setEmail(e.target.value)}
                                    />

                                </div>

                            </div>

                            <div className="mb-4">

                                <label>Password</label>

                                <div className="input-group">

                                    <span className="input-group-text">
                                        <FaLock/>
                                    </span>

                                    <input
                                        type="password"
                                        className="form-control"
                                        placeholder="Enter Password"
                                        value={password}
                                        onChange={(e)=>setPassword(e.target.value)}
                                    />

                                </div>

                            </div>

                            <button
                                className="btn btn-primary w-100"
                                disabled={loading}
                            >

                                {loading ? "Logging in..." : "Login"}

                            </button>

                        </form>

                        <div className="text-center mt-4">

                            Don't have an account?

                            <Link
                                to="/register"
                                className="ms-2"
                            >
                                Register
                            </Link>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default Login;