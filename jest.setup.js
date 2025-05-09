// Import jest-dom matchers
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    pathname: '/test-path',
    query: {},
  }),
  usePathname: jest.fn().mockReturnValue('/test-path'),
  useSearchParams: jest.fn().mockReturnValue(new URLSearchParams()),
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || ''} />;
  },
}));

// Mock Firebase
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  signInWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(() => ({})),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(() => ({})),
  addDoc: jest.fn(),
  getDocs: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({})),
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));

// Suppress specific console errors/warnings
const originalConsoleError = console.error;
console.error = (...args) => {
  // Filter out certain errors for cleaner test output
  if (args[0]?.includes('ReactDOM.render is no longer supported')) {
    return;
  }
  originalConsoleError(...args);
};

console.warn = (...args) => {
  // Filter out certain warnings for cleaner test output
  if (args[0]?.includes('React state update on an unmounted component')) {
    return;
  }
  // You can conditionally handle other common warnings here
};

// Mock matchMedia for components that use media queries
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
}); 