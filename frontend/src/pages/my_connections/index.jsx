import React from 'react'
import UserLayout from '@/layout/userLayout'
import DashboardLayout from '@/layout/dashboardLayout' 

export default function MyConnections() {
  return (
    <UserLayout>
        <DashboardLayout>
            {/* {authState.profileFetched && authState.user && (
                <div>Hey {authState.user.name}</div>
            )} */}
            <h1>My Connections</h1>
        </DashboardLayout>
    </UserLayout>
  )
}
