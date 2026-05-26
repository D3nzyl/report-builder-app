import { createContext, useContext } from "react";
import type { FormQuestion, FormAnswers, Collection } from "./types";

interface QuestionsContextValue {
  questions: FormQuestion[];
  answers: FormAnswers;
  updateQuestion: (id: string, updates: Partial<FormQuestion>) => void;
  collections: Collection[];
}

export const QuestionsContext = createContext<QuestionsContextValue>({
  questions: [],
  answers: {},
  updateQuestion: () => {},
  collections: [],
});

export function useQuestions() {
  return useContext(QuestionsContext);
}
