import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import socket from "../services/socket";


const LiveLearningRoom = () => {

    const { roomId } = useParams();
    const navigate = useNavigate();

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    const peerConnectionRef = useRef(null);
    const localStreamRef = useRef(null);

    const [connected, setConnected] = useState(false);
    const [peerConnected, setPeerConnected] = useState(false);

    const [micEnabled, setMicEnabled] = useState(true);
    const [cameraEnabled, setCameraEnabled] = useState(true);

    const [status, setStatus] =
        useState("Starting camera...");

    const [error, setError] = useState("");


    // =========================================================
    // GET USER ID
    // =========================================================

    const getUserId = () => {

        const token =
            localStorage.getItem(
                "courseforge_token"
            );

        if (!token) {
            return null;
        }

        try {

            const payload =
                JSON.parse(
                    atob(
                        token.split(".")[1]
                    )
                );

            return payload.id || null;

        } catch (err) {

            console.error(
                "JWT decode error:",
                err
            );

            return null;
        }
    };


    // =========================================================
    // START LOCAL CAMERA + MICROPHONE
    // =========================================================

    const startMedia = async () => {

        try {

            setStatus(
                "Requesting camera and microphone..."
            );

            const stream =
                await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });


            localStreamRef.current =
                stream;


            if (localVideoRef.current) {

                localVideoRef.current.srcObject =
                    stream;

            }


            setConnected(true);

            setStatus(
                "Camera ready. Waiting for another learner..."
            );


            return stream;

        } catch (err) {

            console.error(
                "getUserMedia error:",
                err
            );

            setError(
                `${err.name}: ${err.message}`
            );

            setStatus(
                "Camera failed"
            );

            return null;
        }
    };


    // =========================================================
    // CREATE PEER CONNECTION
    // =========================================================

    const createPeerConnection = () => {

        if (peerConnectionRef.current) {

            return peerConnectionRef.current;

        }


        const peerConnection =
            new RTCPeerConnection({

                iceServers: [
                    {
                        urls:
                            "stun:stun.l.google.com:19302"
                    }
                ]

            });


        const stream =
            localStreamRef.current;


        if (stream) {

            stream
                .getTracks()
                .forEach(
                    track => {

                        peerConnection.addTrack(
                            track,
                            stream
                        );

                    }
                );

        }


        peerConnection.onicecandidate =
            event => {

                if (
                    event.candidate
                ) {

                    socket.emit(
                        "webrtc:ice-candidate",
                        {
                            roomId,
                            candidate:
                                event.candidate
                        }
                    );

                }

            };


        peerConnection.ontrack =
            event => {

                console.log(
                    "Remote stream received"
                );


                if (
                    remoteVideoRef.current
                ) {

                    remoteVideoRef.current.srcObject =
                        event.streams[0];

                }


                setPeerConnected(
                    true
                );

                setStatus(
                    "Connected to another learner"
                );

            };


        peerConnection.onconnectionstatechange =
            () => {

                console.log(
                    "WebRTC state:",
                    peerConnection.connectionState
                );


                if (
                    peerConnection.connectionState ===
                    "connected"
                ) {

                    setPeerConnected(true);

                    setStatus(
                        "Connected to another learner"
                    );

                }


                if (
                    peerConnection.connectionState ===
                        "disconnected" ||
                    peerConnection.connectionState ===
                        "failed" ||
                    peerConnection.connectionState ===
                        "closed"
                ) {

                    setPeerConnected(false);

                    setStatus(
                        "Learner disconnected"
                    );

                }

            };


        peerConnectionRef.current =
            peerConnection;


        return peerConnection;
    };


    // =========================================================
    // CREATE OFFER
    // =========================================================

    const createOffer = async () => {

        try {

            console.log(
                "Creating WebRTC offer..."
            );


            const peerConnection =
                createPeerConnection();


            const offer =
                await peerConnection.createOffer();


            await peerConnection.setLocalDescription(
                offer
            );


            socket.emit(
                "webrtc:offer",
                {
                    roomId,
                    offer
                }
            );


            setStatus(
                "Connecting to learner..."
            );

        } catch (err) {

            console.error(
                "Create offer error:",
                err
            );

            setError(
                err.message
            );

        }
    };


    // =========================================================
    // SOCKET + WEBRTC SETUP
    // =========================================================

    useEffect(() => {

        const userId =
            getUserId();


        if (!userId) {

            setError(
                "You must be logged in."
            );

            return;
        }


        let mounted = true;


        const initialize =
            async () => {

                /*
                 * IMPORTANT:
                 * Start camera BEFORE Socket.IO room logic.
                 */

                const stream =
                    await startMedia();


                if (
                    !stream ||
                    !mounted
                ) {
                    return;
                }


                const handleConnect =
                    () => {

                        console.log(
                            "Socket connected:",
                            socket.id
                        );


                        socket.emit(
                            "webrtc:join",
                            {
                                roomId,
                                userId
                            }
                        );

                    };


                const handleRoomJoined =
                    ({
                        peerCount
                    }) => {

                        console.log(
                            "Room joined:",
                            roomId,
                            "Peers:",
                            peerCount
                        );


                        createPeerConnection();


                        /*
                         * If another peer already exists,
                         * create the offer.
                         */

                        if (
                            peerCount > 0
                        ) {

                            setTimeout(
                                () => {
                                    createOffer();
                                },
                                500
                            );

                        }

                    };


                const handlePeerJoined =
                    () => {

                        console.log(
                            "Another learner joined"
                        );


                        setStatus(
                            "Another learner joined. Connecting..."
                        );

                    };


                const handleOffer =
                    async ({
                        offer
                    }) => {

                        try {

                            console.log(
                                "Received offer"
                            );


                            const peerConnection =
                                createPeerConnection();


                            await peerConnection.setRemoteDescription(
                                new RTCSessionDescription(
                                    offer
                                )
                            );


                            const answer =
                                await peerConnection.createAnswer();


                            await peerConnection.setLocalDescription(
                                answer
                            );


                            socket.emit(
                                "webrtc:answer",
                                {
                                    roomId,
                                    answer
                                }
                            );


                        } catch (err) {

                            console.error(
                                "Offer error:",
                                err
                            );

                            setError(
                                err.message
                            );

                        }

                    };


                const handleAnswer =
                    async ({
                        answer
                    }) => {

                        try {

                            console.log(
                                "Received answer"
                            );


                            const peerConnection =
                                peerConnectionRef.current;


                            if (
                                !peerConnection
                            ) {
                                return;
                            }


                            await peerConnection.setRemoteDescription(
                                new RTCSessionDescription(
                                    answer
                                )
                            );


                        } catch (err) {

                            console.error(
                                "Answer error:",
                                err
                            );

                            setError(
                                err.message
                            );

                        }

                    };


                const handleIceCandidate =
                    async ({
                        candidate
                    }) => {

                        try {

                            const peerConnection =
                                peerConnectionRef.current;


                            if (
                                !peerConnection ||
                                !candidate
                            ) {
                                return;
                            }


                            await peerConnection.addIceCandidate(
                                new RTCIceCandidate(
                                    candidate
                                )
                            );


                        } catch (err) {

                            console.error(
                                "ICE error:",
                                err
                            );

                        }

                    };


                const handlePeerLeft =
                    () => {

                        console.log(
                            "Peer left"
                        );


                        setPeerConnected(
                            false
                        );


                        setStatus(
                            "Waiting for another learner..."
                        );


                        if (
                            remoteVideoRef.current
                        ) {

                            remoteVideoRef.current.srcObject =
                                null;

                        }


                        if (
                            peerConnectionRef.current
                        ) {

                            peerConnectionRef.current.close();

                            peerConnectionRef.current =
                                null;

                        }

                    };


                const handleRoomFull =
                    () => {

                        setError(
                            "This learning room is already full."
                        );

                    };


                socket.on(
                    "connect",
                    handleConnect
                );

                socket.on(
                    "webrtc:room-joined",
                    handleRoomJoined
                );

                socket.on(
                    "webrtc:peer-joined",
                    handlePeerJoined
                );

                socket.on(
                    "webrtc:offer",
                    handleOffer
                );

                socket.on(
                    "webrtc:answer",
                    handleAnswer
                );

                socket.on(
                    "webrtc:ice-candidate",
                    handleIceCandidate
                );

                socket.on(
                    "webrtc:peer-left",
                    handlePeerLeft
                );

                socket.on(
                    "webrtc:room-full",
                    handleRoomFull
                );


                if (socket.connected) {

                    handleConnect();

                } else {

                    socket.connect();

                }


                /*
                 * Cleanup
                 */

                return () => {

                    socket.emit(
                        "webrtc:leave",
                        {
                            roomId
                        }
                    );


                    socket.off(
                        "connect",
                        handleConnect
                    );

                    socket.off(
                        "webrtc:room-joined",
                        handleRoomJoined
                    );

                    socket.off(
                        "webrtc:peer-joined",
                        handlePeerJoined
                    );

                    socket.off(
                        "webrtc:offer",
                        handleOffer
                    );

                    socket.off(
                        "webrtc:answer",
                        handleAnswer
                    );

                    socket.off(
                        "webrtc:ice-candidate",
                        handleIceCandidate
                    );

                    socket.off(
                        "webrtc:peer-left",
                        handlePeerLeft
                    );

                    socket.off(
                        "webrtc:room-full",
                        handleRoomFull
                    );


                    if (
                        peerConnectionRef.current
                    ) {

                        peerConnectionRef.current.close();

                        peerConnectionRef.current =
                            null;

                    }


                    if (
                        localStreamRef.current
                    ) {

                        localStreamRef.current
                            .getTracks()
                            .forEach(
                                track => {
                                    track.stop();
                                }
                            );

                        localStreamRef.current =
                            null;

                    }

                };

            };


        let cleanup;


        initialize()
            .then(
                cleanupFunction => {
                    cleanup =
                        cleanupFunction;
                }
            );


        return () => {

            mounted = false;

            if (cleanup) {
                cleanup();
            }

        };

    }, [roomId]);


    // =========================================================
    // MICROPHONE
    // =========================================================

    const toggleMicrophone = () => {

        if (
            !localStreamRef.current
        ) {
            return;
        }


        const tracks =
            localStreamRef.current
                .getAudioTracks();


        tracks.forEach(
            track => {

                track.enabled =
                    !track.enabled;

            }
        );


        setMicEnabled(
            tracks.some(
                track =>
                    track.enabled
            )
        );

    };


    // =========================================================
    // CAMERA
    // =========================================================

    const toggleCamera = () => {

        if (
            !localStreamRef.current
        ) {
            return;
        }


        const tracks =
            localStreamRef.current
                .getVideoTracks();


        tracks.forEach(
            track => {

                track.enabled =
                    !track.enabled;

            }
        );


        setCameraEnabled(
            tracks.some(
                track =>
                    track.enabled
            )
        );

    };


    // =========================================================
    // LEAVE
    // =========================================================

    const leaveRoom = () => {

        socket.emit(
            "webrtc:leave",
            {
                roomId
            }
        );


        if (
            peerConnectionRef.current
        ) {

            peerConnectionRef.current.close();

        }


        if (
            localStreamRef.current
        ) {

            localStreamRef.current
                .getTracks()
                .forEach(
                    track => {
                        track.stop();
                    }
                );

        }


        navigate(
            "/dashboard"
        );

    };


    // =========================================================
    // UI
    // =========================================================

    return (

        <div
            style={{
                minHeight: "100vh",
                background: "#111827",
                padding: "24px",
                color: "white"
            }}
        >

            <div
                style={{
                    maxWidth: "1200px",
                    margin: "0 auto"
                }}
            >

                <div
                    style={{
                        display: "flex",
                        justifyContent:
                            "space-between",
                        alignItems:
                            "center",
                        marginBottom:
                            "20px"
                    }}
                >

                    <div>

                        <h1>
                            Live Learning Room
                        </h1>

                        <p
                            style={{
                                color:
                                    "#9ca3af"
                            }}
                        >
                            Room: {roomId}
                        </p>

                    </div>


                    <div
                        style={{
                            color:
                                peerConnected
                                    ? "#22c55e"
                                    : "#9ca3af"
                        }}
                    >
                        {peerConnected
                            ? "● Peer Connected"
                            : "● Waiting for learner"}
                    </div>

                </div>


                <p
                    style={{
                        color:
                            "#d1d5db",
                        marginBottom:
                            "16px"
                    }}
                >
                    {status}
                </p>


                {error && (

                    <div
                        style={{
                            background:
                                "#7f1d1d",
                            padding:
                                "12px",
                            borderRadius:
                                "8px",
                            marginBottom:
                                "16px"
                        }}
                    >
                        {error}
                    </div>

                )}


                <div
                    style={{
                        display:
                            "grid",
                        gridTemplateColumns:
                            "1fr 1fr",
                        gap:
                            "16px"
                    }}
                >

                    <div
                        style={{
                            background:
                                "black",
                            borderRadius:
                                "12px",
                            overflow:
                                "hidden"
                        }}
                    >

                        <video
                            ref={
                                localVideoRef
                            }
                            autoPlay
                            muted
                            playsInline
                            style={{
                                width:
                                    "100%",
                                minHeight:
                                    "400px",
                                objectFit:
                                    "cover"
                            }}
                        />

                    </div>


                    <div
                        style={{
                            background:
                                "black",
                            borderRadius:
                                "12px",
                            overflow:
                                "hidden",
                            minHeight:
                                "400px",
                            position:
                                "relative"
                        }}
                    >

                        <video
                            ref={
                                remoteVideoRef
                            }
                            autoPlay
                            playsInline
                            style={{
                                width:
                                    "100%",
                                minHeight:
                                    "400px",
                                objectFit:
                                    "cover"
                            }}
                        />


                        {!peerConnected && (

                            <div
                                style={{
                                    position:
                                        "absolute",
                                    inset:
                                        0,
                                    display:
                                        "flex",
                                    alignItems:
                                        "center",
                                    justifyContent:
                                        "center",
                                    color:
                                        "#9ca3af"
                                }}
                            >
                                Waiting for another learner...
                            </div>

                        )}

                    </div>

                </div>


                <div
                    style={{
                        display:
                            "flex",
                        justifyContent:
                            "center",
                        gap:
                            "12px",
                        marginTop:
                            "20px"
                    }}
                >

                    <button
                        onClick={
                            toggleMicrophone
                        }
                    >
                        {micEnabled
                            ? "Mute Mic"
                            : "Unmute Mic"}
                    </button>


                    <button
                        onClick={
                            toggleCamera
                        }
                    >
                        {cameraEnabled
                            ? "Turn Camera Off"
                            : "Turn Camera On"}
                    </button>


                    <button
                        onClick={
                            leaveRoom
                        }
                    >
                        Leave Room
                    </button>

                </div>

            </div>

        </div>

    );

};


export default LiveLearningRoom;