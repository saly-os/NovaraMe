'use client';

import React, { useState } from 'react';
import { GeneratedSchedule, ActivityType, Priority, ScheduleTask } from '../types';
import { Clock, Coffee, Briefcase, BookOpen, Home, User, CheckCircle, Circle, Plus, X, Save, Edit2, Trash2, Sparkles, Check } from 'lucide-react';

interface ScheduleViewProps {
  scheduleData: GeneratedSchedule;
  onToggleTask?: (dayIndex: number, taskId: string) => void;
  onAddTask?: (dayIndex: number, task: ScheduleTask) => void;
  onUpdateTask?: (dayIndex: number, taskId: string, updatedTask: Partial<ScheduleTask>) => void;
  onDeleteTask?: (dayIndex: number, taskId: string) => void;
}

// Helper: Get styles based on activity
const getActivityStyles = (type: ActivityType, priority: Priority | 'N/A', isCompleted?: boolean, isAiGenerated?: boolean) => {
  if (isCompleted) {
    return 'bg-slate-50 border-slate-100 text-slate-400 opacity-60 grayscale shadow-none decoration-slate-400 transform scale-[0.99] transition-all duration-300';
  }
  
  const hoverEffects = 'hover:scale-[1.01] hover:shadow-md hover:border-opacity-80 transition-all duration-200';
  
  // Fixed/Immutables
  if (type === 'Break') return `bg-white border-dashed border-slate-300 text-slate-500 ${hoverEffects}`;
  if (type === 'Fixed') return `bg-slate-100 border-l-4 border-l-slate-400 border-y border-r border-slate-200 text-slate-700 ${hoverEffects}`;
  if (type === 'Work') return `bg-sky-50 border-l-4 border-l-sky-400 border-y border-r border-sky-100 text-sky-800 ${hoverEffects}`;
  
  // Academic = Lavender
  if (type === 'Study') {
     if (priority === 'High') return `bg-lavender-100 border-l-4 border-l-lavender-500 border-y border-r border-lavender-200 text-lavender-900 ${hoverEffects}`;
     return `bg-lavender-50 border-l-4 border-l-lavender-300 border-y border-r border-lavender-100 text-lavender-800 ${hoverEffects}`;
  }
  
  // Personal = Coral
  if (type === 'Personal') {
    if (priority === 'High') return `bg-coral-50 border-l-4 border-l-coral-500 border-y border-r border-coral-200 text-coral-900 ${hoverEffects}`;
    return `bg-coral-50/50 border-l-4 border-l-coral-300 border-y border-r border-coral-100 text-coral-800 ${hoverEffects}`;
  }

  // Chores = Brand (Mint/Teal)
  if (type === 'Chore') {
    return `bg-brand-50 border-l-4 border-l-brand-400 border-y border-r border-brand-200 text-brand-900 ${hoverEffects}`;
  }
  
  return `bg-slate-50 border border-slate-200 text-slate-600 ${hoverEffects}`;
};

const getActivityIcon = (type: ActivityType) => {
  switch (type) {
    case 'Break': return <Coffee className="w-3.5 h-3.5" />;
    case 'Fixed': return <Clock className="w-3.5 h-3.5" />;
    case 'Work': return <Briefcase className="w-3.5 h-3.5" />;
    case 'Study': return <BookOpen className="w-3.5 h-3.5" />;
    case 'Personal': return <User className="w-3.5 h-3.5" />;
    case 'Chore': return <Home className="w-3.5 h-3.5" />;
    default: return <Clock className="w-3.5 h-3.5" />;
  }
};

export const ScheduleView: React.FC<ScheduleViewProps> = ({ scheduleData, onToggleTask, onAddTask, onUpdateTask, onDeleteTask }) => {
  const { optimized_weekly_schedule, summary_review } = scheduleData;
  const [addingToDayIndex, setAddingToDayIndex] = useState<number | null>(null); // For inline add
  const [globalAddModalOpen, setGlobalAddModalOpen] = useState(false); // For global add
  const [editingTask, setEditingTask] = useState<{ dayIndex: number, task: ScheduleTask } | null>(null);
  
  // Animation States
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

  // New Task State (Shared for inline and global)
  const defaultTaskState: Partial<ScheduleTask> = {
    time_start: '09:00',
    time_end: '10:00',
    subject_or_task: '',
    activity_type: 'Personal',
    priority_level: 'Medium',
    duration_minutes: 60
  };
  const [newTask, setNewTask] = useState<Partial<ScheduleTask>>(defaultTaskState);
  const [selectedDayIndexForGlobal, setSelectedDayIndexForGlobal] = useState<number>(0);

  // --- Handlers ---

  const handleSaveNewTask = (dayIndex: number) => {
    if (!onAddTask || !newTask.subject_or_task) return;

    // Calc duration
    const startParts = newTask.time_start?.split(':').map(Number) || [9, 0];
    const endParts = newTask.time_end?.split(':').map(Number) || [10, 0];
    const startMins = startParts[0] * 60 + startParts[1];
    const endMins = endParts[0] * 60 + endParts[1];
    let duration = endMins - startMins;
    if (duration <= 0) duration = 60; // Default if time is weird
    
    const newId = crypto.randomUUID();

    onAddTask(dayIndex, {
      ...newTask,
      id: newId,
      duration_minutes: duration,
      notes: newTask.notes || 'Added manually',
      isCompleted: false,
      priority_level: newTask.priority_level || 'Medium',
      is_ai_generated: false 
    } as ScheduleTask);

    setAddingToDayIndex(null);
    setGlobalAddModalOpen(false);
    setNewTask(defaultTaskState);
    
    // Trigger highlight
    setHighlightedTaskId(newId);
    setTimeout(() => setHighlightedTaskId(null), 2000);
  };

  const handleUpdateTask = () => {
    if (!editingTask || !onUpdateTask) return;
    
    const startParts = editingTask.task.time_start.split(':').map(Number);
    const endParts = editingTask.task.time_end.split(':').map(Number);
    
    // Ensure accurate duration calc
    let duration = (endParts[0] * 60 + endParts[1]) - (startParts[0] * 60 + startParts[1]);
    if (duration <= 0) duration = 60; // Fallback for invalid times

    // Call Update immediately with all fields
    onUpdateTask(editingTask.dayIndex, editingTask.task.id, {
      ...editingTask.task, // Spread all current values from edit modal
      duration_minutes: duration,
    });
    
    // Show feedback then close
    setShowSavedFeedback(true);
    setTimeout(() => {
        setShowSavedFeedback(false);
        setEditingTask(null);
    }, 400);
    
    // Highlight row
    setHighlightedTaskId(editingTask.task.id);
    setTimeout(() => setHighlightedTaskId(null), 2000);
  };

  const handleDelete = (dayIndex: number, taskId: string) => {
    // 1. Close modal immediately
    setEditingTask(null);
    
    // 2. Mark for deletion animation
    setDeletingTaskId(taskId);
    
    // 3. Actually delete from data
    setTimeout(() => {
        if (onDeleteTask) onDeleteTask(dayIndex, taskId);
        setDeletingTaskId(null);
    }, 300);
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      
      {/* Hidden button for Global Add, triggered by Header */}
      <button id="global-add-task-btn" className="hidden" onClick={() => setGlobalAddModalOpen(true)}></button>

      {/* Global Add Modal */}
      {globalAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
             <div className="px-6 py-4 border-b border-brand-100 flex justify-between items-center bg-brand-50/50">
               <h3 className="font-bold text-brand-700 flex items-center gap-2">
                 <Plus className="w-5 h-5" /> Add New Task
               </h3>
               <button onClick={() => setGlobalAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
             </div>
             <div className="p-6 space-y-4">
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Day</label>
                   <select 
                     className="w-full text-sm border-lavender-200 rounded-lg p-2.5 text-slate-900 bg-white"
                     value={selectedDayIndexForGlobal}
                     onChange={(e) => setSelectedDayIndexForGlobal(parseInt(e.target.value))}
                   >
                     {optimized_weekly_schedule.map((day, idx) => (
                       <option key={idx} value={idx}>{day.day} ({day.date})</option>
                     ))}
                   </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Task Name</label>
                  <input 
                    type="text" 
                    className="w-full text-sm border-lavender-200 rounded-lg p-2.5 text-slate-900 bg-white" 
                    value={newTask.subject_or_task} 
                    onChange={(e) => setNewTask({...newTask, subject_or_task: e.target.value})}
                    placeholder="e.g. Read Chapter 4"
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <input type="time" className="w-full text-sm border-lavender-200 rounded-lg p-2.5 text-slate-900 bg-white [color-scheme:light]" value={newTask.time_start} onChange={e => setNewTask({...newTask, time_start: e.target.value})} />
                   <input type="time" className="w-full text-sm border-lavender-200 rounded-lg p-2.5 text-slate-900 bg-white [color-scheme:light]" value={newTask.time_end} onChange={e => setNewTask({...newTask, time_end: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <select className="w-full text-sm border-lavender-200 rounded-lg p-2.5 text-slate-900 bg-white" value={newTask.activity_type} onChange={e => setNewTask({...newTask, activity_type: e.target.value as ActivityType})}>
                      <option value="Study">Study</option><option value="Personal">Personal</option><option value="Work">Work</option><option value="Chore">Chore</option><option value="Break">Break</option><option value="Fixed">Fixed</option>
                   </select>
                   <select className="w-full text-sm border-lavender-200 rounded-lg p-2.5 text-slate-900 bg-white" value={newTask.priority_level} onChange={e => setNewTask({...newTask, priority_level: e.target.value as Priority})}>
                      <option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option>
                   </select>
                </div>
             </div>
             <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                 <button onClick={() => setGlobalAddModalOpen(false)} className="px-4 py-2 text-slate-600 text-sm font-medium hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition">Cancel</button>
                 <button onClick={() => handleSaveNewTask(selectedDayIndexForGlobal)} className="px-6 py-2 bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 rounded-lg shadow-sm hover:shadow transition-all">Add Task</button>
             </div>
           </div>
        </div>
      )}

      {/* Edit Modal Overlay */}
      {editingTask && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-brand-500" /> Edit Task
              </h3>
              <button onClick={() => setEditingTask(null)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Task Name</label>
                 <input 
                   type="text" 
                   className="w-full text-sm border-lavender-200 rounded-lg p-2.5 focus:ring-brand-500 focus:border-brand-500 text-slate-900 bg-white shadow-sm transition-shadow focus:shadow" 
                   value={editingTask.task.subject_or_task} 
                   onChange={(e) => setEditingTask({...editingTask, task: {...editingTask.task, subject_or_task: e.target.value}})}
                 />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Start Time</label>
                    <input 
                      type="time" 
                      className="w-full text-sm border-lavender-200 rounded-lg p-2.5 text-slate-900 bg-white [color-scheme:light]" 
                      value={editingTask.task.time_start}
                      onChange={(e) => setEditingTask({...editingTask, task: {...editingTask.task, time_start: e.target.value}})}
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">End Time</label>
                    <input 
                      type="time" 
                      className="w-full text-sm border-lavender-200 rounded-lg p-2.5 text-slate-900 bg-white [color-scheme:light]" 
                      value={editingTask.task.time_end}
                      onChange={(e) => setEditingTask({...editingTask, task: {...editingTask.task, time_end: e.target.value}})}
                    />
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Type</label>
                    <select 
                      className="w-full text-sm border-lavender-200 rounded-lg p-2.5 text-slate-900 bg-white"
                      value={editingTask.task.activity_type}
                      onChange={(e) => setEditingTask({...editingTask, task: {...editingTask.task, activity_type: e.target.value as ActivityType}})}
                    >
                      <option value="Study">Study</option>
                      <option value="Work">Work</option>
                      <option value="Personal">Personal</option>
                      <option value="Chore">Chore</option>
                      <option value="Break">Break</option>
                      <option value="Fixed">Fixed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Priority</label>
                    <select 
                      className="w-full text-sm border-lavender-200 rounded-lg p-2.5 text-slate-900 bg-white"
                      value={editingTask.task.priority_level}
                      onChange={(e) => setEditingTask({...editingTask, task: {...editingTask.task, priority_level: e.target.value as Priority}})}
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                      <option value="N/A">N/A</option>
                    </select>
                  </div>
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Notes</label>
                  <textarea 
                    className="w-full text-sm border-lavender-200 rounded-lg p-2.5 h-20 resize-none text-slate-900 bg-white"
                    value={editingTask.task.notes || ''}
                    onChange={(e) => setEditingTask({...editingTask, task: {...editingTask.task, notes: e.target.value}})}
                  />
               </div>
               
               <div className="flex items-center gap-2 mt-2">
                 <button 
                  onClick={() => setEditingTask({...editingTask, task: {...editingTask.task, isCompleted: !editingTask.task.isCompleted}})}
                  className={`flex-1 p-2 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${editingTask.task.isCompleted ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-600'}`}
                 >
                   {editingTask.task.isCompleted ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                   {editingTask.task.isCompleted ? 'Marked as Complete' : 'Mark as Complete'}
                 </button>
               </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between">
               <button 
                 onClick={() => handleDelete(editingTask.dayIndex, editingTask.task.id)}
                 className="px-4 py-2 text-rose-600 text-sm font-medium hover:bg-rose-50 rounded-lg flex items-center gap-2 transition hover:scale-105 active:scale-95"
               >
                 <Trash2 className="w-4 h-4" /> Delete
               </button>
               <div className="flex gap-2">
                 <button onClick={() => setEditingTask(null)} className="px-4 py-2 text-slate-600 text-sm font-medium hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition">Cancel</button>
                 <button 
                  onClick={handleUpdateTask} 
                  className={`px-4 py-2 text-white text-sm font-medium rounded-lg shadow-sm hover:shadow transition-all hover:scale-105 active:scale-95 flex items-center gap-2 ${showSavedFeedback ? 'bg-emerald-500' : 'bg-brand-500 hover:bg-brand-600'}`}
                 >
                    {showSavedFeedback ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />} 
                    {showSavedFeedback ? 'Saved!' : 'Save Changes'}
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/80 backdrop-blur p-4 rounded-xl border border-lavender-100 shadow-sm transition hover:shadow-md hover:border-lavender-200 flex flex-col group">
          <span className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">Study Hours</span>
          <span className="text-xl sm:text-2xl font-bold text-lavender-600 group-hover:scale-105 transition-transform origin-left">{summary_review.total_study_hours}</span>
        </div>
        <div className="bg-white/80 backdrop-blur p-4 rounded-xl border border-lavender-100 shadow-sm transition hover:shadow-md hover:border-lavender-200 flex flex-col group">
          <span className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">Deadlines Met</span>
          <span className="text-lg sm:text-xl font-semibold text-brand-600 group-hover:scale-105 transition-transform origin-left">{summary_review.deadlines_met}</span>
        </div>
        <div className="bg-white/80 backdrop-blur p-4 rounded-xl border border-lavender-100 shadow-sm transition hover:shadow-md hover:border-lavender-200 flex flex-col group">
          <span className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">Top Focus</span>
          <span className="text-lg sm:text-xl font-semibold text-coral-500 group-hover:scale-105 transition-transform origin-left truncate">{summary_review.high_priority_focus}</span>
        </div>
        <div className="bg-white/80 backdrop-blur p-4 rounded-xl border border-lavender-100 shadow-sm transition hover:shadow-md hover:border-lavender-200 flex flex-col group">
          <span className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">Life Balance</span>
          <span className="text-lg sm:text-xl font-semibold text-emerald-500 group-hover:scale-105 transition-transform origin-left">{summary_review.life_balance_score || 'Good'}</span>
        </div>
      </div>

      {/* Daily Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 lg:gap-3 overflow-x-auto pb-4">
        {optimized_weekly_schedule.map((dayData, dayIndex) => (
          <div key={dayIndex} className="min-w-[300px] lg:min-w-0 bg-white/90 rounded-xl border border-lavender-100 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
            <div className="p-3 border-b border-lavender-100 bg-lavender-50/80 rounded-t-xl text-center sticky top-0 z-10 backdrop-blur">
              <h4 className="font-bold text-lavender-900">{dayData.day}</h4>
              <span className="text-xs text-lavender-500 font-medium">{dayData.date}</span>
            </div>
            
            <div className="p-2 space-y-2 flex-grow overflow-y-auto max-h-[800px] scrollbar-thin scrollbar-thumb-lavender-200">
              {dayData.tasks.length === 0 && addingToDayIndex !== dayIndex ? (
                 <div className="text-center py-8 text-lavender-300 text-xs italic">Free Day</div>
              ) : (
                dayData.tasks.map((task, tIndex) => (
                  <div 
                    key={task.id || tIndex}
                    className={`
                      p-3 rounded-lg border text-left transition-all duration-300 ease-out group relative cursor-pointer
                      ${getActivityStyles(task.activity_type, task.priority_level, task.isCompleted, task.is_ai_generated)}
                      ${highlightedTaskId === task.id ? 'ring-2 ring-brand-400 bg-brand-50 scale-[1.02]' : ''}
                      ${deletingTaskId === task.id ? 'opacity-0 scale-90 h-0 p-0 overflow-hidden' : 'opacity-100'}
                    `}
                    onClick={(e) => {
                      setEditingTask({ dayIndex, task: { ...task } });
                    }}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span className={`text-[10px] sm:text-xs font-bold opacity-75 font-mono ${task.isCompleted ? 'line-through' : ''}`}>
                        {task.time_start} - {task.time_end}
                      </span>
                      <div className="flex items-center gap-1">
                         {task.is_ai_generated && (
                           <div title="AI Suggestion">
                             <Sparkles className="w-2.5 h-2.5 text-lavender-400" />
                           </div>
                         )}
                         {getActivityIcon(task.activity_type)}
                         {/* Checkbox */}
                         {onToggleTask && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); onToggleTask(dayIndex, task.id); }}
                              className={`ml-1 transition-all duration-300 ease-spring ${task.isCompleted ? 'text-brand-500 hover:text-brand-600 scale-110' : 'text-slate-300 hover:text-brand-500 hover:scale-125'}`}
                              title={task.isCompleted ? "Mark as Incomplete" : "Mark as Complete"}
                            >
                              {task.isCompleted ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                            </button>
                         )}
                      </div>
                    </div>
                    
                    <div className={`font-semibold text-xs sm:text-sm leading-snug mb-1 transition-all duration-300 ${task.isCompleted ? 'line-through opacity-50 decoration-slate-400' : ''}`}>
                      {task.subject_or_task}
                    </div>
                    
                    {task.notes && !task.isCompleted && (
                      <div className="text-[10px] opacity-80 mt-1 italic leading-tight border-l-2 border-current pl-1.5 my-1">
                        {task.notes}
                      </div>
                    )}
                    
                    {(task.activity_type === 'Study' || task.activity_type === 'Personal') && task.priority_level !== 'N/A' && !task.isCompleted && (
                      <div className="mt-2 flex gap-1 flex-wrap">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${task.priority_level === 'High' ? 'bg-white/60 border border-current opacity-90' : 'bg-white/40 border border-transparent'}`}>
                          {task.priority_level}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 bg-white/60 rounded-full font-medium opacity-80 border border-transparent">
                          {task.duration_minutes}m
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* Quick Add Form (Inline) */}
              {addingToDayIndex === dayIndex ? (
                <div className="p-3 rounded-lg border border-brand-200 bg-brand-50 shadow-inner animate-in fade-in zoom-in-95">
                  <div className="space-y-2">
                    <input 
                      type="text" 
                      placeholder="Task Name"
                      className="w-full text-xs p-2 rounded border-brand-200 focus:border-brand-500 focus:ring-brand-500 text-slate-900 bg-white"
                      value={newTask.subject_or_task}
                      onChange={e => setNewTask({...newTask, subject_or_task: e.target.value})}
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <input 
                        type="time" 
                        className="w-1/2 text-xs p-1.5 rounded border-brand-200 text-slate-900 bg-white [color-scheme:light]"
                        value={newTask.time_start}
                        onChange={e => setNewTask({...newTask, time_start: e.target.value})}
                      />
                      <input 
                        type="time" 
                        className="w-1/2 text-xs p-1.5 rounded border-brand-200 text-slate-900 bg-white [color-scheme:light]"
                        value={newTask.time_end}
                        onChange={e => setNewTask({...newTask, time_end: e.target.value})}
                      />
                    </div>
                    <select 
                       className="w-full text-xs p-1.5 rounded border-brand-200 text-slate-900 bg-white"
                       value={newTask.activity_type}
                       onChange={e => setNewTask({...newTask, activity_type: e.target.value as ActivityType})}
                    >
                      <option value="Personal">Personal</option>
                      <option value="Study">Study</option>
                      <option value="Work">Work</option>
                      <option value="Chore">Chore</option>
                      <option value="Break">Break</option>
                      <option value="Fixed">Fixed</option>
                    </select>
                    <div className="flex gap-2 pt-1">
                      <button 
                        onClick={() => handleSaveNewTask(dayIndex)}
                        className="flex-1 bg-brand-500 text-white text-xs py-1.5 rounded hover:bg-brand-600 flex items-center justify-center gap-1 shadow-sm"
                      >
                        <Save className="w-3 h-3" /> Save
                      </button>
                      <button 
                        onClick={() => setAddingToDayIndex(null)}
                        className="flex-1 bg-white text-slate-600 border border-slate-200 text-xs py-1.5 rounded hover:bg-slate-50 flex items-center justify-center gap-1 shadow-sm"
                      >
                         <X className="w-3 h-3" /> Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                onAddTask && (
                  <button 
                    onClick={() => setAddingToDayIndex(dayIndex)}
                    className="w-full py-2.5 border border-dashed border-lavender-300 rounded-lg text-lavender-400 hover:text-brand-600 hover:border-brand-300 hover:bg-brand-50 transition flex items-center justify-center gap-1 text-xs font-medium"
                  >
                    <Plus className="w-3 h-3" /> Add Task
                  </button>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};