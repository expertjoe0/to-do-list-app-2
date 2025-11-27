import React, { useState } from 'react';
import { Sparkles, Plus, X, Wand2, Zap } from 'lucide-react';
import { Button } from './Button';
import { breakdownTaskWithAI } from '../services/geminiService';
import { Priority, Task } from '../types';

interface AICreatorProps {
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export const AICreator: React.FC<AICreatorProps> = ({ onAddTask, onCancel }) => {
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [preview, setPreview] = useState<{
    refinedTitle: string;
    priority: Priority;
    subtasks: string[];
  } | null>(null);

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setIsAnalyzing(true);
    try {
      const result = await breakdownTaskWithAI(input);
      setPreview(result);
    } catch (e) {
      console.error(e);
      setPreview({
        refinedTitle: input,
        priority: Priority.MEDIUM,
        subtasks: []
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDirectAdd = () => {
    if (!input.trim()) return;
    
    onAddTask({
      text: input,
      priority: Priority.MEDIUM,
      completed: false,
      subtasks: []
    });
    onCancel();
  };

  const handleConfirm = () => {
    if (!preview) return;
    
    onAddTask({
      text: preview.refinedTitle,
      priority: preview.priority,
      completed: false,
      subtasks: preview.subtasks.map(t => ({
        id: crypto.randomUUID(),
        text: t,
        completed: false
      }))
    });
    onCancel();
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl border border-white/50 overflow-hidden w-full mb-8 animate-slide-up ring-4 ring-indigo-50/50">
      <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 p-5 flex justify-between items-center text-white relative overflow-hidden">
        {/* Decorative Circles */}
        <div className="absolute top-[-50%] left-[-10%] w-32 h-32 rounded-full bg-white/10 blur-xl"></div>
        <div className="absolute bottom-[-50%] right-[-10%] w-32 h-32 rounded-full bg-white/10 blur-xl"></div>
        
        <div className="flex items-center gap-2 relative z-10">
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight">New Task</h3>
            <p className="text-xs text-indigo-100 font-medium">Quick add or AI breakdown</p>
          </div>
        </div>
        <button 
          onClick={onCancel} 
          className="relative z-10 bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6">
        {!preview ? (
          <div className="space-y-5">
            <div>
               <label className="block text-sm font-bold text-slate-700 mb-2">
                What do you need to get done?
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleDirectAdd()}
                  placeholder="e.g., 'Buy groceries' or 'Plan vacation'"
                  className="w-full pl-5 pr-4 py-4 text-lg bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400"
                  autoFocus
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-6">
               <Button 
                variant="secondary" 
                onClick={handleDirectAdd} 
                disabled={!input.trim() || isAnalyzing}
                className="w-full h-12"
              >
                <Zap className="w-5 h-5 mr-2 text-indigo-500" />
                Quick Add
              </Button>
              
              <Button 
                variant="primary" 
                onClick={handleAnalyze} 
                isLoading={isAnalyzing} 
                disabled={!input.trim()}
                className="w-full h-12"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Break Down
              </Button>
            </div>
            
            <p className="text-center text-xs text-slate-400 mt-2 font-medium">
              Use "Break Down" for complex tasks to get AI steps & priority.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <label className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-1 block">Task Title</label>
              <input 
                value={preview.refinedTitle} 
                onChange={(e) => setPreview({...preview, refinedTitle: e.target.value})}
                className="block w-full text-xl font-bold text-slate-800 border-none bg-transparent focus:ring-0 p-0 placeholder:text-slate-300"
              />
            </div>
            
            <div>
              <label className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3 block">Priority Level</label>
              <div className="grid grid-cols-3 gap-3">
                {[Priority.LOW, Priority.MEDIUM, Priority.HIGH].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPreview({...preview, priority: p})}
                    className={`py-3 rounded-xl text-sm font-bold border-2 transition-all active:scale-95 ${
                      preview.priority === p 
                      ? p === Priority.HIGH ? 'bg-red-50 text-red-600 border-red-200' 
                        : p === Priority.MEDIUM ? 'bg-orange-50 text-orange-600 border-orange-200'
                        : 'bg-green-50 text-green-600 border-green-200'
                      : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3 block">Suggested Steps</label>
              <ul className="space-y-3">
                {preview.subtasks.map((sub, idx) => (
                  <li key={idx} className="flex items-center gap-3 group">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {idx + 1}
                    </div>
                    <input
                      value={sub}
                      onChange={(e) => {
                        const newSubs = [...preview.subtasks];
                        newSubs[idx] = e.target.value;
                        setPreview({...preview, subtasks: newSubs});
                      }}
                      className="flex-1 bg-transparent text-slate-700 font-medium border-b border-slate-200 focus:border-indigo-500 focus:outline-none py-1 transition-colors"
                    />
                    <button 
                      onClick={() => {
                         const newSubs = preview.subtasks.filter((_, i) => i !== idx);
                         setPreview({...preview, subtasks: newSubs});
                      }}
                      className="text-slate-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
               <button 
                onClick={() => setPreview({...preview, subtasks: [...preview.subtasks, "New step"]})}
                className="mt-4 w-full py-2 border-2 border-dashed border-indigo-200 rounded-xl text-indigo-500 font-bold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
               >
                 <Plus className="w-4 h-4" /> Add Step
               </button>
            </div>

            <div className="flex gap-3 pt-4">
               <Button variant="secondary" onClick={() => setPreview(null)} className="flex-1">Back</Button>
               <Button onClick={handleConfirm} className="flex-[2]">
                 <Plus className="w-5 h-5 mr-2" />
                 Add Task
               </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};