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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to the Fomuso Family! 🎉 Confirm your email</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={emoji}>🏡</Text>
        <Heading style={h1}>Welcome to the Family! 🎉</Heading>
        <Text style={text}>
          Hey there! Thanks for joining the{' '}
          <Link href={siteUrl} style={link}>
            <strong>Fomuso Family Hub</strong>
          </Link>
          — we're so excited to have you! 💕
        </Text>
        <Text style={text}>
          Just one quick thing — confirm your email (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) so we know it's really you:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Verify My Email ✨
        </Button>
        <Text style={footer}>
          Didn't sign up? No worries — just ignore this email and nothing will happen. 😊
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

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
