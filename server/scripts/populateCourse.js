require("dotenv").config();

const prisma = require("../src/config/database");
const { generateCoursePlan } = require("../src/services/aiService");

const COURSE_ID =
    "8258941d-dfc6-422c-b2ea-ea6378b6eacd";

async function main() {
    console.log("Checking course...");

    const course = await prisma.course.findUnique({
        where: {
            id: COURSE_ID
        }
    });

    if (!course) {
        throw new Error(
            `Course ${COURSE_ID} does not exist`
        );
    }

    console.log(
        `Found course: ${course.title}`
    );

    const existingModules =
        await prisma.module.count({
            where: {
                courseId: COURSE_ID
            }
        });

    if (existingModules > 0) {
        console.log(
            "Course already has modules."
        );
        return;
    }

    console.log(
        "Generating course plan with Gemini..."
    );

    const plan = await generateCoursePlan({
        goal:
            "Learn software engineering and modern web development with CourseForge AI",

        experienceLevel:
            "BEGINNER",

        weeklyHours: 10,

        durationWeeks: 8
    });

    console.log(
        `Generated ${plan.modules.length} modules`
    );

    /*
     * ==========================================
     * 1. CREATE / REUSE CONCEPTS
     * ==========================================
     */

    const conceptMap = new Map();
    const conceptNames = new Set();

    for (const module of plan.modules) {
        for (const lesson of module.lessons) {
            for (const concept of lesson.concepts) {
                conceptNames.add(
                    concept.trim()
                );
            }
        }
    }

    for (const relationship of plan.prerequisites) {
        conceptNames.add(
            relationship.concept.trim()
        );

        conceptNames.add(
            relationship.prerequisite.trim()
        );
    }

    console.log(
        `Creating ${conceptNames.size} concepts...`
    );

    for (const conceptName of conceptNames) {
        const concept =
            await prisma.concept.upsert({
                where: {
                    name: conceptName
                },

                update: {},

                create: {
                    name: conceptName,

                    description:
                        `Concept included in ${course.title}`
                }
            });

        conceptMap.set(
            conceptName,
            concept.id
        );

        await prisma.courseConcept.upsert({
            where: {
                courseId_conceptId: {
                    courseId: COURSE_ID,
                    conceptId: concept.id
                }
            },

            update: {},

            create: {
                courseId: COURSE_ID,
                conceptId: concept.id
            }
        });
    }

    console.log("Concepts created.");

    /*
     * ==========================================
     * 2. CREATE MODULES + LESSONS
     * ==========================================
     */

    let moduleCount = 0;
    let lessonCount = 0;

    for (const moduleData of plan.modules) {
        console.log(
            `Creating module ${moduleData.position}: ${moduleData.title}`
        );

        const module =
            await prisma.module.create({
                data: {
                    title:
                        moduleData.title,

                    description:
                        moduleData.description,

                    position:
                        moduleData.position,

                    courseId:
                        COURSE_ID
                }
            });

        moduleCount++;

        for (
            const lessonData of
            moduleData.lessons
        ) {
            console.log(
                `  Creating lesson ${lessonData.position}: ${lessonData.title}`
            );

            const lesson =
                await prisma.lesson.create({
                    data: {
                        title:
                            lessonData.title,

                        description:
                            lessonData.description,

                        content:
                            lessonData.objective,

                        position:
                            lessonData.position,

                        type:
                            "THEORY",

                        estimatedMinutes:
                            lessonData.estimatedMinutes,

                        moduleId:
                            module.id
                    }
                });

            lessonCount++;

            /*
             * Connect lesson concepts
             */

            for (
                const conceptName of
                lessonData.concepts
            ) {
                const conceptId =
                    conceptMap.get(
                        conceptName.trim()
                    );

                if (!conceptId) {
                    continue;
                }

                await prisma.lessonConcept.create({
                    data: {
                        lessonId:
                            lesson.id,

                        conceptId
                    }
                });
            }
        }
    }

    /*
     * ==========================================
     * 3. CREATE PREREQUISITES
     * ==========================================
     */

    console.log(
        "Creating prerequisite relationships..."
    );

    let prerequisiteCount = 0;

    for (
        const relationship of
        plan.prerequisites
    ) {
        const conceptId =
            conceptMap.get(
                relationship.concept.trim()
            );

        const prerequisiteId =
            conceptMap.get(
                relationship.prerequisite.trim()
            );

        if (
            !conceptId ||
            !prerequisiteId ||
            conceptId === prerequisiteId
        ) {
            continue;
        }

        try {
            await prisma.conceptPrerequisite.create({
                data: {
                    conceptId,
                    prerequisiteId
                }
            });

            prerequisiteCount++;

        } catch (error) {
            /*
             * Ignore duplicate relationships.
             */

            if (error.code !== "P2002") {
                throw error;
            }
        }
    }

    console.log("");
    console.log("==============================");
    console.log("COURSE POPULATION COMPLETE");
    console.log("==============================");
    console.log(
        `Modules: ${moduleCount}`
    );
    console.log(
        `Lessons: ${lessonCount}`
    );
    console.log(
        `Prerequisites: ${prerequisiteCount}`
    );
    console.log("==============================");
}

main()
    .catch((error) => {
        console.error("");
        console.error(
            "COURSE POPULATION ERROR:"
        );
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });