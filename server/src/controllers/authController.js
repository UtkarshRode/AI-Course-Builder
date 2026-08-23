const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/database");

const COURSE_ID =
    "8258941d-dfc6-422c-b2ea-ea6378b6eacd";

const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );
};

const register = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            experienceLevel,
            weeklyHours,
            learningGoal,
            preferredDifficulty,
            targetDate
        } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, email and password are required"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 8 characters"
            });
        }

        const normalizedEmail =
            email.toLowerCase().trim();

        const existingUser =
            await prisma.user.findUnique({
                where: {
                    email: normalizedEmail
                }
            });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message:
                    "An account with this email already exists"
            });
        }

        const passwordHash =
            await bcrypt.hash(password, 12);

        /*
         * Create the user and enrollment together.
         * If either operation fails, neither is committed.
         */

        const user = await prisma.$transaction(
            async (tx) => {

                const createdUser =
                    await tx.user.create({
                        data: {
                            name: name.trim(),
                            email: normalizedEmail,
                            passwordHash,

                            profile: {
                                create: {
                                    experienceLevel:
                                        experienceLevel ||
                                        "BEGINNER",

                                    weeklyHours:
                                        weeklyHours
                                            ? Number(
                                                  weeklyHours
                                              )
                                            : null,

                                    learningGoal:
                                        learningGoal ||
                                        null,

                                    preferredDifficulty:
                                        preferredDifficulty ||
                                        null,

                                    targetDate:
                                        targetDate
                                            ? new Date(
                                                  targetDate
                                              )
                                            : null
                                }
                            }
                        },

                        include: {
                            profile: true
                        }
                    });

                /*
                 * Automatically enroll the new learner
                 * in the CourseForge course used by Dashboard.
                 */

                await tx.enrollment.create({
                    data: {
                        userId: createdUser.id,
                        courseId: COURSE_ID,
                        status: "ACTIVE"
                    }
                });

                return createdUser;
            }
        );

        const token =
            generateToken(user);

        return res.status(201).json({
            success: true,
            message:
                "Account created successfully",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                profile: user.profile
            }
        });

    } catch (error) {

        console.error(
            "Registration error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Something went wrong while creating the account"
        });
    }
};


const login = async (req, res) => {
    try {

        const {
            email,
            password
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message:
                    "Email and password are required"
            });
        }

        const normalizedEmail =
            email.toLowerCase().trim();

        const user =
            await prisma.user.findUnique({
                where: {
                    email: normalizedEmail
                },
                include: {
                    profile: true
                }
            });

        if (!user) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password"
            });
        }

        const passwordMatches =
            await bcrypt.compare(
                password,
                user.passwordHash
            );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password"
            });
        }

        const token =
            generateToken(user);

        return res.status(200).json({
            success: true,
            message:
                "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                profile: user.profile
            }
        });

    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Something went wrong while logging in"
        });
    }
};


const getMe = async (req, res) => {
    try {

        const user =
            await prisma.user.findUnique({
                where: {
                    id: req.user.id
                },
                include: {
                    profile: true
                },
                omit: {
                    passwordHash: true
                }
            });

        if (!user) {
            return res.status(404).json({
                success: false,
                message:
                    "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            user
        });

    } catch (error) {

        console.error(
            "Get user error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to fetch user"
        });
    }
};


module.exports = {
    register,
    login,
    getMe
};