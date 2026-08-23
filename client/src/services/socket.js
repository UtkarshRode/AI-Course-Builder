import { io } from "socket.io-client";

const SOCKET_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000";

const socket = io(SOCKET_URL, {
    autoConnect: false,
    transports: ["websocket"]
});

export const connectSocket = (userId) => {

    if (!userId) {
        console.error(
            "Cannot connect socket: userId missing"
        );
        return;
    }

    if (!socket.connected) {
        socket.connect();
    }

    socket.emit(
        "join-user-room",
        userId
    );
};

export const disconnectSocket = () => {

    if (socket.connected) {
        socket.disconnect();
    }

};

export const getSocket = () => {
    return socket;
};

export default socket;