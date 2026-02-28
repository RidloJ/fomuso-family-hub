/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your Fomuso Family Hub password 🔑</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={emoji}>🔑</Text>
        <Heading style={h1}>Forgot Your Password? No Worries!</Heading>
        <Text style={text}>
          Hey! We got a request to reset your password for the Fomuso Family Hub.
          Click the button below to pick a new one — easy peasy! 😊
        </Text>
        <Button style={button} href={confirmationUrl}>
          Reset My Password 🔒
        </Button>
        <Text style={footer}>
          Didn't ask for this? Just ignore this email — your password stays the same. 💕
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

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
