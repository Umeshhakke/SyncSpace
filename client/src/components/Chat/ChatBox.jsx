import React, { useState, useRef, useEffect } from "react";
import "./chatbox.css";

const ChatBox = ({ username, isDarkMode, roomId }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    const trimmedMessage = inputValue.trim();
    if (!trimmedMessage) return;

    const newMessage = {
      id: Date.now().toString(),
      text: trimmedMessage,
      sender: username || "Anonymous",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isLocal: true,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  // Do not render if not in a room
  if (!roomId) return null;

  return (
    <div className={`chatbox-container ${isDarkMode ? "chatbox-dark" : "chatbox-light"}`}>
      <div className="chatbox-header">
        <h3>Chat</h3>
      </div>
      
      <div className="chatbox-messages">
        {messages.length === 0 ? (
          <div className="chatbox-empty-state">
            <p>No messages yet. Start the conversation.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`chat-message ${msg.isLocal ? "message-local" : "message-remote"}`}
            >
              <div className="message-header">
                <span className="message-sender">{msg.sender}</span>
                <span className="message-timestamp">{msg.timestamp}</span>
              </div>
              <div className="message-bubble">
                {msg.text}
              </div>
            </div>
          ))
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
  );
};

export default ChatBox;
