const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


const generateAssessment = async ({
    lessonTitle,
    lessonDescription,
    lessonObjective,
    concepts
}) => {

    const prompt = `
You are the Assessment Agent for CourseForge AI.

Create a high-quality multiple-choice assessment for the lesson below.

LESSON:
${lessonTitle}

DESCRIPTION:
${lessonDescription}

LEARNING OBJECTIVE:
${lessonObjective}

AVAILABLE CONCEPTS:
${concepts.join("\n")}

REQUIREMENTS:

1. Generate exactly 5 questions.
2. Each question must have exactly 4 options.
3. Each question must have exactly one correct answer.
4. Questions should test understanding, application, and reasoning.
5. Avoid questions that are purely based on memorization.
6. Use a mixture of EASY, MEDIUM, and HARD questions.
7. Every question must be associated with exactly one available concept.
8. The conceptId MUST be the exact UUID written after "ID:" for that concept.
9. Do not invent concept IDs.
10. correctAnswer must be a number from 0 to 3 representing the index of the correct option.
11. Return ONLY valid JSON.
12. Do not include markdown or code fences.

IMPORTANT CONCEPT-ID RULE:

The available concepts are provided in this format:

Concept: Concept Name | ID: UUID

For example:

Concept: Gradient Descent | ID: abc-123

If a question tests Gradient Descent, return:

"conceptId": "abc-123"

NOT:

"conceptId": "Gradient Descent"

and NOT:

"conceptId": "some-new-id"

RETURN EXACTLY THIS STRUCTURE:

{
    "questions": [
        {
            "id": "q1",
            "question": "Question text",
            "options": [
                "Option A",
                "Option B",
                "Option C",
                "Option D"
            ],
            "correctAnswer": 0,
            "conceptId": "exact-existing-concept-uuid",
            "difficulty": "EASY",
            "explanation": "Brief explanation of why the answer is correct."
        }
    ]
}
`;


    const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",

        contents: prompt,

        config: {
            responseMimeType: "application/json"
        }
    });


    if (!response || !response.text) {
        throw new Error(
            "Gemini returned an empty assessment response"
        );
    }


    let parsedResponse;

    try {

        parsedResponse =
            JSON.parse(response.text);

    } catch (error) {

        console.error(
            "Invalid Gemini JSON:",
            response.text
        );

        throw new Error(
            "Gemini returned invalid JSON"
        );
    }


    if (
        !parsedResponse.questions ||
        !Array.isArray(
            parsedResponse.questions
        )
    ) {
        throw new Error(
            "Gemini response does not contain a questions array"
        );
    }


    if (
        parsedResponse.questions.length !== 5
    ) {
        throw new Error(
            `Expected 5 questions but received ${parsedResponse.questions.length}`
        );
    }


    return parsedResponse;
};


module.exports = {
    generateAssessment
};