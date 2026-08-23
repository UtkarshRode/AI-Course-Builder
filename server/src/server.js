const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const courseRoutes = require("./routes/courseRoutes");
const contentRoutes = require("./routes/contentRoutes");
const conceptRoutes = require("./routes/conceptRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const aiRoutes = require("./routes/aiRoutes");
const adaptiveRoutes = require("./routes/adaptiveRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");
const progressRoutes = require("./routes/progressRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const {
    setupWebRTC
} = require("./services/webrtcService");


const app = express();

const server = http.createServer(app);

const PORT =
    process.env.PORT || 5000;

const CLIENT_URL =
    process.env.CLIENT_URL ||
    "http://localhost:5173";


// =========================================================
// MIDDLEWARE
// =========================================================

app.use(
    cors({
        origin: CLIENT_URL,
        credentials: true
    })
);

app.use(
    express.json()
);


// =========================================================
// SOCKET.IO
// =========================================================

const io = new Server(
    server,
    {
        cors: {
    origin: CLIENT_URL,
    methods: [
        "GET",
        "POST"
    ],
    credentials: true
}
    }
);


io.on(
    "connection",
    (socket) => {

        console.log(
            "Socket connected:",
            socket.id
        );


        // =================================================
        // USER ROOM
        // =================================================

        socket.on(
            "join-user-room",
            (userId) => {

                if (!userId) {
                    return;
                }


                const room =
                    `user:${userId}`;


                socket.join(
                    room
                );


                console.log(
                    `Socket ${socket.id} joined ${room}`
                );

            }
        );


        // =================================================
        // WEBRTC SIGNALING
        // =================================================

        setupWebRTC(
            io,
            socket
        );


        // =================================================
        // DISCONNECT
        // =================================================

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


// Make Socket.IO available to
// Express controllers.
app.set(
    "io",
    io
);


// =========================================================
// HEALTH CHECK
// =========================================================

app.get(
    "/api/health",
    (req, res) => {

        res.status(200).json({

            success: true,

            message:
                "CourseForge AI server is running"

        });

    }
);


// =========================================================
// API ROUTES
// =========================================================

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/courses",
    courseRoutes
);

app.use(
    "/api/content",
    contentRoutes
);

app.use(
    "/api/concepts",
    conceptRoutes
);

app.use(
    "/api/enrollments",
    enrollmentRoutes
);

app.use(
    "/api/ai",
    aiRoutes
);

app.use(
    "/api/adaptive",
    adaptiveRoutes
);

app.use(
    "/api/assessments",
    assessmentRoutes
);

app.use(
    "/api/progress",
    progressRoutes
);

app.use(
    "/api/dashboard",
    dashboardRoutes
);


// =========================================================
// 404 HANDLER
// =========================================================

app.use(
    (req, res) => {

        res.status(404).json({

            success: false,

            message:
                `Route ${req.method} ${req.originalUrl} not found`

        });

    }
);


// =========================================================
// GLOBAL ERROR HANDLER
// =========================================================

app.use(
    (
        err,
        req,
        res,
        next
    ) => {

        console.error(
            "Server error:",
            err
        );


        res.status(500).json({

            success: false,

            message:
                "Internal server error"

        });

    }
);


// =========================================================
// START SERVER
// =========================================================

server.listen(
    PORT,
    () => {

        console.log(
            `CourseForge AI server running on port ${PORT}`
        );

    }
);