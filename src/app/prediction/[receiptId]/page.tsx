import React from 'react'

export default function PredictionReceiptPage({ params }: { params: { receiptId: string } }) {
  const { receiptId } = params
  return (
    <div style={{ minHeight:'100vh', background:'#000', color:'#fff', padding:'40px' }}>
      <div style={{ maxWidth: 800, margin:'0 auto' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 10 }}>Prediction Receipt</h1>
        <div style={{ opacity:.7, marginBottom: 20 }}>ID: {receiptId}</div>
        <p style={{ marginTop: 20 }}>We saved your prediction and will verify results in about 48h.</p>
        <a href="/admin/studio" style={{ color:'#7b61ff', textDecoration:'underline', display:'inline-block', marginTop: 20 }}>Back to Studio</a>
      </div>
    </div>
  )
}


