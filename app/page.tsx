'use client';

import React, { useState, useRef, useEffect } from 'react';
import { InputForm } from '../components/InputForm';
import { ScheduleView } from '../components/ScheduleView';
import { Dashboard } from '../components/Dashboard';
import { UserInputData, GeneratedSchedule, ScheduleTask } from '../types';
import { generateScheduleAction } from './actions';
import { RotateCcw, LayoutDashboard, Calendar, RefreshCw, Sun, Sparkles, Plus, Undo2, Archive, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const [scheduleData, setScheduleData] = useState<GeneratedSchedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'calendar' | 'dashboard'>('calendar');
  
  // State for History (Undo) and Archives
  const [history, setHistory] = useState<GeneratedSchedule[]>([]);
  const [archivedSchedules, setArchivedSchedules] = useState<GeneratedSchedule[]>([]);
  
  // Lifted Input State to persist data between resets
  const [inputData, setInputData] = useState<UserInputData | null>(null);

  // --- Persistence ---
  useEffect(() => {
    // Load state on mount
    const savedSchedule = localStorage.getItem('novarame_schedule');
    const savedInput = localStorage.getItem('novarame_input');
    
    if (savedSchedule) {
      try {
        setScheduleData(JSON.parse(savedSchedule));
      } catch (e) {
        console.error("Failed to parse saved schedule", e);
      }
    }
    
    if (savedInput) {
      try {
        setInputData(JSON.parse(savedInput));
      } catch (e) {
        console.error("Failed to parse saved input", e);
      }
    }
  }, []);

  useEffect(() => {
    // Save state on change
    if (scheduleData) {
      localStorage.setItem('novarame_schedule', JSON.stringify(scheduleData));
    }
  }, [scheduleData]);

  useEffect(() => {
    if (inputData) {
      localStorage.setItem('novarame_input', JSON.stringify(inputData));
    }
  }, [inputData]);

  // --- Helpers ---

  // Deep copy helper for history
  const cloneSchedule = (data: GeneratedSchedule): GeneratedSchedule => JSON.parse(JSON.stringify(data));

  const addToHistory = () => {
    if (scheduleData) {
      setHistory(prev => [...prev.slice(-19), cloneSchedule(scheduleData)]); // Keep last 20
    }
  };

  const processSchedule = (schedule: GeneratedSchedule, existingTasksMap?: Map<string, ScheduleTask>): GeneratedSchedule => {
    return {
      ...schedule,
      optimized_weekly_schedule: schedule.optimized_weekly_schedule.map(day => ({
        ...day,
        tasks: day.tasks.map(task => {
            const key = `${day.day}-${task.time_start}-${task.subject_or_task.trim().toLowerCase()}`;
            const existing = existingTasksMap?.get(key);
            
            return {
              ...task,
              id: existing?.id || crypto.randomUUID(), 
              isCompleted: existing ? existing.isCompleted : false,
              is_ai_generated: existing ? existing.is_ai_generated : task.is_ai_generated
            };
        })
      }))
    };
  };

  // --- Actions ---

  const handleGenerate = async (data: UserInputData) => {
    setLoading(true);
    setError(null);
    setInputData(data); 

    try {
      const result = await generateScheduleAction(data);
      if (result && result.optimized_weekly_schedule) {
         setScheduleData(processSchedule(result));
         setHistory([]); // Reset history on new generation
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate schedule. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previousState = history[history.length - 1];
    setScheduleData(previousState);
    setHistory(prev => prev.slice(0, -1));
  };

  const handleSoftRefresh = () => {
    if (!scheduleData) return;
    addToHistory();
    // Re-sort tasks and force re-render
    setScheduleData(prev => {
        if (!prev) return null;
        const newSchedule = cloneSchedule(prev);
        newSchedule.optimized_weekly_schedule.forEach(day => {
            day.tasks.sort((a, b) => a.time_start.localeCompare(b.time_start));
        });
        return newSchedule;
    });
  };

  const handleStartNewWeek = () => {
    if (window.confirm("Ready to start a new week? This will archive your current schedule and take you back to setup.")) {
      if (scheduleData) {
        setArchivedSchedules(prev => [...prev, scheduleData]);
      }
      setScheduleData(null);
      setError(null);
      setHistory([]);
      localStorage.removeItem('novarame_schedule');
    }
  };

  // --- Task Management Handlers (Immutable Updates + History) ---

  const toggleTask = (dayIndex: number, taskId: string) => {
    addToHistory();
    setScheduleData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        optimized_weekly_schedule: prev.optimized_weekly_schedule.map((day, idx) => {
          if (idx !== dayIndex) return day;
          return {
            ...day,
            tasks: day.tasks.map(task => {
              if (task.id !== taskId) return task;
              return { ...task, isCompleted: !task.isCompleted };
            })
          };
        })
      };
    });
  };

  const addTask = (dayIndex: number, task: ScheduleTask) => {
    addToHistory();
    setScheduleData(prev => {
      if (!prev) return null;
      const newSchedule = cloneSchedule(prev);
      newSchedule.optimized_weekly_schedule = newSchedule.optimized_weekly_schedule.map((day, idx) => {
         if (idx !== dayIndex) return day;
         const newTask = { ...task, is_ai_generated: false };
         const updatedTasks = [...day.tasks, newTask];
         updatedTasks.sort((a, b) => a.time_start.localeCompare(b.time_start));
         return { ...day, tasks: updatedTasks };
      });
      return newSchedule;
    });
  };

  const updateTask = (dayIndex: number, taskId: string, updatedTask: Partial<ScheduleTask>) => {
    addToHistory();
    setScheduleData(prev => {
      if (!prev) return null;
      const newSchedule = cloneSchedule(prev);
      newSchedule.optimized_weekly_schedule = newSchedule.optimized_weekly_schedule.map((day, idx) => {
        if (idx !== dayIndex) return day;
        const updatedTasks = day.tasks.map(task => {
          if (task.id !== taskId) return task;
          // Apply updates, ensure it's marked as user-edited (not AI)
          return { ...task, ...updatedTask, is_ai_generated: false };
        });
        if (updatedTask.time_start) {
            updatedTasks.sort((a, b) => a.time_start.localeCompare(b.time_start));
        }
        return { ...day, tasks: updatedTasks };
      });
      return newSchedule;
    });
  };

  const deleteTask = (dayIndex: number, taskId: string) => {
    addToHistory();
    setScheduleData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        optimized_weekly_schedule: prev.optimized_weekly_schedule.map((day, idx) => {
          if (idx !== dayIndex) return day;
          return {
            ...day,
            tasks: day.tasks.filter(task => task.id !== taskId)
          };
        })
      };
    });
  };

  return (
    <div className="min-h-screen bg-lavender-50 text-slate-800 font-sans pb-20 transition-colors duration-500">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-lavender-200 sticky top-0 z-50 transition-all shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* NovaraMe Logo */}
            <div className="relative group cursor-default">
               <div className="absolute inset-0 bg-brand-200 blur-sm rounded-full opacity-0 group-hover:opacity-60 transition-opacity duration-300"></div>
               <div className="relative bg-gradient-to-br from-brand-50 to-lavender-50 p-1.5 rounded-xl border border-brand-200 shadow-sm transform -rotate-6 group-hover:rotate-0 transition-transform duration-300">
                  <Sun className="w-6 h-6 text-brand-500" />
                  <div className="absolute -top-1 -right-1">
                    <Sparkles className="w-3 h-3 text-lavender-400 fill-lavender-400 animate-pulse" />
                  </div>
               </div>
            </div>
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">
              <span className="text-slate-600">Novara</span>
              <span className="text-brand-500">Me</span>
            </h1>
          </div>
          
          {scheduleData && (
             <div className="flex gap-1 md:gap-2 items-center">
               
               {/* View Switchers */}
               <div className="flex bg-slate-100/80 rounded-lg p-1 mr-1 md:mr-3">
                 <button 
                  onClick={() => setView('calendar')}
                  className={`p-2 md:px-3 md:py-1.5 rounded-md text-sm font-medium transition-all ${view === 'calendar' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  title="Calendar View"
                 >
                   <Calendar className="w-4 h-4 md:inline-block hidden mr-1" />
                   <Calendar className="w-5 h-5 md:hidden" />
                   <span className="hidden md:inline">Calendar</span>
                 </button>
                 <button 
                  onClick={() => setView('dashboard')}
                  className={`p-2 md:px-3 md:py-1.5 rounded-md text-sm font-medium transition-all ${view === 'dashboard' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  title="Analytics View"
                 >
                   <LayoutDashboard className="w-4 h-4 md:inline-block hidden mr-1" />
                   <LayoutDashboard className="w-5 h-5 md:hidden" />
                   <span className="hidden md:inline">Analytics</span>
                 </button>
               </div>

               {/* Action Buttons */}
               <button 
                 onClick={() => {
                   const globalAddBtn = document.getElementById('global-add-task-btn');
                   if (globalAddBtn) globalAddBtn.click();
                 }}
                 className="p-2 rounded-full bg-brand-500 text-white hover:bg-brand-600 shadow-md shadow-brand-200 transition active:scale-95"
                 title="Add New Task"
               >
                 <Plus className="w-5 h-5" />
               </button>

               <div className="w-px h-6 bg-slate-200 mx-1"></div>

               <button 
                 onClick={handleUndo}
                 disabled={history.length === 0}
                 className="p-2 rounded-md text-slate-500 hover:bg-lavender-100 hover:text-brand-600 transition disabled:opacity-30"
                 title="Undo Last Change"
               >
                 <Undo2 className="w-5 h-5" />
               </button>

               <button 
                 onClick={handleSoftRefresh}
                 className="p-2 rounded-md text-slate-500 hover:bg-lavender-100 hover:text-brand-600 transition"
                 title="Soft Refresh (Fix Layout)"
               >
                 <RefreshCw className="w-5 h-5" />
               </button>

               <button 
                onClick={handleStartNewWeek}
                className="ml-1 text-sm px-3 py-1.5 bg-slate-50 border border-lavender-200 rounded-lg text-slate-600 hover:bg-white hover:text-brand-600 hover:border-brand-300 hover:shadow-sm flex items-center gap-2 transition"
                title="Archive & Start New Week"
               >
                 <RotateCcw className="w-4 h-4" /> <span className="hidden sm:inline">New Week</span>
               </button>
             </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!scheduleData ? (
          <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-slate-800 mb-4 tracking-tight">Optimize Your Academic Week</h2>
              <p className="text-lg text-slate-500 mb-6">
                Input your fixed commitments, subjects, and assignments. AI will build your perfect study routine.
              </p>
              {archivedSchedules.length > 0 && (
                 <div className="inline-flex items-center gap-2 px-4 py-2 bg-lavender-100 rounded-full text-lavender-700 text-sm font-medium">
                    <Archive className="w-4 h-4" /> {archivedSchedules.length} weeks archived
                 </div>
              )}
            </div>
            
            {error && (
              <div className="bg-coral-50 text-coral-700 p-4 rounded-lg border border-coral-200 mb-6 flex items-start animate-shake">
                <div className="mr-3 mt-1 text-xl">⚠️</div>
                <div>
                  <h4 className="font-bold">Generation Failed</h4>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

            <InputForm onSubmit={handleGenerate} isLoading={loading} initialData={inputData} />
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                 <h2 className="text-2xl font-bold text-slate-800">Your Optimized Schedule</h2>
                 <p className="text-slate-500">Generated for week starting {scheduleData.optimized_weekly_schedule[0]?.date}</p>
              </div>
            </div>

            {view === 'calendar' ? (
              <ScheduleView 
                scheduleData={scheduleData} 
                onToggleTask={toggleTask}
                onAddTask={addTask}
                onUpdateTask={updateTask}
                onDeleteTask={deleteTask}
              />
            ) : (
              <Dashboard scheduleData={scheduleData} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}