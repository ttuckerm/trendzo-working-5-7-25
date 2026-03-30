export default function JustSupabase() {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Supabase Connection Test</h1>
        <p>Check the console for connection results.</p>
        <button 
          onClick={async () => {
            // Import the Supabase client directly here
            const { createClient } = await import('@supabase/supabase-js');
            
            // Create a client with hardcoded values
            const supabase = createClient(
              'https://vyeiyccrageckeehyhj.supabase.co',
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5ZWl5Y2NyYWdlY2tlZWh5aGoiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcxNjI0NzUyMCwiZXhwIjoxNzE2MzMzOTIwfQ.vfcm9sZ'
            );
            
            try {
              console.log('Testing Supabase connection...');
              const { data, error } = await supabase
                .from('feature_flags')
                .select('*')
                .limit(1);
                
              if (error) throw error;
              
              console.log('Connection successful!', data);
              alert('Connection successful! See console for details.');
            } catch (error) {
              console.error('Connection failed:', error);
              alert(`Connection failed: ${error.message}`);
            }
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Supabase Connection
        </button>
      </div>
    );
  }