import { Link } from "react-router-dom";

const Register = () => {
    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1>Create account</h1>
                <p>Start learning with CourseForge AI.</p>

                <div className="form-group">
                    <label>Name</label>
                    <input
                        type="text"
                        placeholder="Your name"
                    />
                </div>

                <div className="form-group">
                    <label>Email</label>
                    <input
                        type="email"
                        placeholder="you@example.com"
                    />
                </div>

                <div className="form-group">
                    <label>Password</label>
                    <input
                        type="password"
                        placeholder="••••••••"
                    />
                </div>

                <button className="primary-btn">
                    Register
                </button>

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