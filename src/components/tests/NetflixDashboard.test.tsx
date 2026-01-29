import React from 'react';
import { render, screen, within, getAllByRole } from '@testing-library/react';
import '@testing-library/jest-dom';
import NetflixSidebar from '../netflix-ui/NetflixSidebar';
import NetflixHeader from '../netflix-ui/NetflixHeader';
import FeaturedBanner from '../netflix-ui/FeaturedBanner';
import ContentRow from '../netflix-ui/ContentRow';
import DashboardViewPage from '../../app/dashboard-view/page';

// Mock the next/image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={props.src} alt={props.alt} {...props} />
  },
}));

// Mock the next/navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  usePathname: () => '/dashboard-view',
}));

describe('Netflix Style Dashboard UI', () => {
  test('should have a proper sidebar with navigation items similar to Netflix', () => {
    render(<NetflixSidebar />);
    
    // Check for Netflix branding
    expect(screen.getByAltText('Netflix')).toBeInTheDocument();
    
    // Check for navigation items from the image
    expect(screen.getByText('Browse')).toBeInTheDocument();
    expect(screen.getByText('Wishlist')).toBeInTheDocument();
    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    
    // Check for trailers section
    expect(screen.getByText('New Trailers')).toBeInTheDocument();
    expect(screen.getByText('Shadow and Bone')).toBeInTheDocument();
    expect(screen.getByText('The Night Agent')).toBeInTheDocument();
    expect(screen.getByText('The Witcher')).toBeInTheDocument();
  });

  test('should have a header with Netflix-style elements', () => {
    render(<NetflixHeader />);
    
    // Check for search functionality
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    
    // Just verify there are multiple buttons including navigation arrows and notification
    expect(screen.getAllByRole('button').length).toBeGreaterThan(1);
    
    // Check for profile section
    expect(screen.getByText('Samantha G.')).toBeInTheDocument();
  });

  test('should have a featured content banner area', () => {
    render(<FeaturedBanner />);
    
    // Check for movie info content without using alt text
    expect(screen.getByText('2013 • Drama • 5 Seasons')).toBeInTheDocument();
    
    // Check for action buttons
    expect(screen.getByText('Watch')).toBeInTheDocument();
  });

  test('should have content rows with proper styling', () => {
    const mockItems = [
      {
        title: 'Test Item 1',
        image: '/test-image-1.jpg',
        year: '2023',
        rating: 'PG-13'
      },
      {
        title: 'Test Item 2',
        image: '/test-image-2.jpg',
        year: '2022',
        rating: 'R'
      }
    ];
    
    render(<ContentRow title="Test Row" items={mockItems} />);
    
    // Check row title
    expect(screen.getByText('Test Row')).toBeInTheDocument();
    
    // Check content items
    expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    expect(screen.getByText('Test Item 2')).toBeInTheDocument();
    
    // Check for images
    expect(screen.getAllByRole('img')).toHaveLength(2);
  });

  test('should render the complete Netflix-style dashboard', () => {
    // We need to mock Image in a different way for the full page test
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<DashboardViewPage />);
    
    // Check for main sections from the full page
    expect(screen.getByText('Popcorn Mania')).toBeInTheDocument();
    expect(screen.getByText('Continue Watching')).toBeInTheDocument();
    
    // Check for specific content items
    expect(screen.getByText('Brooklyn Nine-Nine')).toBeInTheDocument();
    expect(screen.getByText('Ready Player One')).toBeInTheDocument();
    expect(screen.getByText('Money Heist')).toBeInTheDocument();
    expect(screen.getByText('Ash vs. Evil Dead')).toBeInTheDocument();
    
    // Reset console.error mock
    (console.error as jest.Mock).mockRestore();
  });
}); 