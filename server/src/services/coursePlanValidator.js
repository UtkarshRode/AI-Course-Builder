const { z } = require("zod");

const lessonSchema = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    objective: z.string().min(1),
    position: z.number().int().positive(),
    estimatedMinutes: z.number().int().positive(),
    concepts: z.array(z.string().min(1))
});

const moduleSchema = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    position: z.number().int().positive(),
    lessons: z.array(lessonSchema).min(1)
});

const prerequisiteSchema = z.object({
    concept: z.string().min(1),
    prerequisite: z.string().min(1)
});

const coursePlanSchema = z.object({
    title: z.string().min(1),
    description: z.string().min(1),

    difficulty: z.enum([
        "BEGINNER",
        "INTERMEDIATE",
        "ADVANCED"
    ]),

    estimatedHours: z.number().int().positive(),

    modules: z.array(moduleSchema).min(1),

    prerequisites: z.array(prerequisiteSchema)
});

const validateCoursePlan = (plan) => {
    return coursePlanSchema.parse(plan);
};

module.exports = {
    validateCoursePlan
};