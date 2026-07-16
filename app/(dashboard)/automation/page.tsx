'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  Zap,
  Plus,
  RefreshCw,
  Play,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Rule {
  id: string;
  name: string;
  triggerEvent: string;
  conditionOperator: string;
  conditionValue: string;
  actionType: string;
  actionTarget: string;
  isActive: boolean;
}

export default function AutomationRulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // New rule form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [ruleTrigger, setRuleTrigger] = useState('Billing Cycle Complete');
  const [ruleOperator, setRuleOperator] = useState('unpaid_days >');
  const [ruleValue, setRuleValue] = useState('30');
  const [ruleAction, setRuleAction] = useState('Suspend Connection');
  const [ruleTarget, setRuleTarget] = useState('MikroTik API Port');

  const loadRules = async () => {
    try {
      const res = await api.get('/automation/rules');
      setRules(res.data);
    } catch (err) {
      console.error('Failed to load rules:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleToggle = async (id: string) => {
    try {
      const res = await api.post(`/automation/rules/${id}/toggle`);
      setRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isActive: res.data.isActive } : r))
      );
    } catch (err) {
      alert('Failed to toggle rule');
    }
  };

  const handleTriggerSimulation = async (id: string) => {
    try {
      const res = await api.post(`/automation/rules/${id}/trigger`);
      alert(
        `Simulation Executed!\nAffected database rows: ${res.data.affectedRows}\n\nLogs:\n${res.data.logs.join(
          '\n'
        )}`
      );
    } catch (err) {
      alert('Simulation trigger failed');
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/automation/rules', {
        name: ruleName,
        trigger_event: ruleTrigger,
        condition_operator: ruleOperator,
        condition_value: ruleValue,
        action_type: ruleAction,
        action_target: ruleTarget
      });
      setShowAddModal(false);
      setRuleName('');
      loadRules();
    } catch (err) {
      alert('Failed to register automation rule');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-sm text-muted-foreground font-semibold">Loading smart automation scheduler...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Zap className="h-8 w-8 text-primary animate-pulse" />
            <span>Smart Automation Engine</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure condition-action rules: suspend defaulting subscribers, automatically assign engineer routes, or flag low inventory.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/95 shadow-sm transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>New Custom Rule</span>
        </button>
      </div>

      {/* Rules list */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center">
          <h3 className="font-bold text-base">Active Business Protocols</h3>
          <span className="text-[10px] uppercase font-bold text-slate-400">Periodic trigger intervals</span>
        </div>
        <div className="divide-y divide-border">
          {rules.map((rule) => (
            <div key={rule.id} className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs hover:bg-secondary/10 transition-colors">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{rule.name}</span>
                  <span className="px-2 py-0.5 rounded-md bg-secondary text-[10px] font-semibold text-muted-foreground">
                    {rule.triggerEvent}
                  </span>
                </div>
                <p className="text-muted-foreground font-semibold">
                  IF <span className="font-mono text-primary">{rule.conditionOperator} {rule.conditionValue}</span>
                  &nbsp;THEN <span className="font-bold text-emerald-500">{rule.actionType}</span> via {rule.actionTarget}
                </p>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <button
                  onClick={() => handleTriggerSimulation(rule.id)}
                  className="flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 hover:bg-secondary font-bold text-[10px]"
                >
                  <Play className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Test Rule</span>
                </button>
                <button onClick={() => handleToggle(rule.id)} className="text-muted-foreground hover:text-foreground">
                  {rule.isActive ? (
                    <ToggleRight className="h-8 w-8 text-primary" />
                  ) : (
                    <ToggleLeft className="h-8 w-8 text-slate-400" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Create Rule */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="fixed inset-0 z-50 bg-black" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 m-auto z-50 w-full max-w-sm h-fit bg-card border border-border rounded-[24px] p-6 shadow-2xl space-y-4">
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                <span>Configure Business Rule</span>
              </h3>
              <form onSubmit={handleCreateRule} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Rule Name *</label>
                  <input type="text" required value={ruleName} onChange={(e) => setRuleName(e.target.value)} placeholder="e.g. Defaulter auto disconnect" className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-muted-foreground">Trigger Event</label>
                    <select value={ruleTrigger} onChange={(e) => setRuleTrigger(e.target.value)} className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3 outline-none">
                      <option value="Billing Cycle Complete">Billing Complete</option>
                      <option value="Complaint Ticket Raised">Ticket Raised</option>
                      <option value="Stock deduction occurred">Stock Reduction</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-muted-foreground">Operator</label>
                    <select value={ruleOperator} onChange={(e) => setRuleOperator(e.target.value)} className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3 outline-none">
                      <option value="unpaid_days >">unpaid_days &gt;</option>
                      <option value="priority =">priority =</option>
                      <option value="quantity <">quantity &lt;</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-muted-foreground">Trigger Value *</label>
                    <input type="text" required value={ruleValue} onChange={(e) => setRuleValue(e.target.value)} className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-muted-foreground">Action Type</label>
                    <select value={ruleAction} onChange={(e) => setRuleAction(e.target.value)} className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3 outline-none">
                      <option value="Suspend Connection">Suspend Connection</option>
                      <option value="Assign Nearest Technician">Assign Route</option>
                      <option value="Notify Procurement">Procure Notify</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Action Target API / Gateway</label>
                  <input type="text" required value={ruleTarget} onChange={(e) => setRuleTarget(e.target.value)} className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3 outline-none" />
                </div>
                <button type="submit" className="w-full h-10 bg-primary text-primary-foreground font-semibold rounded-xl mt-2">Activate Automation Rule</button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
