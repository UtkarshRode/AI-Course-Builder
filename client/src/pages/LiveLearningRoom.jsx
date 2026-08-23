import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import socket from "../services/socket";


const LiveLearningRoom = () => {

    const { roomId } = useParams();

    const navigate = useNavigate();


    const localVideoRef =
        useRef(null);

    const remoteVideoRef =
        useRef(null);

    const peerConnectionRef =
        useRef(null);

    const localStreamRef =
        useRef(null);


    const [connected, setConnected] =
        useState(false);

    const [micEnabled, setMicEnabled] =
        useState(true);

    const [cameraEnabled, setCameraEnabled] =
        useState(true);

    const [peerConnected, setPeerConnected] =
        useState(false);

    const [error, setError] =
        useState("");


    /*
     * =========================================================
     * GET USER ID FROM JWT
     * =========================================================
     */

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


    /*
     * =========================================================
     * CREATE PEER CONNECTION
     * =========================================================
     */

    const createPeerConnection = () => {

        const peerConnection =
            new RTCPeerConnection({

                iceServers: [
                    {
                        urls:
                            "stun:stun.l.google.com:19302"
                    }
                ]

            });


        peerConnection.onicecandidate =
            (event) => {

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
            (event) => {

                if (
                    remoteVideoRef.current
                ) {

                    remoteVideoRef.current.srcObject =
                        event.streams[0];

                }

                setPeerConnected(
                    true
                );

            };


        peerConnection.onconnectionstatechange =
            () => {

                const state =
                    peerConnection.connectionState;

                console.log(
                    "WebRTC connection:",
                    state
                );


                if (
                    state ===
                    "connected"
                ) {

                    setPeerConnected(
                        true
                    );

                }


                if (
                    state ===
                    "disconnected" ||
                    state ===
                    "failed" ||
                    state ===
                    "closed"
                ) {

                    setPeerConnected(
                        false
                    );

                }

            };


        peerConnectionRef.current =
            peerConnection;


        return peerConnection;

    };


    /*
     * =========================================================
     * CREATE OFFER
     * =========================================================
     */

    const createOffer = async () => {

        try {

            const peerConnection =
                peerConnectionRef.current;


            if (!peerConnection) {
                return;
            }


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

        } catch (err) {

            console.error(
                "Offer error:",
                err
            );

            setError(
                "Failed to create WebRTC offer."
            );

        }

    };


    /*
     * =========================================================
     * START CAMERA + MICROPHONE
     * =========================================================
     */

    const startMedia = async () => {

        try {

            const stream =
                await navigator.mediaDevices.getUserMedia(
                    {
                        video: true,
                        audio: true
                    }
                );


            localStreamRef.current =
                stream;


            if (
                localVideoRef.current
            ) {

                localVideoRef.current.srcObject =
                    stream;

            }


            const peerConnection =
                createPeerConnection();


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


            setConnected(
                true
            );

        } catch (err) {

            console.error(
                "Media error:",
                err
            );

            setError(
                "Camera or microphone permission was denied."
            );

        }

    };


    /*
     * =========================================================
     * JOIN WEBRTC ROOM
     * =========================================================
     */

    useEffect(() => {

        const userId =
            getUserId();


        if (!userId) {

            setError(
                "You must be logged in."
            );

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
            async ({
                peerCount
            }) => {

                console.log(
                    "Joined WebRTC room:",
                    roomId,
                    peerCount
                );


                /*
                 * Start local media first.
                 */

                await startMedia();


                /*
                 * If another peer already exists,
                 * this user becomes the offerer.
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
                    "Peer joined the room."
                );

            };


        const handleOffer =
            async ({
                offer
            }) => {

                try {

                    console.log(
                        "Received WebRTC offer"
                    );


                    const peerConnection =
                        peerConnectionRef.current ||
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
                        "Offer handling error:",
                        err
                    );

                    setError(
                        "Failed to handle WebRTC offer."
                    );

                }

            };


        const handleAnswer =
            async ({
                answer
            }) => {

                try {

                    console.log(
                        "Received WebRTC answer"
                    );


                    const peerConnection =
                        peerConnectionRef.current;


                    if (!peerConnection) {
                        return;
                    }


                    await peerConnection.setRemoteDescription(
                        new RTCSessionDescription(
                            answer
                        )
                    );

                } catch (err) {

                    console.error(
                        "Answer handling error:",
                        err
                    );

                    setError(
                        "Failed to handle WebRTC answer."
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
                        "ICE candidate error:",
                        err
                    );

                }

            };


        const handlePeerLeft =
            () => {

                setPeerConnected(
                    false
                );


                if (
                    remoteVideoRef.current
                ) {

                    remoteVideoRef.current.srcObject =
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


            if (
                peerConnectionRef.current
            ) {

                peerConnectionRef.current.close();

            }

        };

    }, [roomId]);


    /*
     * =========================================================
     * TOGGLE MICROPHONE
     * =========================================================
     */

    const toggleMicrophone = () => {

        if (
            !localStreamRef.current
        ) {
            return;
        }


        const audioTracks =
            localStreamRef.current
                .getAudioTracks();


        audioTracks.forEach(
            track => {

                track.enabled =
                    !track.enabled;

            }
        );


        setMicEnabled(
            audioTracks.some(
                track =>
                    track.enabled
            )
        );

    };


    /*
     * =========================================================
     * TOGGLE CAMERA
     * =========================================================
     */

    const toggleCamera = () => {

        if (
            !localStreamRef.current
        ) {
            return;
        }


        const videoTracks =
            localStreamRef.current
                .getVideoTracks();


        videoTracks.forEach(
            track => {

                track.enabled =
                    !track.enabled;

            }
        );


        setCameraEnabled(
            videoTracks.some(
                track =>
                    track.enabled
            )
        );

    };


    /*
     * =========================================================
     * LEAVE ROOM
     * =========================================================
     */

    const leaveRoom = () => {

        socket.emit(
            "webrtc:leave",
            {
                roomId
            }
        );


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


        if (
            peerConnectionRef.current
        ) {

            peerConnectionRef.current.close();

        }


        navigate(
            "/dashboard"
        );

    };


    /*
     * =========================================================
     * RENDER
     * =========================================================
     */

    return (

        <div
            style={{
                minHeight: "100vh",
                padding: "24px",
                background: "#111827"
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
                        alignItems: "center",
                        marginBottom: "20px"
                    }}
                >

                    <div>

                        <h1
                            style={{
                                color: "white"
                            }}
                        >
                            Live Learning Room
                        </h1>

                        <p
                            style={{
                                color: "#9ca3af",
                                marginTop: "6px"
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


                {error && (

                    <div
                        style={{
                            padding: "12px",
                            marginBottom: "16px",
                            background: "#7f1d1d",
                            color: "white",
                            borderRadius: "8px"
                        }}
                    >
                        {error}
                    </div>

                )}


                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "1fr 1fr",
                        gap: "16px"
                    }}
                >

                    {/* LOCAL VIDEO */}

                    <div
                        style={{
                            position: "relative",
                            background: "black",
                            borderRadius: "12px",
                            overflow: "hidden",
                            minHeight: "400px"
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
                                width: "100%",
                                height: "100%",
                                minHeight: "400px",
                                objectFit: "cover"
                            }}
                        />

                        <div
                            style={{
                                position: "absolute",
                                bottom: "12px",
                                left: "12px",
                                color: "white",
                                background:
                                    "rgba(0,0,0,0.6)",
                                padding:
                                    "6px 10px",
                                borderRadius:
                                    "6px"
                            }}
                        >
                            You
                        </div>

                    </div>


                    {/* REMOTE VIDEO */}

                    <div
                        style={{
                            position: "relative",
                            background: "black",
                            borderRadius: "12px",
                            overflow: "hidden",
                            minHeight: "400px"
                        }}
                    >

                        <video
                            ref={
                                remoteVideoRef
                            }
                            autoPlay
                            playsInline
                            style={{
                                width: "100%",
                                height: "100%",
                                minHeight: "400px",
                                objectFit: "cover"
                            }}
                        />


                        {!peerConnected && (

                            <div
                                style={{
                                    position:
                                        "absolute",
                                    inset: 0,
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


                {/* CONTROLS */}

                <div
                    style={{
                        display: "flex",
                        justifyContent:
                            "center",
                        gap: "12px",
                        marginTop: "20px"
                    }}
                >

                    <button
                        onClick={
                            toggleMicrophone
                        }
                        style={{
                            padding:
                                "12px 18px",
                            border: "none",
                            borderRadius:
                                "8px",
                            cursor: "pointer"
                        }}
                    >
                        {micEnabled
                            ? "Mute Mic"
                            : "Unmute Mic"}
                    </button>


                    <button
                        onClick={
                            toggleCamera
                        }
                        style={{
                            padding:
                                "12px 18px",
                            border: "none",
                            borderRadius:
                                "8px",
                            cursor: "pointer"
                        }}
                    >
                        {cameraEnabled
                            ? "Turn Camera Off"
                            : "Turn Camera On"}
                    </button>


                    <button
                        onClick={
                            leaveRoom
                        }
                        style={{
                            padding:
                                "12px 18px",
                            border: "none",
                            borderRadius:
                                "8px",
                            cursor: "pointer"
                        }}
                    >
                        Leave Room
                    </button>

                </div>

            </div>

        </div>

    );

};


export default LiveLearningRoom;