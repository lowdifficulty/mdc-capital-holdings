import { ALFRED_INSTRUCTIONS } from "@/lib/voice/alfred-system-prompt";
import { dashboardTodayIso } from "@/lib/voice/dates";

export const REALTIME_MODEL =
  process.env.OPENAI_REALTIME_MODEL || "gpt-realtime-1.5";

const OPERATIONS_TOOLS = [
  {
    type: "function" as const,
    name: "get_daily_brief",
    description:
      "Get today's (or a specific date's) operations brief: todos, workout, meals, peptides, custody, notes, and completion status.",
    parameters: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: `ISO date YYYY-MM-DD. Defaults to today (${dashboardTodayIso()} Pacific).`,
        },
      },
      required: [],
    },
  },
  {
    type: "function" as const,
    name: "add_todo",
    description: "Add a todo item to the day list or custody list.",
    parameters: {
      type: "object",
      properties: {
        text: { type: "string", description: "Todo text" },
        date: { type: "string", description: "ISO date YYYY-MM-DD" },
        custody: {
          type: "boolean",
          description: "If true, add to custody todo list (David & Charles week)",
        },
      },
      required: ["text"],
    },
  },
  {
    type: "function" as const,
    name: "complete_todo",
    description: "Mark a todo as done by id or partial text match.",
    parameters: {
      type: "object",
      properties: {
        todo_id: { type: "string", description: "Todo UUID" },
        text: { type: "string", description: "Partial todo text to match" },
        date: { type: "string", description: "ISO date YYYY-MM-DD" },
      },
      required: [],
    },
  },
  {
    type: "function" as const,
    name: "log_peptide_taken",
    description: "Mark a scheduled peptide dose as taken.",
    parameters: {
      type: "object",
      properties: {
        peptide_id: { type: "string", description: "Peptide checkoff id" },
        compound_name: {
          type: "string",
          description: 'Compound name e.g. "Retatrutide", "HGH", "Testosterone"',
        },
        date: { type: "string", description: "ISO date YYYY-MM-DD" },
      },
      required: [],
    },
  },
  {
    type: "function" as const,
    name: "log_meal_eaten",
    description: "Mark a scheduled meal as eaten.",
    parameters: {
      type: "object",
      properties: {
        meal_id: { type: "string", description: "Meal checkoff id" },
        meal_label: { type: "string", description: 'Meal label e.g. "Meal 1"' },
        date: { type: "string", description: "ISO date YYYY-MM-DD" },
      },
      required: [],
    },
  },
  {
    type: "function" as const,
    name: "log_workout_complete",
    description: "Mark today's scheduled workout as completed.",
    parameters: {
      type: "object",
      properties: {
        date: { type: "string", description: "ISO date YYYY-MM-DD" },
      },
      required: [],
    },
  },
  {
    type: "function" as const,
    name: "log_cardio_complete",
    description: "Mark 30 minutes of cardio as completed for the day.",
    parameters: {
      type: "object",
      properties: {
        date: { type: "string", description: "ISO date YYYY-MM-DD" },
      },
      required: [],
    },
  },
  {
    type: "function" as const,
    name: "update_day_note",
    description: "Save the main day journal note.",
    parameters: {
      type: "object",
      properties: {
        note: { type: "string", description: "Note text" },
        date: { type: "string", description: "ISO date YYYY-MM-DD" },
      },
      required: ["note"],
    },
  },
  {
    type: "function" as const,
    name: "update_section_note",
    description: "Save a plan note for a calendar section.",
    parameters: {
      type: "object",
      properties: {
        section: {
          type: "string",
          description: "custody | workout | meal | todo | peptides",
        },
        text: { type: "string", description: "Note text" },
        date: { type: "string", description: "ISO date YYYY-MM-DD" },
      },
      required: ["section", "text"],
    },
  },
];

export function getRealtimeSessionConfig() {
  return {
    type: "realtime" as const,
    model: REALTIME_MODEL,
    output_modalities: ["text"],
    instructions: ALFRED_INSTRUCTIONS,
    tool_choice: "auto" as const,
    tools: OPERATIONS_TOOLS,
    audio: {
      input: {
        transcription: { model: "whisper-1" },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
          create_response: true,
          interrupt_response: true,
        },
      },
    },
  };
}

export function getRealtimeSessionUpdate() {
  return {
    type: "realtime" as const,
    model: REALTIME_MODEL,
    instructions: ALFRED_INSTRUCTIONS,
    tool_choice: "auto" as const,
    tools: OPERATIONS_TOOLS,
    output_modalities: ["text"],
    audio: {
      input: {
        transcription: { model: "whisper-1" },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
          create_response: true,
          interrupt_response: true,
        },
      },
    },
  };
}
