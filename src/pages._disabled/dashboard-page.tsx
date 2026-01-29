// src/pages/dashboard.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user, loading, signOut, usingSupabase } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If not loading and no user, redirect to login
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // If loading, show loading message
  if (loading) {
    return <div>Loading...</div>;
  }

  // If no user and not loading, we'll be redirected so just show loading
  if (!user) {
    return <div>Checking authentication...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
        Dashboard
      </h1>
      
      <div style={{ 
        padding: '16px', 
        backgroundColor: '#f0fff4', 
        borderRadius: '4px',
        marginBottom: '16px'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
          Welcome, {user.email}!
        </h2>
        <p>This is a protected page. You can only see this if you're logged in.</p>
        <p><strong>Using:</strong> {usingSupabase ? 'Supabase Auth' : 'Firebase Auth'}</p>
      </div>
      
      <button
        onClick={() => signOut()}
        style={{
          padding: '8px 16px',
          backgroundColor: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Sign Out
      </button>
    </div>
  );
}