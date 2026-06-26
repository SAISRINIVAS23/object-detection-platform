import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaEnvelope, FaLock, FaRobot } from "react-icons/fa";
import api from "../api/axios";

function Register() {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: ""
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleRegister = async (e) => {

        e.preventDefault();

        setLoading(true);
        setError("");
        setSuccess("");

        try {

            const response = await api.post(
                "/auth/register",
                formData
            );

            setSuccess(response.data.message);

            setTimeout(() => {
                navigate("/");
            }, 2000);

        } catch (err) {
            if (err.response) {
                setError(err.response.data.detail || err.response.data.error || "Registration Failed");
            } else {
                setError("Server not reachable");
            }
        }

        setLoading(false);

    };

    return (

        <div className="container-fluid login-page">

            <div className="row vh-100">

                <div className="col-lg-6 left-panel d-flex justify-content-center align-items-center">

                    <div className="text-center text-white">

                        <FaRobot size={140} />

                        <h2 className="mt-4 fw-bold">
                            Object Detection Platform
                        </h2>

                        <p>
                            Create your account to continue
                        </p>

                    </div>

                </div>

                <div className="col-lg-6 d-flex justify-content-center align-items-center">

                    <div className="login-card shadow">

                        <h2>Create Account</h2>

                        <p className="text-muted mb-4">
                            Register to access the AI Dashboard
                        </p>

                        {error &&
                            <div className="alert alert-danger">
                                {error}
                            </div>
                        }

                        {success &&
                            <div className="alert alert-success">
                                {success}
                            </div>
                        }

                        <form onSubmit={handleRegister}>

                            <div className="mb-3">

                                <label>Username</label>

                                <div className="input-group">

                                    <span className="input-group-text">

                                        <FaUser/>

                                    </span>

                                    <input
                                        className="form-control"
                                        name="username"
                                        placeholder="Enter Username"
                                        onChange={handleChange}
                                    />

                                </div>

                            </div>

                            <div className="mb-3">

                                <label>Email</label>

                                <div className="input-group">

                                    <span className="input-group-text">

                                        <FaEnvelope/>

                                    </span>

                                    <input
                                        type="email"
                                        className="form-control"
                                        name="email"
                                        placeholder="Enter Email"
                                        onChange={handleChange}
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
                                        name="password"
                                        placeholder="Enter Password"
                                        onChange={handleChange}
                                    />

                                </div>

                            </div>

                            <button
                                className="btn btn-primary w-100"
                                disabled={loading}
                            >

                                {loading ? "Creating Account..." : "Register"}

                            </button>

                        </form>

                        <div className="text-center mt-4">

                            Already have an account?

                            <Link
                                to="/"
                                className="ms-2"
                            >

                                Login

                            </Link>

                        </div>

                    </div>

                </div>

            </div>

        </div>

    );

}

export default Register;