const {
    runCoursePlanner
} = require("../services/coursePlannerAgent");

const {
    generateCourseFromPlan
} = require("../services/courseGenerationService");

const {
    runLearnerAgent
} = require("../services/learnerAgent");


// =========================================================
// CREATE AI COURSE
// =========================================================

const createCoursePlan = async (
    req,
    res
) => {

    try {

        const {
            goal,
            experienceLevel,
            weeklyHours,
            durationWeeks
        } = req.body;


        if (
            !goal ||
            !experienceLevel ||
            !weeklyHours ||
            !durationWeeks
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "All course planning fields are required"
            });

        }


        console.log(
            "Generating AI course plan..."
        );


        // Step 1:
        // Ask Gemini to design the curriculum

        const plan =
            await runCoursePlanner({
                goal,
                experienceLevel,
                weeklyHours,
                durationWeeks
            });


        console.log(
            "AI course plan generated"
        );


        // Step 2:
        // Convert AI plan into database records

        const course =
            await generateCourseFromPlan(
                plan,
                req.user.id
            );


        console.log(
            "Course successfully created"
        );


        return res.status(201).json({

            success: true,

            message:
                "AI course generated successfully",

            course

        });


    } catch (error) {

        console.error(
            "AI COURSE GENERATION ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to generate course"

        });

    }

};


// =========================================================
// RUN LEARNER AGENT
// =========================================================

const runLearnerAgentController =
    async (
        req,
        res
    ) => {

        try {

            const {
                courseId
            } = req.body;


            if (!courseId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "courseId is required"

                });

            }


            console.log(
                "Starting Learner Agent..."
            );


            /*
             * Get the Socket.IO instance
             * created in server.js.
             */

            const io =
                req.app.get("io");


            /*
             * Run the agent.
             *
             * Every agent event is sent
             * to the authenticated user's
             * private Socket.IO room.
             */

            const result =
                await runLearnerAgent({

                    userId:
                        req.user.id,

                    courseId,

                    onEvent: (
                        event,
                        data = {}
                    ) => {

                        if (!io) {

                            console.error(
                                "Socket.IO instance unavailable"
                            );

                            return;

                        }


                        io
                            .to(
                                `user:${req.user.id}`
                            )
                            .emit(
                                event,
                                data
                            );

                    }

                });


            console.log(
                "Learner Agent completed successfully"
            );


            return res.status(200).json({

                success: true,

                message:
                    "Learner agent completed successfully",

                plan:
                    result.plan,

                decision:
                    result.decision

            });


        } catch (error) {

            console.error(
                "LEARNER AGENT ERROR:",
                error
            );


            /*
             * Tell the frontend that the
             * agent failed.
             */

            const io =
                req.app.get("io");


            if (io) {

                io
                    .to(
                        `user:${req.user.id}`
                    )
                    .emit(
                        "agent:error",
                        {
                            message:
                                error.message ||
                                "Failed to run learner agent"
                        }
                    );

            }


            return res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Failed to run learner agent"

            });

        }

    };


module.exports = {

    createCoursePlan,

    runLearnerAgentController

};