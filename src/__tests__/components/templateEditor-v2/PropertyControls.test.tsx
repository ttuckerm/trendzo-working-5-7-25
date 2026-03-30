import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColorPicker } from '../../../components/templateEditor-v2/PropertyControls/ColorPicker';
import { FontControls } from '../../../components/templateEditor-v2/PropertyControls/FontControls';
import { AnimationControls } from '../../../components/templateEditor-v2/PropertyControls/AnimationControls';
import { PositionControls } from '../../../components/templateEditor-v2/PropertyControls/PositionControls';
import { LayerControls } from '../../../components/templateEditor-v2/PropertyControls/LayerControls';
import { TemplateEditorProvider } from '../../../components/templateEditor-v2/TemplateEditorContext';

// Mock tier system
jest.mock('../../../lib/utils/userTier', () => ({
  getUserTier: jest.fn().mockReturnValue('free'),
  isTierFeatureAvailable: jest.fn().mockImplementation((tier, feature) => {
    if (tier === 'free' && feature === 'basicAnimations') return true;
    if (tier === 'free' && feature === 'advancedAnimations') return false;
    if (tier === 'premium' && feature === 'advancedAnimations') return true;
    if (tier === 'premium' && feature === 'beatSyncedAnimations') return true;
    if (tier === 'platinum' && feature === 'aiSuggestions') return true;
    return false;
  }),
}));

describe('ColorPicker', () => {
  const onChangeMock = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders color picker with default colors', () => {
    render(
      <ColorPicker 
        color="#ff0000" 
        onChange={onChangeMock} 
        label="Test Color" 
      />
    );
    
    expect(screen.getByLabelText('Test Color')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /#ff0000/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(21); // 20 preset colors + current color
  });
  
  test('calls onChange when a color is selected', async () => {
    render(
      <ColorPicker 
        color="#ff0000" 
        onChange={onChangeMock} 
        label="Test Color" 
      />
    );
    
    // Click on a different color
    const blueColorButton = screen.getByRole('button', { name: /#0000ff/i });
    await userEvent.click(blueColorButton);
    
    expect(onChangeMock).toHaveBeenCalledWith('#0000ff');
  });
  
  test('allows custom color input', async () => {
    render(
      <ColorPicker 
        color="#ff0000" 
        onChange={onChangeMock} 
        label="Test Color" 
        allowCustom
      />
    );
    
    // Open custom color input
    const customButton = screen.getByRole('button', { name: /custom/i });
    await userEvent.click(customButton);
    
    // Enter custom color
    const input = screen.getByLabelText(/custom color/i);
    await userEvent.clear(input);
    await userEvent.type(input, '#00ff00');
    await userEvent.click(screen.getByRole('button', { name: /apply/i }));
    
    expect(onChangeMock).toHaveBeenCalledWith('#00ff00');
  });
});

describe('FontControls', () => {
  const defaultProps = {
    fontFamily: 'Arial',
    fontSize: 16,
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'left',
    onFontFamilyChange: jest.fn(),
    onFontSizeChange: jest.fn(),
    onFontWeightChange: jest.fn(),
    onFontStyleChange: jest.fn(),
    onTextAlignChange: jest.fn(),
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders all font controls', () => {
    render(<FontControls {...defaultProps} />);
    
    expect(screen.getByLabelText(/font family/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/font size/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/alignment/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /bold/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /italic/i })).toBeInTheDocument();
  });
  
  test('calls appropriate handlers when font properties change', async () => {
    render(<FontControls {...defaultProps} />);
    
    // Change font family
    const fontFamilySelect = screen.getByLabelText(/font family/i);
    await userEvent.selectOptions(fontFamilySelect, 'Times New Roman');
    expect(defaultProps.onFontFamilyChange).toHaveBeenCalledWith('Times New Roman');
    
    // Change font size
    const fontSizeInput = screen.getByLabelText(/font size/i);
    await userEvent.clear(fontSizeInput);
    await userEvent.type(fontSizeInput, '24');
    await userEvent.tab(); // Trigger blur event
    expect(defaultProps.onFontSizeChange).toHaveBeenCalledWith(24);
    
    // Toggle bold
    const boldButton = screen.getByRole('button', { name: /bold/i });
    await userEvent.click(boldButton);
    expect(defaultProps.onFontWeightChange).toHaveBeenCalledWith('bold');
    
    // Toggle italic
    const italicButton = screen.getByRole('button', { name: /italic/i });
    await userEvent.click(italicButton);
    expect(defaultProps.onFontStyleChange).toHaveBeenCalledWith('italic');
    
    // Change alignment
    const centerAlignButton = screen.getByRole('button', { name: /center align/i });
    await userEvent.click(centerAlignButton);
    expect(defaultProps.onTextAlignChange).toHaveBeenCalledWith('center');
  });
});

describe('AnimationControls', () => {
  const defaultProps = {
    animation: {
      type: 'fade',
      duration: 1000,
      delay: 0,
      easing: 'ease',
      repeat: 0,
    },
    onChange: jest.fn(),
    userTier: 'free',
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders basic animation controls for free users', () => {
    render(<AnimationControls {...defaultProps} />);
    
    expect(screen.getByLabelText(/animation type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/duration/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/delay/i)).toBeInTheDocument();
    
    // Advanced controls should be disabled for free users
    expect(screen.getByText(/advanced animations/i)).toBeInTheDocument();
    expect(screen.getByText(/upgrade to premium/i)).toBeInTheDocument();
  });
  
  test('renders advanced animation controls for premium users', () => {
    render(
      <AnimationControls 
        {...defaultProps} 
        userTier="premium" 
      />
    );
    
    expect(screen.getByLabelText(/animation type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/duration/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/delay/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/easing/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/repeat/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/beat sync/i)).toBeInTheDocument();
  });
  
  test('calls onChange when animation properties change', async () => {
    render(
      <AnimationControls 
        {...defaultProps} 
        userTier="premium" 
      />
    );
    
    // Change animation type
    const typeSelect = screen.getByLabelText(/animation type/i);
    await userEvent.selectOptions(typeSelect, 'slide');
    
    expect(defaultProps.onChange).toHaveBeenCalledWith({
      ...defaultProps.animation,
      type: 'slide',
    });
    
    // Change duration
    const durationInput = screen.getByLabelText(/duration/i);
    await userEvent.clear(durationInput);
    await userEvent.type(durationInput, '2000');
    await userEvent.tab(); // Trigger blur
    
    expect(defaultProps.onChange).toHaveBeenCalledWith({
      ...defaultProps.animation,
      duration: 2000,
    });
  });
  
  test('shows contextual help tooltip on hover', async () => {
    render(<AnimationControls {...defaultProps} />);
    
    // Hover over a control to trigger tooltip
    await userEvent.hover(screen.getByLabelText(/animation type/i));
    
    await waitFor(() => {
      expect(screen.getByText(/choose how your element animates/i)).toBeInTheDocument();
    });
  });
});

describe('PositionControls', () => {
  const defaultProps = {
    x: 100,
    y: 200,
    width: 300,
    height: 150,
    rotation: 0,
    onPositionChange: jest.fn(),
    onSizeChange: jest.fn(),
    onRotationChange: jest.fn(),
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders position and size controls', () => {
    render(<PositionControls {...defaultProps} />);
    
    expect(screen.getByLabelText(/position x/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/position y/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/width/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/height/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/rotation/i)).toBeInTheDocument();
  });
  
  test('calls handlers when position values change', async () => {
    render(<PositionControls {...defaultProps} />);
    
    // Change X position
    const xInput = screen.getByLabelText(/position x/i);
    await userEvent.clear(xInput);
    await userEvent.type(xInput, '150');
    await userEvent.tab(); // Trigger blur
    
    expect(defaultProps.onPositionChange).toHaveBeenCalledWith(150, 200);
    
    // Change width
    const widthInput = screen.getByLabelText(/width/i);
    await userEvent.clear(widthInput);
    await userEvent.type(widthInput, '400');
    await userEvent.tab(); // Trigger blur
    
    expect(defaultProps.onSizeChange).toHaveBeenCalledWith(400, 150);
    
    // Change rotation
    const rotationInput = screen.getByLabelText(/rotation/i);
    await userEvent.clear(rotationInput);
    await userEvent.type(rotationInput, '45');
    await userEvent.tab(); // Trigger blur
    
    expect(defaultProps.onRotationChange).toHaveBeenCalledWith(45);
  });
});

describe('LayerControls', () => {
  const defaultProps = {
    zIndex: 2,
    onBringForward: jest.fn(),
    onSendBackward: jest.fn(),
    onBringToFront: jest.fn(),
    onSendToBack: jest.fn(),
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders layer control buttons', () => {
    render(<LayerControls {...defaultProps} />);
    
    expect(screen.getByRole('button', { name: /bring forward/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send backward/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /bring to front/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send to back/i })).toBeInTheDocument();
  });
  
  test('calls appropriate handlers when layer buttons are clicked', async () => {
    render(<LayerControls {...defaultProps} />);
    
    // Click bring forward
    await userEvent.click(screen.getByRole('button', { name: /bring forward/i }));
    expect(defaultProps.onBringForward).toHaveBeenCalled();
    
    // Click send backward
    await userEvent.click(screen.getByRole('button', { name: /send backward/i }));
    expect(defaultProps.onSendBackward).toHaveBeenCalled();
    
    // Click bring to front
    await userEvent.click(screen.getByRole('button', { name: /bring to front/i }));
    expect(defaultProps.onBringToFront).toHaveBeenCalled();
    
    // Click send to back
    await userEvent.click(screen.getByRole('button', { name: /send to back/i }));
    expect(defaultProps.onSendToBack).toHaveBeenCalled();
  });
}); 