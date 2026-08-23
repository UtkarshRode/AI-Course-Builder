import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import api from "../services/api";
import Navbar from "../components/Navbar";
import Loading from "../components/Loading";


const Course = () => {

    const { courseId } = useParams();

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    useEffect(() => {

        const loadCourse = async () => {

            try {

                const token =
                    localStorage.getItem(
                        "courseforge_token"
                    );

                if (!token) {
                    setError(
                        "You are not logged in."
                    );
                    return;
                }


                const response = await api.get(
                    `/courses/${courseId}`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );


                if (!response.data.success) {

                    setError(
                        response.data.message ||
                        "Failed to load course"
                    );

                    return;
                }


                setCourse(
                    response.data.course
                );

            } catch (err) {

                console.error(
                    "Course loading error:",
                    err
                );

                setError(
                    err.response?.data?.message ||
                    "Failed to load course"
                );

            } finally {

                setLoading(false);
            }
        };


        loadCourse();

    }, [courseId]);


    if (loading) {
        return <Loading />;
    }


    if (error || !course) {

        return (
            <>
                <Navbar />

                <main className="page">

                    <div className="card">

                        <h2>
                            Unable to load course
                        </h2>

                        <p
                            className="error"
                            style={{
                                marginTop: "12px"
                            }}
                        >
                            {error ||
                                "Course not found"}
                        </p>

                        <div
                            style={{
                                marginTop: "16px"
                            }}
                        >
                            <Link to="/dashboard">
                                ← Back to Dashboard
                            </Link>
                        </div>

                    </div>

                </main>
            </>
        );
    }


    return (
        <>
            <Navbar />

            <main className="page">

                {/* Back to dashboard */}

                <div
                    style={{
                        marginBottom: "20px"
                    }}
                >
                    <Link to="/dashboard">
                        ← Back to Dashboard
                    </Link>
                </div>


                {/* Course header */}

                <div className="card">

                    <h1>
                        {course.title}
                    </h1>

                    {course.description && (
                        <p
                            className="muted"
                            style={{
                                marginTop: "12px"
                            }}
                        >
                            {course.description}
                        </p>
                    )}

                    <div
                        style={{
                            marginTop: "16px",
                            display: "flex",
                            gap: "10px",
                            flexWrap: "wrap"
                        }}
                    >

                        <span className="badge">
                            {course.difficulty}
                        </span>

                        <span className="badge">
                            {course.status}
                        </span>

                        {course.estimatedHours && (
                            <span className="badge">
                                {course.estimatedHours} hours
                            </span>
                        )}

                    </div>

                </div>


                {/* Course modules */}

                <div
                    className="card"
                    style={{
                        marginTop: "20px"
                    }}
                >

                    <h2>
                        Course Modules
                    </h2>


                    <div
                        style={{
                            marginTop: "20px"
                        }}
                    >

                        {(course.modules || []).map(
                            (module) => (

                                <div
                                    className="card"
                                    key={module.id}
                                    style={{
                                        marginBottom: "16px"
                                    }}
                                >

                                    <h3>
                                        {module.position}.{" "}
                                        {module.title}
                                    </h3>

                                    {module.description && (
                                        <p
                                            className="muted"
                                            style={{
                                                marginTop: "8px"
                                            }}
                                        >
                                            {module.description}
                                        </p>
                                    )}


                                    <div
                                        style={{
                                            marginTop: "16px"
                                        }}
                                    >

                                        {(module.lessons || [])
                                            .map(
                                                (lesson) => (

                                                    <div
                                                        key={
                                                            lesson.id
                                                        }
                                                        style={{
                                                            padding:
                                                                "10px 0"
                                                        }}
                                                    >

                                                        <Link
                                                            to={`/course/${courseId}/lesson/${lesson.id}`}
                                                        >
                                                            {lesson.position}.{" "}
                                                            {lesson.title}
                                                        </Link>

                                                        {lesson.estimatedMinutes && (
                                                            <span
                                                                className="muted"
                                                                style={{
                                                                    marginLeft:
                                                                        "10px"
                                                                }}
                                                            >
                                                                {
                                                                    lesson.estimatedMinutes
                                                                }{" "}
                                                                min
                                                            </span>
                                                        )}

                                                    </div>

                                                )
                                            )}

                                    </div>

                                </div>

                            )
                        )}

                    </div>

                </div>

            </main>
        </>
    );
};


export default Course;