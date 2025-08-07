import React from "react";
import { FiPaperclip } from "react-icons/fi";

const FileUpload: React.FC<{ onFiles: (files: FileList) => void }> = ({ onFiles }) => (
  <label className="cursor-pointer flex items-center">
    <span className="text-blue-600 hover:bg-blue-50 rounded-full p-2 transition">
      <FiPaperclip size={20} />
    </span>
    <input
      type="file"
      className="hidden"
      multiple
      onChange={e => e.target.files && onFiles(e.target.files)}
    />
  </label>
);

export default FileUpload; 