"use client"

import React from 'react'
import dynamic from 'next/dynamic'

// Render the full Admin Viral Recipe Book page to match design 1:1
const AdminRecipeBookPage = dynamic(() => import('@/app/admin/viral-recipe-book/page'), { ssr: false })

export default function MemberRecipeBookPage() {
  return <AdminRecipeBookPage />
}


