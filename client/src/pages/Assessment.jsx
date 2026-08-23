import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import api from "../services/api";
import Navbar from "../components/Navbar";
import Loading from "../components/Loading";


const Assessment = () => {

    const { assessmentId } = useParams();

    const [assessment, setAssessment] = useState(null);
    const [answers, setAnswers] = useState({});
    const [currentQuestion, setCurrentQuestion] = useState(0);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [result, setResult] = useState(null);
    const [error, setError] = useState("");


    useEffect(() => {

        const loadAssessment = async () => {

            try {

                const token =
                    localStorage.getItem(
                        "courseforge_token"
                    );

                const response = await api.get(
                    `/assessments/${assessmentId}`,
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
                        "Failed to load assessment"
                    );

                    return;
                }

                setAssessment(
                    response.data.assessment
                );

            } catch (err) {

                console.error(
                    "Assessment loading error:",
                    err
                );

                setError(
                    err.response?.data?.message ||
                    "Failed to load assessment"
                );

            } finally {

                setLoading(false);
            }
        };


        loadAssessment();

    }, [assessmentId]);


    const selectAnswer = (questionId, optionIndex) => {

        setAnswers(prev => ({
            ...prev,
            [questionId]: optionIndex
        }));
    };


    const handleNext = () => {

        if (
            currentQuestion <
            assessment.questions.length - 1
        ) {

            setCurrentQuestion(
                prev => prev + 1
            );
        }
    };


    const handlePrevious = () => {

        if (currentQuestion > 0) {

            setCurrentQuestion(
                prev => prev - 1
            );
        }
    };


    const handleSubmit = async () => {

        try {

            setSubmitting(true);
            setError("");

            const token =
                localStorage.getItem(
                    "courseforge_token"
                );


            const formattedAnswers =
    assessment.questions.map(
        question => ({
            questionId:
                question.id,

            answer:
                answers[question.id] ??
                null
        })
    );


            const response = await api.post(
                `/assessments/${assessmentId}/submit`,
                {
                    answers: formattedAnswers
                },
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
                    "Failed to submit assessment"
                );
            }


            setResult(
                response.data.result ||
                response.data.attempt ||
                response.data.assessmentAttempt
            );

        } catch (err) {

            console.error(
                "Assessment submission error:",
                err
            );

            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to submit assessment"
            );

        } finally {

            setSubmitting(false);
        }
    };


    if (loading) {
        return <Loading />;
    }


    if (error && !assessment) {

        return (
            <>
                <Navbar />

                <main className="page">

                    <div className="card">

                        <h2>
                            Unable to load assessment
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


    if (!assessment) {
        return null;
    }


    /* =========================
       RESULT SCREEN
       ========================= */

    if (result) {

        const score =
            result.score ??
            0;

        const totalQuestions =
            result.totalQuestions ??
            assessment.questions.length;

        const correctAnswers =
            result.correctAnswers ??
            0;

        const passed =
            score >=
            (assessment.passingScore ?? 60);


        return (
            <>
                <Navbar />

                <main className="page">

                    <div className="card">

                        <h1>
                            Assessment Result
                        </h1>

                        <p
                            className="muted"
                            style={{
                                marginTop: "8px"
                            }}
                        >
                            {assessment.title}
                        </p>


                        <div
                            className="grid grid-3"
                            style={{
                                marginTop: "24px"
                            }}
                        >

                            <div className="card">

                                <h3>
                                    Score
                                </h3>

                                <p
                                    style={{
                                        fontSize:
                                            "28px",
                                        fontWeight:
                                            "700",
                                        marginTop:
                                            "8px"
                                    }}
                                >
                                    {score}%
                                </p>

                            </div>


                            <div className="card">

                                <h3>
                                    Correct
                                </h3>

                                <p
                                    style={{
                                        fontSize:
                                            "28px",
                                        fontWeight:
                                            "700",
                                        marginTop:
                                            "8px"
                                    }}
                                >
                                    {correctAnswers}/
                                    {totalQuestions}
                                </p>

                            </div>


                            <div className="card">

                                <h3>
                                    Status
                                </h3>

                                <p
                                    style={{
                                        fontSize:
                                            "22px",
                                        fontWeight:
                                            "700",
                                        marginTop:
                                            "8px"
                                    }}
                                >
                                    {passed
                                        ? "PASSED"
                                        : "FAILED"}
                                </p>

                            </div>

                        </div>


                        <div
                            style={{
                                marginTop: "24px"
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

                </main>
            </>
        );
    }


    /* =========================
       ASSESSMENT SCREEN
       ========================= */

    const questions =
        assessment.questions || [];

    const question =
        questions[currentQuestion];

    const selectedAnswer =
        answers[question.id];


    const answeredCount =
        Object.keys(answers).length;


    return (
        <>
            <Navbar />

            <main className="page">

                <div className="card">

                    <Link
                        to="/dashboard"
                    >
                        ← Back to Dashboard
                    </Link>


                    <h1
                        style={{
                            marginTop: "16px"
                        }}
                    >
                        {assessment.title}
                    </h1>


                    {assessment.description && (

                        <p
                            className="muted"
                            style={{
                                marginTop: "8px"
                            }}
                        >
                            {assessment.description}
                        </p>

                    )}

                </div>


                {/* Progress */}

                <div
                    className="card"
                    style={{
                        marginTop: "20px"
                    }}
                >

                    <div
                        style={{
                            display: "flex",
                            justifyContent:
                                "space-between"
                        }}
                    >

                        <strong>
                            Question{" "}
                            {currentQuestion + 1}
                            {" "}of{" "}
                            {questions.length}
                        </strong>

                        <span>
                            {answeredCount}/
                            {questions.length}
                            {" "}answered
                        </span>

                    </div>

                </div>


                {/* Question */}

                <div
                    className="card"
                    style={{
                        marginTop: "20px"
                    }}
                >

                    <span className="badge">
                        {question.difficulty ||
                            "QUESTION"}
                    </span>


                    <h2
                        style={{
                            marginTop: "16px"
                        }}
                    >
                        {question.question}
                    </h2>


                    <div
                        style={{
                            marginTop: "24px"
                        }}
                    >

                        {question.options.map(
                            (option, index) => {

                                const selected =
                                    selectedAnswer ===
                                    index;


                                return (
                                    <button
                                        key={index}
                                        onClick={() =>
                                            selectAnswer(
                                                question.id,
                                                index
                                            )
                                        }
                                        style={{
                                            display:
                                                "block",
                                            width:
                                                "100%",
                                            textAlign:
                                                "left",
                                            padding:
                                                "14px",
                                            marginBottom:
                                                "12px",
                                            border:
                                                selected
                                                    ? "2px solid #333"
                                                    : "1px solid #ddd",
                                            borderRadius:
                                                "8px",
                                            background:
                                                selected
                                                    ? "#f0f0f0"
                                                    : "#fff",
                                            cursor:
                                                "pointer"
                                        }}
                                    >
                                        <strong>
                                            {String.fromCharCode(
                                                65 + index
                                            )}
                                            .
                                        </strong>{" "}
                                        {option}
                                    </button>
                                );

                            }
                        )}

                    </div>

                </div>


                {error && (

                    <div
                        className="error"
                        style={{
                            marginTop: "16px"
                        }}
                    >
                        {error}
                    </div>

                )}


                {/* Navigation */}

                <div
                    style={{
                        marginTop: "20px",
                        display: "flex",
                        justifyContent:
                            "space-between",
                        gap: "12px"
                    }}
                >

                    <button
                        className="primary-btn"
                        onClick={
                            handlePrevious
                        }
                        disabled={
                            currentQuestion === 0
                        }
                    >
                        ← Previous
                    </button>


                    {currentQuestion <
                    questions.length - 1 ? (

                        <button
                            className="primary-btn"
                            onClick={handleNext}
                        >
                            Next →
                        </button>

                    ) : (

                        <button
                            className="primary-btn"
                            onClick={
                                handleSubmit
                            }
                            disabled={
                                submitting ||
                                answeredCount !==
                                questions.length
                            }
                        >
                            {submitting
                                ? "Submitting..."
                                : "Submit Assessment"}
                        </button>

                    )}

                </div>


                {answeredCount !==
                    questions.length && (
                    <p
                        className="muted"
                        style={{
                            textAlign:
                                "center",
                            marginTop:
                                "12px"
                        }}
                    >
                        Answer all questions
                        before submitting.
                    </p>
                )}

            </main>
        </>
    );
};


export default Assessment;