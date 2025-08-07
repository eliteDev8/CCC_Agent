import React, { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../store";
import { addUserMessage, sendMessage } from "../../store/chatSlice";
import Message from "./Message";
import FileUpload from "./FileUpload";

const ChatBox: React.FC = () => {
  const dispatch = useDispatch<any>();
  const { messages, loading, error } = useSelector((state: RootState) => state.chat);
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    dispatch(addUserMessage({ from: "user", text: input }));
    dispatch(sendMessage({ text: input }));
    setInput("");
  };

  // For future: handle file uploads
  const handleFiles = (files: FileList) => {
    // TODO: handle file upload and send
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {loading && messages.length === 0 && (
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-500">Loading chat history...</div>
          </div>
        )}
        
        {error && messages.length === 0 && (
          <div className="flex items-center justify-center h-32">
            <div className="text-red-500">Error: {error}</div>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <Message key={msg.id || idx} msg={msg} />
        ))}
        <div ref={chatEndRef} />
      </div>
      <form className="p-3 bg-white rounded-xl shadow-md flex gap-2 m-4 mt-0" onSubmit={handleSend}>
        <FileUpload onFiles={handleFiles} />
        <textarea
          className="flex-1 px-4 py-2 rounded-lg border border-transparent focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none bg-gray-50 resize-none min-h-[40px] max-h-40"
          placeholder="Type your message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            } else if (e.key === "Enter" && e.shiftKey) {
              // allow newline
            }
          }}
          rows={1}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 shadow"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
};

export default ChatBox;