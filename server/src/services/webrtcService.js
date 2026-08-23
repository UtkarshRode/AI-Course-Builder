const rooms = new Map();


const getRoom = (roomId) => {

    if (!rooms.has(roomId)) {
        rooms.set(
            roomId,
            new Set()
        );
    }

    return rooms.get(roomId);
};


const removeEmptyRoom = (roomId) => {

    const room =
        rooms.get(roomId);

    if (
        room &&
        room.size === 0
    ) {
        rooms.delete(roomId);
    }

};


const setupWebRTC = (
    io,
    socket
) => {


    // =========================================================
    // JOIN ROOM
    // =========================================================

    socket.on(
        "webrtc:join",
        ({
            roomId,
            userId
        }) => {

            if (
                !roomId ||
                !userId
            ) {
                return;
            }


            const room =
                getRoom(roomId);


            /*
             * This implementation supports
             * two-person peer-to-peer sessions.
             */

            if (
                room.size >= 2 &&
                !room.has(socket.id)
            ) {

                socket.emit(
                    "webrtc:room-full"
                );

                return;
            }


            room.add(
                socket.id
            );


            socket.join(
                roomId
            );


            socket.data.webrtcRoomId =
                roomId;

            socket.data.webrtcUserId =
                userId;


            console.log(
                `WebRTC user ${userId} joined room ${roomId}`
            );


            /*
             * Tell the joining client how
             * many peers are already inside.
             */

            const peerCount =
                room.size - 1;


            socket.emit(
                "webrtc:room-joined",
                {
                    roomId,
                    peerCount
                }
            );


            /*
             * Notify existing peer.
             */

            socket
                .to(roomId)
                .emit(
                    "webrtc:peer-joined",
                    {
                        userId
                    }
                );

        }
    );


    // =========================================================
    // OFFER
    // =========================================================

    socket.on(
        "webrtc:offer",
        ({
            roomId,
            offer
        }) => {

            if (
                !roomId ||
                !offer
            ) {
                return;
            }


            console.log(
                `WebRTC offer received for room ${roomId}`
            );


            socket
                .to(roomId)
                .emit(
                    "webrtc:offer",
                    {
                        offer
                    }
                );

        }
    );


    // =========================================================
    // ANSWER
    // =========================================================

    socket.on(
        "webrtc:answer",
        ({
            roomId,
            answer
        }) => {

            if (
                !roomId ||
                !answer
            ) {
                return;
            }


            console.log(
                `WebRTC answer received for room ${roomId}`
            );


            socket
                .to(roomId)
                .emit(
                    "webrtc:answer",
                    {
                        answer
                    }
                );

        }
    );


    // =========================================================
    // ICE CANDIDATE
    // =========================================================

    socket.on(
        "webrtc:ice-candidate",
        ({
            roomId,
            candidate
        }) => {

            if (
                !roomId ||
                !candidate
            ) {
                return;
            }


            socket
                .to(roomId)
                .emit(
                    "webrtc:ice-candidate",
                    {
                        candidate
                    }
                );

        }
    );


    // =========================================================
    // LEAVE ROOM
    // =========================================================

    socket.on(
        "webrtc:leave",
        ({
            roomId
        }) => {

            leaveWebRTCRoom(
                io,
                socket,
                roomId
            );

        }
    );


    // =========================================================
    // DISCONNECT
    // =========================================================

    socket.on(
        "disconnect",
        () => {

            const roomId =
                socket.data.webrtcRoomId;


            if (roomId) {

                leaveWebRTCRoom(
                    io,
                    socket,
                    roomId
                );

            }

        }
    );

};


const leaveWebRTCRoom = (
    io,
    socket,
    roomId
) => {

    const room =
        rooms.get(roomId);


    if (!room) {
        return;
    }


    room.delete(
        socket.id
    );


    socket.leave(
        roomId
    );


    socket
        .to(roomId)
        .emit(
            "webrtc:peer-left"
        );


    socket.data.webrtcRoomId =
        null;

    socket.data.webrtcUserId =
        null;


    removeEmptyRoom(
        roomId
    );


    console.log(
        `WebRTC socket ${socket.id} left room ${roomId}`
    );

};


module.exports = {
    setupWebRTC
};