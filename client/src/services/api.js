import axios from "axios";

const api = axios.create({
    baseURL:
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`
});

console.log(
    "API BASE URL:",
    api.defaults.baseURL
);

api.interceptors.request.use((config) => {

    const token =
        localStorage.getItem("courseforge_token");

    if (token) {

        config.headers.Authorization =
            `Bearer ${token}`;

    }

    return config;

});


export default api;