// check if functionality exists
function hasGetUserMedia() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}
if (hasGetUserMedia()) {
} else {
    alert("getUserMedia() is not supported by your browser");
}



// WebRTC Setup

const ws = new WebSocket("ws://localhost:8000/ws")

const constraints = {
    video: true,
    audio: true
};

const configuration = {
    iceServers: [
        {
            urls: ['stun:stun1.l.google.com:19302'],
        }
    ],
    iceCandidatePoolSize: 10,
}

let pc = new RTCPeerConnection(configuration);
let localStream = null;
let remoteStream = null;

// Setup event listeners

pc.onicecandidate = ({ candidate }) => ws.emit({ candidate });

pc.onnegotiationneeded = async () => {
    try {
        await pc.setLocalDescription(await pc.createOffer());
        ws.send({ desc: pc.localDescription });
    } catch (err) {
        console.error(err);
    }
}

pc.ontrack = (event) => {
    // Don't set srcObject again if it is already set.
    if (remoteStream.srcObject) return;
    remoteStream.srcObject = event.streams[0];
};

// Call start() to initiate.
async function start() {
    try {
        // Get local stream, show it in self-view, and add it to be sent.
        const stream =
            await navigator.mediaDevices.getUserMedia(constraints);
        stream.getTracks().forEach((track) =>
            pc.addTrack(track, stream));
        localStream.srcObject = stream;
    } catch (err) {
        console.error(err);
    }
}

ws.onmessage = async ({ desc, candidate }) => {
    try {
        if (desc) {
            // If you get an offer, you need to reply with an answer.
            if (desc.type === 'offer') {
                await pc.setRemoteDescription(desc);
                const stream =
                    await navigator.mediaDevices.getUserMedia(constraints);
                stream.getTracks().forEach((track) =>
                    pc.addTrack(track, stream));
                await pc.setLocalDescription(await pc.createAnswer());
                ws.send({ desc: pc.localDescription });
            } else if (desc.type === 'answer') {
                await pc.setRemoteDescription(desc);
            } else {
                console.log('Unsupported SDP type.');
            }
        } else if (candidate) {
            await pc.addIceCandidate(candidate);
        }
    } catch (err) {
        console.error(err);
    }
};