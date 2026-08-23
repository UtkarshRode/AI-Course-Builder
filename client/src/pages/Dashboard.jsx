import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../services/api";
import Navbar from "../components/Navbar";
import ProgressBar from "../components/ProgressBar";
import Loading from "../components/Loading";

import {
    connectSocket,
    disconnectSocket,
    getSocket
} from "../services/socket";


const COURSE_ID =
    "8258941d-dfc6-422c-b2ea-ea6378b6eacd";


const Dashboard = () => {


    const [dashboard, setDashboard] =
        useState(null);

    const [weakConcepts, setWeakConcepts] =
        useState([]);

    const [recommendation, setRecommendation] =
        useState(null);

    const [agentPlan, setAgentPlan] =
        useState(null);

    const [agentStatus, setAgentStatus] =
        useState("IDLE");

    const [agentError, setAgentError] =
        useState("");

    const [agentLoading, setAgentLoading] =
        useState(false);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");


    /*
     * =========================================================
     * SOCKET.IO CONNECTION
     * =========================================================
     */

    useEffect(() => {

        const token =
            localStorage.getItem(
                "courseforge_token"
            );

        if (!token) {
            return;
        }


        try {

            const payload =
                JSON.parse(
                    atob(
                        token.split(".")[1]
                    )
                );


            const userId =
                payload.id;


            if (!userId) {
                console.error(
                    "User ID missing from JWT"
                );
                return;
            }


            const socket =
                getSocket();


            socket.on(
                "connect",
                () => {

                    console.log(
                        "Dashboard socket connected:",
                        socket.id
                    );

                    connectSocket(userId);

                }
            );


            socket.on(
                "agent:started",
                () => {

                    setAgentStatus(
                        "ANALYZING"
                    );

                    setAgentError("");

                }
            );


            socket.on(
                "agent:analyzing",
                () => {

                    setAgentStatus(
                        "ANALYZING"
                    );

                }
            );


            socket.on(
                "agent:planning",
                () => {

                    setAgentStatus(
                        "PLANNING"
                    );

                }
            );


            socket.on(
                "agent:generating",
                () => {

                    setAgentStatus(
                        "GENERATING"
                    );

                }
            );


            socket.on(
                "agent:completed",
                (data) => {

                    console.log(
                        "Agent completed:",
                        data
                    );


                    setAgentStatus(
                        "COMPLETED"
                    );


                    if (data?.plan) {

                        setAgentPlan(
                            data.plan
                        );

                    }


                    setAgentLoading(
                        false
                    );

                }
            );


            socket.on(
                "agent:error",
                (data) => {

                    console.error(
                        "Agent socket error:",
                        data
                    );


                    setAgentStatus(
                        "ERROR"
                    );


                    setAgentError(
                        data?.message ||
                        "AI agent failed"
                    );


                    setAgentLoading(
                        false
                    );

                }
            );


            if (!socket.connected) {

                socket.connect();

            }


            return () => {

                socket.off(
                    "connect"
                );

                socket.off(
                    "agent:started"
                );

                socket.off(
                    "agent:analyzing"
                );

                socket.off(
                    "agent:planning"
                );

                socket.off(
                    "agent:generating"
                );

                socket.off(
                    "agent:completed"
                );

                socket.off(
                    "agent:error"
                );

                disconnectSocket();

            };

        } catch (socketError) {

            console.error(
                "Socket setup error:",
                socketError
            );

        }

    }, []);


    /*
     * =========================================================
     * LOAD DASHBOARD
     * =========================================================
     */

    useEffect(() => {

        const loadDashboard = async () => {

            try {

                const token =
                    localStorage.getItem(
                        "courseforge_token"
                    );


                const headers = {
                    Authorization:
                        `Bearer ${token}`
                };


                /*
                 * Main dashboard
                 */

                const dashboardResponse =
                    await api.get(
                        `/dashboard/${COURSE_ID}`,
                        {
                            headers
                        }
                    );


                if (
                    !dashboardResponse.data.success
                ) {

                    setError(
                        dashboardResponse.data.message ||
                        "Failed to load dashboard"
                    );

                    return;
                }


                setDashboard(
                    dashboardResponse.data.dashboard
                );


                /*
                 * Weak concepts
                 */

                try {

                    const weakResponse =
                        await api.get(
                            `/adaptive/courses/${COURSE_ID}/weak-areas`,
                            {
                                headers
                            }
                        );


                    if (
                        weakResponse.data.success
                    ) {

                        setWeakConcepts(
                            weakResponse.data.weakConcepts ||
                            []
                        );

                    }

                } catch (weakError) {

                    console.error(
                        "Weak concepts error:",
                        weakError
                    );

                }


                /*
                 * Recommendation
                 */

                try {

                    const recommendationResponse =
                        await api.get(
                            `/adaptive/courses/${COURSE_ID}/recommendation`,
                            {
                                headers
                            }
                        );


                    if (
                        recommendationResponse.data.success
                    ) {

                        setRecommendation(
                            recommendationResponse.data
                        );

                    }

                } catch (
                    recommendationError
                ) {

                    console.error(
                        "Recommendation error:",
                        recommendationError
                    );

                }

            } catch (err) {

    console.error(
        "Dashboard error:",
        err
    );

    const requestUrl =
        `${err.config?.baseURL || ""}${err.config?.url || ""}`;

    setError(
        `ERROR: ${err.message} | URL: ${requestUrl}`
    );
} finally {

                setLoading(false);

            }

        };


        loadDashboard();

    }, []);


    /*
     * =========================================================
     * RUN LEARNER AGENT
     * =========================================================
     */

    const runLearnerAgent = async () => {

        try {

            setAgentLoading(true);

            setAgentError("");

            setAgentPlan(null);

            setAgentStatus(
                "STARTING"
            );


            const token =
                localStorage.getItem(
                    "courseforge_token"
                );


            const headers = {
                Authorization:
                    `Bearer ${token}`
            };


            const response =
                await api.post(
                    "/ai/learner-agent",
                    {
                        courseId:
                            COURSE_ID
                    },
                    {
                        headers
                    }
                );


            if (
                response.data.success
            ) {

                /*
                 * Socket events provide the live
                 * progress. The HTTP response provides
                 * the final result as a fallback.
                 */

                setAgentPlan(
                    response.data.plan
                );

                setAgentStatus(
                    "COMPLETED"
                );

                setAgentLoading(
                    false
                );

            } else {

                setAgentStatus(
                    "ERROR"
                );

                setAgentError(
                    response.data.message ||
                    "Agent failed"
                );

                setAgentLoading(
                    false
                );

            }

        } catch (err) {

            console.error(
                "Learner agent error:",
                err
            );


            setAgentStatus(
                "ERROR"
            );


            setAgentError(
                err.response?.data?.message ||
                "Failed to run learner agent"
            );


            setAgentLoading(
                false
            );

        }

    };


    /*
     * =========================================================
     * LOADING / ERROR
     * =========================================================
     */

    if (loading) {

        return <Loading />;

    }


    if (error) {

        return (
            <>
                <Navbar />

                <div className="page">

                    <div className="card">

                        <h2>
                            Unable to load dashboard
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

                </div>
            </>
        );

    }


    if (!dashboard) {
        return null;
    }


    const progress =
        dashboard.progress || {};

    const assessments =
        dashboard.assessments || {};

    const mastery =
        dashboard.mastery || {};


    /*
     * =========================================================
     * RENDER
     * =========================================================
     */

    return (
        <>
            <Navbar />


            <main className="page">


                {/* =================================================
                    HEADER
                ================================================= */}

                <div
                    style={{
                        marginBottom: "32px"
                    }}
                >

                    <h1>
                        {dashboard.course?.title ||
                            "Your Learning Dashboard"}
                    </h1>

                    <p
                        className="muted"
                        style={{
                            marginTop: "8px"
                        }}
                    >
                        Track your learning progress,
                        assessments, mastery, and
                        personalized recommendations.
                    </p>

                </div>


                {/* =================================================
                    STATISTICS
                ================================================= */}

                <div className="grid grid-3">

                    <div className="card">

                        <p className="muted">
                            Course Progress
                        </p>

                        <div className="stat-value">

                            {Math.round(
                                progress.overall || 0
                            )}%

                        </div>

                    </div>


                    <div className="card">

                        <p className="muted">
                            Lessons Completed
                        </p>

                        <div className="stat-value">

                            {progress.completedLessons || 0}
                            /
                            {progress.totalLessons || 0}

                        </div>

                    </div>


                    <div className="card">

                        <p className="muted">
                            Assessment Average
                        </p>

                        <div className="stat-value">

                            {Math.round(
                                assessments.averageScore || 0
                            )}%

                        </div>

                    </div>

                </div>


                {/* =================================================
                    OVERALL PROGRESS
                ================================================= */}

                <div
                    className="card"
                    style={{
                        marginTop: "24px"
                    }}
                >

                    <h2>
                        Overall Course Progress
                    </h2>

                    <div
                        style={{
                            marginTop: "18px"
                        }}
                    >

                        <ProgressBar
                            value={
                                progress.overall || 0
                            }
                        />

                    </div>

                </div>


                {/* =================================================
                    AI LEARNING AGENT
                ================================================= */}

                <div
                    style={{
                        marginTop: "32px"
                    }}
                >

                    <h2>
                        AI Learning Agent
                    </h2>

                    <p
                        className="muted"
                        style={{
                            marginTop: "6px"
                        }}
                    >
                        CourseForge AI analyzes your
                        actual mastery and assessment
                        history to create a personalized
                        learning strategy.
                    </p>


                    <div
                        className="card"
                        style={{
                            marginTop: "16px"
                        }}
                    >

                        <div
                            style={{
                                display: "flex",
                                justifyContent:
                                    "space-between",
                                alignItems: "center",
                                gap: "16px",
                                flexWrap: "wrap"
                            }}
                        >

                            <div>

                                <h3>
                                    Personalized Learning Plan
                                </h3>

                                <p
                                    className="muted"
                                    style={{
                                        marginTop: "6px"
                                    }}
                                >
                                    Let the AI agent analyze
                                    your weak concepts and
                                    decide what you should
                                    learn next.
                                </p>

                            </div>


                            <button
                                className="button"
                                onClick={
                                    runLearnerAgent
                                }
                                disabled={
                                    agentLoading
                                }
                            >

                                {agentLoading
                                    ? "AI Agent Working..."
                                    : "Generate AI Learning Plan"}

                            </button>

                        </div>


                        {/* Agent status */}

                        {agentStatus !== "IDLE" && (

                            <div
                                style={{
                                    marginTop: "20px",
                                    padding: "14px",
                                    borderRadius: "8px",
                                    background:
                                        "#f5f5f5"
                                }}
                            >

                                <strong>
                                    Agent Status
                                </strong>

                                <p
                                    style={{
                                        marginTop: "6px"
                                    }}
                                >

                                    {agentStatus ===
                                        "STARTING" &&
                                        "Starting learner agent..."}

                                    {agentStatus ===
                                        "ANALYZING" &&
                                        "Analyzing your mastery and weak concepts..."}

                                    {agentStatus ===
                                        "PLANNING" &&
                                        "Creating your personalized learning plan..."}

                                    {agentStatus ===
                                        "GENERATING" &&
                                        "Generating targeted practice..."}

                                    {agentStatus ===
                                        "COMPLETED" &&
                                        "Learning plan ready."}

                                    {agentStatus ===
                                        "ERROR" &&
                                        "Agent failed."}

                                </p>

                            </div>

                        )}


                        {agentError && (

                            <p
                                className="error"
                                style={{
                                    marginTop: "14px"
                                }}
                            >
                                {agentError}
                            </p>

                        )}


                        {/* Agent result */}

                        {agentPlan && (

                            <div
                                style={{
                                    marginTop: "24px"
                                }}
                            >

                                {/* Priority */}

                                <div
                                    style={{
                                        display: "flex",
                                        gap: "10px",
                                        alignItems:
                                            "center",
                                        flexWrap: "wrap"
                                    }}
                                >

                                    <span className="badge">

                                        Priority:{" "}
                                        {
                                            agentPlan.priority
                                        }

                                    </span>

                                    <span className="badge">

                                        Action:{" "}
                                        {
                                            agentPlan.action
                                        }

                                    </span>

                                </div>


                                {/* Reason */}

                                <div
                                    style={{
                                        marginTop: "18px"
                                    }}
                                >

                                    <h3>
                                        Why this plan?
                                    </h3>

                                    <p
                                        className="muted"
                                        style={{
                                            marginTop: "8px"
                                        }}
                                    >
                                        {
                                            agentPlan.reason
                                        }
                                    </p>

                                </div>


                                {/* Learning plan */}

                                <div
                                    style={{
                                        marginTop: "22px"
                                    }}
                                >

                                    <h3>
                                        Your Learning Plan
                                    </h3>


                                    {(() => {

                                        let steps = [];

                                        try {

                                            steps =
                                                JSON.parse(
                                                    agentPlan.learningPlan ||
                                                    "[]"
                                                );

                                        } catch {

                                            steps = [];

                                        }


                                        return steps.length > 0 ? (

                                            <ol
                                                style={{
                                                    marginTop:
                                                        "12px",
                                                    paddingLeft:
                                                        "22px"
                                                }}
                                            >

                                                {steps.map(
                                                    (
                                                        step,
                                                        index
                                                    ) => (

                                                        <li
                                                            key={
                                                                index
                                                            }
                                                            style={{
                                                                marginBottom:
                                                                    "10px"
                                                            }}
                                                        >
                                                            {step}
                                                        </li>

                                                    )
                                                )}

                                            </ol>

                                        ) : null;

                                    })()}

                                </div>


                                {/* Practice */}

                                {agentPlan.practiceTask && (

                                    <div
                                        className="card"
                                        style={{
                                            marginTop:
                                                "22px"
                                        }}
                                    >

                                        <h3>
                                            Targeted Practice
                                        </h3>

                                        <p
                                            style={{
                                                marginTop:
                                                    "10px"
                                            }}
                                        >
                                            {
                                                agentPlan.practiceTask
                                            }
                                        </p>

                                    </div>

                                )}


                                {/* Recommended lesson */}

                                {agentPlan.recommendedLessonId && (

                                    <div
                                        style={{
                                            marginTop:
                                                "20px"
                                        }}
                                    >

                                        <Link
                                            className="button"
                                            to={`/course/${COURSE_ID}/lesson/${agentPlan.recommendedLessonId}`}
                                        >
                                            Start Recommended Lesson
                                        </Link>

                                    </div>

                                )}

                            </div>

                        )}

                    </div>

                </div>


                {/* =================================================
                    ADAPTIVE LEARNING
                ================================================= */}

                <div
                    style={{
                        marginTop: "32px"
                    }}
                >

                    <h2>
                        Adaptive Learning
                    </h2>

                    <p
                        className="muted"
                        style={{
                            marginTop: "6px"
                        }}
                    >
                        CourseForge AI analyzes your
                        assessment performance to
                        identify concepts that need
                        additional practice.
                    </p>


                    <div
                        className="grid grid-2"
                        style={{
                            marginTop: "16px"
                        }}
                    >

                        {/* Weak Areas */}

                        <div className="card">

                            <h2>
                                Areas to Improve
                            </h2>


                            {weakConcepts.length === 0 ? (

                                <p
                                    className="muted"
                                    style={{
                                        marginTop: "16px"
                                    }}
                                >
                                    Great job! You currently
                                    have no concepts below
                                    the mastery threshold.
                                </p>

                            ) : (

                                <div
                                    style={{
                                        marginTop: "16px"
                                    }}
                                >

                                    {weakConcepts.map(
                                        concept => (

                                            <div
                                                key={
                                                    concept.id
                                                }
                                                style={{
                                                    padding:
                                                        "14px 0",
                                                    borderBottom:
                                                        "1px solid #eee"
                                                }}
                                            >

                                                <div
                                                    style={{
                                                        display:
                                                            "flex",
                                                        justifyContent:
                                                            "space-between",
                                                        gap:
                                                            "12px"
                                                    }}
                                                >

                                                    <strong>
                                                        {concept.name ||
                                                            concept.conceptId}
                                                    </strong>

                                                    <span>
                                                        {Math.round(
                                                            concept.masteryScore
                                                        )}%
                                                    </span>

                                                </div>


                                                <ProgressBar
                                                    value={
                                                        concept.masteryScore
                                                    }
                                                />


                                                <p
                                                    className="muted"
                                                    style={{
                                                        marginTop:
                                                            "6px"
                                                    }}
                                                >
                                                    {concept.status}
                                                </p>

                                            </div>

                                        )
                                    )}

                                </div>

                            )}

                        </div>


                        {/* Recommendation */}

                        <div className="card">

                            <h2>
                                Next Recommendation
                            </h2>


                            {recommendation ? (

                                <div
                                    style={{
                                        marginTop:
                                            "16px"
                                    }}
                                >

                                    {recommendation.concept && (

                                        <p>

                                            <strong>
                                                Focus Concept:
                                            </strong>{" "}

                                            {
                                                recommendation
                                                    .concept.name
                                            }

                                        </p>

                                    )}


                                    {recommendation.lesson && (

                                        <p
                                            style={{
                                                marginTop:
                                                    "12px"
                                            }}
                                        >

                                            <strong>
                                                Recommended Lesson:
                                            </strong>{" "}

                                            {
                                                recommendation
                                                    .lesson.title
                                            }

                                        </p>

                                    )}


                                    {recommendation.reason && (

                                        <p
                                            className="muted"
                                            style={{
                                                marginTop:
                                                    "12px"
                                            }}
                                        >
                                            {
                                                recommendation
                                                    .reason
                                            }
                                        </p>

                                    )}


                                    {recommendation.message && (

                                        <p
                                            className="muted"
                                            style={{
                                                marginTop:
                                                    "12px"
                                            }}
                                        >
                                            {
                                                recommendation
                                                    .message
                                            }
                                        </p>

                                    )}

                                </div>

                            ) : (

                                <p
                                    className="muted"
                                    style={{
                                        marginTop: "16px"
                                    }}
                                >
                                    Complete an assessment
                                    to receive a personalized
                                    learning recommendation.
                                </p>

                            )}

                        </div>

                    </div>

                </div>


                {/* =================================================
                    MODULES
                ================================================= */}

                <div
                    style={{
                        marginTop: "32px"
                    }}
                >

                    <h2>
                        Course Modules
                    </h2>


                    <div
                        className="grid"
                        style={{
                            marginTop: "16px"
                        }}
                    >

                        {(
                            dashboard.modules || []
                        ).map(module => (

                            <div
                                className="card"
                                key={module.id}
                            >

                                <div
                                    style={{
                                        display:
                                            "flex",
                                        justifyContent:
                                            "space-between",
                                        alignItems:
                                            "center",
                                        gap: "20px"
                                    }}
                                >

                                    <div>

                                        <h3>
                                            {module.title}
                                        </h3>

                                        <p
                                            className="muted"
                                            style={{
                                                marginTop:
                                                    "6px"
                                            }}
                                        >
                                            {
                                                module.completedLessons
                                            }
                                            /
                                            {
                                                module.totalLessons
                                            }
                                            {" "}lessons
                                            completed
                                        </p>

                                    </div>


                                    <strong>
                                        {Math.round(
                                            module.progress
                                        )}%
                                    </strong>

                                </div>


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


                                <div
                                    style={{
                                        marginTop: "16px"
                                    }}
                                >

                                    {module.lessons.map(
                                        lesson => (

                                            <div
                                                className="lesson-item"
                                                key={lesson.id}
                                            >

                                                <Link
    to={`/course/${COURSE_ID}/lesson/${lesson.id}`}
>
    {lesson.title}
</Link>


                                                <span
                                                    className="badge"
                                                >
                                                    {
                                                        lesson.status
                                                    }
                                                </span>

                                            </div>

                                        )
                                    )}

                                </div>

                            </div>

                        ))}

                    </div>

                </div>


                {/* =================================================
                    MASTERY SUMMARY
                ================================================= */}

                <div
                    className="grid grid-2"
                    style={{
                        marginTop: "32px"
                    }}
                >

                    <div className="card">

                        <h2>
                            Concept Mastery
                        </h2>

                        <div
                            style={{
                                marginTop: "20px"
                            }}
                        >

                            <p className="muted">
                                Concepts Tracked
                            </p>

                            <div className="stat-value">

                                {
                                    mastery.conceptsTracked ||
                                    0
                                }

                            </div>

                        </div>

                    </div>


                    <div className="card">

                        <h2>
                            Weak Concepts
                        </h2>

                        <div
                            style={{
                                marginTop: "20px"
                            }}
                        >

                            <div className="stat-value">

                                {weakConcepts.length}

                            </div>

                            <p
                                className="muted"
                                style={{
                                    marginTop: "6px"
                                }}
                            >
                                concepts need attention
                            </p>

                        </div>

                    </div>

                </div>


            </main>
        </>
    );
};


export default Dashboard;