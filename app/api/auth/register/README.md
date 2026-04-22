# Registration API Endpoint

## Overview

The registration endpoint allows new users to create an account with email and password authentication. Upon successful registration, a default Family Archive is automatically created for the user, and a session is established.

## Endpoint

```
POST /api/auth/register
```

## Request Body

```json
{
  "email": "user@example.com",
  "password": "password123",
  "familyName": "Smith Family Archive" // Optional
}
```

### Parameters

- `email` (required): User's email address
  - Must be a valid email format (basic regex validation)
  - Must be unique (not already registered)
  
- `password` (required): User's password
  - Must be at least 8 characters long
  
- `familyName` (optional): Name for the default Family Archive
  - Defaults to "My Family Archive" if not provided

## Response

### Success (201 Created)

```json
{
  "userId": "cmo9wapx50000sp6hh1c8yhye",
  "familyId": "cmo9wapxd0002sp6hxgl6fuxn"
}
```

**Headers:**
- `Set-Cookie`: Session cookie (HTTP-only, secure in production)

### Error Responses

#### 400 Bad Request

**Missing required fields:**
```json
{
  "error": "Email and password are required"
}
```

**Invalid email format:**
```json
{
  "error": "Invalid email format"
}
```

**Weak password:**
```json
{
  "error": "Password must be at least 8 characters long"
}
```

#### 409 Conflict

**Email already registered:**
```json
{
  "error": "Email already registered"
}
```

#### 500 Internal Server Error

**Server error:**
```json
{
  "error": "Internal server error"
}
```

## Implementation Details

### Security Features

1. **Password Hashing**: Passwords are hashed using bcrypt with 10 salt rounds before storage
2. **Session Management**: Secure session tokens (32 bytes, hex-encoded) with 30-day expiration
3. **HTTP-Only Cookies**: Session cookies are HTTP-only to prevent XSS attacks
4. **Secure Flag**: Cookies use the secure flag in production (HTTPS only)

### Database Operations

The registration process performs the following operations in a transaction:

1. Validate email format and password strength
2. Check for existing user with the same email
3. Hash the password using bcrypt
4. Create User record
5. Create default Family record linked to the user
6. Create Session record
7. Set session cookie in response

### Validation Rules

- **Email**: Must match regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- **Password**: Minimum 8 characters (no complexity requirements)
- **Family Name**: No validation (optional field)

## Testing

### Manual Testing

Run the test script to verify the endpoint:

```bash
# Start the dev server
npm run dev

# In another terminal, run the API test
npx tsx scripts/test-registration-api.ts
```

### Test Cases Covered

1. ✓ Successful registration with custom family name
2. ✓ Successful registration with default family name
3. ✓ Missing email (400)
4. ✓ Missing password (400)
5. ✓ Invalid email format (400)
6. ✓ Weak password (400)
7. ✓ Duplicate email (409)
8. ✓ Session cookie creation
9. ✓ Password hashing
10. ✓ Family-user relationship

## Example Usage

### Using fetch

```javascript
const response = await fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'securePassword123',
    familyName: 'Smith Family Archive',
  }),
});

if (response.ok) {
  const { userId, familyId } = await response.json();
  console.log('Registration successful!');
  console.log('User ID:', userId);
  console.log('Family ID:', familyId);
  
  // Session cookie is automatically set
  // User is now authenticated
} else {
  const error = await response.json();
  console.error('Registration failed:', error.error);
}
```

### Using curl

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securePassword123",
    "familyName": "Smith Family Archive"
  }'
```

## Related Files

- `lib/auth/password.ts` - Password hashing utilities
- `lib/auth/session.ts` - Session management
- `lib/auth/cookies.ts` - Cookie utilities
- `prisma/schema.prisma` - Database schema
- `scripts/test-registration.ts` - Logic tests
- `scripts/test-registration-api.ts` - API integration tests

## Next Steps

After registration, users can:
1. Access the Family Dashboard at `/dashboard`
2. Create profiles within their Family Archive
3. Generate magic links for interviews
4. Manage their family's visibility settings
