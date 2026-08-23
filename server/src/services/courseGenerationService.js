const prisma = require("../config/database");

const generateCourseFromPlan = async (plan, userId) => {
    return await prisma.$transaction(async (tx) => {

        // 1. Create the course
        const course = await tx.course.create({
            data: {
                title: plan.title,
                description: plan.description,
                difficulty: plan.difficulty,
                estimatedHours: plan.estimatedHours,
                creatorId: userId
            }
        });

        // Store concept IDs here
        const conceptMap = new Map();

        // 2. Collect every concept from lessons
        const conceptNames = new Set();

        for (const module of plan.modules) {
            for (const lesson of module.lessons) {
                for (const concept of lesson.concepts) {
                    conceptNames.add(concept.trim());
                }
            }
        }

        // Also collect concepts appearing in prerequisites
        for (const relationship of plan.prerequisites) {
            conceptNames.add(relationship.concept.trim());
            conceptNames.add(relationship.prerequisite.trim());
        }

        // 3. Create/reuse concepts
        for (const conceptName of conceptNames) {

            const concept = await tx.concept.upsert({
                where: {
                    name: conceptName
                },

                update: {},

                create: {
                    name: conceptName,
                    description: `Concept included in ${course.title}`
                }
            });

            conceptMap.set(conceptName, concept.id);

            // Connect concept to course
            await tx.courseConcept.create({
                data: {
                    courseId: course.id,
                    conceptId: concept.id
                }
            });
        }

        // 4. Create modules and lessons
        for (const moduleData of plan.modules) {

            const module = await tx.module.create({
                data: {
                    title: moduleData.title,
                    description: moduleData.description,
                    position: moduleData.position,
                    courseId: course.id
                }
            });

            for (const lessonData of moduleData.lessons) {

                const lesson = await tx.lesson.create({
                    data: {
                        title: lessonData.title,
                        description: lessonData.description,
                        content: lessonData.objective,
                        position: lessonData.position,
                        type: "THEORY",
                        estimatedMinutes:
                            lessonData.estimatedMinutes,
                        moduleId: module.id
                    }
                });

                // Connect lesson to concepts
                for (const conceptName of lessonData.concepts) {

                    const conceptId =
                        conceptMap.get(conceptName.trim());

                    if (!conceptId) {
                        continue;
                    }

                    await tx.lessonConcept.create({
                        data: {
                            lessonId: lesson.id,
                            conceptId
                        }
                    });
                }
            }
        }

        // 5. Create prerequisite relationships
        for (const relationship of plan.prerequisites) {

            const conceptId =
                conceptMap.get(
                    relationship.concept.trim()
                );

            const prerequisiteId =
                conceptMap.get(
                    relationship.prerequisite.trim()
                );

            if (!conceptId || !prerequisiteId) {
                continue;
            }

            if (conceptId === prerequisiteId) {
                continue;
            }

            try {
                await tx.conceptPrerequisite.create({
                    data: {
                        conceptId,
                        prerequisiteId
                    }
                });
            } catch (error) {

                // Ignore duplicate prerequisite relationships
                if (error.code !== "P2002") {
                    throw error;
                }
            }
        }

        return await tx.course.findUnique({
            where: {
                id: course.id
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
                            }
                        }
                    }
                },

                concepts: {
                    include: {
                        concept: true
                    }
                }
            }
        });
    });
};

module.exports = {
    generateCourseFromPlan
};