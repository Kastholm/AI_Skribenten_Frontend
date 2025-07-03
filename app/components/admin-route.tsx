"use client"

import type React from "react"

import { useAuth } from "@/app/context/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface AdminRouteProps {
  children: React.ReactNode
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/")
    }
  }, [user, loading, router])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user || user.role !== "admin") {
    return null
  }

  return <>{children}</>
}
