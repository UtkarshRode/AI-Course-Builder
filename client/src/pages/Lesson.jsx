import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import api from "../services/api";
import Navbar from "../components/Navbar";
import Loading from "../components/Loading";


const Lesson = () => {

    const {
        courseId,
        lessonId
    } = useParams();

    const [lesson, setLesson] = useState(null);
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");


    useEffect(() => {

        const loadLesson = async () => {

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


                if (!response.data.success) {

                    setError(
                        response.data.message ||
                        "Failed to load course"
                    );

                    return;
                }


                const course =
                    response.data.course;


                let foundLesson = null;


                for (
                    const module of
                    course.modules || []
                ) {

                    const matchingLesson =
                        (module.lessons || []).find(
                            item =>
                                item.id === lessonId
                        );


                    if (matchingLesson) {

                        foundLesson = {
                            ...matchingLesson,
                            moduleTitle:
                                module.title
                        };

                        break;
                    }
                }


                if (!foundLesson) {

                    setError(
                        "Lesson not found in this course"
                    );

                    return;
                }


                setLesson(foundLesson);

            } catch (err) {

                console.error(
                    "Lesson loading error:",
                    err
                );

                setError(
                    err.response?.data?.message ||
                    "Failed to load lesson"
                );

            } finally {

                setLoading(false);
            }
        };


        loadLesson();

    }, [courseId, lessonId]);


    const handleComplete = async () => {

        try {

            setCompleting(true);
            setError("");
            setSuccess("");


            const token =
                localStorage.getItem(
                    "courseforge_token"
                );


            /*
             * Get the current user's enrollment
             * for this course.
             */

            const enrollmentResponse =
                await api.get(
                    `/enrollments/${courseId}`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );


            if (
                !enrollmentResponse.data.success
            ) {

                throw new Error(
                    enrollmentResponse.data.message ||
                    "Unable to find enrollment"
                );
            }


            const enrollment =
                enrollmentResponse.data.enrollment;


            /*
             * Mark this lesson as completed.
             */

            const response = await api.post(
                `/enrollments/${enrollment.id}/lessons/${lessonId}/complete`,
                {},
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


            if (!response.data.success) {

                throw new Error(
                    response.data.message ||
                    "Failed to complete lesson"
                );
            }


            setLesson(prev => ({
                ...prev,
                completed: true,
                status: "COMPLETED"
            }));


            setSuccess(
                "Lesson completed successfully!"
            );


        } catch (err) {

            console.error(
                "Complete lesson error:",
                err
            );

            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to complete lesson"
            );

        } finally {

            setCompleting(false);
        }
    };


    if (loading) {
        return <Loading />;
    }


    if (error && !lesson) {

        return (
            <>
                <Navbar />

                <main className="page">

                    <div className="card">

                        <h2>
                            Unable to load lesson
                        </h2>

                        <p
                            className="error"
                            style={{
                                marginTop: "12px"
                            }}
                        >
                            {error}
                        </p>

                        <div
                            style={{
                                marginTop: "16px"
                            }}
                        >

                            <Link
                                to={`/courses/${courseId}`}
                            >
                                ← Back to Course
                            </Link>

                        </div>

                    </div>

                </main>
            </>
        );
    }


    if (!lesson) {
        return null;
    }


    return (
        <>
            <Navbar />

            <main className="page">

                {/* Back to course */}

                <div
                    style={{
                        marginBottom: "20px"
                    }}
                >

                    <Link
                        to={`/courses/${courseId}`}
                    >
                        ← Back to Course
                    </Link>

                </div>


                {/* Lesson header */}

                <div className="card">

                    <p
                        className="muted"
                        style={{
                            marginBottom: "8px"
                        }}
                    >
                        {lesson.moduleTitle}
                    </p>


                    <h1>
                        {lesson.title}
                    </h1>


                    {lesson.description && (

                        <p
                            className="muted"
                            style={{
                                marginTop: "12px"
                            }}
                        >
                            {lesson.description}
                        </p>

                    )}


                    <div
                        style={{
                            marginTop: "16px"
                        }}
                    >

                        <span className="badge">
                            {lesson.status ||
                                "NOT_STARTED"}
                        </span>

                    </div>

                </div>


                {/* Lesson content */}

                <div
                    className="card"
                    style={{
                        marginTop: "20px"
                    }}
                >

                    <h2>
                        Lesson Content
                    </h2>


                    {lesson.content ? (

                        <div
                            style={{
                                marginTop: "16px",
                                lineHeight: "1.7",
                                whiteSpace:
                                    "pre-wrap"
                            }}
                        >
                            {lesson.content}
                        </div>

                    ) : (

                        <p
                            className="muted"
                            style={{
                                marginTop: "12px"
                            }}
                        >
                            No lesson content
                            available.
                        </p>

                    )}

                </div>


                {/* Lesson information */}

                <div
                    className="grid grid-2"
                    style={{
                        marginTop: "20px"
                    }}
                >

                    <div className="card">

                        <h3>
                            Lesson Type
                        </h3>

                        <p
                            className="muted"
                            style={{
                                marginTop: "8px"
                            }}
                        >
                            {lesson.type ||
                                "THEORY"}
                        </p>

                    </div>


                    <div className="card">

                        <h3>
                            Estimated Time
                        </h3>

                        <p
                            className="muted"
                            style={{
                                marginTop: "8px"
                            }}
                        >
                            {lesson.estimatedMinutes
                                ? `${lesson.estimatedMinutes} minutes`
                                : "Not specified"}
                        </p>

                    </div>

                </div>


                {/* Completion messages */}

                {error && (

                    <div
                        className="error"
                        style={{
                            marginTop: "20px"
                        }}
                    >
                        {error}
                    </div>

                )}


                {success && (

                    <div
                        style={{
                            marginTop: "20px",
                            padding: "12px",
                            borderRadius: "8px",
                            background:
                                "#e8f7ee"
                        }}
                    >
                        {success}
                    </div>

                )}


                {/* Lesson actions */}

                <div
                    style={{
                        marginTop: "24px",
                        display: "flex",
                        gap: "12px",
                        flexWrap: "wrap"
                    }}
                >

                    {!lesson.completed ? (

                        <button
                            className="primary-btn"
                            onClick={handleComplete}
                            disabled={completing}
                        >
                            {completing
                                ? "Marking Complete..."
                                : "Mark as Complete"}
                        </button>

                    ) : (

                        <button
                            className="primary-btn"
                            disabled
                        >
                            ✓ Lesson Completed
                        </button>

                    )}


                    <Link
                        to={`/courses/${courseId}`}
                        className="primary-btn"
                    >
                        Back to Course
                    </Link>

                </div>

            </main>
        </>
    );
};


export default Lesson;