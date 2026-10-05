import Navbar from '@/components/Navbar'
import React from 'react'

export default function userLayout({children}) {
  return (
    <div>
        <Navbar />
      {children}
    </div>
  )
}
