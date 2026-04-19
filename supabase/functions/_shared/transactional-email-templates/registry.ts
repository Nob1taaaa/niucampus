/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as studyPlanReminder } from './study-plan-reminder.tsx'
import { template as userFeedback } from './user-feedback.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'study-plan-reminder': studyPlanReminder,
  'user-feedback': userFeedback,
}
