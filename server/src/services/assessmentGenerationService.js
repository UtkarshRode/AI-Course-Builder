const prisma = require("../config/database");

const {
    generateAssessment
} = require("./assessmentAgent");

const {
    createAssessment
} = require("./assessmentService");


const generateLessonAssessment = async ({
    lessonId,
    userId
}) => {

    const lesson = await prisma.lesson.findUnique({
        where: {
            id: lessonId
        },

        include: {
            module: {
                include: {
                    course: true
                }
            },

            concepts: {
                include: {
                    concept: true
                }
            }
        }
    });

    if (!lesson) {
        throw new Error("Lesson not found");
    }

    const concepts = lesson.concepts.map((item) => ({
        id: item.concept.id,
        name: item.concept.name
    }));

    if (concepts.length === 0) {
        throw new Error(
            "This lesson has no concepts associated with it"
        );
    }

    console.log(
        "Generating assessment for:",
        lesson.title
    );

    console.log(
        "Available concepts:",
        concepts
    );


    /*
     * Send both concept name and ID to Gemini.
     */
    const generated = await generateAssessment({
        lessonTitle: lesson.title,

        lessonDescription:
            lesson.description || "",

        lessonObjective:
            lesson.content || "",

        concepts: concepts.map(
            (concept) =>
                `Concept: ${concept.name} | ID: ${concept.id}`
        )
    });


    if (
        !generated ||
        !Array.isArray(generated.questions)
    ) {
        throw new Error(
            "Gemini returned an invalid assessment structure"
        );
    }


    if (generated.questions.length === 0) {
        throw new Error(
            "Gemini generated no questions"
        );
    }


    /*
     * Normalize the concept returned by Gemini.
     *
     * Gemini may return:
     *   UUID
     *   concept name
     *   Concept: name
     */
    const findConcept = (value) => {

        if (!value) {
            return null;
        }

        const normalized =
            String(value)
                .trim()
                .toLowerCase();


        // Match UUID directly
        const directMatch =
            concepts.find(
                (concept) =>
                    concept.id.toLowerCase() ===
                    normalized
            );

        if (directMatch) {
            return directMatch;
        }


        // Match concept name
        const nameMatch =
            concepts.find(
                (concept) =>
                    concept.name
                        .trim()
                        .toLowerCase() ===
                    normalized
            );

        if (nameMatch) {
            return nameMatch;
        }


        // Try extracting concept name from
        // "Concept: Something | ID: xyz"
        const cleaned =
            normalized
                .replace("concept:", "")
                .split("|")[0]
                .trim();


        return concepts.find(
            (concept) =>
                concept.name
                    .trim()
                    .toLowerCase() ===
                cleaned
        ) || null;
    };


    const validQuestions =
        generated.questions.map(
            (question, index) => {

                const matchingConcept =
                    findConcept(
                        question.conceptId
                    );


                if (!matchingConcept) {
                    throw new Error(
                        `Question ${index + 1} has an invalid concept: ${question.conceptId}`
                    );
                }


                if (
                    !question.question ||
                    !Array.isArray(question.options) ||
                    question.options.length !== 4
                ) {
                    throw new Error(
                        `Question ${index + 1} must contain exactly 4 options`
                    );
                }


                const correctAnswer =
                    Number(
                        question.correctAnswer
                    );


                if (
                    !Number.isInteger(
                        correctAnswer
                    ) ||
                    correctAnswer < 0 ||
                    correctAnswer > 3
                ) {
                    throw new Error(
                        `Question ${index + 1} has an invalid correct answer`
                    );
                }


                return {
                    id: `q${index + 1}`,

                    question:
                        question.question,

                    options:
                        question.options,

                    correctAnswer,

                    conceptId:
                        matchingConcept.id,

                    difficulty:
                        question.difficulty ||
                        "MEDIUM",

                    explanation:
                        question.explanation || ""
                };
            }
        );


    /*
     * Save assessment in PostgreSQL.
     */
    const assessment =
        await createAssessment({
            courseId:
                lesson.module.course.id,

            lessonId,

            title:
                `${lesson.title} Assessment`,

            description:
                `Assessment for ${lesson.title}`,

            questions:
                validQuestions
        });


    return assessment;
};


module.exports = {
    generateLessonAssessment
};