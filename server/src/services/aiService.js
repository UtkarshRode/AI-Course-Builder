const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const generateCoursePlan = async ({
    goal,
    experienceLevel,
    weeklyHours,
    durationWeeks
}) => {

    const prompt = `
Create a realistic learning course.

Goal: ${goal}
Experience Level: ${experienceLevel}
Weekly Hours: ${weeklyHours}
Duration: ${durationWeeks} weeks

Return ONLY valid JSON.

Use this exact structure:

{
  "title": "string",
  "description": "string",
  "difficulty": "BEGINNER | INTERMEDIATE | ADVANCED",
  "estimatedHours": number,
  "modules": [
    {
      "title": "string",
      "description": "string",
      "position": number,
      "lessons": [
        {
          "title": "string",
          "description": "string",
          "objective": "string",
          "position": number,
          "estimatedMinutes": number,
          "concepts": ["string"]
        }
      ]
    }
  ],
  "prerequisites": [
    {
      "concept": "string",
      "prerequisite": "string"
    }
  ]
}

Rules:
- Create 3 to 5 modules.
- Create 2 to 4 lessons per module.
- Progress from fundamentals to advanced topics.
- Keep the workload realistic.
- Include meaningful concepts.
- Include prerequisite relationships.
`;

    const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json"
        }
    });

    return JSON.parse(response.text);
};

module.exports = {
    generateCoursePlan
};