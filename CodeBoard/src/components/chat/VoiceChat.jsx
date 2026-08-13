// CodeBoard/src/components/chat/VoiceChat.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useWorkspace } from "../../context/WorkspaceContext";
import socketService from "../../services/socketService";
import { Mic, MicOff } from "lucide-react";
import "./voicechat.css";

const VoiceChat = () => {
  const { roomId, username } = useWorkspace();
  const [isMuted, setIsMuted] = useState(true); // true = mic off
  const [isConnecting, setIsConnecting] = useState(false);
  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef({}); // clientId -> RTCPeerConnection
  const audioElementsRef = useRef({}); // clientId -> HTMLAudioElement

  // --- Helper: get user media ---
  const getLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      return stream;
    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("Please allow microphone access to use voice chat.");
      setIsMuted(true);
      return null;
    }
  }, []);

  // --- Create a new peer connection for a remote client ---
  const createPeerConnection = useCallback(
    (remoteClientId, remoteUsername, stream) => {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      // Add local tracks to the connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketService.emit("voice:ice-candidate", {
            roomId,
            target: remoteClientId,
            candidate: event.candidate,
          });
        }
      };

      // When remote stream arrives, attach to an audio element
      pc.ontrack = (event) => {
        if (!audioElementsRef.current[remoteClientId]) {
          const audio = new Audio();
          audio.autoplay = true;
          audio.srcObject = event.streams[0];
          audioElementsRef.current[remoteClientId] = audio;
        }
      };

      return pc;
    },
    [roomId]
  );

  // --- Handle incoming signaling messages ---
  useEffect(() => {
    if (!roomId) return;

    // ---- Incoming offer ----
    const handleOffer = async ({ from, offer }) => {
      if (!localStreamRef.current) return;
      const pc = createPeerConnection(from, "", localStreamRef.current);
      peerConnectionsRef.current[from] = pc;
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketService.emit("voice:answer", { roomId, to: from, answer });
    };

    // ---- Incoming answer ----
    const handleAnswer = async ({ from, answer }) => {
      const pc = peerConnectionsRef.current[from];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    // ---- Incoming ICE candidate ----
    const handleIceCandidate = async ({ from, candidate }) => {
      const pc = peerConnectionsRef.current[from];
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn("ICE candidate add failed", e);
        }
      }
    };

    // ---- User turned on mic ----
    const handleUserMicOn = ({ clientId, username: remoteUsername }) => {
      // If we are muted, ignore
      if (isMuted) return;
      // If we already have a connection, ignore
      if (peerConnectionsRef.current[clientId]) return;

      // Initiate a call to this user
      const initCall = async () => {
        const stream = localStreamRef.current;
        if (!stream) return;
        const pc = createPeerConnection(clientId, remoteUsername, stream);
        peerConnectionsRef.current[clientId] = pc;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketService.emit("voice:offer", {
          roomId,
          to: clientId,
          offer,
        });
      };
      initCall();
    };

    // ---- User turned off mic ----
    const handleUserMicOff = ({ clientId }) => {
      // Close connection to that user
      const pc = peerConnectionsRef.current[clientId];
      if (pc) {
        pc.close();
        delete peerConnectionsRef.current[clientId];
      }
      // Remove audio element
      if (audioElementsRef.current[clientId]) {
        audioElementsRef.current[clientId].pause();
        audioElementsRef.current[clientId].srcObject = null;
        delete audioElementsRef.current[clientId];
      }
    };

    // ---- User left room ----
    const handleUserLeft = ({ clientId }) => {
      // Close connection
      const pc = peerConnectionsRef.current[clientId];
      if (pc) {
        pc.close();
        delete peerConnectionsRef.current[clientId];
      }
      if (audioElementsRef.current[clientId]) {
        audioElementsRef.current[clientId].pause();
        audioElementsRef.current[clientId].srcObject = null;
        delete audioElementsRef.current[clientId];
      }
    };

    // Register socket listeners
    socketService.on("voice:offer", handleOffer);
    socketService.on("voice:answer", handleAnswer);
    socketService.on("voice:ice-candidate", handleIceCandidate);
    socketService.on("voice:user-mic-on", handleUserMicOn);
    socketService.on("voice:user-mic-off", handleUserMicOff);
    socketService.on("user-left", handleUserLeft);

    return () => {
      socketService.off("voice:offer", handleOffer);
      socketService.off("voice:answer", handleAnswer);
      socketService.off("voice:ice-candidate", handleIceCandidate);
      socketService.off("voice:user-mic-on", handleUserMicOn);
      socketService.off("voice:user-mic-off", handleUserMicOff);
      socketService.off("user-left", handleUserLeft);
    };
  }, [roomId, isMuted, createPeerConnection]);

  // --- Toggle mic on/off ---
  const toggleMic = async () => {
    if (!roomId) return;

    if (isMuted) {
      // Turn on
      setIsConnecting(true);
      const stream = await getLocalStream();
      if (!stream) {
        setIsConnecting(false);
        return;
      }
      // Tell others we are now active
      socketService.emit("voice:mic-on", { roomId });
      setIsMuted(false);
      setIsConnecting(false);
    } else {
      // Turn off
      // Close all peer connections
      Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
      peerConnectionsRef.current = {};
      // Remove all audio elements
      Object.values(audioElementsRef.current).forEach((audio) => {
        audio.pause();
        audio.srcObject = null;
      });
      audioElementsRef.current = {};
      // Stop local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      // Notify others
      socketService.emit("voice:mic-off", { roomId });
      setIsMuted(true);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Close all connections and stop tracks
      Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
      Object.values(audioElementsRef.current).forEach((audio) => {
        audio.pause();
        audio.srcObject = null;
      });
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  if (!roomId) return null;

  return (
    <button
      className={`voice-toggle-btn ${!isMuted ? "voice-active" : ""}`}
      onClick={toggleMic}
      disabled={isConnecting}
      title={isMuted ? "Turn on microphone" : "Turn off microphone"}
    >
      {isConnecting ? "..." : isMuted ? <Mic size={24} /> : <MicOff size={24} />}
    </button>
  );
};

export default VoiceChat;