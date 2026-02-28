"use client";

import { useReducer } from "react";
import type { Question } from "@/payload-types";

export type AnswerMap = Record<string, string>;
export type FlagMap = Record<string, boolean>;
export type ExamStatus = "loading" | "ready" | "running" | "bridging" | "finished";

export type SubtestQuestion = NonNullable<Question["tryoutQuestions"]>[number];


export interface ExamState {
  attemptId: string | null;
  status: ExamStatus;
  currentSubtestIndex: number;
  currentQuestionIndex: number;
  answers: Record<string, AnswerMap>;
  flags: Record<string, FlagMap>;
  bridgingSeconds: number;
  subtestDurations: Record<string, number>;
  dialogs: {
    confirmFinish: boolean;
    exit: boolean;
    timeUp: boolean;
  };
}

export type ExamAction =
  | { type: "SET_ATTEMPT"; id: string; status?: ExamStatus }
  | { type: "START_EXAM"; initialSeconds: number }
  | { type: "SET_STATUS"; status: ExamStatus }
  | { type: "SET_ANSWER"; subtestId: string; questionId: string; answerId: string }
  | { type: "TOGGLE_FLAG"; subtestId: string; questionId: string }
  | { type: "SET_SUBTEST"; index: number }
  | { type: "SET_QUESTION"; index: number }
  | { type: "NEXT_QUESTION" }
  | { type: "PREV_QUESTION" }
  | { type: "SET_BRIDGING_SECONDS"; seconds: number }
  | { type: "SET_DIALOG"; dialog: keyof ExamState["dialogs"]; open: boolean }
  | { type: "SET_SUBTEST_DURATION"; subtestId: string; elapsedSeconds: number }
  | {
      type: "LOAD_STATE";
      state: Partial<ExamState>;
    };

const initialState: ExamState = {
  attemptId: null,
  status: "loading",
  currentSubtestIndex: 0,
  currentQuestionIndex: 0,
  answers: {},
  flags: {},
  bridgingSeconds: 60,
  subtestDurations: {},
  dialogs: {
    confirmFinish: false,
    exit: false,
    timeUp: false,
  },
};

function examReducer(state: ExamState, action: ExamAction): ExamState {
  switch (action.type) {
    case "SET_ATTEMPT":
      return {
        ...state,
        attemptId: action.id,
        status: action.status ?? state.status,
      };
    case "SET_STATUS":
      return { ...state, status: action.status };
    case "SET_ANSWER":
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.subtestId]: {
            ...(state.answers[action.subtestId] || {}),
            [action.questionId]: action.answerId,
          },
        },
      };
    case "TOGGLE_FLAG": {
      const currentSubFlags = state.flags[action.subtestId] || {};
      const newFlag = !currentSubFlags[action.questionId];
      return {
        ...state,
        flags: {
          ...state.flags,
          [action.subtestId]: {
            ...currentSubFlags,
            [action.questionId]: newFlag,
          },
        },
      };
    }
    case "SET_SUBTEST":
      return { ...state, currentSubtestIndex: action.index, currentQuestionIndex: 0 };
    case "SET_QUESTION":
      return { ...state, currentQuestionIndex: action.index };
    case "NEXT_QUESTION":
      return { ...state, currentQuestionIndex: state.currentQuestionIndex + 1 };
    case "PREV_QUESTION":
      return { ...state, currentQuestionIndex: Math.max(0, state.currentQuestionIndex - 1) };
    case "SET_BRIDGING_SECONDS":
      return { ...state, bridgingSeconds: action.seconds };
    case "SET_DIALOG":
      return {
        ...state,
        dialogs: { ...state.dialogs, [action.dialog]: action.open },
      };
    case "LOAD_STATE":
      return { ...state, ...action.state };
    case "SET_SUBTEST_DURATION":
      return {
        ...state,
        subtestDurations: {
          ...state.subtestDurations,
          [action.subtestId]: action.elapsedSeconds,
        },
      };
    default:
      return state;
  }
}

export function useExamState() {
  const [state, dispatch] = useReducer(examReducer, initialState);
  return { state, dispatch };
}
