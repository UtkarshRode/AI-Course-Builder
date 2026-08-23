const {
    generateCoursePlan
} = require("./aiService");

const runCoursePlanner = async (input) => {

    console.log("Course Planner Agent started");

    const plan = await generateCoursePlan(input);

    console.log("Course Planner Agent completed");

    return plan;
};

module.exports = {
    runCoursePlanner
};