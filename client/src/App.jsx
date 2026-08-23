import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import LiveLearningRoom from "./pages/LiveLearningRoom";


function App() {

    return (

        <BrowserRouter>

            <Routes>

                <Route
                    path="/"
                    element={
                        <Navigate
                            to="/dashboard"
                            replace
                        />
                    }
                />


                <Route
                    path="/dashboard"
                    element={
                        <Dashboard />
                    }
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
                            to="/dashboard"
                            replace
                        />
                    }
                />

            </Routes>

        </BrowserRouter>

    );

}


export default App;