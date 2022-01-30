// check if functionality exists
function hasGetUserMedia() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}
if (hasGetUserMedia()) {
} else {
    alert("getUserMedia() is not supported by your browser");
}



// WebRTC Setup

const ws = new WebSocket("ws://localhost:9000")

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

pc.onicecandidate = ({ candidate }) => ws.send({ candidate });

pc.onnegotiationneeded = async () => {
    try {
        data = await pc.setLocalDescription(await pc.createOffer());
        console.log({ data: pc.localDescription });
        ws.send(JSON.stringify({ data: pc.localDescription }));
    } catch (err) {
        console.error(err);
    }
}

pc.ontrack = (event) => {
    // Don't set srcObject again if it is already set.
    if (remoteVideo.srcObject) return;
    remoteVideo.srcObject = event.streams[0];
};

// Call start() to initiate.
async function start() {
    try {
        // Get local stream, show it in self-view, and add it to be sent.
        const stream =
            await navigator.mediaDevices.getUserMedia(constraints);
        stream.getTracks().forEach((track) =>
            pc.addTrack(track, stream));
        localVideo.srcObject = stream;
    } catch (err) {
        console.error(err);
    }
}

ws.onmessage = async ({ data, candidate }) => {
    try {
        if (data) {
            data = JSON.parse(data)
            data = data['data']
            // If you get an offer, you need to reply with an answer.
            if (data.type === 'offer') {
                await pc.setRemoteDescription(data);
                const stream =
                    await navigator.mediaDevices.getUserMedia(constraints);
                stream.getTracks().forEach((track) =>
                    pc.addTrack(track, stream));
                await pc.setLocalDescription(await pc.createAnswer());
                console.log({ data: pc.localDescription });
                ws.send(JSON.stringify({ data: pc.localDescription }));
            } else if (data.type === 'answer') {
                await pc.setRemoteDescription(data);
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

start()