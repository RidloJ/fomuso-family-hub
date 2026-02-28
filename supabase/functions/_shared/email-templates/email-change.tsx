/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your new email for Fomuso Family Hub 📧</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={emoji}>📧</Text>
        <Heading style={h1}>Confirm Your New Email</Heading>
        <Text style={text}>
          Hey! You asked to change your Fomuso Family Hub email from{' '}
          <Link href={`mailto:${email}`} style={link}>
            {email}
          </Link>{' '}
          to{' '}
          <Link href={`mailto:${newEmail}`} style={link}>
            {newEmail}
          </Link>
          . Just tap below to make it official! 🎉
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirm Email Change ✅
        </Button>
        <Text style={footer}>
          Didn't request this? Please secure your account right away. 🔒
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Fredoka', 'Nunito', Arial, sans-serif" }
const container = { padding: '30px 25px', textAlign: 'center' as const }
const emoji = { fontSize: '48px', margin: '0 0 10px', textAlign: 'center' as const }
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: 'hsl(220, 30%, 15%)',
  margin: '0 0 20px',
}
const text = {
  fontSize: '15px',
  color: 'hsl(220, 15%, 40%)',
  lineHeight: '1.6',
  margin: '0 0 20px',
  textAlign: 'left' as const,
}
const link = { color: 'hsl(345, 80%, 50%)', textDecoration: 'underline' }
const button = {
  backgroundColor: 'hsl(345, 80%, 50%)',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold' as const,
  borderRadius: '16px',
  padding: '14px 28px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0', textAlign: 'left' as const }
