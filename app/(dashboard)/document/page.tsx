'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  FolderOpen,
  Plus,
  RefreshCw,
  FileCode,
  Download,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Document {
  id: string;
  title: string;
  category: string;
  version: string;
  uploadedBy: string;
  uploadedAt: string;
  url: string;
}

export default function DocumentPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState('Agreements');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const res = await api.get('/document/');
      setDocuments(res.data);
    } catch (err) {
      console.error('Failed to load documents list:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    try {
      await api.post(`/document/upload?title=${encodeURIComponent(docTitle)}&category=${encodeURIComponent(docCategory)}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowUploadModal(false);
      setDocTitle('');
      setSelectedFile(null);
      loadData();
    } catch (err) {
      alert('Upload failed');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-sm text-muted-foreground font-semibold">Opening documents cabinet...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            <FolderOpen className="h-8 w-8 text-primary" />
            <span>Document Repository Console</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Store and retrieve critical legal customer SLA agreements, network installation audits, and hardware supplier purchase bills.
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/95 shadow-sm transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Documents List */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center">
          <h3 className="font-bold text-base">Archived Corporate Assets</h3>
          <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded">
            {documents.length} Files Tracked
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="bg-slate-500/5 text-xs text-muted-foreground border-b border-border font-bold uppercase">
                <th className="p-4">Document Title</th>
                <th className="p-4">Category</th>
                <th className="p-4 text-center">Version</th>
                <th className="p-4">Uploaded By</th>
                <th className="p-4 text-right">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {documents.map((d) => (
                <tr key={d.id} className="hover:bg-secondary/10">
                  <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{d.title}</td>
                  <td className="p-4 font-semibold">{d.category}</td>
                  <td className="p-4 text-center font-mono font-bold text-indigo-500 text-xs">{d.version}</td>
                  <td className="p-4">
                    <span className="font-semibold block">{d.uploadedBy}</span>
                    <span className="text-[10px] text-slate-500 block">{d.uploadedAt}</span>
                  </td>
                  <td className="p-4 text-right">
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Upload Document */}
      <AnimatePresence>
        {showUploadModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={() => setShowUploadModal(false)} className="fixed inset-0 z-50 bg-black" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 m-auto z-50 w-full max-w-sm h-fit bg-card border border-border rounded-[24px] p-6 shadow-2xl space-y-4">
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                <span>Upload Corporate Document</span>
              </h3>
              <form onSubmit={handleUpload} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Document Title *</label>
                  <input type="text" required value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="e.g. SLA Clifton Sector 4" className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Category</label>
                  <select value={docCategory} onChange={(e) => setDocCategory(e.target.value)} className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3 outline-none">
                    <option value="Agreements">Agreements / SLAs</option>
                    <option value="Reports">Technician Reports</option>
                    <option value="Bills">Supplier Bills</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Choose File *</label>
                  <input type="file" required onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="h-10 w-full rounded-xl border border-border bg-secondary/30 p-2 text-xs outline-none" />
                </div>
                <button type="submit" className="w-full h-10 bg-primary text-primary-foreground font-semibold rounded-xl mt-2">Upload File</button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
