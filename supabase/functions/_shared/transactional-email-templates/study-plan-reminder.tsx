/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "NIU Connect"

interface StudyPlanReminderProps {
  name?: string
  plan?: string
  examDate?: string
  focusAreas?: string
}

const StudyPlanReminderEmail = ({ name, plan, examDate, focusAreas }: StudyPlanReminderProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your personalized study plan from {SITE_NAME} 📚</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Text style={logo}>🎯</Text>
          <Heading style={h1}>
            {name ? `Hey ${name}, here's your study plan!` : 'Your Personalized Study Plan'}
          </Heading>
        </Section>

        <Hr style={divider} />

        {examDate && (
          <Section style={examBadgeSection}>
            <Text style={examBadge}>
              📅 Exam prep target: {examDate}
            </Text>
          </Section>
        )}

        {focusAreas && (
          <Section style={focusSection}>
            <Text style={focusLabel}>Focus areas:</Text>
            <Text style={focusText}>{focusAreas}</Text>
          </Section>
        )}

        <Section style={planSection}>
          <Heading style={h2}>📋 Your Weekly Roadmap</Heading>
          <Text style={planText}>{plan || 'No plan generated yet. Visit NIU Connect to generate your personalized plan!'}</Text>
        </Section>

        <Hr style={divider} />

        <Section style={tipSection}>
          <Text style={tipTitle}>💡 Quick Tips</Text>
          <Text style={tipText}>• Consistency beats intensity — study daily, even if just 30 mins</Text>
          <Text style={tipText}>• Review yesterday's topics before starting new ones</Text>
          <Text style={tipText}>• Take a 5-min break every 25 mins (Pomodoro technique)</Text>
        </Section>

        <Text style={footer}>
          Keep pushing! You've got this 💪<br />
          — The {SITE_NAME} Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: StudyPlanReminderEmail,
  subject: (data: Record<string, any>) =>
    data.examDate
      ? `📚 Study Reminder — Exam prep for ${data.examDate}`
      : '📚 Your Study Plan from NIU Connect',
  displayName: 'Study plan reminder',
  previewData: {
    name: 'Rahul',
    plan: 'Monday: DSA practice (2 hrs)\nTuesday: OS concepts (1.5 hrs)\nWednesday: DBMS revision (1.5 hrs)\nThursday: DSA practice (2 hrs)\nFriday: Mock tests & revision (1 hr)',
    examDate: 'May 2026',
    focusAreas: 'DSA & problem solving, Core CS (OS/DBMS/CN)',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Work Sans', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const headerSection = { textAlign: 'center' as const, marginBottom: '8px' }
const logo = { fontSize: '40px', margin: '0 0 8px', lineHeight: '1' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#0f4f3a', margin: '0 0 4px', lineHeight: '1.3' }
const h2 = { fontSize: '16px', fontWeight: '700' as const, color: '#0f4f3a', margin: '0 0 12px' }
const divider = { borderColor: '#e0ebe6', margin: '20px 0' }
const examBadgeSection = { textAlign: 'center' as const, marginBottom: '16px' }
const examBadge = { fontSize: '14px', color: '#0f4f3a', backgroundColor: '#e6f7ef', padding: '8px 16px', borderRadius: '8px', display: 'inline-block' as const, margin: '0' }
const focusSection = { marginBottom: '16px' }
const focusLabel = { fontSize: '12px', color: '#6b7280', margin: '0 0 4px', fontWeight: '600' as const, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }
const focusText = { fontSize: '14px', color: '#1f2937', margin: '0' }
const planSection = { backgroundColor: '#f8faf9', borderRadius: '12px', padding: '20px', marginBottom: '8px' }
const planText = { fontSize: '14px', color: '#374151', lineHeight: '1.7', margin: '0', whiteSpace: 'pre-line' as const }
const tipSection = { marginBottom: '8px' }
const tipTitle = { fontSize: '14px', fontWeight: '700' as const, color: '#0f4f3a', margin: '0 0 8px' }
const tipText = { fontSize: '13px', color: '#6b7280', margin: '0 0 4px', lineHeight: '1.5' }
const footer = { fontSize: '13px', color: '#9ca3af', marginTop: '24px', textAlign: 'center' as const, lineHeight: '1.6' }
