import React from "react";
import ReactMarkdown from "react-markdown";
import type { ChatMessage } from "../../store/chatSlice";

const Message: React.FC<{ msg: ChatMessage }> = ({ msg }) => (
  <div className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
    <div className={`max-w-xl p-4 rounded-lg shadow ${msg.from === "user" ? "bg-blue-500 text-white" : "bg-white text-gray-900"}`}>
      {msg.text && (
        <div className="mb-2 whitespace-pre-line">
          <ReactMarkdown>{msg.text}</ReactMarkdown>
        </div>
      )}
      {msg.media && (
        <div className="space-y-2">
          {msg.media.map((m, i) => (
            <div key={i}>
              {m.type === "image" && (
                <img src={m.url} alt={m.filename} className="w-32 h-32 object-cover rounded border" />
              )}
              {m.type === "audio" && (
                <audio controls src={m.url} className="w-full mt-2" />
              )}
              {m.type === "doc" && (
                <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{m.filename}</a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

export default Message;