#!/bin/bash

# Install AI SDK packages for the AI-Assisted Template Customization feature

echo "Installing AI SDK packages..."

# Install OpenAI SDK
npm install openai@^4.28.0

# Install Anthropic SDK
npm install @anthropic-ai/sdk@^0.10.0

# Install UUID package (if not already installed)
npm install uuid@^9.0.0

# Install types for UUID (if not already installed)
npm install --save-dev @types/uuid

echo "AI SDK packages installed successfully!"
echo "Please rebuild and restart your application to apply these changes." 