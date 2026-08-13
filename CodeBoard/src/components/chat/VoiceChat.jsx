// CodeBoard/src/components/chat/VoiceChat.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useWorkspace } from "../../context/WorkspaceContext";
import socketService from "../../services/socketService";
import { Mic, MicOff } from "lucide-react";
import "./voicechat.css";

const VoiceChat = () => {
  const { roomId, username, doc } = useWorkspace(); // get shared doc
  const [isMuted, setIsMuted] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef({}); // clientId -> RTCPeerConnection
  const audioElementsRef = useRef({}); // clientId -> HTMLAudioElement
  const mySocketIdRef = useRef(null); // store our socket id

  // Get the Yjs map for active voice users
  const voiceMap = doc?.getMap("voiceActiveUsers");

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

  // --- Create audio element for a remote peer ---
  const createAudioElement = (clientId) => {
    if (audioElementsRef.current[clientId]) {
      return audioElementsRef.current[clientId];
    }
    const audio = new Audio();
    audio.autoplay = true;
    audioElementsRef.current[clientId] = audio;
    return audio;
  };

  // --- Create a new peer connection for a remote client ---
  const createPeerConnection = useCallback(
    (remoteClientId, remoteUsername, stream) => {
      const audio = createAudioElement(remoteClientId);

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketService.emit("voice:ice-candidate", {
            roomId,
            target: remoteClientId,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        audio.srcObject = event.streams[0];
        audio.play().catch((e) => console.warn("Audio play failed:", e));
      };

      return pc;
    },
    [roomId]
  );

  // --- Initiate a call to a remote user ---
  const callUser = useCallback(
    async (remoteClientId, remoteUsername) => {
      if (peerConnectionsRef.current[remoteClientId]) return;
      const stream = localStreamRef.current;
      if (!stream) return;

      const pc = createPeerConnection(remoteClientId, remoteUsername, stream);
      peerConnectionsRef.current[remoteClientId] = pc;
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketService.emit("voice:offer", {
          roomId,
          to: remoteClientId,
          offer,
        });
      } catch (err) {
        console.error("Error creating offer:", err);
      }
    },
    [roomId, createPeerConnection]
  );

  // --- Connect to all active users in the Yjs map ---
  const connectToActiveUsers = useCallback(() => {
    if (!voiceMap) return;
    const entries = Array.from(voiceMap.entries());
    for (const [clientId, data] of entries) {
      if (clientId === mySocketIdRef.current) continue; // skip self
      callUser(clientId, data.username);
    }
  }, [voiceMap, callUser]);

  // --- Observe Yjs map for changes ---
  useEffect(() => {
    if (!voiceMap || !mySocketIdRef.current) return;

    const handleMapChange = () => {
      const activeIds = new Set(voiceMap.keys());
      // Remove connections for users who turned off mic
      for (const [clientId, pc] of Object.entries(peerConnectionsRef.current)) {
        if (!activeIds.has(clientId)) {
          pc.close();
          delete peerConnectionsRef.current[clientId];
          if (audioElementsRef.current[clientId]) {
            audioElementsRef.current[clientId].pause();
            audioElementsRef.current[clientId].srcObject = null;
            delete audioElementsRef.current[clientId];
          }
        }
      }
      // Connect to newly active users (if we are unmuted)
      if (!isMuted && localStreamRef.current) {
        for (const [clientId, data] of voiceMap.entries()) {
          if (clientId === mySocketIdRef.current) continue;
          if (!peerConnectionsRef.current[clientId]) {
            callUser(clientId, data.username);
          }
        }
      }
    };

    handleMapChange(); // initial sync
    voiceMap.observe(handleMapChange);
    return () => voiceMap.unobserve(handleMapChange);
  }, [voiceMap, isMuted, callUser]);

  // --- Handle incoming signaling (offer, answer, ICE) ---
  useEffect(() => {
    if (!roomId) return;

    const handleOffer = async ({ from, offer }) => {
      if (isMuted || !localStreamRef.current) return;
      if (peerConnectionsRef.current[from]) return;

      const pc = createPeerConnection(from, "", localStreamRef.current);
      peerConnectionsRef.current[from] = pc;
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketService.emit("voice:answer", { roomId, to: from, answer });
    };

    const handleAnswer = async ({ from, answer }) => {
      const pc = peerConnectionsRef.current[from];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

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

    socketService.on("voice:offer", handleOffer);
    socketService.on("voice:answer", handleAnswer);
    socketService.on("voice:ice-candidate", handleIceCandidate);

    return () => {
      socketService.off("voice:offer", handleOffer);
      socketService.off("voice:answer", handleAnswer);
      socketService.off("voice:ice-candidate", handleIceCandidate);
    };
  }, [roomId, isMuted, createPeerConnection]);

  // --- Toggle mic on/off ---
  const toggleMic = async () => {
    if (!roomId || !voiceMap) return;

    if (isMuted) {
      // Turn on
      setIsConnecting(true);
      const stream = await getLocalStream();
      if (!stream) {
        setIsConnecting(false);
        return;
      }

      // Store socket id (we need it once)
      if (!mySocketIdRef.current) {
        mySocketIdRef.current = socketService.socket?.id;
        if (!mySocketIdRef.current) {
          alert("Socket not connected yet.");
          setIsConnecting(false);
          return;
        }
      }

      // Add ourselves to the Yjs map
      voiceMap.set(mySocketIdRef.current, { username, timestamp: Date.now() });

      setIsMuted(false);
      setIsConnecting(false);

      // Connect to all currently active users (including those who were already on)
      connectToActiveUsers();
    } else {
      // Turn off
      // Remove ourselves from Yjs map
      if (mySocketIdRef.current) {
        voiceMap.delete(mySocketIdRef.current);
      }

      // Close all connections
      Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
      peerConnectionsRef.current = {};
      Object.values(audioElementsRef.current).forEach((audio) => {
        audio.pause();
        audio.srcObject = null;
      });
      audioElementsRef.current = {};

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }

      setIsMuted(true);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (voiceMap && mySocketIdRef.current) {
        voiceMap.delete(mySocketIdRef.current);
      }
      Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
      Object.values(audioElementsRef.current).forEach((audio) => {
        audio.pause();
        audio.srcObject = null;
      });
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [voiceMap]);

  if (!roomId || !voiceMap) return null;

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