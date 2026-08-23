import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";

const WeakAreas = () => {

    const { courseId } = useParams();

    const [weakConcepts, setWeakConcepts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {

        const fetchWeakAreas = async () => {

            try {

                setLoading(true);
                setError("");

                const response =
                    await api.get(
                        `/adaptive/courses/${courseId}/weak-areas`
                    );

                setWeakConcepts(
                    response.data?.weakConcepts || []
                );

            } catch (err) {

                console.error(
                    "Weak areas error:",
                    err
                );

                setError(
                    err.response?.data?.message ||
                    "Failed to load weak areas"
                );

            } finally {

                setLoading(false);

            }

        };

        fetchWeakAreas();

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
                    Areas to Improve
                </h1>

                <p
                    className="muted"
                    style={{
                        marginTop: "8px"
                    }}
                >
                    Concepts where your current mastery
                    is below the adaptive learning threshold.
                </p>

                {loading && (

                    <div
                        className="card"
                        style={{
                            marginTop: "24px"
                        }}
                    >
                        Loading weak areas...
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
                    weakConcepts.length === 0 && (

                        <div
                            className="card"
                            style={{
                                marginTop: "24px"
                            }}
                        >

                            <h2>
                                Great job!
                            </h2>

                            <p
                                className="muted"
                                style={{
                                    marginTop: "12px"
                                }}
                            >
                                You currently have no
                                concepts below the
                                mastery threshold.
                            </p>

                        </div>

                    )}

                {!loading &&
                    !error &&
                    weakConcepts.length > 0 && (

                        <div
                            style={{
                                marginTop: "24px"
                            }}
                        >

                            {weakConcepts.map(
                                concept => (

                                    <div
                                        key={
                                            concept.id ||
                                            concept.conceptId
                                        }
                                        className="card"
                                        style={{
                                            marginBottom:
                                                "16px"
                                        }}
                                    >

                                        <div
                                            style={{
                                                display:
                                                    "flex",
                                                justifyContent:
                                                    "space-between",
                                                alignItems:
                                                    "center",
                                                gap: "16px"
                                            }}
                                        >

                                            <h2>
                                                {
                                                    concept.name ||
                                                    concept.conceptId
                                                }
                                            </h2>

                                            <strong>
                                                {Math.round(
                                                    concept.masteryScore
                                                )}%
                                            </strong>

                                        </div>

                                        <div
                                            style={{
                                                marginTop:
                                                    "12px",
                                                height: "8px",
                                                background:
                                                    "#eee",
                                                borderRadius:
                                                    "4px",
                                                overflow:
                                                    "hidden"
                                            }}
                                        >

                                            <div
                                                style={{
                                                    width:
                                                        `${Math.max(
                                                            0,
                                                            Math.min(
                                                                100,
                                                                concept.masteryScore
                                                            )
                                                        )}%`,
                                                    height: "100%"
                                                }}
                                            />

                                        </div>

                                        {concept.status && (

                                            <p
                                                className="muted"
                                                style={{
                                                    marginTop:
                                                        "10px"
                                                }}
                                            >
                                                {
                                                    concept.status
                                                }
                                            </p>

                                        )}

                                    </div>

                                )
                            )}

                        </div>

                    )}

            </div>

        </div>

    );

};

export default WeakAreas;