'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  FolderOpen,
  Plus,
  RefreshCw,
  Search,
  BookOpen,
  Bot,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
}

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // Form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [artTitle, setArtTitle] = useState('');
  const [artContent, setArtContent] = useState('');
  const [artCategory, setArtCategory] = useState('Router Manuals');

  const loadData = async () => {
    try {
      const res = await api.get('/ai-knowledge/articles');
      setArticles(res.data);
    } catch (err) {
      console.error('Failed to load KB:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setAiAnswer('');
      loadData();
      return;
    }
    setIsSearching(true);
    try {
      const res = await api.get(`/ai-knowledge/search?q=${encodeURIComponent(searchQuery)}`);
      setAiAnswer(res.data.reply);
      setArticles(res.data.results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/ai-knowledge/articles', {
        title: artTitle,
        content: artContent,
        category: artCategory
      });
      setShowAddModal(false);
      setArtTitle('');
      setArtContent('');
      loadData();
    } catch (err) {
      alert('Failed to save document');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-sm text-muted-foreground font-semibold">Syncing knowledge base index...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <span>Corporate Knowledge Base SOPs</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Store and retrieve troubleshooting guides, OLT configuration procedures, company workflows, and network policies.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/95 shadow-sm transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Publish Article</span>
        </button>
      </div>

      {/* Search and AI answers */}
      <div className="space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ask AI or search: 'defaulting suspension', 'optical loss checklist', router model manuals..."
            className="flex-1 h-12 px-4 rounded-xl border border-border bg-card outline-none text-xs md:text-sm shadow-sm"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="h-12 px-6 bg-secondary hover:bg-secondary-hover text-foreground font-semibold rounded-xl flex items-center gap-2 border border-border shadow-sm"
          >
            {isSearching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            <span>Ask / Search</span>
          </button>
        </form>

        {aiAnswer && (
          <div className="bg-primary/5 border border-primary/20 p-5 rounded-2xl space-y-2.5">
            <h4 className="font-extrabold text-sm flex items-center gap-1 text-primary">
              <Bot className="h-5 w-5 animate-pulse" />
              <span>AI Search Synthesis</span>
            </h4>
            <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line font-medium">
              {aiAnswer}
            </p>
          </div>
        )}
      </div>

      {/* Grid: Category segments */}
      <div className="grid gap-6 sm:grid-cols-2">
        {articles.map((art) => (
          <div key={art.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-1.5">
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                {art.category}
              </span>
              <h4 className="font-bold text-base text-slate-800 dark:text-slate-100">{art.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                {art.content}
              </p>
            </div>
            <div className="border-t border-border/30 pt-2 text-[10px] text-slate-400 font-bold uppercase flex justify-between">
              <span>Doc Ref: {art.id}</span>
              <span>Updated: {art.createdAt}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Publish Article */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="fixed inset-0 z-50 bg-black" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 m-auto z-50 w-full max-w-sm h-fit bg-card border border-border rounded-[24px] p-6 shadow-2xl space-y-4">
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <span>Publish KB SOP Article</span>
              </h3>
              <form onSubmit={handleCreateArticle} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Document Title *</label>
                  <input type="text" required value={artTitle} onChange={(e) => setArtTitle(e.target.value)} placeholder="e.g. Huawei ONT setup" className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Category</label>
                  <select value={artCategory} onChange={(e) => setArtCategory(e.target.value)} className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3 outline-none">
                    <option value="Router Manuals">Router Manuals</option>
                    <option value="Troubleshooting Guides">Troubleshooting SOPs</option>
                    <option value="Company Policies">Company Policies</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Article Contents *</label>
                  <textarea rows={4} required value={artContent} onChange={(e) => setArtContent(e.target.value)} placeholder="Provide detailed procedures..." className="w-full rounded-xl border border-border p-3 outline-none bg-secondary/30" />
                </div>
                <button type="submit" className="w-full h-10 bg-primary text-primary-foreground font-semibold rounded-xl mt-2">Publish Guide</button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
