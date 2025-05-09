"use client"

import React from 'react'
import { ToastProvider as InternalToastProvider } from "./toast"

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <InternalToastProvider>{children}</InternalToastProvider>
} 