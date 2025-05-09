# TikTok Template Editor API

This directory contains the API endpoints for the TikTok Template Editor application.

## API Structure

- `/api/templates` - Endpoints for managing templates collection
- `/api/templates/[id]` - Endpoints for managing individual templates
- `/api/ai/generate-script` - Endpoint for generating AI scripts for template sections

## Authentication

For demo and development purposes, a simplified authentication approach is used:
- The `x-user-id` header is used to identify users
- A fallback `demo-user-id` is provided for testing without authentication
- In production, Firebase Authentication should be properly integrated

## Templates API

### GET /api/templates
Returns all templates owned by the current user.

Response:
```json
[
  {
    "id": "template-id-1",
    "name": "Template Name",
    "industry": "Technology",
    "category": "Product Launch",
    "sections": [...],
    "views": 120,
    "usageCount": 15,
    "isPublished": true,
    "userId": "user-id",
    "createdAt": "2023-05-01T12:00:00Z",
    "updatedAt": "2023-05-10T14:30:00Z"
  },
  ...
]
```

### POST /api/templates
Creates a new template.

Request Body:
```json
{
  "name": "New Template",
  "industry": "E-commerce",
  "category": "Sales",
  "sections": [...]
}
```

Response: The created template object

### GET /api/templates/[id]
Returns a specific template by ID.

Response: The template object

### PUT /api/templates/[id]
Updates a specific template.

Request Body: Template data with updated fields
Response: The updated template object

### DELETE /api/templates/[id]
Deletes a specific template.

Response:
```json
{
  "success": true
}
```

## AI Generation API

### POST /api/ai/generate-script
Generates a script for a template section using OpenAI.

Request Body:
```json
{
  "sectionName": "Intro",
  "industry": "Technology",
  "style": "Professional",
  "duration": 5,
  "objective": "Introduce new product features"
}
```

Response:
```json
{
  "script": "Welcome to our revolutionary new tech product. Designed with you in mind, it solves your everyday problems with just a tap.",
  "params": {
    "sectionName": "Intro",
    "industry": "Technology",
    "style": "Professional",
    "duration": 5,
    "objective": "Introduce new product features"
  }
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:
- 200: Success
- 201: Resource created
- 400: Bad request (missing/invalid parameters)
- 401: Unauthorized
- 403: Forbidden (authenticated but no permission)
- 404: Resource not found
- 500: Server error

Error responses follow this format:
```json
{
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

## Subscription Tiers

Certain API features require specific subscription tiers:
- Free: Basic template creation and editing
- Premium: Analytics access
- Business: AI script generation 