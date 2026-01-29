export default function BasicPage() {
  return (
    <div style={{padding: "20px", fontFamily: "Arial, sans-serif"}}>
      <h1 style={{color: "#3b82f6"}}>Trendzo Dashboard</h1>
      <p>This is a static dashboard page with no dependencies.</p>
      
      <div style={{
        display: "flex", 
        flexWrap: "wrap", 
        gap: "20px", 
        margin: "20px 0"
      }}>
        <div style={{
          background: "white", 
          padding: "20px", 
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          flex: "1",
          minWidth: "200px"
        }}>
          <div style={{color: "#6b7280", fontSize: "14px"}}>Templates Created</div>
          <div style={{fontSize: "24px", fontWeight: "bold", marginTop: "8px"}}>12</div>
        </div>
        
        <div style={{
          background: "white", 
          padding: "20px", 
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          flex: "1",
          minWidth: "200px"
        }}>
          <div style={{color: "#6b7280", fontSize: "14px"}}>Total Views</div>
          <div style={{fontSize: "24px", fontWeight: "bold", marginTop: "8px"}}>8.5K</div>
        </div>
      </div>
      
      <h2>Recent Templates</h2>
      <ul>
        <li>Product Showcase</li>
        <li>Dance Challenge</li>
        <li>Tutorial Format</li>
        <li>Trend Reaction</li>
      </ul>
    </div>
  )
} 