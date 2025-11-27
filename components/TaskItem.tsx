import React, { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Trash2, Calendar } from 'lucide-react';
import { Task, Priority } from '../types';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete, onToggleSubtask }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const completedSubtasks = task.subtasks.filter(t => t.completed).length;
  const totalSubtasks = task.subtasks.length;
  const progress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const priorityConfig = {
    [Priority.HIGH]: { color: 'border-l-red-500', bg: 'bg-red-50', text: 'text-red-700', icon: '🔥' },
    [Priority.MEDIUM]: { color: 'border-l-orange-500', bg: 'bg-orange-50', text: 'text-orange-700', icon: '⚡' },
    [Priority.LOW]: { color: 'border-l-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: '☕' },
  }[task.priority];

  const handleMainToggle = () => {
    // If it's already completed, just toggle back immediately (restoring it)
    if (task.completed) {
      onToggle(task.id);
      return;
    }

    // If completing, show visual feedback first, then call onToggle to make it disappear
    setIsToggling(true);
    setTimeout(() => {
      onToggle(task.id);
      setIsToggling(false);
    }, 600); // 600ms delay to let the animation play and user to feel satisfaction
  };

  const isVisuallyCompleted = task.completed || isToggling;

  return (
    <div className={`group relative bg-white rounded-2xl border-0 shadow-sm hover:shadow-lg transition-all duration-500 overflow-hidden animate-slide-up ${isVisuallyCompleted ? 'opacity-50 grayscale-[0.5] scale-[0.98]' : ''}`}>
      {/* Colored Priority Strip */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${priorityConfig.color}`}></div>

      <div className="p-4 pl-5 flex items-start gap-4">
        {/* Main Checkbox - Large and Satisfying */}
        <button
          onClick={handleMainToggle}
          disabled={isToggling}
          className={`mt-0.5 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 flex-shrink-0 active:scale-90 ${
            isVisuallyCompleted
              ? 'bg-gradient-to-br from-indigo-500 to-violet-600 border-transparent text-white shadow-indigo-500/30 shadow-md scale-105'
              : 'border-slate-300 hover:border-indigo-400 bg-slate-50 text-transparent'
          }`}
        >
          <Check className={`w-4 h-4 ${isVisuallyCompleted ? 'animate-bounce-short' : ''}`} strokeWidth={3.5} />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0" onClick={() => totalSubtasks > 0 && setIsExpanded(!isExpanded)}>
          <div className="flex justify-between items-start gap-2">
            <h3 className={`text-lg font-bold text-slate-800 break-words leading-tight transition-all ${isVisuallyCompleted ? 'line-through text-slate-400 decoration-slate-300 decoration-2' : ''}`}>
              {task.text}
            </h3>
          </div>
          
          <div className="mt-2 flex flex-wrap items-center gap-3">
             <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${priorityConfig.bg} ${priorityConfig.text}`}>
              <span>{priorityConfig.icon}</span>
              {task.priority}
            </span>

            <span className="flex items-center gap-1 text-xs font-semibold text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(task.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>

           {totalSubtasks > 0 && (
             <div className="mt-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
                   <span>{completedSubtasks}/{totalSubtasks} steps</span>
                   <span>{progress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                   <div 
                    className={`h-full rounded-full transition-all duration-500 ease-out ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                    style={{ width: `${progress}%` }} 
                   />
                </div>
             </div>
           )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1 items-end">
           <button
            onClick={() => onDelete(task.id)}
            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors active:scale-90"
          >
            <Trash2 className="w-5 h-5" />
          </button>
           {totalSubtasks > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              className={`p-2 rounded-xl transition-colors ${isExpanded ? 'bg-indigo-50 text-indigo-600' : 'text-slate-300 hover:text-indigo-600'}`}
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Subtasks Dropdown */}
      {isExpanded && totalSubtasks > 0 && (
        <div className="bg-slate-50/50 border-t border-slate-100">
          <ul className="px-5 py-3 space-y-3">
            {task.subtasks.map((subtask) => (
              <li key={subtask.id} className="flex items-center gap-3 animate-slide-up">
                <button
                  onClick={() => onToggleSubtask(task.id, subtask.id)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                    subtask.completed
                      ? 'bg-slate-400 border-slate-400 text-white'
                      : 'border-slate-300 bg-white hover:border-indigo-400'
                  }`}
                >
                  {subtask.completed && <Check className="w-3.5 h-3.5" />}
                </button>
                <span className={`text-sm font-medium transition-colors cursor-pointer select-none ${subtask.completed ? 'text-slate-400 line-through' : 'text-slate-600'}`} onClick={() => onToggleSubtask(task.id, subtask.id)}>
                  {subtask.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};