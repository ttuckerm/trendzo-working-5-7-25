import { z } from 'zod'
import {
  LLMContextSchema,
  TeacherInputSchema,
  TeacherOutputSchema,
  ScoutInputSchema,
  ScoutOutputSchema,
  JudgeInputSchema,
  JudgeOutputSchema
} from './schemas'

export type LLMContext = z.infer<typeof LLMContextSchema>

export type TeacherInput = z.infer<typeof TeacherInputSchema>
export type TeacherOutput = z.infer<typeof TeacherOutputSchema>

export type ScoutInput = z.infer<typeof ScoutInputSchema>
export type ScoutOutput = z.infer<typeof ScoutOutputSchema>

export type JudgeInput = z.infer<typeof JudgeInputSchema>
export type JudgeOutput = z.infer<typeof JudgeOutputSchema>

export type LLMRole = LLMContext['role']

export {
  TeacherOutputSchema,
  ScoutOutputSchema,
  JudgeOutputSchema
} from './schemas'


