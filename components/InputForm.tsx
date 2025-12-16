'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, Clock, BookOpen, CheckSquare, ArrowRight, Loader2, User, Save } from 'lucide-react';
import { UserInputData, FixedEvent, Subject, Assignment, PersonalTask, Priority } from '../types';

interface InputFormProps {
  onSubmit: (data: UserInputData) => void;
  isLoading: boolean;
  initialData?: UserInputData | null;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Updated Styles: Larger, cleaner, more comfortable inputs
// Added [color-scheme:light] to ensure time/date inputs render with dark text/icons even if OS is in dark mode
const inputBaseClass = "w-full text-base border-lavender-200 rounded-xl p-3.5 bg-white text-slate-900 shadow-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 placeholder:text-slate-400 transition-all outline-none [color-scheme:light]";
const labelBaseClass = "block text-sm font-bold text-slate-600 uppercase tracking-wide mb-2";
const cardBaseClass = "bg-white p-5 rounded-2xl border border-lavender-100 shadow-sm transition-all hover:shadow-md hover:border-brand-200";

export const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading, initialData }) => {
  const [step, setStep] = useState(1);
  
  // State Initialization
  const [weekStartDate, setWeekStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [sleepStart, setSleepStart] = useState('23:00');
  const [sleepEnd, setSleepEnd] = useState('07:00');
  const [fixedEvents, setFixedEvents] = useState<FixedEvent[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([
    { id: '1', name: 'Mathematics', priority: 'High', hoursNeeded: 5 }
  ]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [personalTasks, setPersonalTasks] = useState<PersonalTask[]>([]);

  // Load initial data if provided
  useEffect(() => {
    if (initialData) {
      setWeekStartDate(initialData.weekStartDate);
      setSleepStart(initialData.sleepStart);
      setSleepEnd(initialData.sleepEnd);
      setFixedEvents(initialData.fixedEvents);
      setSubjects(initialData.subjects);
      setAssignments(initialData.assignments);
      setPersonalTasks(initialData.personalTasks);
    }
  }, [initialData]);

  // Add Item Helpers
  const addFixedEvent = () => setFixedEvents([...fixedEvents, { id: crypto.randomUUID(), day: 'Monday', startTime: '09:00', endTime: '10:00', title: '' }]);
  const addSubject = () => setSubjects([...subjects, { id: crypto.randomUUID(), name: '', priority: 'Medium', hoursNeeded: 2 }]);
  const addAssignment = () => setAssignments([...assignments, { id: crypto.randomUUID(), name: '', description: '', deadline: weekStartDate, estimatedHours: 2, subjectId: subjects[0]?.id || '' }]);
  const addPersonalTask = () => setPersonalTasks([...personalTasks, { id: crypto.randomUUID(), name: '', deadline: weekStartDate, estimatedHours: 1, priority: 'Medium' }]);

  // Update/Remove Helpers
  const updateFixedEvent = (id: string, field: keyof FixedEvent, value: string) => setFixedEvents(fixedEvents.map(e => e.id === id ? { ...e, [field]: value } : e));
  const removeFixedEvent = (id: string) => setFixedEvents(fixedEvents.filter(e => e.id !== id));
  
  const updateSubject = (id: string, field: keyof Subject, value: any) => setSubjects(subjects.map(s => s.id === id ? { ...s, [field]: value } : s));
  const removeSubject = (id: string) => setSubjects(subjects.filter(s => s.id !== id));
  
  const updateAssignment = (id: string, field: keyof Assignment, value: any) => setAssignments(assignments.map(a => a.id === id ? { ...a, [field]: value } : a));
  const removeAssignment = (id: string) => setAssignments(assignments.filter(a => a.id !== id));
  
  const updatePersonalTask = (id: string, field: keyof PersonalTask, value: any) => setPersonalTasks(personalTasks.map(p => p.id === id ? { ...p, [field]: value } : p));
  const removePersonalTask = (id: string) => setPersonalTasks(personalTasks.filter(p => p.id !== id));

  const handleSubmit = () => {
    onSubmit({
      weekStartDate,
      sleepStart,
      sleepEnd,
      fixedEvents,
      subjects,
      assignments,
      personalTasks
    });
  };

  const renderStep1 = () => (
    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 bg-brand-100 rounded-2xl text-brand-600 shadow-sm"><Clock className="w-8 h-8" /></div>
        <div>
          <h3 className="text-xl font-bold text-slate-800">Time & Sleep</h3>
          <p className="text-base text-slate-500">Set your boundaries for the week.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <label className={labelBaseClass}>Week Start Date</label>
          <input type="date" className={inputBaseClass} value={weekStartDate} onChange={(e) => setWeekStartDate(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <label className={labelBaseClass}>Sleep Start (Bedtime)</label>
          <input type="time" className={inputBaseClass} value={sleepStart} onChange={(e) => setSleepStart(e.target.value)} />
        </div>
        <div>
          <label className={labelBaseClass}>Wake Up Time</label>
          <input type="time" className={inputBaseClass} value={sleepEnd} onChange={(e) => setSleepEnd(e.target.value)} />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-lavender-100 rounded-2xl text-lavender-600 shadow-sm"><Calendar className="w-8 h-8" /></div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Fixed Events</h3>
            <p className="text-base text-slate-500">Classes, Work, Appointments.</p>
          </div>
        </div>
        <button onClick={addFixedEvent} className="text-sm bg-lavender-50 hover:bg-lavender-100 text-lavender-700 px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-colors border border-lavender-200 shadow-sm">
          <Plus className="w-4 h-4" /> Add Event
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {fixedEvents.map((event) => (
          <div key={event.id} className={`${cardBaseClass} flex flex-col md:flex-row gap-6 items-start md:items-center`}>
            <div className="w-full md:w-1/4">
               <label className="text-xs text-slate-500 mb-1.5 block font-semibold md:hidden">Day</label>
               <select className={inputBaseClass} value={event.day} onChange={(e) => updateFixedEvent(event.id, 'day', e.target.value)}>
                 {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
               </select>
            </div>
            <div className="w-full md:w-1/4 grid grid-cols-2 gap-4">
               <div>
                  <label className="text-xs text-slate-500 mb-1.5 block font-semibold md:hidden">Start</label>
                  <input type="time" className={inputBaseClass} value={event.startTime} onChange={e => updateFixedEvent(event.id, 'startTime', e.target.value)} />
               </div>
               <div>
                  <label className="text-xs text-slate-500 mb-1.5 block font-semibold md:hidden">End</label>
                  <input type="time" className={inputBaseClass} value={event.endTime} onChange={e => updateFixedEvent(event.id, 'endTime', e.target.value)} />
               </div>
            </div>
            <div className="w-full md:w-2/5">
                <label className="text-xs text-slate-500 mb-1.5 block font-semibold md:hidden">Title</label>
                <input type="text" placeholder="Event Title (e.g. Work)" className={inputBaseClass} value={event.title} onChange={e => updateFixedEvent(event.id, 'title', e.target.value)} />
            </div>
            <button onClick={() => removeFixedEvent(event.id)} className="p-3 rounded-xl text-slate-400 hover:text-coral-500 hover:bg-coral-50 transition-colors self-end md:self-center">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-brand-100 rounded-2xl text-brand-600 shadow-sm"><BookOpen className="w-8 h-8" /></div>
           <div>
            <h3 className="text-xl font-bold text-slate-800">Subjects</h3>
            <p className="text-base text-slate-500">What are you studying this week?</p>
          </div>
        </div>
        <button onClick={addSubject} className="text-sm bg-brand-50 hover:bg-brand-100 text-brand-700 px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-colors border border-brand-200 shadow-sm">
          <Plus className="w-4 h-4" /> Add Subject
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {subjects.map((subject) => (
          <div key={subject.id} className={`${cardBaseClass} flex flex-col md:flex-row gap-6 items-start md:items-center`}>
            <div className="w-full md:w-2/5">
                <label className="text-xs text-slate-500 mb-1.5 block font-semibold md:hidden">Subject Name</label>
                <input type="text" placeholder="Subject Name (e.g. Math)" className={inputBaseClass} value={subject.name} onChange={e => updateSubject(subject.id, 'name', e.target.value)} />
            </div>
            <div className="w-full md:w-1/4">
               <label className="text-xs text-slate-500 mb-1.5 block font-semibold md:hidden">Priority</label>
               <select className={inputBaseClass} value={subject.priority} onChange={e => updateSubject(subject.id, 'priority', e.target.value as Priority)}>
                 <option value="High">High Priority</option>
                 <option value="Medium">Medium</option>
                 <option value="Low">Low</option>
               </select>
            </div>
            <div className="w-full md:w-1/4">
               <label className="text-xs text-slate-500 mb-1.5 block font-semibold md:hidden">Target Hours</label>
               <div className="relative">
                 <input type="number" className={`${inputBaseClass} pr-12`} value={subject.hoursNeeded} onChange={e => updateSubject(subject.id, 'hoursNeeded', parseInt(e.target.value) || 0)} />
                 <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium pointer-events-none">hrs</span>
               </div>
            </div>
            <button onClick={() => removeSubject(subject.id)} className="p-3 rounded-xl text-slate-400 hover:text-coral-500 hover:bg-coral-50 transition-colors self-end md:self-center">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6 animate-fade-in">
       <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-lavender-200 rounded-2xl text-lavender-700 shadow-sm"><CheckSquare className="w-8 h-8" /></div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Assignments</h3>
            <p className="text-base text-slate-500">Deadlines and deliverables.</p>
          </div>
        </div>
        <button onClick={addAssignment} className="text-sm bg-lavender-50 hover:bg-lavender-100 text-lavender-700 px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-colors border border-lavender-200 shadow-sm">
          <Plus className="w-4 h-4" /> Add Assignment
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {assignments.map((assignment) => (
          <div key={assignment.id} className={cardBaseClass}>
            <div className="space-y-4">
              {/* Name and Subject */}
              <div className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Assignment Name (e.g. Midterm Paper)" 
                  className={`${inputBaseClass} font-semibold`} 
                  value={assignment.name} 
                  onChange={e => updateAssignment(assignment.id, 'name', e.target.value)} 
                />
                
                <textarea 
                  placeholder="Details (e.g. 2000 words on Ancient Rome history...)"
                  className={`${inputBaseClass} resize-none`}
                  rows={2}
                  value={assignment.description || ''}
                  onChange={e => updateAssignment(assignment.id, 'description', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Subject</label>
                   <select className={inputBaseClass} value={assignment.subjectId} onChange={e => updateAssignment(assignment.id, 'subjectId', e.target.value)}>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name || 'Unnamed Subject'}</option>)}
                   </select>
                </div>
                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Deadline</label>
                   <input type="date" className={inputBaseClass} value={assignment.deadline} onChange={e => updateAssignment(assignment.id, 'deadline', e.target.value)} />
                </div>
              </div>
              
              <div className="flex items-end gap-4">
                 <div className="relative flex-1">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Estimated Effort</label>
                   <div className="relative">
                      <input type="number" placeholder="Est. Hours" className={`${inputBaseClass} pr-16`} value={assignment.estimatedHours} onChange={e => updateAssignment(assignment.id, 'estimatedHours', parseFloat(e.target.value) || 0)} />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium pointer-events-none">hours</span>
                   </div>
                 </div>
                 <button onClick={() => removeAssignment(assignment.id)} className="p-3.5 rounded-xl text-slate-300 hover:text-coral-500 hover:bg-coral-50 transition-colors border border-transparent hover:border-coral-100">
                    <Trash2 className="w-5 h-5" />
                 </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6 animate-fade-in">
       <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-coral-100 rounded-2xl text-coral-600 shadow-sm"><User className="w-8 h-8" /></div>
          <div>
             <h3 className="text-xl font-bold text-slate-800">Life & Chores</h3>
             <p className="text-base text-slate-500">Personal to-dos and errands.</p>
          </div>
        </div>
        <button onClick={addPersonalTask} className="text-sm bg-coral-50 hover:bg-coral-100 text-coral-700 px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-colors border border-coral-200 shadow-sm">
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {personalTasks.length === 0 && <div className="col-span-2 text-slate-400 italic text-base text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">No personal tasks added. Enjoy your free time!</div>}
        {personalTasks.map((task) => (
          <div key={task.id} className={cardBaseClass}>
            <div className="space-y-4">
               <input type="text" placeholder="Task Name (e.g. Laundry)" className={`${inputBaseClass} font-semibold`} value={task.name} onChange={e => updatePersonalTask(task.id, 'name', e.target.value)} />
               
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Priority</label>
                    <select className={inputBaseClass} value={task.priority} onChange={e => updatePersonalTask(task.id, 'priority', e.target.value)}>
                       <option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Deadline</label>
                    <input type="date" className={inputBaseClass} value={task.deadline} onChange={e => updatePersonalTask(task.id, 'deadline', e.target.value)} />
                  </div>
               </div>

               <div className="flex items-end gap-4">
                  <div className="relative flex-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Est. Effort</label>
                    <div className="relative">
                      <input type="number" placeholder="Est. Hours" className={`${inputBaseClass} pr-16`} value={task.estimatedHours} onChange={e => updatePersonalTask(task.id, 'estimatedHours', parseFloat(e.target.value) || 0)} />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium pointer-events-none">hours</span>
                    </div>
                  </div>
                  <button onClick={() => removePersonalTask(task.id)} className="p-3.5 rounded-xl text-slate-300 hover:text-coral-500 hover:bg-coral-50 transition-colors border border-transparent hover:border-coral-100"><Trash2 className="w-5 h-5" /></button>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl shadow-lavender-200/50 border border-white overflow-hidden transition-all">
      {/* Progress Bar */}
      <div className="bg-slate-50/80 px-6 py-5 border-b border-lavender-100 flex justify-between items-center sticky top-0 z-10 backdrop-blur-md">
        <div className="flex space-x-2">
           {[1, 2, 3, 4, 5].map(i => (
             <div key={i} className={`h-2 w-8 md:w-10 rounded-full transition-all duration-300 ${step >= i ? 'bg-brand-500' : 'bg-slate-200'}`} />
           ))}
        </div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Step {step} of 5</span>
      </div>

      <div className="p-6 md:p-10 min-h-[500px]">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
      </div>

      <div className="px-6 py-5 bg-slate-50 border-t border-lavender-100 flex justify-between items-center">
        <button 
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1 || isLoading}
          className="px-6 py-3 rounded-xl text-slate-600 font-bold hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:shadow-none transition-all"
        >
          Back
        </button>
        
        {step < 5 ? (
          <button 
            onClick={() => setStep(Math.min(5, step + 1))}
            className="px-8 py-3 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 hover:shadow-lg hover:shadow-slate-500/20 transition-all flex items-center gap-2"
          >
            Next <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <button 
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-10 py-3 rounded-xl bg-brand-500 text-white font-bold hover:bg-brand-600 hover:shadow-lg hover:shadow-brand-500/30 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Generate Schedule
          </button>
        )}
      </div>
    </div>
  );
};