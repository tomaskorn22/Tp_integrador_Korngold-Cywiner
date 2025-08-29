# Event Management API - Implementation Summary

## Overview
This API provides a complete event management system with user authentication, event CRUD operations, enrollment functionality, and event location management.

## Implemented Endpoints

### Authentication Endpoints
- **POST /api/user/register** - User registration
  - Validates name length (≥3 chars), email format, password length (≥3 chars)
  - Returns 201 on success, 400 on validation errors
  
- **POST /api/user/login** - User authentication
  - Returns JWT token on successful authentication
  - Returns 400 for invalid email, 401 for invalid credentials

### Event Management Endpoints

#### Event Listing & Details
- **GET /api/event** - List events with pagination and filters
  - Query parameters: `name`, `startdate`, `tag`, `page`, `limit`
  - Returns paginated events with creator, location, and tags
  
- **GET /api/event/{id}** - Get event details
  - Returns complete event data including nested location and province info
  - Returns 404 if event not found

#### Event CRUD Operations (Authentication Required)
- **POST /api/event** - Create new event
  - Validates name/description length (≥3 chars)
  - Validates price ≥ 0, duration ≥ 0
  - Validates max_assistance ≤ location max_capacity
  - Returns 201 on success, 400 on validation errors, 401 if not authenticated
  
- **PUT /api/event** - Update existing event
  - ID must be provided in request body
  - Only event creator can update
  - Dynamic field updates (only provided fields are updated)
  - Same validation rules as creation
  - Returns 200 on success, 404 if not found/not owner
  
- **DELETE /api/event/{id}** - Delete event
  - Only event creator can delete
  - Prevents deletion if users are enrolled
  - Returns 200 on success, 400 if has enrollments, 404 if not found/not owner

### Event Enrollment Endpoints (Authentication Required)
- **POST /api/event/{id}/enrollment** - Enroll user in event
  - Validates event is enabled for enrollment
  - Prevents enrollment in past/today events
  - Prevents duplicate enrollments
  - Checks capacity limits
  - Returns 201 on success, 400 on validation errors, 404 if event not found
  
- **DELETE /api/event/{id}/enrollment** - Remove user from event
  - Prevents unenrollment from past/today events
  - Returns 200 on success, 400 if not enrolled, 404 if event not found

### Event Location Management Endpoints (Authentication Required)
- **GET /api/event-location** - List user's event locations
  - Paginated results with location details
  - Only shows locations created by authenticated user
  
- **GET /api/event-location/{id}** - Get specific event location
  - Includes nested location and province information
  - Only accessible by location creator
  - Returns 404 if not found/not owner
  
- **POST /api/event-location** - Create new event location
  - Validates name/address length (≥3 chars)
  - Validates max_capacity > 0
  - Validates id_location exists
  - Creator is automatically set to authenticated user
  - Returns 201 on success, 400 on validation errors
  
- **PUT /api/event-location/{id}** - Update event location
  - Only location creator can update
  - Dynamic field updates
  - Same validation rules as creation
  - Returns 200 on success, 404 if not found/not owner
  
- **DELETE /api/event-location/{id}** - Delete event location
  - Only location creator can delete
  - Prevents deletion if events are using this location
  - Returns 200 on success, 400 if has associated events, 404 if not found/not owner

## Security Features
- JWT-based authentication for protected endpoints
- User ownership validation for events and locations
- Input validation and sanitization
- Proper HTTP status codes and error messages

## Business Rules Implemented
1. Event creators can only modify/delete their own events
2. Events cannot be deleted if users are enrolled
3. Users cannot enroll in past events or events happening today
4. Event capacity cannot exceed location capacity
5. Duplicate enrollments are prevented
6. Event locations cannot be deleted if events are using them
7. All text fields require minimum 3 characters
8. Prices and durations must be non-negative
9. Email addresses must be valid format

## Data Relationships
- Events belong to users (creators)
- Events have event locations
- Event locations have geographic locations with provinces
- Users can enroll in events
- Events can have multiple tags
- Complete nested data is returned in API responses

## Response Formats
All responses follow consistent JSON formats matching the specification, with proper error handling and detailed nested objects for relationships.