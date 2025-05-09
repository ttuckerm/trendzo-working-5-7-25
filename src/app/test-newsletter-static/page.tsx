export default function StaticNewsletterTestPage() {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
        Static Newsletter Test Page
      </h1>
      
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <p>This is a static test page that doesn't rely on client-side rendering or contexts.</p>
        <p>Here are some pre-generated test links you can use:</p>
      </div>
      
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>Basic User Journey (Template Preview)</h2>
        <ul style={{ listStyle: 'disc', marginLeft: '20px' }}>
          <li style={{ marginBottom: '10px' }}>
            <a 
              href="/api/newsletter/simple-test?template=dance-challenge" 
              style={{ color: 'blue', textDecoration: 'underline' }}
            >
              Viral Dance Challenge Template
            </a>
          </li>
          <li style={{ marginBottom: '10px' }}>
            <a 
              href="/api/newsletter/simple-test?template=product-review" 
              style={{ color: 'blue', textDecoration: 'underline' }}
            >
              ASMR Product Review Template
            </a>
          </li>
        </ul>
      </div>
      
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f0f8ff' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>Premium User Journey (Direct to Editor)</h2>
        <ul style={{ listStyle: 'disc', marginLeft: '20px' }}>
          <li style={{ marginBottom: '10px' }}>
            <a 
              href="/api/newsletter/simple-test?template=dance-challenge&to_editor=true" 
              style={{ color: 'blue', textDecoration: 'underline' }}
            >
              Viral Dance Challenge Template (Premium)
            </a>
          </li>
          <li style={{ marginBottom: '10px' }}>
            <a 
              href="/api/newsletter/simple-test?template=product-review&to_editor=true" 
              style={{ color: 'blue', textDecoration: 'underline' }}
            >
              ASMR Product Review Template (Premium)
            </a>
          </li>
        </ul>
      </div>
      
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f8f8f8' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>How This Works</h2>
        <ol style={{ listStyle: 'decimal', marginLeft: '20px' }}>
          <li style={{ marginBottom: '5px' }}>
            When you click a link, it calls our simple API route that handles redirection
          </li>
          <li style={{ marginBottom: '5px' }}>
            The API checks if the link has the <code style={{ backgroundColor: '#eee', padding: '2px 4px' }}>to_editor=true</code> parameter
          </li>
          <li style={{ marginBottom: '5px' }}>
            If it does, it redirects to the editor with the template preloaded
          </li>
          <li style={{ marginBottom: '5px' }}>
            If not, it redirects to the template preview page
          </li>
        </ol>
      </div>
    </div>
  )
} 