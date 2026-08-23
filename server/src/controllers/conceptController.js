const prisma = require("../config/database");


const createConcept = async (req, res) => {
    try {
        const {
            name,
            description
        } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Concept name is required"
            });
        }

        const concept = await prisma.concept.create({
            data: {
                name: name.trim(),
                description: description || null
            }
        });

        res.status(201).json({
            success: true,
            concept
        });

    } catch (error) {

        if (error.code === "P2002") {
            return res.status(409).json({
                success: false,
                message: "Concept already exists"
            });
        }

        console.error("Create concept error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create concept"
        });
    }
};


const addPrerequisite = async (req, res) => {
    try {
        const { conceptId } = req.params;
        const { prerequisiteId } = req.body;

        if (!prerequisiteId) {
            return res.status(400).json({
                success: false,
                message: "Prerequisite concept is required"
            });
        }

        if (conceptId === prerequisiteId) {
            return res.status(400).json({
                success: false,
                message: "A concept cannot be its own prerequisite"
            });
        }

        const concept = await prisma.concept.findUnique({
            where: {
                id: conceptId
            }
        });

        const prerequisite = await prisma.concept.findUnique({
            where: {
                id: prerequisiteId
            }
        });

        if (!concept || !prerequisite) {
            return res.status(404).json({
                success: false,
                message: "Concept or prerequisite not found"
            });
        }

        const relationship =
            await prisma.conceptPrerequisite.create({
                data: {
                    conceptId,
                    prerequisiteId
                },

                include: {
                    concept: true,
                    prerequisite: true
                }
            });

        res.status(201).json({
            success: true,
            relationship
        });

    } catch (error) {

        if (error.code === "P2002") {
            return res.status(409).json({
                success: false,
                message: "Prerequisite relationship already exists"
            });
        }

        console.error("Prerequisite error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create prerequisite relationship"
        });
    }
};


const getConceptGraph = async (req, res) => {
    try {
        const concepts = await prisma.concept.findMany({
            include: {
                prerequisites: {
                    include: {
                        prerequisite: true
                    }
                },

                dependents: {
                    include: {
                        concept: true
                    }
                }
            }
        });

        res.status(200).json({
            success: true,
            concepts
        });

    } catch (error) {
        console.error("Concept graph error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch concept graph"
        });
    }
};


module.exports = {
    createConcept,
    addPrerequisite,
    getConceptGraph
};