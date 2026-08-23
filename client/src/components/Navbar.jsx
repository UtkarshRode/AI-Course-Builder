import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {

    const navigate = useNavigate();

    const logout = () => {

        localStorage.removeItem(
            "courseforge_token"
        );

        localStorage.removeItem(
            "courseforge_user"
        );

        navigate("/login");
    };


    return (
        <nav className="navbar">

            <Link
                to="/dashboard"
                className="logo"
            >
                CourseForge AI
            </Link>

            <div className="nav-links">

                <Link to="/dashboard">
                    Dashboard
                </Link>

                <button
                    onClick={logout}
                    className="logout-btn"
                >
                    Logout
                </button>

            </div>

        </nav>
    );
};

export default Navbar;