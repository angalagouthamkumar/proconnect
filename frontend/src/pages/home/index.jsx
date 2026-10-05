import React from 'react'
import UserLayout from '@/layout/userLayout'
import DashboardLayout from '@/layout/dashboardLayout'

export default function index() {
  return (
    <UserLayout>
        <DashboardLayout>
            <h1>Home</h1>
        </DashboardLayout>
    </UserLayout>
  )
}
