# OpenAI Realtime API Integration

This document describes the integration of OpenAI's Realtime API for voice interactions in the Art Terminal application.

## Overview

The integration enables real-time voice interactions using OpenAI's GPT-4o model through WebRTC. The system consists of:

1. A server endpoint (`/api/realtime/route.js`) that generates ephemeral tokens
2. A React component (`RealtimeAudio.js`) that handles WebRTC connections and audio streaming

## Components

### Server Endpoint (`/api/realtime/route.js`)

The server endpoint handles:
- Generation of ephemeral tokens for secure client-side connections
- Authentication with OpenAI's API
- Configuration of model and voice settings

### React Component (`RealtimeAudio.js`)

The component manages:
- WebRTC connection setup
- Audio input/output streams
- Real-time data channel for events
- User interface for voice interactions

## Technical Details

### WebRTC Setup

1. Client requests ephemeral token from our server
2. Server generates token using OpenAI's session API
3. Client establishes WebRTC connection using token
4. Audio streams and data channels are configured

### Voice Processing

- Uses browser's `getUserMedia` API for microphone access
- Streams audio in real-time to OpenAI's model
- Receives processed audio responses
- Handles voice activation detection

### Security

- Uses ephemeral tokens that expire after 1 minute
- Keeps OpenAI API key secure on server
- Implements proper WebRTC security practices

## Usage

The voice assistant can be used to:
1. Generate image prompts through voice
2. Get information about generated images
3. Control gallery navigation
4. Provide natural language assistance

## Model Details

Using:
- Model: `gpt-4o-realtime-preview-2024-12-17`
- Voice: `verse`
- Supports: Text and audio modalities

## Error Handling

The system includes comprehensive error handling for:
- Connection failures
- Token expiration
- Audio device issues
- Network interruptions

## Future Improvements

Potential enhancements:
1. Voice command shortcuts
2. Custom wake words
3. Multi-language support
4. Voice-based image editing
5. Audio feedback for operations
