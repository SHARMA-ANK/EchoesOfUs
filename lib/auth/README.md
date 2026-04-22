# Authentication Library

This directory contains authentication utilities for the Family Archive Access Control system.

## Files

### `password.ts`
Password hashing and verification utilities using bcrypt.

- `hashPassword(password: string): Promise<string>` - Hash a password with bcrypt (10 rounds)
- `verifyPassword(password: string, hash: string): Promise<boolean>` - Verify a password against a hash

### `session.ts`
Session management utilities for creating, validating, and destroying user sessions.

- `createSession(userId: string): Promise<Session>` - Create a new session with 30-day expiration
- `validateSession(token: string): Promise<User | null>` - Validate a session token and return user
- `renewSession(token: string): Promise<void>` - Extend session expiration (sliding window)
- `destroySession(token: string): Promise<void>` - Delete a session from database

### `cookies.ts` ✨ NEW
HTTP cookie utilities for managing session cookies with proper security flags.

#### Functions

##### `setSessionCookie(response: NextResponse, token: string): void`
Sets a session cookie in the response with secure options:
- **httpOnly**: `true` - Prevents client-side JavaScript access (XSS protection)
- **secure**: `true` in production - Only send over HTTPS
- **sameSite**: `'lax'` - Prevents CSRF while allowing normal navigation
- **path**: `'/'` - Available across entire site
- **maxAge**: 30 days

**Example:**
```typescript
import { NextResponse } from 'next/server';
import { setSessionCookie } from '@/lib/auth/cookies';
import { createSession } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
    // ... authenticate user ...
    const session = await createSession(userId);
    
    const response = NextResponse.json({ success: true });
    setSessionCookie(response, session.token);
    
    return response;
}
```

##### `clearSessionCookie(response: NextResponse): void`
Clears the session cookie by setting it to an empty value with maxAge of 0.

**Example:**
```typescript
import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth/cookies';

export async function POST(req: NextRequest) {
    // ... destroy session ...
    
    const response = NextResponse.json({ success: true });
    clearSessionCookie(response);
    
    return response;
}
```

##### `getSessionToken(request: NextRequest): string | null`
Extracts the session token from request cookies.

**Example:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSessionToken } from '@/lib/auth/cookies';
import { validateSession } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
    const token = getSessionToken(req);
    
    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await validateSession(token);
    
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // User is authenticated
    return NextResponse.json({ user });
}
```

##### `getSessionTokenFromCookies(): Promise<string | null>`
Gets session token from server-side `cookies()` function. Use in Server Components and Server Actions.

**Example:**
```typescript
import { getSessionTokenFromCookies } from '@/lib/auth/cookies';
import { validateSession } from '@/lib/auth/session';

export default async function DashboardPage() {
    const token = await getSessionTokenFromCookies();
    
    if (!token) {
        redirect('/auth/login');
    }
    
    const user = await validateSession(token);
    
    if (!user) {
        redirect('/auth/login');
    }
    
    return <div>Welcome, {user.email}</div>;
}
```

## Security Features

### HTTP-Only Cookies
Session cookies are marked as `httpOnly`, preventing client-side JavaScript from accessing them. This protects against XSS attacks where malicious scripts try to steal session tokens.

### Secure Flag
In production environments, cookies are marked as `secure`, ensuring they're only transmitted over HTTPS connections. This prevents session hijacking via man-in-the-middle attacks.

### SameSite Protection
Cookies use `sameSite: 'lax'`, which:
- Prevents CSRF attacks by not sending cookies on cross-site POST requests
- Allows cookies on normal navigation (clicking links)
- Balances security with usability

### Session Expiration
Sessions expire after 30 days of inactivity. The `renewSession` function implements a sliding window, extending the expiration on each authenticated request.

## Complete Authentication Flow

### 1. Registration/Login
```typescript
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { setSessionCookie } from '@/lib/auth/cookies';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    const { email, password } = await req.json();
    
    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    // Verify password
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    // Create session
    const session = await createSession(user.id);
    
    // Set cookie and return response
    const response = NextResponse.json({ userId: user.id });
    setSessionCookie(response, session.token);
    
    return response;
}
```

### 2. Protected Route
```typescript
// app/api/families/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionToken } from '@/lib/auth/cookies';
import { validateSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    // Extract and validate session
    const token = getSessionToken(req);
    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await validateSession(token);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Fetch user's families
    const families = await prisma.family.findMany({
        where: { adminUserId: user.id }
    });
    
    return NextResponse.json(families);
}
```

### 3. Logout
```typescript
// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionToken, clearSessionCookie } from '@/lib/auth/cookies';
import { destroySession } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
    const token = getSessionToken(req);
    
    if (token) {
        await destroySession(token);
    }
    
    const response = NextResponse.json({ success: true });
    clearSessionCookie(response);
    
    return response;
}
```

## Testing

Unit tests are provided in `cookies.test.ts` covering:
- Cookie setting with correct security options
- Secure flag behavior in production vs development
- Cookie clearing
- Token extraction from requests
- Handling of missing or empty cookies
- Multiple cookie scenarios

Run tests with your configured test runner (Jest/Vitest).
