import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import LiveLearningRoom from "./pages/LiveLearningRoom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Course from "./pages/Course";
import Lesson from "./pages/Lesson";
import Assessment from "./pages/Assessment";


function App() {

    return (

        <BrowserRouter>

            <Routes>

                <Route
                    path="/"
                    element={
                        <Navigate
                            to="/login"
                            replace
                        />
                    }
                />

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />

                <Route
                    path="/dashboard"
                    element={<Dashboard />}
                />

                <Route
                    path="/course/:courseId"
                    element={<Course />}
                />

                <Route
                    path="/lesson/:lessonId"
                    element={<Lesson />}
                />

                <Route
                    path="/assessment/:assessmentId"
                    element={<Assessment />}
                />

                <Route
                    path="/live-learning/:roomId"
                    element={
                        <LiveLearningRoom />
                    }
                />

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/login"
                            replace
                        />
                    }
                />

            </Routes>

        </BrowserRouter>

    );

}


export default App;