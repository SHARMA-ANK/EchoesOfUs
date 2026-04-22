import { NextRequest, NextResponse } from 'next/server';
import { setSessionCookie, clearSessionCookie, getSessionToken } from './cookies';

describe('Cookie Utilities', () => {
    describe('setSessionCookie', () => {
        it('should set session cookie with correct options', () => {
            const response = NextResponse.json({ success: true });
            const token = 'a'.repeat(64); // 64-char token

            setSessionCookie(response, token);

            const cookie = response.cookies.get('session');
            expect(cookie).toBeDefined();
            expect(cookie?.value).toBe(token);
            expect(cookie?.httpOnly).toBe(true);
            expect(cookie?.sameSite).toBe('lax');
            expect(cookie?.path).toBe('/');
            expect(cookie?.maxAge).toBe(30 * 24 * 60 * 60); // 30 days
        });

        it('should set secure flag in production', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            const response = NextResponse.json({ success: true });
            const token = 'b'.repeat(64);

            setSessionCookie(response, token);

            const cookie = response.cookies.get('session');
            expect(cookie?.secure).toBe(true);

            process.env.NODE_ENV = originalEnv;
        });

        it('should not set secure flag in development', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';

            const response = NextResponse.json({ success: true });
            const token = 'c'.repeat(64);

            setSessionCookie(response, token);

            const cookie = response.cookies.get('session');
            expect(cookie?.secure).toBe(false);

            process.env.NODE_ENV = originalEnv;
        });
    });

    describe('clearSessionCookie', () => {
        it('should clear session cookie by setting maxAge to 0', () => {
            const response = NextResponse.json({ success: true });

            // First set a cookie
            setSessionCookie(response, 'd'.repeat(64));

            // Then clear it
            clearSessionCookie(response);

            const cookie = response.cookies.get('session');
            expect(cookie).toBeDefined();
            expect(cookie?.value).toBe('');
            expect(cookie?.maxAge).toBe(0);
            expect(cookie?.httpOnly).toBe(true);
        });
    });

    describe('getSessionToken', () => {
        it('should extract session token from request cookies', () => {
            const token = 'e'.repeat(64);
            const request = new NextRequest('http://localhost:3000/api/test', {
                headers: {
                    cookie: `session=${token}`,
                },
            });

            const extractedToken = getSessionToken(request);
            expect(extractedToken).toBe(token);
        });

        it('should return null when session cookie is not present', () => {
            const request = new NextRequest('http://localhost:3000/api/test');

            const extractedToken = getSessionToken(request);
            expect(extractedToken).toBeNull();
        });

        it('should return null when session cookie is empty', () => {
            const request = new NextRequest('http://localhost:3000/api/test', {
                headers: {
                    cookie: 'session=',
                },
            });

            const extractedToken = getSessionToken(request);
            expect(extractedToken).toBeNull();
        });

        it('should extract session token when multiple cookies are present', () => {
            const token = 'f'.repeat(64);
            const request = new NextRequest('http://localhost:3000/api/test', {
                headers: {
                    cookie: `other=value; session=${token}; another=value`,
                },
            });

            const extractedToken = getSessionToken(request);
            expect(extractedToken).toBe(token);
        });
    });
});
