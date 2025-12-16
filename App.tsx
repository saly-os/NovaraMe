import React, { useState } from 'react';
import { InputForm } from './components/InputForm';
import { ScheduleView } from './components/ScheduleView';
import { Dashboard } from './components/Dashboard';
import { UserInputData, GeneratedSchedule } from './types';
import { generateSchedule } from './services/geminiService';
import { RotateCcw, LayoutDashboard, Calendar, Sun, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [scheduleData, setScheduleData] = useState<GeneratedSchedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'calendar' | 'dashboard'>('calendar');

  const handleGenerate = async (data: UserInputData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateSchedule(data);
      setScheduleData(result);
    } catch (err: any) {
      setError(err.message || "Failed to generate schedule. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    if (window.confirm("Are you sure you want to create a new schedule? Current data will be lost.")) {
      setScheduleData(null);
      setError(null);
    }
  };

  return (
    <div className="min-h-screen bg-lavender-50 text-slate-900 font-sans pb-20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-lavender-200 sticky top-0 z-50">
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
             <div className="flex gap-2">
               <button 
                onClick={() => setView('calendar')}
                className={`p-2 rounded-md transition ${view === 'calendar' ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-lavender-50'}`}
                title="Calendar View"
               >
                 <Calendar className="w-5 h-5" />
               </button>
               <button 
                onClick={() => setView('dashboard')}
                className={`p-2 rounded-md transition ${view === 'dashboard' ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-lavender-50'}`}
                title="Analytics View"
               >
                 <LayoutDashboard className="w-5 h-5" />
               </button>
               <div className="w-px h-8 bg-lavender-200 mx-2"></div>
               <button 
                onClick={reset}
                className="text-sm px-3 py-1.5 border border-lavender-200 rounded-md text-slate-600 hover:bg-lavender-50 flex items-center gap-2 transition"
               >
                 <RotateCcw className="w-4 h-4" /> New
               </button>
             </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!scheduleData ? (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-slate-800 mb-4">Optimize Your Academic Week</h2>
              <p className="text-lg text-slate-600">
                Input your fixed commitments, subjects, and assignments. AI will build your perfect study routine.
              </p>
            </div>
            
            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 mb-6 flex items-start">
                <div className="mr-3 mt-1 text-xl">⚠️</div>
                <div>
                  <h4 className="font-bold">Generation Failed</h4>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

            <InputForm onSubmit={handleGenerate} isLoading={loading} />
          </div>
        ) : (
          <div>
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                 <h2 className="text-2xl font-bold text-slate-800">Your Optimized Schedule</h2>
                 <p className="text-slate-500">Generated for week starting {scheduleData.optimized_weekly_schedule[0]?.date}</p>
              </div>
            </div>

            {view === 'calendar' ? (
              <ScheduleView scheduleData={scheduleData} />
            ) : (
              <Dashboard scheduleData={scheduleData} />
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;