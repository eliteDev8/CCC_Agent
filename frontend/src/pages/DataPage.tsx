import React, { useEffect, useState, useRef, useMemo } from "react";
import api from "../api/client";
import axios from "axios";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import {
  FiUpload, FiTrash2, FiEdit2, FiDownload, FiFile, FiX, FiCheck,
  FiImage, FiFileText, FiUser, FiLoader, FiRefreshCw
} from "react-icons/fi";

interface FileItem {
  id: number;
  filename: string;
  filetype: string;
  gdrive_id: string;
  file_size?: number;
  created_at?: string;
  owner?: string;
}

function formatSize(bytes?: number) {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getFileIcon(file: FileItem) {
  const ext = file.filename.split('.').pop()?.toLowerCase();
  if (file.filetype.startsWith('image/')) return <FiImage color="#60a5fa" size={20} />;
  if (file.filetype === 'application/pdf' || ext === 'pdf') return <FiFile color="#f87171" size={20} />;
  if (['doc', 'docx'].includes(ext || '')) return <FiFileText color="#2563eb" size={20} />;
  if (['xls', 'xlsx'].includes(ext || '')) return <FiFileText color="#22c55e" size={20} />;
  if (['zip', 'rar', '7z'].includes(ext || '')) return <FiFile color="#f59e42" size={20} />;
  if (file.filetype.startsWith('text/') || ["txt", "md", "csv"].includes(ext || "")) return <FiFileText color="#a78bfa" size={20} />;
  return <FiFile color="#6b7280" size={20} />;
}

const typeFilters = [
  { label: "All", value: "" },
  { label: "Images", value: "image/" },
  { label: "PDF", value: "application/pdf" },
  { label: "Text", value: "text/" },
];

const PAGE_SIZE = 10;

const Toast: React.FC<{ message: string; type?: 'success' | 'error'; onClose: () => void }> = ({ message, type = 'success', onClose }) => (
  <div className={`fixed top-6 right-6 z-50 px-4 py-2 rounded shadow-lg text-white ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
    role="alert">
    <div className="flex items-center gap-2">
      {type === 'success' ? <FiCheck /> : <FiX />}<span>{message}</span>
      <button className="ml-2 text-white/70 hover:text-white" onClick={onClose}><FiX /></button>
    </div>
  </div>
);

const Spinner: React.FC = () => (
  <div className="fixed inset-0 z-40 flex items-center justify-center bg-opacity-0">
    <FiLoader className="animate-spin text-blue-600" size={48} />
  </div>
);

const DataPage: React.FC = () => {
  const user = useSelector((state: RootState) => state.user.user);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "size" | "date">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);
  // Add per-file upload status state with explicit type
  interface UploadStatus {
    file: File;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
    progress?: number; // 0-100
  }
  const [uploadQueue, setUploadQueue] = useState<UploadStatus[]>([]);
  const [pageSize, setPageSize] = useState(10);

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/media/list");
      setFiles(res.data);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Failed to fetch files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") fetchFiles();
    // eslint-disable-next-line
  }, [user]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Update handleUpload for multi-file upload and per-file status
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const filesArr = Array.from(e.target.files);
    setUploadQueue(q => [
      ...q,
      ...filesArr.map(f => ({ file: f, status: 'pending' as const, progress: 0 }))
    ]);
    for (const file of filesArr) {
      setUploadQueue(q => q.map(u => u.file === file ? { ...u, status: 'uploading', progress: 0 } : u));
      const formData = new FormData();
      formData.append("files", file);
      try {
        await api.post("/media/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const percent = progressEvent.total ? Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0;
            setUploadQueue(q => q.map(u => u.file === file ? { ...u, progress: percent } : u));
          },
        });
        setUploadQueue(q => q.map(u => u.file === file ? { ...u, status: 'success', progress: 100 } : u));
        fetchFiles(); // Refresh file list
      } catch (err: any) {
        setUploadQueue(q => q.map(u => u.file === file ? { ...u, status: 'error', error: err?.response?.data?.detail || 'Upload failed' } : u));
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDismissUpload = (file: File) => {
    setUploadQueue(q => q.filter(u => u.file !== file));
  };
  const handleRetryUpload = async (file: File) => {
    setUploadQueue(q => q.map(u => u.file === file ? { ...u, status: 'pending', error: undefined, progress: 0 } : u));
    // Re-run upload for this file only
    setUploadQueue(q => [
      ...q,
    ]);
    const formData = new FormData();
    formData.append("files", file);
    try {
      await api.post("/media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percent = progressEvent.total ? Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0;
          setUploadQueue(q => q.map(u => u.file === file ? { ...u, progress: percent } : u));
        },
      });
      setUploadQueue(q => q.map(u => u.file === file ? { ...u, status: 'success', progress: 100 } : u));
      fetchFiles();
    } catch (err: any) {
      setUploadQueue(q => q.map(u => u.file === file ? { ...u, status: 'error', error: err?.response?.data?.detail || 'Upload failed' } : u));
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/media/delete/${id}`);
      setFiles(files => files.filter(f => f.id !== id));
      setSelected(selected => selected.filter(sid => sid !== id));
      showToast("File deleted", "success");
    } catch (e: any) {
      setError(e.response?.data?.detail || "Delete failed");
      showToast(e.response?.data?.detail || "Delete failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm("Are you sure you want to delete the selected files?")) return;
    setLoading(true);
    setError(null);
    try {
      await Promise.all(selected.map(id => api.delete(`/media/delete/${id}`)));
      setFiles(files => files.filter(f => !selected.includes(f.id)));
      setSelected([]);
      showToast("Files deleted", "success");
    } catch (e: any) {
      setError(e.response?.data?.detail || "Bulk delete failed");
      showToast(e.response?.data?.detail || "Bulk delete failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDownload = async () => {
    setLoading(true);
    try {
      for (const id of selected) {
        const file = files.find(f => f.id === id);
        if (file) await handleDownload(file.id, file.filename);
      }
      showToast("Files downloaded", "success");
    } catch (e: any) {
      showToast("Bulk download failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRename = async (id: number) => {
    if (!renameValue.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await api.put(`/media/rename/${id}?new_name=${encodeURIComponent(renameValue)}`);
      setFiles(files => files.map(f => f.id === id ? { ...f, filename: renameValue } : f));
      setRenamingId(null);
      setRenameValue("");
      showToast("File renamed", "success");
    } catch (e: any) {
      setError(e.response?.data?.detail || "Rename failed");
      showToast(e.response?.data?.detail || "Rename failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id: number, filename: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/media/download/${id}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      showToast("File downloaded", "success");
    } catch (e: any) {
      setError(e.response?.data?.detail || "Download failed");
      showToast(e.response?.data?.detail || "Download failed", "error");
    } finally {
      setLoading(false);
    }
  };

  // Filter, search, and sort files
  const filteredFiles = useMemo(() => {
    let result = files;
    if (typeFilter) {
      result = result.filter(f => f.filetype.startsWith(typeFilter));
    }
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      result = result.filter(f => f.filename.toLowerCase().includes(s) || f.filetype.toLowerCase().includes(s));
    }
    result = [...result].sort((a, b) => {
      if (sortBy === "name") {
        return sortDir === "asc"
          ? a.filename.localeCompare(b.filename)
          : b.filename.localeCompare(a.filename);
      }
      if (sortBy === "size") {
        return sortDir === "asc"
          ? (a.file_size || 0) - (b.file_size || 0)
          : (b.file_size || 0) - (a.file_size || 0);
      }
      if (sortBy === "date") {
        return sortDir === "asc"
          ? new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
          : new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
      return 0;
    });
    return result;
  }, [files, search, typeFilter, sortBy, sortDir]);

  // Pagination
  const pageCount = Math.ceil(filteredFiles.length / pageSize);
  const pagedFiles = filteredFiles.slice((page - 1) * pageSize, page * pageSize);
  const allSelected = pagedFiles.length > 0 && pagedFiles.every(f => selected.includes(f.id));

  const toggleSelect = (id: number) => {
    setSelected(sel => sel.includes(id) ? sel.filter(sid => sid !== id) : [...sel, id]);
  };
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(sel => sel.filter(id => !pagedFiles.some(f => f.id === id)));
    } else {
      setSelected(sel => [...sel, ...pagedFiles.filter(f => !sel.includes(f.id)).map(f => f.id)]);
    }
  };

  // Auto-remove successful uploads per file after 2s
  const timersRef = React.useRef<{ [key: string]: ReturnType<typeof setTimeout> }>({});
  React.useEffect(() => {
    uploadQueue.forEach(u => {
      if (u.status === 'success' && !timersRef.current[u.file.name]) {
        timersRef.current[u.file.name] = setTimeout(() => {
          setUploadQueue(q => q.filter(x => x.file !== u.file));
          delete timersRef.current[u.file.name];
        }, 2000);
      }
    });
    // Cleanup on unmount
    return () => {
      Object.values(timersRef.current).forEach(clearTimeout);
      timersRef.current = {};
    };
  }, [uploadQueue]);

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <FiX color="#f87171" size={48} />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-4">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-0 md:p-8 bg-gray-50">
      {/* Header and Controls Row */}
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-6">
        <div className="flex flex-wrap gap-2 items-center mt-2 md:mt-0">
          <div className="relative">
            <input
              type="text"
              className="pl-10 pr-3 py-2 rounded-full border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 min-w-[200px]"
              placeholder="Search files..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <span className="absolute left-3 top-2.5 text-gray-400">
              <FiFile size={16} />
            </span>
          </div>
          {typeFilters.map(f => (
            <button
              key={f.label}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition
                ${typeFilter === f.value ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"}`}
              onClick={() => setTypeFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              onChange={handleUpload}
              disabled={uploading}
              multiple
            />
            <span className="bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 flex items-center gap-2 font-semibold shadow">
              <FiUpload /> {uploading ? "Uploading..." : "Upload"}
            </span>
          </label>
        </div>
      </div>
      {/* Bulk Actions Row */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleSelectAll}
        />
        <span className="text-sm">Select All</span>
        <button
          className="px-4 py-2 rounded-lg bg-red-100 text-red-700 font-semibold disabled:opacity-50"
          disabled={selected.length === 0}
          onClick={handleBulkDelete}
        >
          Bulk Delete
        </button>
        <button
          className="px-4 py-2 rounded-lg bg-blue-100 text-blue-700 font-semibold disabled:opacity-50"
          disabled={selected.length === 0}
          onClick={handleBulkDownload}
        >
          Bulk Download
        </button>
        {selected.length > 0 && <span className="ml-2 text-xs text-gray-500">{selected.length} selected</span>}
      </div>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {/* 1. Add total record count above the table */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-500">{filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''} found</span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Show</span>
          <div className="relative">
            <select
              className="appearance-none pl-4 pr-8 py-2 rounded-full border border-gray-300 bg-white text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
            >
              {[1,10, 25, 50, 100].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              ▼
            </span>
          </div>
          <span className="text-sm text-gray-500">per page</span>
        </div>
      </div>
      {uploadQueue.length > 0 && (
        <div className="mt-2 bg-white rounded-lg shadow p-4 max-w-lg max-h-[100px] overflow-y-auto">
          {uploadQueue.map((u, i) => (
            <div key={i} className="flex items-center gap-3 text-xs py-1 border-b last:border-b-0 border-gray-100">
              <span className="truncate max-w-xs flex-1">{u.file.name}</span>
              {/* Status icon */}
              {u.status === 'pending' && <span className="text-gray-400"><FiLoader size={16} /></span>}
              {u.status === 'uploading' && <span className="text-blue-500"><FiLoader size={16} /></span>}
              {u.status === 'success' && <FiCheck size={16} />}
              {u.status === 'error' && <FiX size={16} />}
              {/* Progress bar */}
              {(u.status === 'uploading' || u.status === 'pending') && (
                <div className="w-24 h-2 bg-gray-200 rounded overflow-hidden">
                  <div className="h-2 bg-blue-500" style={{ width: `${u.progress || 0}%` }} />
                </div>
              )}
              {/* Error message and retry */}
              {u.status === 'error' && (
                <>
                  <span className="text-red-500 ml-2">{u.error || 'Error'}</span>
                  <button className="ml-2 text-blue-600 hover:underline" onClick={() => handleRetryUpload(u.file)}><FiRefreshCw size={14} /> Retry</button>
                </>
              )}
              {/* Dismiss button for completed uploads */}
              {(u.status === 'success' || u.status === 'error') && (
                <button className="ml-2 text-gray-400 hover:text-gray-700" onClick={() => handleDismissUpload(u.file)} title="Dismiss"><FiX size={14} /></button>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="overflow-x-auto bg-white rounded-2xl shadow border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-white rounded-t-2xl border-b border-gray-200">
            <tr className="text-gray-700">
              <th className="p-4 text-left rounded-tl-2xl">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  aria-label="Select all files"
                />
              </th>
              <th className="p-4 text-left cursor-pointer font-semibold" onClick={() => { setSortBy("name"); setSortDir(sortBy === "name" && sortDir === "asc" ? "desc" : "asc"); }}>
                Filename {sortBy === "name" && (sortDir === "asc" ? "▲" : "▼")}
              </th>
              <th className="p-4 text-left font-semibold">Type</th>
              <th className="p-4 text-left cursor-pointer font-semibold min-w-[100px]" onClick={() => { setSortBy("size"); setSortDir(sortBy === "size" && sortDir === "asc" ? "desc" : "asc"); }}>
                Size {sortBy === "size" && (sortDir === "asc" ? "▲" : "▼")}
              </th>
              <th className="p-4 text-left cursor-pointer font-semibold" onClick={() => { setSortBy("date"); setSortDir(sortBy === "date" && sortDir === "asc" ? "desc" : "asc"); }}>
                Date {sortBy === "date" && (sortDir === "asc" ? "▲" : "▼")}
              </th>
              <th className="p-4 text-left font-semibold">Owner</th>
              <th className="p-4 text-left rounded-tr-2xl font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-gray-400">
                  <span className="inline-flex items-center gap-2">
                    <span className="animate-spin"><FiLoader color="#60a5fa" size={20} /></span> Loading...
                  </span>
                </td>
              </tr>
            ) : pagedFiles.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-gray-400">
                  <span className="inline-flex flex-col items-center gap-2">
                    <FiFile color="#a3a3a3" size={32} />
                    <span>No files found. Try uploading or changing your filters.</span>
                  </span>
                </td>
              </tr>
            ) : pagedFiles.map(file => (
              <tr key={file.id} className="border-b last:border-b-0 border-gray-100 bg-white hover:bg-gray-50 transition">
                {/* Checkbox */}
                <td className="p-4 align-middle">
                  <input
                    type="checkbox"
                    checked={selected.includes(file.id)}
                    onChange={() => toggleSelect(file.id)}
                    aria-label="Select file"
                  />
                </td>
                {/* Filename with icon and rename */}
                <td className="p-4 align-middle">
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 text-xl">
                      {getFileIcon(file)}
                    </span>
                    <div className="flex flex-col">
                      {renamingId === file.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            className="border rounded px-2 py-1 text-sm"
                            value={renameValue}
                            onChange={e => setRenameValue(e.target.value)}
                            autoFocus
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleRename(file.id);
                              if (e.key === 'Escape') setRenamingId(null);
                            }}
                          />
                          <button className="text-green-600" onClick={() => handleRename(file.id)} title="Save"><FiCheck /></button>
                          <button className="text-gray-400" onClick={() => setRenamingId(null)} title="Cancel"><FiX /></button>
                        </div>
                      ) : (
                        <span className="font-medium text-gray-900 truncate" title={file.filename}>{file.filename || '-'}</span>
                      )}
                      <span className="text-xs text-gray-400">{formatSize(file.file_size)}</span>
                    </div>
                  </div>
                </td>
                {/* Type badge */}
                <td className="p-4 align-middle">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                    {file.filetype.split('/')[1]?.toUpperCase() || file.filetype}
                  </span>
                </td>
                {/* Size */}
                <td className="p-4 align-middle">
                  <span className="text-gray-700 font-medium">{formatSize(file.file_size) || '-'}</span>
                </td>
                {/* Date */}
                <td className="p-4 align-middle whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500"><FiFileText color="#6b7280" size={18} /></span>
                    <span className="text-gray-900 font-medium">{formatDate(file.created_at)}</span>
                  </div>
                </td>
                {/* Owner with avatar */}
                <td className="p-4 align-middle">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      <FiUser color="#9ca3af" size={18} />
                    </span>
                    <span className="truncate max-w-[120px] font-medium text-gray-900" title={file.owner || '-'}>{file.owner || '-'}</span>
                  </div>
                </td>
                {/* Actions */}
                <td className="p-4 align-middle">
                  <div className="flex gap-2">
                    <button
                      className="p-2 rounded-full hover:bg-blue-50 text-blue-600"
                      onClick={() => handleDownload(file.id, file.filename)}
                      title="Download"
                    >
                      <FiDownload />
                    </button>
                    <button
                      className="p-2 rounded-full hover:bg-yellow-50 text-yellow-600"
                      onClick={() => { setRenamingId(file.id); setRenameValue(file.filename); }}
                      title="Rename"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      className="p-2 rounded-full hover:bg-red-50 text-red-600"
                      onClick={() => handleDelete(file.id)}
                      title="Delete"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Modern Pagination */}
      <div className="flex justify-center items-center gap-3 mt-6">
        <button
          className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 font-medium disabled:opacity-50"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Prev
        </button>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={pageCount}
            value={page}
            onChange={e => {
              let val = Number(e.target.value);
              if (isNaN(val)) val = 1;
              if (val < 1) val = 1;
              if (val > pageCount) val = pageCount;
              setPage(val);
            }}
            className="w-14 text-center border border-gray-300 rounded-lg py-2 px-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm font-medium"
          />
          <span className="text-gray-500 text-sm">/ {pageCount}</span>
        </div>
        <button
          className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 font-medium disabled:opacity-50"
          disabled={page === pageCount || pageCount === 0}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default DataPage; 