export type Priority = 'High' | 'Medium' | 'Low';
export type ActivityType = 'Study' | 'Work' | 'Fixed' | 'Break' | 'Personal' | 'Chore';

export interface FixedEvent {
  id: string;
  day: string; // "Monday", "Tuesday", etc.
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  title: string;
}

export interface Subject {
  id: string;
  name: string;
  priority: Priority;
  hoursNeeded: number;
}

export interface Assignment {
  id: string;
  name: string;
  description?: string; // Added description field
  deadline: string; // YYYY-MM-DD
  estimatedHours: number;
  subjectId: string; // Reference to subject
}

export interface PersonalTask {
  id: string;
  name: string;
  deadline: string; // YYYY-MM-DD
  estimatedHours: number;
  priority: Priority;
}

export interface UserInputData {
  weekStartDate: string; // YYYY-MM-DD
  sleepStart: string; // HH:MM
  sleepEnd: string; // HH:MM
  fixedEvents: FixedEvent[];
  subjects: Subject[];
  assignments: Assignment[];
  personalTasks: PersonalTask[];
}

// Output from Gemini
export interface ScheduleTask {
  id: string; // Added ID for reliable editing
  time_start: string;
  time_end: string;
  duration_minutes: number;
  activity_type: ActivityType;
  subject_or_task: string;
  priority_level: Priority | 'N/A';
  notes: string;
  isCompleted?: boolean; 
  is_ai_generated?: boolean; // Distinguish between user-defined and AI-suggested tasks
}

export interface DaySchedule {
  day: string;
  date: string;
  tasks: ScheduleTask[];
}

export interface SummaryReview {
  total_study_hours: string;
  deadlines_met: string;
  high_priority_focus: string;
  life_balance_score: string;
}

export interface GeneratedSchedule {
  optimized_weekly_schedule: DaySchedule[];
  summary_review: SummaryReview;
}