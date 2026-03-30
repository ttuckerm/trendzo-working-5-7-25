// src/pages/auth-test.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { featureFlagsManager } from '../lib/utils/featureFlagsManager';

export default function AuthTest() {
  const { user, loading, usingSupabase, signInWithEmail, signUpWithEmail, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [toggleLoading, setToggleLoading] = useState(false);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setMessage('');
    
    try {
      const { user, error } = await signInWithEmail(email, password);
      
      if (error) {
        setMessage(`Sign in error: ${error.message}`);
      } else if (user) {
        setMessage(`Signed in as ${user.email}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setMessage('');
    
    try {
      const { user, error } = await signUpWithEmail(email, password);
      
      if (error) {
        setMessage(`Sign up error: ${error.message}`);
      } else if (user) {
        setMessage(`Account created for ${user.email}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const handleSignOut = async () => {
    setMessage('');
    
    try {
      await signOut();
      setMessage('Signed out successfully');
    } catch (error) {
      setMessage(`Sign out error: ${error.message}`);
    }
  };

  const toggleAuthProvider = async () => {
    setMessage('');
    setToggleLoading(true);
    
    try {
      await featureFlagsManager.setEnabled('use_supabase_auth', !usingSupabase);
      setMessage(`Auth provider updated to ${!usingSupabase ? 'Supabase' : 'Firebase'}. Please refresh the page.`);
    } catch (error) {
      setMessage(`Error toggling provider: ${error.message}`);
    } finally {
      setToggleLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
        Auth System Test
      </h1>
      
      <div style={{ 
        padding: '16px', 
        backgroundColor: '#f3f4f6', 
        borderRadius: '4px',
        marginBottom: '16px'
      }}>
        <p><strong>Status:</strong> {loading ? 'Loading...' : 'Ready'}</p>
        <p><strong>Using:</strong> {usingSupabase ? 'Supabase Auth' : 'Firebase Auth'}</p>
        <p><strong>User:</strong> {user ? `${user.email} (${user.id})` : 'Not signed in'}</p>
        <button 
          onClick={toggleAuthProvider}
          disabled={toggleLoading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '8px'
          }}
        >
          {toggleLoading ? 'Updating...' : `Switch to ${usingSupabase ? 'Firebase' : 'Supabase'}`}
        </button>
      </div>
      
      {message && (
        <div style={{ 
          padding: '16px', 
          backgroundColor: message.includes('error') ? '#fee2e2' : '#d1fae5', 
          borderRadius: '4px',
          marginBottom: '16px'
        }}>
          <p>{message}</p>
        </div>
      )}
      
      <div style={{ 
        padding: '16px', 
        backgroundColor: 'white', 
        borderRadius: '4px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '16px'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
          Authentication Test
        </h2>
        
        <form>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <div>
            <button
              type="button"
              onClick={handleSignUp}
              style={{
                padding: '8px 16px',
                backgroundColor: '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '8px'
              }}
            >
              Sign Up
            </button>
            
            <button
              type="button"
              onClick={handleSignIn}
              style={{
                padding: '8px 16px',
                backgroundColor: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '8px'
              }}
            >
              Sign In
            </button>
            
            <button
              type="button"
              onClick={handleSignOut}
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
        </form>
      </div>
      
      <div style={{ 
        padding: '16px', 
        backgroundColor: 'white', 
        borderRadius: '4px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
          Navigation Tests
        </h2>
        
        <p style={{ marginBottom: '16px' }}>Click the links below to test protected route functionality:</p>
        
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          <li style={{ marginBottom: '8px' }}>
            <a 
              href="/dashboard"
              style={{
                color: '#4f46e5',
                textDecoration: 'underline'
              }}
            >
              Dashboard (Protected)
            </a>
          </li>
          <li style={{ marginBottom: '8px' }}>
            <a 
              href="/login"
              style={{
                color: '#4f46e5',
                textDecoration: 'underline'
              }}
            >
              Login Page
            </a>
          </li>
          <li>
            <a 
              href="/signup"
              style={{
                color: '#4f46e5',
                textDecoration: 'underline'
              }}
            >
              Signup Page
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}