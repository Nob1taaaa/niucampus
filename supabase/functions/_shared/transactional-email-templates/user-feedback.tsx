/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "NIU Connect"

interface FeedbackProps {
  category?: string
  message?: string
  fromUser?: string
  submittedAt?: string
}

const FeedbackEmail = ({ category, message, fromUser, submittedAt }: FeedbackProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New feedback from {SITE_NAME} — {category || 'General'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>💌 New Feedback</Heading>
          <Text style={subtitle}>Someone just shared their thoughts on {SITE_NAME}</Text>
        </Section>

        <Section style={card}>
          <Text style={label}>Category</Text>
          <Text style={value}>{category || 'Not specified'}</Text>

          <Hr style={divider} />

          <Text style={label}>From</Text>
          <Text style={value}>{fromUser || 'Anonymous user'}</Text>

          <Hr style={divider} />

          <Text style={label}>Message</Text>
          <Text style={messageStyle}>{message || '(no message)'}</Text>

          {submittedAt && (
            <>
              <Hr style={divider} />
              <Text style={label}>Submitted</Text>
              <Text style={value}>{submittedAt}</Text>
            </>
          )}
        </Section>

        <Text style={footer}>
          This feedback was sent from the {SITE_NAME} app feedback form.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: FeedbackEmail,
  subject: (data: Record<string, any>) =>
    `💌 New ${SITE_NAME} feedback: ${data?.category || 'General'}`,
  to: 'niucampusorg@gmail.com',
  displayName: 'User feedback',
  previewData: {
    category: '💡 Idea',
    message: 'It would be amazing to have a dark mode toggle!',
    fromUser: 'jane@example.com',
    submittedAt: new Date().toLocaleString(),
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '32px 24px', maxWidth: '560px', margin: '0 auto' }
const header = { textAlign: 'center' as const, marginBottom: '24px' }
const h1 = { fontSize: '26px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px' }
const subtitle = { fontSize: '14px', color: '#64748b', margin: '0' }
const card = {
  backgroundColor: '#f8fafc',
  borderRadius: '16px',
  padding: '24px',
  border: '1px solid #e2e8f0',
}
const label = {
  fontSize: '11px',
  fontWeight: 'bold' as const,
  color: '#16a34a',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  margin: '0 0 4px',
}
const value = { fontSize: '15px', color: '#0f172a', margin: '0 0 8px', fontWeight: '500' as const }
const messageStyle = {
  fontSize: '15px',
  color: '#0f172a',
  margin: '0',
  lineHeight: '1.6',
  whiteSpace: 'pre-wrap' as const,
}
const divider = { borderColor: '#e2e8f0', margin: '16px 0' }
const footer = { fontSize: '12px', color: '#94a3b8', textAlign: 'center' as const, marginTop: '24px' }
