'use server';

import { GoogleGenAI, Type, Schema } from "@google/genai";
import { UserInputData, GeneratedSchedule, ScheduleTask } from "../types";

// Initialize Gemini on the server side
// The API key is securely accessed from process.env on the server
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    optimized_weekly_schedule: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.STRING },
          date: { type: Type.STRING },
          tasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                time_start: { type: Type.STRING },
                time_end: { type: Type.STRING },
                duration_minutes: { type: Type.NUMBER },
                activity_type: { type: Type.STRING, enum: ["Study", "Work", "Fixed", "Break", "Personal", "Chore"] },
                subject_or_task: { type: Type.STRING },
                priority_level: { type: Type.STRING, enum: ["High", "Medium", "Low", "N/A"] },
                notes: { type: Type.STRING },
                is_ai_generated: { type: Type.BOOLEAN },
              },
              required: ["time_start", "time_end", "duration_minutes", "activity_type", "subject_or_task", "priority_level", "notes", "is_ai_generated"],
            },
          },
        },
        required: ["day", "date", "tasks"],
      },
    },
    summary_review: {
      type: Type.OBJECT,
      properties: {
        total_study_hours: { type: Type.STRING },
        deadlines_met: { type: Type.STRING },
        high_priority_focus: { type: Type.STRING },
        life_balance_score: { type: Type.STRING },
      },
      required: ["total_study_hours", "deadlines_met", "high_priority_focus", "life_balance_score"],
    },
  },
  required: ["optimized_weekly_schedule", "summary_review"],
};

export async function generateScheduleAction(data: UserInputData, lockedTasks: ScheduleTask[] = []): Promise<GeneratedSchedule> {
  const { weekStartDate, sleepStart, sleepEnd, fixedEvents, subjects, assignments, personalTasks } = data;

  // Format inputs for the prompt
  const fixedEventsStr = fixedEvents
    .map((e) => `- ${e.day} ${e.startTime}-${e.endTime}: ${e.title}`)
    .join("\n");

  const subjectsStr = subjects
    .map((s) => `- ${s.name}: ${s.priority}`)
    .join("\n");

  const hoursStr = subjects
    .map((s) => `- ${s.name}: ${s.hoursNeeded} hours`)
    .join("\n");

  const assignmentsStr = assignments
    .map((a) => `- Academic Task: ${a.name} (${subjects.find(s => s.id === a.subjectId)?.name || 'Unknown Subject'}), Details: ${a.description || 'None'}, Deadline: ${a.deadline}, Est. Hours: ${a.estimatedHours}`)
    .join("\n");

  const personalTasksStr = personalTasks
    .map((p) => `- Personal Task: ${p.name}, Priority: ${p.priority}, Deadline: ${p.deadline}, Est. Hours: ${p.estimatedHours}`)
    .join("\n");

  // Format locked tasks to ensure the AI respects them
  const lockedTasksContext = lockedTasks.length > 0 
    ? `\n**LOCKED TASKS (MUST PRESERVE):**\nThe following tasks are already scheduled by the user and MUST appear in the schedule at their exact times. Do not move, remove, or modify them. Fill gaps around them.\n${lockedTasks.map(t => `- [${t.activity_type}] ${t.time_start}-${t.time_end}: ${t.subject_or_task} (Priority: ${t.priority_level})`).join('\n')}`
    : '';

  const prompt = `
You are an Expert Life & Academic Planner.
Generate a fully optimized, 7-day Weekly Schedule starting from ${weekStartDate}.

**User Context:**
- **Week Start:** ${weekStartDate}
- **Sleep Schedule:** ${sleepStart} to ${sleepEnd} (Strictly OFF LIMITS)

**Inputs:**
1. **Fixed Commitments:**
${fixedEventsStr || "None"}

2. **Academic Focus:**
${subjectsStr || "None"}
(Target Hours: \n${hoursStr || "None"})

3. **Academic Assignments:**
${assignmentsStr || "None"}

4. **Personal Tasks & Chores:**
${personalTasksStr || "None"}
${lockedTasksContext}

**Optimization Rules:**
1. **Prioritization:** Deadlines first. Then High Priority items (Academic or Personal).
2. **Breaks:** Insert a 15-minute 'Break' for every 90-120 mins of deep work.
3. **Session Length:** Academic blocks: 60-120 mins. Personal tasks: 30-60 mins.
4. **Balance:** Ensure personal tasks are scheduled during lighter academic days if possible.
5. **Activity Types:** Use 'Study' for academic, 'Personal' or 'Chore' for life tasks.
6. **Origin Flagging:** Set 'is_ai_generated' to FALSE for tasks that come directly from User Inputs (Fixed Events, Assignments, Personal Tasks, or Locked Tasks). Set 'is_ai_generated' to TRUE for suggestions you create (Breaks, Meals, Filler Study Blocks).

Output strictly valid JSON matching the schema.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as GeneratedSchedule;
    } else {
      throw new Error("No response generated.");
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate schedule. Please try again.");
  }
}