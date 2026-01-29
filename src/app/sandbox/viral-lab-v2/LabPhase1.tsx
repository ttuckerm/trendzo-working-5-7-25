// Separate component for Phase 1 of the Lab
const LabPhase1 = () => {
  const colors = {
    accentPurple: '#8b5cf6',
    accentBlue: '#448aff',
    textSecondary: 'rgba(255,255,255,0.7)'
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Future Viral Vault</h3>
          <p style={{ fontSize: '14px', color: colors.textSecondary }}>14-day predictions</p>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <p>Content for Future Viral Vault...</p>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Proven Templates</h3>
          <p style={{ fontSize: '14px', color: colors.textSecondary }}>Templates for your audience</p>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <p>Content for Proven Templates...</p>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>YOUR Success Predictions</h3>
          <p style={{ fontSize: '14px', color: colors.textSecondary }}>Forecasts based on your patterns</p>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <p>Content for Success Predictions...</p>
        </div>
      </div>
    </>
  );
};