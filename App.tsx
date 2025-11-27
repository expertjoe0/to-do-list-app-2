import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Layout, PartyPopper, WifiOff } from 'lucide-react';
import { Task, Priority } from './types';
import { AICreator } from './components/AICreator';
import { TaskItem } from './components/TaskItem';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('zendo-tasks');
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse tasks", e);
      }
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('zendo-tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const isCompleted = !t.completed;
      return { 
        ...t, 
        completed: isCompleted,
        completedAt: isCompleted ? Date.now() : undefined
      };
    }));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        subtasks: t.subtasks.map(s => 
          s.id === subtaskId ? { ...s, completed: !s.completed } : s
        )
      };
    }));
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  // Calculate completion
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const percentComplete = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  // Progress Circle Config
  const radius = 33;
  const stroke = 6;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentComplete / 100) * circumference;

  return (
    <div className="min-h-screen font-sans selection:bg-indigo-200 text-slate-800 pb-24 md:pb-8">
      
      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-slate-800 text-slate-200 px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2 sticky top-0 z-50">
          <WifiOff className="w-3 h-3" />
          <span>You are offline. AI features unavailable.</span>
        </div>
      )}

      {/* Glass Header */}
      <header className={`sticky z-20 glass border-b border-white/50 shadow-sm transition-all ${isOffline ? 'top-8' : 'top-0'}`}>
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-xl tracking-tight text-slate-800 leading-none">To Do List</h1>
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">AI Task Manager</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{new Date().toLocaleDateString(undefined, { weekday: 'long' })}</p>
               <p className="text-sm font-bold text-slate-700">{new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</p>
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        
        {/* Welcome Section / Second Section */}
        <div className="mb-8 animate-slide-up">
           <div className="flex justify-between items-center px-1">
             <div>
               <h2 className="text-3xl font-black text-slate-800">My Tasks</h2>
               <p className="text-slate-500 font-medium">
                 {tasks.filter(t => !t.completed).length} pending tasks
               </p>
             </div>
             
             <div className="flex items-center gap-3">
                {totalTasks > 0 && percentComplete === 100 && (
                  <div className="hidden sm:flex items-center gap-2 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold animate-pulse-slow">
                    <PartyPopper className="w-4 h-4" /> All done!
                  </div>
                )}

                {/* Progress Score Circle */}
                <div className="relative w-24 h-24 flex items-center justify-center bg-white rounded-full shadow-sm border border-slate-100">
                    <svg
                      height={radius * 2 + stroke}
                      width={radius * 2 + stroke}
                      className="rotate-[-90deg] transform"
                    >
                      <circle
                        stroke="#e2e8f0"
                        strokeWidth={stroke}
                        fill="transparent"
                        r={normalizedRadius}
                        cx="50%"
                        cy="50%"
                      />
                      <circle
                        stroke="currentColor"
                        className="text-indigo-600 transition-all duration-1000 ease-out"
                        strokeWidth={stroke}
                        strokeDasharray={circumference + ' ' + circumference}
                        style={{ strokeDashoffset }}
                        strokeLinecap="round"
                        fill="transparent"
                        r={normalizedRadius}
                        cx="50%"
                        cy="50%"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col leading-none">
                      <span className="text-xl font-black text-slate-800">{percentComplete}%</span>
                    </div>
                 </div>
             </div>
           </div>
        </div>

        {/* Creator Section */}
        {isCreatorOpen && (
           <div className="relative z-10">
              <AICreator onAddTask={addTask} onCancel={() => setIsCreatorOpen(false)} />
           </div>
        )}

        {/* Filters */}
        <div className={`sticky z-10 bg-transparent py-2 mb-2 -mx-4 px-4 overflow-x-auto no-scrollbar ${isOffline ? 'top-[6.5rem]' : 'top-[4.5rem]'}`}>
           <div className="flex gap-2 min-w-max">
            {(['active', 'all', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2 text-sm font-bold rounded-full capitalize transition-all duration-300 shadow-sm ${
                  filter === f 
                    ? 'bg-indigo-600 text-white shadow-indigo-500/30 scale-105' 
                    : 'bg-white text-slate-500 border border-white/50 hover:bg-white/80'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-4 pb-20">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="bg-white/50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white">
                <Layout className="w-10 h-10 text-indigo-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">No tasks found</h3>
              <p className="text-slate-500">
                {filter === 'active' 
                  ? "You're all caught up! Enjoy your day." 
                  : filter === 'completed'
                    ? "No completed tasks yet. Get to work!"
                    : "Add a task to get started!"}
              </p>
            </div>
          ) : (
            filteredTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={toggleTask}
                onDelete={deleteTask}
                onToggleSubtask={toggleSubtask}
              />
            ))
          )}
        </div>
      </main>

      {/* Floating Action Button for Mobile & Desktop */}
      {!isCreatorOpen && (
        <div className="fixed bottom-6 right-6 z-30">
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setIsCreatorOpen(true);
            }}
            className="group relative flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-full shadow-xl shadow-indigo-500/40 transition-all duration-300 hover:scale-110 hover:shadow-indigo-500/60 active:scale-95"
          >
             <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
             <span className="absolute right-full mr-4 bg-slate-800 text-white text-xs font-bold py-1 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
               Add Task
             </span>
          </button>
        </div>
      )}
      
    </div>
  );
};

export default App;