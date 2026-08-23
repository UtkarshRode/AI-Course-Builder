const bcrypt = require("bcryptjs");
const prisma = require("../src/config/database");

const COURSE_ID =
    "8258941d-dfc6-422c-b2ea-ea6378b6eacd";

async function main() {
    console.log("Creating CourseForge course...");

    // Find an existing user to act as the course creator.
    let creator = await prisma.user.findFirst({
        orderBy: {
            createdAt: "asc"
        }
    });

    // If the database has no users, create a system creator.
    if (!creator) {
        const passwordHash = await bcrypt.hash(
            "CourseForgeSystem123!",
            12
        );

        creator = await prisma.user.create({
            data: {
                name: "CourseForge Admin",
                email: "courseforge-admin@system.local",
                passwordHash,
                role: "ADMIN"
            }
        });

        console.log(
            "Created system creator:",
            creator.id
        );
    }

    const course = await prisma.course.upsert({
        where: {
            id: COURSE_ID
        },

        update: {
            title: "CourseForge AI",
            description:
                "Personalized AI-powered learning course",
            status: "PUBLISHED",
            difficulty: "BEGINNER",
            estimatedHours: 10
        },

        create: {
            id: COURSE_ID,
            title: "CourseForge AI",
            description:
                "Personalized AI-powered learning course",
            status: "PUBLISHED",
            difficulty: "BEGINNER",
            estimatedHours: 10,
            creatorId: creator.id
        }
    });

    console.log("Course created/found successfully:");
    console.log(course);

    console.log("DONE");
}

main()
    .catch((error) => {
        console.error("SEED ERROR:");
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });