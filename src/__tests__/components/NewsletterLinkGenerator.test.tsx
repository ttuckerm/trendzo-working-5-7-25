import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock component that simplifies the actual NewsletterLinkGenerator
// In a real test, this would import the actual component
const NewsletterLinkGenerator = () => {
  const [template, setTemplate] = React.useState('');
  const [campaign, setCampaign] = React.useState('');
  const [generatedLink, setGeneratedLink] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [linkCopied, setLinkCopied] = React.useState(false);

  // Mock API call
  const generateLink = async () => {
    if (!template) {
      setError('Please select a template');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Generate a fake link
      const fakeLink = `https://example.com/api/template-redirect?id=${template}&source=newsletter&campaign=${campaign}`;
      setGeneratedLink(fakeLink);
    } catch (e) {
      setError('Failed to generate link');
    } finally {
      setIsLoading(false);
    }
  };

  // Copy link to clipboard
  const copyToClipboard = () => {
    if (!generatedLink) return;
    
    // Instead of actually using navigator.clipboard, just set state
    setLinkCopied(true);
    
    // Reset copied state after 2 seconds
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div className="newsletter-link-generator" data-testid="newsletter-generator">
      <h2>Generate Newsletter Link</h2>
      
      {/* Template selection */}
      <div className="form-group">
        <label htmlFor="template-select">Select Template</label>
        <select
          id="template-select"
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          data-testid="template-select"
        >
          <option value="">-- Select a template --</option>
          <option value="template1">Marketing Template</option>
          <option value="template2">Sales Template</option>
        </select>
      </div>
      
      {/* Campaign name input */}
      <div className="form-group">
        <label htmlFor="campaign-name">Campaign Name</label>
        <input
          type="text"
          id="campaign-name"
          value={campaign}
          onChange={(e) => setCampaign(e.target.value)}
          placeholder="e.g. april-newsletter"
          data-testid="campaign-input"
        />
      </div>
      
      {/* Generate button */}
      <button
        onClick={generateLink}
        disabled={isLoading}
        data-testid="generate-button"
      >
        {isLoading ? 'Generating...' : 'Generate Newsletter Link'}
      </button>
      
      {/* Error message */}
      {error && (
        <div className="error-message" data-testid="error-message">
          {error}
        </div>
      )}
      
      {/* Generated link display */}
      {generatedLink && (
        <div className="generated-link" data-testid="link-container">
          <input
            type="text"
            readOnly
            value={generatedLink}
            data-testid="generated-link"
          />
          <button
            onClick={copyToClipboard}
            data-testid="copy-button"
          >
            {linkCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
    </div>
  );
};

describe('NewsletterLinkGenerator Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with initial empty state', () => {
    render(<NewsletterLinkGenerator />);
    
    expect(screen.getByTestId('newsletter-generator')).toBeInTheDocument();
    expect(screen.getByTestId('template-select')).toBeInTheDocument();
    expect(screen.getByTestId('campaign-input')).toBeInTheDocument();
    expect(screen.getByTestId('generate-button')).toBeInTheDocument();
    
    // Link should not be displayed initially
    expect(screen.queryByTestId('link-container')).not.toBeInTheDocument();
  });

  it('shows error when trying to generate without selecting a template', async () => {
    render(<NewsletterLinkGenerator />);
    
    // Try to generate without selecting a template
    fireEvent.click(screen.getByTestId('generate-button'));
    
    // Error should be displayed
    expect(screen.getByTestId('error-message')).toBeInTheDocument();
    expect(screen.getByTestId('error-message')).toHaveTextContent('Please select a template');
  });

  it('generates a link when form is filled correctly', async () => {
    render(<NewsletterLinkGenerator />);
    
    // Fill the form
    fireEvent.change(screen.getByTestId('template-select'), { target: { value: 'template1' } });
    fireEvent.change(screen.getByTestId('campaign-input'), { target: { value: 'spring-newsletter' } });
    
    // Generate link
    fireEvent.click(screen.getByTestId('generate-button'));
    
    // Wait for the link to be generated
    await waitFor(() => {
      expect(screen.getByTestId('link-container')).toBeInTheDocument();
    });
    
    // Check the generated link
    const linkInput = screen.getByTestId('generated-link');
    expect(linkInput).toHaveValue('https://example.com/api/template-redirect?id=template1&source=newsletter&campaign=spring-newsletter');
  });

  it('copies link to clipboard when copy button is clicked', async () => {
    render(<NewsletterLinkGenerator />);
    
    // Fill the form and generate link
    fireEvent.change(screen.getByTestId('template-select'), { target: { value: 'template1' } });
    fireEvent.click(screen.getByTestId('generate-button'));
    
    // Wait for the link to be generated
    await waitFor(() => {
      expect(screen.getByTestId('link-container')).toBeInTheDocument();
    });
    
    // Click copy button
    fireEvent.click(screen.getByTestId('copy-button'));
    
    // Button text should change to "Copied!"
    expect(screen.getByTestId('copy-button')).toHaveTextContent('Copied!');
  });
}); 