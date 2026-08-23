require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const { setupWebRTC } = require("./services/webrtcService");

const authRoutes = require("./routes/authRoutes");
const courseRoutes = require("./routes/courseRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const progressRoutes = require("./routes/progressRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");
const adaptiveRoutes = require("./routes/adaptiveRoutes");
const aiRoutes = require("./routes/aiRoutes");
const conceptRoutes = require("./routes/conceptRoutes");
const contentRoutes = require("./routes/contentRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

const CLIENT_URL =
    process.env.CLIENT_URL || "http://localhost:5173";

/*
 * =========================================================
 * ALLOWED FRONTEND ORIGINS
 * =========================================================
 *
 * CLIENT_URL handles the main production URL.
 *
 * The regex also allows Vercel deployment URLs such as:
 *
 * https://ai-course-builder-xxxxx-utkarsh-rode.vercel.app
 *
 * This prevents CORS from breaking every time Vercel
 * creates a new deployment URL.
 */

const vercelOriginRegex =
    /^https:\/\/ai-course-builder-[a-z0-9]+-utkarsh-rode\.vercel\.app$/;


const isAllowedOrigin = (origin) => {

    if (!origin) {
        return true;
    }

    if (origin === CLIENT_URL) {
        return true;
    }

    if (
        vercelOriginRegex.test(origin)
    ) {
        return true;
    }

    return false;

};


/*
 * =========================================================
 * CORS
 * =========================================================
 */

app.use(
    cors({
        origin: (origin, callback) => {

            if (
                isAllowedOrigin(origin)
            ) {

                callback(
                    null,
                    true
                );

            } else {

                callback(
                    new Error(
                        `CORS blocked origin: ${origin}`
                    )
                );

            }

        },

        credentials: true
    })
);


/*
 * =========================================================
 * BODY PARSER
 * =========================================================
 */

app.use(
    express.json()
);

app.use(
    express.urlencoded({
        extended: true
    })
);


/*
 * =========================================================
 * HEALTH CHECK
 * =========================================================
 */

app.get(
    "/",
    (req, res) => {

        res.json({
            message:
                "CourseForge AI API is running"
        });

    }
);

app.get(
    "/api/health",
    (req, res) => {

        res.json({
            status: "ok"
        });

    }
);


/*
 * =========================================================
 * API ROUTES
 * =========================================================
 */

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/courses",
    courseRoutes
);

app.use(
    "/api/enrollments",
    enrollmentRoutes
);

app.use(
    "/api/progress",
    progressRoutes
);

app.use(
    "/api/assessments",
    assessmentRoutes
);

app.use(
    "/api/adaptive",
    adaptiveRoutes
);

app.use(
    "/api/ai",
    aiRoutes
);

app.use(
    "/api/concepts",
    conceptRoutes
);

app.use(
    "/api/content",
    contentRoutes
);

app.use(
    "/api/dashboard",
    dashboardRoutes
);


/*
 * =========================================================
 * SOCKET.IO
 * =========================================================
 */

const io = new Server(
    server,
    {
        cors: {
            origin: (origin, callback) => {

                if (
                    isAllowedOrigin(origin)
                ) {

                    callback(
                        null,
                        true
                    );

                } else {

                    callback(
                        new Error(
                            `Socket CORS blocked origin: ${origin}`
                        )
                    );

                }

            },

            methods: [
                "GET",
                "POST"
            ],

            credentials: true
        }
    }
);


/*
 * =========================================================
 * WEBRTC
 * =========================================================
 */

io.on(
    "connection",
    (socket) => {

        console.log(
            "Socket connected:",
            socket.id
        );

        setupWebRTC(
            io,
            socket
        );

        socket.on(
            "disconnect",
            () => {

                console.log(
                    "Socket disconnected:",
                    socket.id
                );

            }
        );

    }
);


/*
 * =========================================================
 * ERROR HANDLER
 * =========================================================
 */

app.use(
    (err, req, res, next) => {

        console.error(
            "Server error:",
            err
        );

        res.status(
            err.status || 500
        ).json({
            message:
                err.message ||
                "Internal server error"
        });

    }
);


/*
 * =========================================================
 * START SERVER
 * =========================================================
 */

server.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `CourseForge AI server running on port ${PORT}`
        );

        console.log(
            `Allowed frontend URL: ${CLIENT_URL}`
        );

    }
);