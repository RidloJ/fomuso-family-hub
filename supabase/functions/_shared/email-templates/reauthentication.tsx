/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Fomuso Family Hub verification code 🔐</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={emoji}>🔐</Text>
        <Heading style={h1}>Your Verification Code</Heading>
        <Text style={text}>
          Hey! Use this code to confirm your identity on the Fomuso Family Hub:
        </Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          This code expires soon. Didn't request it? Just ignore this email. 😊
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

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
}
const codeStyle = {
  fontFamily: "'Fredoka', Courier, monospace",
  fontSize: '32px',
  fontWeight: 'bold' as const,
  color: 'hsl(345, 80%, 50%)',
  margin: '0 0 30px',
  letterSpacing: '6px',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
