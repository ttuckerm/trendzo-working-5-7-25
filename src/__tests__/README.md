# Testing Strategy for Trendzo

This directory contains automated tests for the Trendzo application. We use Jest as our test runner and React Testing Library for testing React components.

## Overview

Our testing strategy follows best practices for React applications:

1. **Component Tests**: Testing UI components in isolation
2. **Integration Tests**: Testing how components work together
3. **Mock Testing**: Using mocks for external dependencies like APIs and Firebase
4. **Feature Flags**: Supporting different testing modes for components

## Directory Structure

- `__tests__/`
  - `components/`: Tests for React components
  - `lib/`: Tests for utility functions and services
  - `README.md`: This documentation file

## Running Tests

```bash
# Run all tests
npm test

# Run tests with watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run only component tests
npm run test:components
```

## Writing Tests

### Component Tests

Component tests should verify:
- Rendering without errors
- Correct display of props
- User interactions (clicks, input changes)
- Conditional rendering
- Proper styling classes

Example:
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });
});
```

### Integration Tests

Integration tests should verify:
- Component interactions
- Data flow between components
- API calls with mocked responses
- Form submissions

### Mocking

Use Jest's mocking capabilities to mock:
- API calls
- Firebase services
- External libraries
- Browser APIs (like clipboard)

Example:
```typescript
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
}));
```

## Best Practices

1. Use data-testid attributes for test-specific element selection
2. Mock external dependencies
3. Test user interactions using fireEvent or userEvent
4. Test error states and loading states
5. Use screen queries that match user behavior (getByRole, getByText)
6. Focus on testing behavior, not implementation details

## Debugging Tests

If tests are failing, check:
1. Console output for errors
2. Timing issues (add waitFor for async operations)
3. Missing mocks
4. DOM structure changes

## Adding New Tests

When adding new features, create tests that cover:
1. Happy path: Component works with expected data
2. Error path: Component handles errors gracefully
3. Edge cases: Component handles unusual inputs
4. Accessibility: Component is accessible 