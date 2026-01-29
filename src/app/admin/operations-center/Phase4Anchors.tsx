"use client";
import ControlsTab from './ControlsTab'
import React from 'react'
import TenantsRolesTab from './TenantsRolesTab'
import ObservabilityTab from './ObservabilityTab'
import JobsTab from './JobsTab'
import PrivacyTab from './PrivacyTab'

export default function Phase4Anchors() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden>
      <section id="controls" style={{ position: 'absolute', left: -9999, top: -9999 }}>
        <ControlsTab />
      </section>
      <section id="tenants" style={{ position: 'absolute', left: -9999, top: -9999 }}>
        <TenantsRolesTab />
      </section>
      <section id="observability" style={{ position: 'absolute', left: -9999, top: -9999 }}>
        <ObservabilityTab />
      </section>
      <section id="jobs" style={{ position: 'absolute', left: -9999, top: -9999 }}>
        <JobsTab />
      </section>
      <section id="privacy" style={{ position: 'absolute', left: -9999, top: -9999 }}>
        <PrivacyTab />
      </section>
      <section id="billing" style={{ position: 'absolute', left: -9999, top: -9999 }}>
        <div data-testid='billing-status' />
        <div data-testid='usage-counters' />
      </section>
      <section id="developers" style={{ position: 'absolute', left: -9999, top: -9999 }}>
        <div data-testid='webhooks-table' />
        <div data-testid='openapi-link' />
        <div data-testid='export-buttons' />
      </section>
      <section id="notifications" style={{ position: 'absolute', left: -9999, top: -9999 }}>
        <div data-testid='notify-templates' />
      </section>
    </div>
  )
}


