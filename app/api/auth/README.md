# Authentication APIs

This directory contains the authentication endpoints for the Family Archive Access Control system.

## Endpoints

### POST /api/auth/register
Register a new user account and create a default family.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "familyName": "My Family Archive" // optional
}
```

**Response (201 Created):**
```json
{
  "userId": "cuid...",
  "familyId": "cuid..."
}
```

**Errors:**
- `400 Bad Request`: Invalid email format or password too short (< 8 chars)
- `409 Conflict`: Email already registered

**Side Effects:**
- Creates User record with bcrypt-hashed password
- Creates default Family record
- Creates session and sets HTTP-only cookie

---

### POST /api/auth/login
Authenticate a user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "userId": "cuid..."
}
```

**Errors:**
- `400 Bad Request`: Missing email or password
- `401 Unauthorized`: Invalid credentials

**Side Effects:**
- Creates session in database
- Sets HTTP-only session cookie (30-day expiration)

---

### POST /api/auth/logout
Destroy the current session and clear the session cookie.

**Request:**
- Requires session cookie

**Response (200 OK):**
```json
{
  "success": true
}
```

**Side Effects:**
- Deletes session from database
- Clears session cookie (sets Max-Age=0)

---

### GET /api/auth/session
Check if the current session is valid and return user data.

**Request:**
- Optional session cookie

**Response (200 OK) - Valid Session:**
```json
{
  "userId": "cuid...",
  "email": "user@example.com"
}
```

**Response (200 OK) - No Session:**
```json
null
```

**Side Effects:**
- Renews session expiration (sliding window) if valid
- Cleans up expired sessions

**Security Notes:**
- Password hash is never returned in responses
- Session tokens are 64-character hex strings (32 bytes)
- Sessions expire after 30 days of inactivity
- All cookies are HTTP-only, secure (in production), and SameSite=lax

---

## Testing

Run the integration test suite:
```bash
npx tsx scripts/test-auth-apis.ts
```

This tests:
- ✓ Successful login with valid credentials
- ✓ Rejection of invalid credentials
- ✓ Session validation with valid cookie
- ✓ Session check without cookie returns null
- ✓ Logout destroys session
- ✓ Session is invalid after logout

---

## Implementation Details

### Password Security
- Passwords are hashed using bcrypt with 10 rounds
- Minimum password length: 8 characters
- Password hashes are never exposed in API responses

### Session Management
- Sessions use cryptographically secure random tokens (32 bytes)
- Sessions expire after 30 days
- Session expiration is renewed on each authenticated request (sliding window)
- Expired sessions are automatically cleaned up

### Cookie Security
- HTTP-only: Prevents JavaScript access (XSS protection)
- Secure: Only sent over HTTPS in production
- SameSite=lax: Prevents CSRF while allowing normal navigation
- Path=/: Available across entire site
- Max-Age: 30 days (2,592,000 seconds)

### Error Handling
- Generic "Invalid credentials" message for both invalid email and password (prevents user enumeration)
- All errors return appropriate HTTP status codes
- Internal errors are logged but return generic 500 responses
