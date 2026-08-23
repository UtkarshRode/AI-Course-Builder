import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

const Login = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();

        setLoading(true);
        setError("");

        try {
            const response = await api.post(
                "/auth/login",
                {
                    email,
                    password
                }
            );

            console.log("LOGIN RESPONSE:", response.data);

            if (response.data.success) {

                const token = response.data.token;

                localStorage.setItem(
                    "courseforge_token",
                    token
                );

                localStorage.setItem(
                    "courseforge_user",
                    JSON.stringify(response.data.user)
                );

                console.log(
                    "Token saved:",
                    localStorage.getItem(
                        "courseforge_token"
                    )
                );

                navigate("/dashboard");

            } else {

                setError(
                    response.data.message ||
                    "Login failed"
                );
            }

        } catch (err) {

            console.error(
                "LOGIN ERROR:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to connect to server"
            );

        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="auth-page">

            <div className="auth-card">

                <h1>Welcome back</h1>

                <p>
                    Login to your CourseForge AI account.
                </p>

                {error && (
                    <div className="error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>

                    <div className="form-group">

                        <label>
                            Email
                        </label>

                        <input
                            type="email"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            placeholder="you@example.com"
                            required
                        />

                    </div>

                    <div className="form-group">

                        <label>
                            Password
                        </label>

                        <input
                            type="password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            placeholder="Enter your password"
                            required
                        />

                    </div>

                    <button
                        type="submit"
                        className="primary-btn"
                        disabled={loading}
                    >
                        {loading
                            ? "Logging in..."
                            : "Login"}
                    </button>

                </form>

                <p style={{ marginTop: "20px" }}>
                    Don't have an account?{" "}

                    <Link to="/register">
                        Register
                    </Link>
                </p>

            </div>

        </div>
    );
};

export default Login;