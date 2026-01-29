"use client"

import React from 'react'
import CosmicDashboardCard from './CosmicDashboardCard'
import { Music, TrendingUp } from 'lucide-react'
import Link from 'next/link'

const CosmicDashboardCardTest = () => {
  return (
    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Cosmic Dashboard Card Test</h1>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(1, minmax(0, 1fr))', 
        gap: '1.5rem',
        width: '100%'
      }}>
        {/* Sound Performance Card */}
        <CosmicDashboardCard
          title="Sound Performance"
          icon={<Music style={{ height: '1.25rem', width: '1.25rem' }} />}
          viewDetailsLink="#"
          subtitle="Sound usage and engagement metrics"
          theme={{
            primaryColor: "#0FA0CE",
            secondaryColor: "#0056b3",
            glowColor: "rgba(15, 160, 206, 0.8)",
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1rem', margin: '1.5rem 0' }}>
            <div>
              <p style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>42</p>
              <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>Used Sounds</p>
              <span style={{ 
                fontSize: '0.75rem', 
                color: 'rgb(134, 239, 172)', 
                backgroundColor: 'rgba(22, 101, 52, 0.3)', 
                padding: '0 0.5rem', 
                borderRadius: '0.25rem', 
                marginTop: '0.25rem', 
                display: 'inline-block' 
              }}>+8%</span>
            </div>
            <div>
              <p style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>19%</p>
              <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>Engagement Boost</p>
              <span style={{ 
                fontSize: '0.75rem', 
                color: 'rgb(134, 239, 172)', 
                backgroundColor: 'rgba(22, 101, 52, 0.3)', 
                padding: '0 0.5rem', 
                borderRadius: '0.25rem', 
                marginTop: '0.25rem', 
                display: 'inline-block' 
              }}>+2.5%</span>
            </div>
            <div>
              <p style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>8.5K</p>
              <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>Sound-Driven Views</p>
              <span style={{ 
                fontSize: '0.75rem', 
                color: 'rgb(134, 239, 172)', 
                backgroundColor: 'rgba(22, 101, 52, 0.3)', 
                padding: '0 0.5rem', 
                borderRadius: '0.25rem', 
                marginTop: '0.25rem', 
                display: 'inline-block' 
              }}>+12%</span>
            </div>
          </div>
                
          <h4 style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Top Performing Sounds</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '0.5rem', 
              backgroundColor: 'rgba(255, 255, 255, 0.1)', 
              borderRadius: '0.25rem' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem' }}>Summer Vibes</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>124 uses</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>18.2% engagement</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp style={{ height: '0.75rem', width: '0.75rem', color: 'rgb(134, 239, 172)', marginRight: '0.25rem' }} />
                <Link href="#" style={{ color: 'rgb(134, 239, 172)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              </div>
            </div>
                  
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '0.5rem', 
              backgroundColor: 'rgba(255, 255, 255, 0.1)', 
              borderRadius: '0.25rem' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem' }}>Deep Bass Loop</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>98 uses</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>15.7% engagement</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp style={{ height: '0.75rem', width: '0.75rem', color: 'rgb(134, 239, 172)', marginRight: '0.25rem' }} />
                <Link href="#" style={{ color: 'rgb(134, 239, 172)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </CosmicDashboardCard>
        
        {/* Template-Sound Performance Card */}
        <CosmicDashboardCard
          title="Template-Sound Performance"
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 9H21M3 9V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3H5C3.89543 3 3 3.89543 3 5V9ZM9 9V21M3 15H9M15 9V21M3 17H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
          viewDetailsLink="#"
          subtitle="Cross-referencing template and sound metrics"
          theme={{
            primaryColor: "#9333EA",
            secondaryColor: "#6B21A8",
            glowColor: "rgba(147, 51, 234, 0.6)",
          }}
        >
          <div className="mt-4">
            <div className="grid grid-cols-3 gap-2 mb-4 text-sm font-medium border-b border-white/20 pb-2">
              <div>Template Type</div>
              <div>Best Sound</div>
              <div>Engagement</div>
            </div>
                  
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-sm py-2 border-b border-white/10">
                <div>Product Showcase</div>
                <div>Summer Vibes</div>
                <div className="text-green-300">24.7%</div>
              </div>
                    
              <div className="grid grid-cols-3 gap-2 text-sm py-2 border-b border-white/10">
                <div>Tutorial Format</div>
                <div>Deep Bass Loop</div>
                <div className="text-green-300">19.3%</div>
              </div>
                    
              <div className="grid grid-cols-3 gap-2 text-sm py-2 border-b border-white/10">
                <div>Brand Story</div>
                <div>Emotional Piano</div>
                <div className="text-green-300">22.1%</div>
              </div>
            </div>
          </div>
                
          <div className="mt-6 flex items-center gap-2 bg-blue-900/20 p-3 rounded-md">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.5 14.5L4 18V4C4 3.44772 4.44772 3 5 3H19C19.5523 3 20 3.44772 20 4V14C20 14.5523 19.5523 15 19 15H8.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="text-sm">
              <p className="font-medium">Template-Sound Recommendation</p>
              <p className="text-xs opacity-80">Adding sound to your templates increases engagement by ~22% on average. Try adding trending sounds to your most viewed templates.</p>
            </div>
          </div>
        </CosmicDashboardCard>
      </div>
    </div>
  )
}

export default CosmicDashboardCardTest 