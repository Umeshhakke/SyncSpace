// CodeBoard/src/components/chat/ChatBox.jsx
import React, { useState, useRef, useEffect, useMemo } from "react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { MessageSquare, Minimize2 } from "lucide-react";
import "./chatbox.css";

const ChatBox = () => {
  const { roomId, username, doc } = useWorkspace(); // get shared document
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null);

  // Get or create the Yjs array for chat messages
  const chatMessages = useMemo(() => {
    if (!doc) return null;
    return doc.getArray("chatMessages");
  }, [doc]);

  // Load initial messages and listen for changes from other users
  useEffect(() => {
    if (!chatMessages) return;

    const updateMessages = () => {
      setMessages(chatMessages.toArray());
    };

    updateMessages();
    chatMessages.observe(updateMessages);

    return () => {
      chatMessages.unobserve(updateMessages);
    };
  }, [chatMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || !chatMessages) return;

    const newMsg = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
      text: trimmed,
      sender: username || "Anonymous",
      timestamp: new Date().toISOString(),
    };

    // Push to the shared Yjs array – automatically synced to all clients
    chatMessages.push([newMsg]);
    setInputValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const toggleExpand = () => setIsExpanded((prev) => !prev);

  // Wait for doc to be ready
  if (!roomId || !doc) return null;

  return (
    <div className="chatbox-wrapper">
      {!isExpanded && (
        <button className="chat-toggle-btn" onClick={toggleExpand} title="Open chat">
          <MessageSquare size={24} />
        </button>
      )}

      {isExpanded && (
        <div className="chatbox-container chatbox-light">
          <div className="chatbox-header">
            <h3>Chat</h3>
            <div className="chat-header-actions">
              <button
                className="chat-minimize-btn"
                onClick={toggleExpand}
                title="Minimize"
              >
                <Minimize2 size={18} />
              </button>
            </div>
          </div>

          <div className="chatbox-messages">
            {messages.length === 0 ? (
              <div className="chatbox-empty-state">
                <p>No messages yet. Start the conversation.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isLocal = msg.sender === username;
                return (
                  <div
                    key={msg.id}
                    className={`chat-message ${isLocal ? "message-local" : "message-remote"}`}
                  >
                    <div className="message-header">
                      <span className="message-sender">{msg.sender}</span>
                      <span className="message-timestamp">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="message-bubble">{msg.text}</div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chatbox-input-area" onSubmit={handleSend}>
            <input
              type="text"
              className="chatbox-input"
              placeholder="Type a message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              type="submit"
              className="chatbox-send-btn"
              disabled={!inputValue.trim()}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatBox;