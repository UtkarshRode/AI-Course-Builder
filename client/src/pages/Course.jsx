import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import api from "../services/api";
import Navbar from "../components/Navbar";
import Loading from "../components/Loading";
import ProgressBar from "../components/ProgressBar";


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

                const response = await api.get(
                    `/courses/${courseId}`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

                console.log(
                    "COURSE RESPONSE:",
                    response.data
                );


                if (response.data.success) {

                    setCourse(
                        response.data.course
                    );

                } else {

                    setError(
                        response.data.message ||
                        "Failed to load course"
                    );
                }

            } catch (err) {

                console.error(
                    "Course error:",
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


    if (error) {

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
                            {error}
                        </p>

                    </div>

                </main>
            </>
        );
    }


    if (!course) {
        return null;
    }


    return (
        <>
            <Navbar />

            <main className="page">

                {/* Course Header */}

                <div
                    className="card"
                    style={{
                        marginBottom: "24px"
                    }}
                >

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
                            marginTop: "20px"
                        }}
                    >

                        <Link
                            to="/dashboard"
                            className="primary-btn"
                        >
                            Back to Dashboard
                        </Link>

                    </div>

                </div>


                {/* Course Modules */}

                <h2>
                    Course Content
                </h2>


                <div
                    style={{
                        marginTop: "16px"
                    }}
                >

                    {(course.modules || []).map(
                        (module, moduleIndex) => (

                            <div
                                className="card"
                                key={module.id}
                                style={{
                                    marginBottom: "20px"
                                }}
                            >

                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent:
                                            "space-between",
                                        alignItems:
                                            "center",
                                        gap: "20px"
                                    }}
                                >

                                    <div>

                                        <h3>
                                            {module.title ||
                                                `Module ${moduleIndex + 1}`}
                                        </h3>

                                        {module.description && (
                                            <p
                                                className="muted"
                                                style={{
                                                    marginTop:
                                                        "6px"
                                                }}
                                            >
                                                {
                                                    module.description
                                                }
                                            </p>
                                        )}

                                    </div>


                                    <strong>
                                        {module.lessons?.length ||
                                            0}{" "}
                                        lessons
                                    </strong>

                                </div>


                                {/* Module Progress */}

                                {typeof module.progress ===
                                    "number" && (

                                    <div
                                        style={{
                                            marginTop: "16px"
                                        }}
                                    >

                                        <ProgressBar
                                            value={
                                                module.progress
                                            }
                                        />

                                    </div>

                                )}


                                {/* Lessons */}

                                <div
                                    style={{
                                        marginTop: "16px"
                                    }}
                                >

                                    {(module.lessons || []).map(
                                        (lesson, lessonIndex) => (

                                            <Link
                                                key={lesson.id}
                                                to={`/courses/${courseId}/lessons/${lesson.id}`}
                                                style={{
                                                    textDecoration:
                                                        "none",
                                                    color:
                                                        "inherit"
                                                }}
                                            >

                                                <div
                                                    className="lesson-item"
                                                >

                                                    <div>

                                                        <strong>
                                                            {lessonIndex +
                                                                1}.
                                                        </strong>{" "}

                                                        {lesson.title}

                                                        {lesson.description && (
                                                            <p
                                                                className="muted"
                                                                style={{
                                                                    marginTop:
                                                                        "4px"
                                                                }}
                                                            >
                                                                {
                                                                    lesson.description
                                                                }
                                                            </p>
                                                        )}

                                                    </div>


                                                    <span
                                                        className="badge"
                                                    >
                                                        {
                                                            lesson.status ||
                                                            "NOT_STARTED"
                                                        }
                                                    </span>

                                                </div>

                                            </Link>

                                        )
                                    )}

                                </div>

                            </div>

                        )
                    )}

                </div>

            </main>
        </>
    );
};


export default Course;