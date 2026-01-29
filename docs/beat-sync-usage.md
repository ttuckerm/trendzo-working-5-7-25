# Beat Sync Controller User Guide

## Overview

The Beat Sync Controller is a powerful feature that allows you to synchronize animations with the beat of audio in your templates. This creates dynamic, engaging content that matches the rhythm of the music.

## Accessing the Beat Sync Controller

The Beat Sync Controller appears in the timeline panel of the Template Editor. It's automatically integrated into the interface and appears as a button in the top-right area of the timeline.

## Using Beat Sync

### Step 1: Add Audio to Your Template

Before using the Beat Sync Controller, you need to add audio to your template:

1. Click the sound icon (🎵) in the main toolbar
2. Select a sound from the library or upload your own
3. Add the sound to your template

### Step 2: Open the Beat Sync Controller

The Beat Sync Controller appears directly in the timeline panel header. When audio is present in your template, the controller will be active.

### Step 3: Detect Beats

1. Click the "Detect Beats" button in the Beat Sync Controller
2. The system will analyze your audio and identify beats
3. Once complete, you'll see a confirmation showing the number of beats detected

### Step 4: Apply Animations

After beat detection, animations will be automatically applied to elements in your template based on:

- Element type (text, image, background)
- Beat timing and intensity
- Element position in the timeline

Different elements will receive different animations:
- **Text elements** will pulse or change opacity
- **Image elements** will scale or rotate
- **Background elements** will change color intensity

### Step 5: Preview and Adjust

Play your template to see the beat-synchronized animations in action. You can:

- Click "Resync Beats" to regenerate animations
- Click "Clear Sync" to remove all beat animations

## Troubleshooting

If the Beat Sync Controller is not visible or not working:

1. Make sure a sound is added to your template
2. Ensure the timeline panel is open and visible
3. Check that your audio file has detectable beats (music with clear rhythm works best)
4. Try refreshing the page if the controller doesn't appear

## Technical Notes

- The beat detection algorithm analyzes audio energy levels to identify beats
- For optimal results, use audio with clear rhythmic patterns
- The system supports various audio formats including MP3, WAV, and M4A
- Beat sync points are stored with your template and will persist when saved 