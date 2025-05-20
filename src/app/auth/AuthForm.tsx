"use client"

import * as React from "react"
import { ChevronLeft, UserX } from "lucide-react"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/hooks/useAuth"
import { useState, useEffect } from "react"
// import { createUserWithEmailAndPassword, signInWithEmailAndPassword, AuthError, AuthErrorCodes } from "firebase/auth"
// import { auth } from "@/lib/firebase/firebase"
import { useRouter } from "next/navigation"
import Link from "next/link"

const COMPONENT_DISABLED_MSG = "AuthForm: Email/Password sign-in/sign-up is disabled as Firebase is being removed. Google/Anonymous sign-in uses a neutralized AuthContext.";

// Helper function to get user-friendly error messages
const getErrorMessage = (error: any): string => { // Changed AuthError to any for broader compatibility
  const errorCode = error?.code;
  
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Invalid email address format.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled. Please contact support or try a different method.';
    default:
      return error?.message || 'An unexpected error occurred.';
  }
};

const AuthForm: React.FC = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { signInWithGoogle, signInAnonymously } = useAuth()

  // Handle Google sign-in with error handling
  const handleGoogleSignIn = async () => {
    setError("");
    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (err: any) {
      setError(getErrorMessage(err));
    }
  };

  // Handle anonymous sign-in for testing
  const handleAnonymousSignIn = async () => {
    setError("");
    try {
      await signInAnonymously();
      router.push("/dashboard");
    } catch (err: any) {
      setError(getErrorMessage(err));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    console.warn(COMPONENT_DISABLED_MSG);
    setError("Email/Password sign-up/sign-in has been temporarily disabled.");
    
    // try {
    //   if (isSignUp) {
    //     await createUserWithEmailAndPassword(auth, email, password) // auth is null
    //   } else {
    //     await signInWithEmailAndPassword(auth, email, password) // auth is null
    //   }
    //   router.push("/dashboard")
    // } catch (err: any) {
    //   // Handle the error appropriately
    //   if (err.code === 'auth/email-already-in-use' && isSignUp) {
    //     // Automatically switch to sign in mode if email already exists
    //     setIsSignUp(false);
    //     setError('This email is already registered. We switched to sign in mode for you.');
    //   } else {
    //     setError(getErrorMessage(err));
    //   }
    // }
  }

  return (
    <div className="bg-white dark:bg-zinc-950 py-10 text-zinc-800 dark:text-zinc-200 selection:bg-zinc-300 dark:selection:bg-zinc-600">
      <BackButton />
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.25, ease: "easeInOut" }}
        className="relative z-10 mx-auto w-full max-w-xl p-4"
      >
        <Logo />
        <Header isSignUp={isSignUp} setIsSignUp={setIsSignUp} />
        <SocialButtons 
          signInWithGoogle={handleGoogleSignIn}
          signInAnonymously={handleAnonymousSignIn} 
        />
        <Divider />
        <LoginForm 
          email={email} 
          setEmail={setEmail} 
          password={password} 
          setPassword={setPassword} 
          handleSubmit={handleSubmit} 
          isSignUp={isSignUp}
          error={error}
        />
        <TermsAndConditions />
      </motion.div>
      <BackgroundDecoration />
    </div>
  )
}

const BackButton: React.FC = () => (
  <Link href="/">
    <SocialButton icon={<ChevronLeft size={16} />}>Go back</SocialButton>
  </Link>
)

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string
}

const Button: React.FC<ButtonProps> = ({ children, className, ...props }) => (
  <button
    className={`rounded-md bg-gradient-to-br from-blue-400 to-blue-700 px-4 py-2 text-lg text-zinc-50 
    ring-2 ring-blue-500/50 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950 
    transition-all hover:scale-[1.02] hover:ring-transparent active:scale-[0.98] active:ring-blue-500/70 ${className}`}
    {...props}
  >
    {children}
  </button>
)

const Logo: React.FC = () => (
  <div className="mb-6 flex justify-center">
    <img
      src="/trendzo-logo.svg"
      alt="Trendzo Logo"
      className="h-12"
    />
  </div>
)

interface HeaderProps {
  isSignUp: boolean
  setIsSignUp: React.Dispatch<React.SetStateAction<boolean>>
}

const Header: React.FC<HeaderProps> = ({ isSignUp, setIsSignUp }) => (
  <div className="mb-6 text-center">
    <h1 className="text-2xl font-semibold">
      {isSignUp ? "Create an account" : "Sign in to your account"}
    </h1>
    <p className="mt-2 text-zinc-500 dark:text-zinc-400">
      {isSignUp ? "Already have an account? " : "Don't have an account? "}
      <button 
        onClick={() => setIsSignUp(!isSignUp)} 
        className="text-blue-600 dark:text-blue-400 hover:underline"
      >
        {isSignUp ? "Sign in." : "Create one."}
      </button>
    </p>
  </div>
)

interface SocialButtonsProps {
  signInWithGoogle: () => Promise<void>
  signInAnonymously: () => Promise<void>
}

const SocialButtons: React.FC<SocialButtonsProps> = ({ signInWithGoogle, signInAnonymously }) => (
  <div className="mb-6 flex flex-col gap-2">
    <SocialButton fullWidth onClick={signInWithGoogle}>Sign in with Google</SocialButton>
    <SocialButton fullWidth onClick={signInAnonymously} icon={<UserX size={16} />}>
      Continue as Guest (Test Mode)
    </SocialButton>
  </div>
)

interface SocialButtonProps {
  icon?: React.ReactNode
  fullWidth?: boolean
  children?: React.ReactNode
  onClick?: () => void
}

const SocialButton: React.FC<SocialButtonProps> = ({ icon, fullWidth, children, onClick }) => (
  <button
    onClick={onClick}
    className={`relative z-0 flex items-center justify-center gap-2 overflow-hidden rounded-md 
    border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 
    px-4 py-2 font-semibold text-zinc-800 dark:text-zinc-200 transition-all duration-500
    before:absolute before:inset-0 before:-z-10 before:translate-x-[150%] before:translate-y-[150%] before:scale-[2.5]
    before:rounded-[100%] before:bg-zinc-800 dark:before:bg-zinc-200 before:transition-transform before:duration-1000 before:content-[""]
    hover:scale-105 hover:text-zinc-100 dark:hover:text-zinc-900 hover:before:translate-x-[0%] hover:before:translate-y-[0%] active:scale-95
    ${fullWidth ? "col-span-2" : ""}`}
  >
    {icon}
    <span>{children}</span>
  </button>
)

const Divider: React.FC = () => (
  <div className="my-6 flex items-center gap-3">
    <div className="h-[1px] w-full bg-zinc-300 dark:bg-zinc-700" />
    <span className="text-zinc-500 dark:text-zinc-400">OR</span>
    <div className="h-[1px] w-full bg-zinc-300 dark:bg-zinc-700" />
  </div>
)

interface LoginFormProps {
  email: string
  setEmail: React.Dispatch<React.SetStateAction<string>>
  password: string
  setPassword: React.Dispatch<React.SetStateAction<string>>
  handleSubmit: (e: React.FormEvent) => Promise<void>
  isSignUp: boolean
  error: string
}

const LoginForm: React.FC<LoginFormProps> = ({ 
  email, 
  setEmail, 
  password, 
  setPassword, 
  handleSubmit,
  isSignUp,
  error
}) => {
  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="mb-4 rounded-md bg-red-100 dark:bg-red-900/20 p-3 text-red-700 dark:text-red-400">
          {error}
        </div>
      )}
      <div className="mb-3">
        <label
          htmlFor="email-input"
          className="mb-1.5 block text-zinc-500 dark:text-zinc-400"
        >
          Email
        </label>
        <input
          id="email-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your.email@provider.com"
          className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 
          bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-800 dark:text-zinc-200
          placeholder-zinc-400 dark:placeholder-zinc-500 
          ring-1 ring-transparent transition-shadow focus:outline-0 focus:ring-blue-700"
          required
        />
      </div>
      <div className="mb-6">
        <div className="mb-1.5 flex items-end justify-between">
          <label
            htmlFor="password-input"
            className="block text-zinc-500 dark:text-zinc-400"
          >
            Password
          </label>
          {!isSignUp && (
            <a href="#" className="text-sm text-blue-600 dark:text-blue-400">
              Forgot?
            </a>
          )}
        </div>
        <input
          id="password-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••••"
          className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 
          bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-800 dark:text-zinc-200
          placeholder-zinc-400 dark:placeholder-zinc-500 
          ring-1 ring-transparent transition-shadow focus:outline-0 focus:ring-blue-700"
          required
        />
      </div>
      <Button type="submit" className="w-full">
        {isSignUp ? "Sign up" : "Sign in"}
      </Button>
    </form>
  )
}

const TermsAndConditions: React.FC = () => (
  <p className="mt-9 text-xs text-zinc-500 dark:text-zinc-400">
    By signing in, you agree to our{" "}
    <a href="#" className="text-blue-600 dark:text-blue-400">
      Terms & Conditions
    </a>{" "}
    and{" "}
    <a href="#" className="text-blue-600 dark:text-blue-400">
      Privacy Policy.
    </a>
  </p>
)

const BackgroundDecoration: React.FC = () => {
  const [mounted, setMounted] = useState(false)
  
  // This effect ensures the component only renders after mount
  useEffect(() => {
    setMounted(true)
  }, [])
  
  return (
    <div
      className="absolute right-0 top-0 z-0 size-[50vw]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke-width='2' stroke='rgb(30 58 138 / 0.5)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e")`,
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: mounted && typeof window !== 'undefined' && document.documentElement.classList.contains('dark')
            ? "radial-gradient(100% 100% at 100% 0%, rgba(9,9,11,0), rgba(9,9,11,1))"
            : "radial-gradient(100% 100% at 100% 0%, rgba(255,255,255,0), rgba(255,255,255,1))",
        }}
      />
    </div>
  )
}

export default AuthForm 