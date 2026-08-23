import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";

const Recommendation = () => {

    const { courseId } = useParams();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {

        const fetchRecommendation = async () => {

            try {

                setLoading(true);
                setError("");

                const response =
                    await api.get(
                        `/adaptive/courses/${courseId}/recommendation`
                    );

                setData(response.data);

            } catch (err) {

                console.error(
                    "Recommendation error:",
                    err
                );

                setError(
                    err.response?.data?.message ||
                    "Failed to load recommendation"
                );

            } finally {

                setLoading(false);

            }

        };

        fetchRecommendation();

    }, [courseId]);

    return (

        <div className="page">

            <div
                style={{
                    maxWidth: "1000px",
                    margin: "0 auto",
                    padding: "32px 20px"
                }}
            >

                <Link
                    to="/dashboard"
                    style={{
                        textDecoration: "none"
                    }}
                >
                    ← Back to Dashboard
                </Link>

                <h1
                    style={{
                        marginTop: "24px"
                    }}
                >
                    Next Recommendation
                </h1>

                <p
                    className="muted"
                    style={{
                        marginTop: "8px"
                    }}
                >
                    Your personalized next learning step
                    based on your current mastery.
                </p>

                {loading && (

                    <div
                        className="card"
                        style={{
                            marginTop: "24px"
                        }}
                    >
                        Generating recommendation...
                    </div>

                )}

                {error && (

                    <div
                        className="card"
                        style={{
                            marginTop: "24px"
                        }}
                    >

                        <p style={{ color: "red" }}>
                            {error}
                        </p>

                    </div>

                )}

                {!loading &&
                    !error &&
                    data &&
                    !data.recommendation && (

                        <div
                            className="card"
                            style={{
                                marginTop: "24px"
                            }}
                        >

                            <h2>
                                You're doing well!
                            </h2>

                            <p
                                className="muted"
                                style={{
                                    marginTop: "12px"
                                }}
                            >
                                {data.message ||
                                    "No weak concepts found. Continue to the next course section."}
                            </p>

                        </div>

                    )}

                {!loading &&
                    !error &&
                    data?.recommendation && (

                        <div
                            className="card"
                            style={{
                                marginTop: "24px"
                            }}
                        >

                            <h2>
                                Recommended Lesson
                            </h2>

                            {data.lesson && (

                                <>

                                    <h3
                                        style={{
                                            marginTop:
                                                "20px"
                                        }}
                                    >
                                        {data.lesson.title}
                                    </h3>

                                    {data.lesson.description && (

                                        <p
                                            className="muted"
                                            style={{
                                                marginTop:
                                                    "10px"
                                            }}
                                        >
                                            {
                                                data.lesson
                                                    .description
                                            }
                                        </p>

                                    )}

                                    <Link
                                        to={`/course/${courseId}/lesson/${data.lesson.id}`}
                                        className="primary-btn"
                                        style={{
                                            display:
                                                "inline-block",
                                            marginTop:
                                                "20px",
                                            textDecoration:
                                                "none"
                                        }}
                                    >
                                        Start Recommended
                                        Lesson
                                    </Link>

                                </>

                            )}

                            {data.mastery && (

                                <p
                                    className="muted"
                                    style={{
                                        marginTop:
                                            "20px"
                                    }}
                                >
                                    Current mastery:{" "}
                                    <strong>
                                        {Number(
                                            data.mastery
                                                .masteryScore
                                        ).toFixed(1)}%
                                    </strong>
                                </p>

                            )}

                            {data.recommendation
                                .reason && (

                                <p
                                    className="muted"
                                    style={{
                                        marginTop:
                                            "12px"
                                    }}
                                >
                                    {
                                        data.recommendation
                                            .reason
                                    }
                                </p>

                            )}

                        </div>

                    )}

            </div>

        </div>

    );

};

export default Recommendation;