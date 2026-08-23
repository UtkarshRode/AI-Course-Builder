import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

const Register = () => {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await api.post("/auth/register", {
                name,
                email,
                password
            });

            const token = response.data?.token;

            if (token) {
                localStorage.setItem(
                    "courseforge_token",
                    token
                );
            }

            navigate("/dashboard");
        } catch (err) {
            console.error("Registration error:", err);

            setError(
                err.response?.data?.message ||
                "Registration failed"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1>Create account</h1>

                <p>
                    Start learning with CourseForge AI.
                </p>

                <form onSubmit={handleSubmit}>

                    <div className="form-group">
                        <label>Name</label>

                        <input
                            type="text"
                            placeholder="Your name"
                            value={name}
                            onChange={(e) =>
                                setName(e.target.value)
                            }
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Email</label>

                        <input
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>

                        <input
                            type="password"
                            placeholder="Your password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            required
                            minLength={6}
                        />
                    </div>

                    {error && (
                        <p
                            style={{
                                color: "red",
                                marginBottom: "15px"
                            }}
                        >
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="primary-btn"
                        disabled={loading}
                    >
                        {loading ? "Registering..." : "Register"}
                    </button>

                </form>

                <p style={{ marginTop: "20px" }}>
                    Already have an account?{" "}

                    <Link to="/login">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;