import type React from "react"
import { AuthProvider } from "./context/auth-context"
import "./globals.css"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Next.js with FastAPI Auth",
  description: "A simple authentication app using Next.js and FastAPI",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
