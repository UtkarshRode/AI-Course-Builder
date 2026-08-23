const prisma = require("../config/database");
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


const runLearnerAgent = async ({
    userId,
    courseId,
    onEvent
}) => {

    const emit = (event, data = {}) => {

        if (onEvent) {
            onEvent(event, data);
        }

    };


    console.log(
        "Learner Agent started:",
        userId,
        courseId
    );


    emit("agent:started");

    emit("agent:analyzing");


    // =========================================================
    // 1. COLLECT LEARNER MASTERY
    // =========================================================

    const mastery =
        await prisma.conceptMastery.findMany({
            where: {
                userId,
                courseId
            },

            orderBy: {
                masteryScore: "asc"
            }
        });


    const conceptIds =
        mastery.map(
            item => item.conceptId
        );


    const concepts =
        conceptIds.length > 0
            ? await prisma.concept.findMany({
                where: {
                    id: {
                        in: conceptIds
                    }
                }
            })
            : [];


    const conceptMap =
        new Map(
            concepts.map(
                concept => [
                    concept.id,
                    concept
                ]
            )
        );


    // =========================================================
    // 2. COLLECT COURSE STRUCTURE
    // =========================================================

    const course =
        await prisma.course.findUnique({
            where: {
                id: courseId
            },

            include: {
                modules: {
                    orderBy: {
                        position: "asc"
                    },

                    include: {
                        lessons: {
                            orderBy: {
                                position: "asc"
                            },

                            include: {
                                concepts: {
                                    include: {
                                        concept: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });


    if (!course) {
        throw new Error("Course not found");
    }


    // =========================================================
    // 3. IDENTIFY WEAK CONCEPTS
    // =========================================================

    const weakConcepts =
        mastery
            .filter(
                item =>
                    item.masteryScore < 70
            )
            .slice(0, 5);


    // =========================================================
    // 4. FIND LESSONS FOR WEAK CONCEPTS
    // =========================================================

    const weakConceptIds =
        new Set(
            weakConcepts.map(
                item => item.conceptId
            )
        );


    const candidateLessons = [];


    for (const module of course.modules) {

        for (const lesson of module.lessons) {

            const matchedConcepts =
                lesson.concepts.filter(
                    relation =>
                        weakConceptIds.has(
                            relation.conceptId
                        )
                );


            if (
                matchedConcepts.length > 0
            ) {

                candidateLessons.push({
                    lessonId: lesson.id,

                    title: lesson.title,

                    moduleTitle:
                        module.title,

                    concepts:
                        matchedConcepts.map(
                            relation =>
                                relation.concept.name
                        )
                });

            }

        }

    }


    // =========================================================
    // 5. BUILD LEARNER STATE
    // =========================================================

    const learnerState = {

        course: {
            id: course.id,
            title: course.title,
            difficulty: course.difficulty
        },


        mastery:
            mastery.map(item => ({

                conceptId:
                    item.conceptId,

                concept:
                    conceptMap.get(
                        item.conceptId
                    )?.name ||
                    "Unknown",

                masteryScore:
                    item.masteryScore,

                status:
                    item.status,

                attempts:
                    item.attempts,

                correctAnswers:
                    item.correctAnswers,

                totalAnswers:
                    item.totalAnswers,

                lastScore:
                    item.lastScore

            })),


        weakConcepts:
            weakConcepts.map(item => ({

                conceptId:
                    item.conceptId,

                concept:
                    conceptMap.get(
                        item.conceptId
                    )?.name ||
                    "Unknown",

                masteryScore:
                    item.masteryScore,

                status:
                    item.status

            })),


        candidateLessons

    };


    // =========================================================
    // 6. ASK GEMINI
    // =========================================================

    emit("agent:planning");


    const prompt = `
You are the CourseForge AI Learning Agent.

Your job is to create a personalized learning
action for ONE learner based on their actual
course progress and concept mastery.

You must reason from the supplied learner state.

LEARNER STATE:

${JSON.stringify(
    learnerState,
    null,
    2
)}

RULES:

1. Prioritize the weakest concepts.

2. Prefer existing lessons that directly teach
   weak concepts.

3. Do not recommend concepts with mastery >= 85
   unless there is no meaningful weak concept.

4. Do not invent lesson IDs.

5. Use only lesson IDs present in candidateLessons.

6. If there are no weak concepts, recommend
   progressing to the next course section.

7. Create a short, actionable learning plan.

8. Include targeted practice instructions.

9. Explain why the action was selected.

10. Base the recommendation on the learner's
    actual mastery, attempts, correct answers,
    and previous score.

Return ONLY valid JSON.

Use exactly this structure:

{
    "priority": "HIGH | MEDIUM | LOW",

    "focusConcepts": [
        {
            "conceptId": "string",
            "name": "string",
            "masteryScore": number
        }
    ],

    "recommendedLessonId": "string or null",

    "action": "REVIEW | PRACTICE | ADVANCE",

    "reason": "string",

    "learningPlan": [
        "string",
        "string",
        "string"
    ],

    "practiceTask": "string"
}
`;


    console.log(
        "Sending learner state to Gemini..."
    );


    const response =
        await ai.models.generateContent({

            model:
                "gemini-3.6-flash",

            contents:
                prompt,

            config: {
                responseMimeType:
                    "application/json"
            }

        });


    const decision =
        JSON.parse(
            response.text
        );


    // =========================================================
    // 7. VALIDATE AI RECOMMENDATION
    // =========================================================

    if (
        decision.recommendedLessonId &&
        !candidateLessons.some(
            lesson =>
                lesson.lessonId ===
                decision.recommendedLessonId
        )
    ) {

        decision.recommendedLessonId =
            candidateLessons.length > 0
                ? candidateLessons[0].lessonId
                : null;

    }


    // =========================================================
    // 8. PERSIST AGENT PLAN
    // =========================================================

    emit("agent:generating");


    const plan =
        await prisma.learningAgentPlan.create({

            data: {

                userId,

                courseId,

                priority:
                    decision.priority ||
                    "MEDIUM",

                action:
                    decision.action ||
                    "REVIEW",

                reason:
                    decision.reason ||
                    "Personalized learning recommendation.",

                learningPlan:
                    JSON.stringify(
                        decision.learningPlan ||
                        []
                    ),

                practiceTask:
                    decision.practiceTask ||
                    null,

                recommendedLessonId:
                    decision.recommendedLessonId ||
                    null

            }

        });


    console.log(
        "Learner Agent completed:",
        plan.id
    );


    // =========================================================
    // 9. SEND COMPLETION EVENT
    // =========================================================

    emit(
        "agent:completed",
        {
            plan,
            decision
        }
    );


    // =========================================================
    // 10. RETURN RESULT
    // =========================================================

    return {

        plan,

        decision,

        learnerState

    };

};


module.exports = {
    runLearnerAgent
};