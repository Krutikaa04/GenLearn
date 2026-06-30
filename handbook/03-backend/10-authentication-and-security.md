# Document Metadata

**Document ID:** BE-10

**Title:** Authentication and Security

**Version:** 1.0.0

**Status:** DRAFT

**Owners:** Rishi Mahajan, Krutika Wagh

**Category:** Backend

**Priority:** Critical

---

# Purpose

Define the complete authentication and security implementation for the GenLearn backend.

---

# Authentication Stack

| Technology | Role |
|-----------|------|
| JWT (HS256) | Access token signing and verification |
| bcrypt (cost 12) | Password hashing |
| NestJS Guards | Route protection |
| Passport JWT Strategy | Token parsing |
| RBAC Decorators | Role enforcement |

---

# Token Architecture

## Access Token

- Type: JWT
- Algorithm: HS256 (HS512 in production)
- Expiry: 15 minutes
- Claims: `{ sub, email, role, iat, exp }`
- Transmitted in: `Authorization: Bearer <token>` header
- Never stored in cookie, localStorage, or sessionStorage on client

## Refresh Token

- Type: opaque random 32-byte string, SHA-256 hashed before storage
- Expiry: 7 days
- Stored in: `HttpOnly, Secure, SameSite=Strict` cookie
- Rotation: every use — old token invalidated, new one issued
- Maximum 10 concurrent tokens per user (multi-device support)

---

# JWT Guard

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) { super(); }

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
```

Applied globally. Public endpoints are decorated with `@Public()`.

---

# RBAC

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}

// Usage on controller methods:
@Roles(Role.ADMIN)
@Get('/admin/users')
getUsers() { }
```

---

# Refresh Token Rotation

```
1. Client sends refresh token in HttpOnly cookie
2. Backend hashes token → SHA-256
3. Backend finds matching tokenHash in user.refreshTokens
4. If not found: replay attack — invalidate ALL tokens for user
5. If expired: remove token, return 401
6. If valid: issue new access + refresh token pair
7. Remove old tokenHash, add new tokenHash to user.refreshTokens
8. Set new refresh token as HttpOnly cookie
9. Return new access token in response body
```

---

# Password Policy

- Minimum 8 characters
- Must contain: uppercase, lowercase, number, special character
- Hashing: bcrypt cost 12
- Reset token: 32-byte random, stored as SHA-256 hash, expires in 1 hour

---

# Request Security

## CORS

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
});
```

## Rate Limiting

Applied via `@nestjs/throttler`. Auth endpoints use custom limits (10 per 15 min per IP).

## Security Headers (Production)

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

## Input Validation

```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}));
```

---

# Internal API Security

```
Backend → AI Platform: X-Internal-Key: <INTERNAL_API_KEY>
```

AI Platform rejects all requests missing the correct key. Key must be rotated on each deployment environment.

---

# Prohibited Patterns

- No JWT in localStorage or sessionStorage
- No passwords logged at any level
- No tokens in URL query parameters
- No sensitive data in JWT payload beyond `{ sub, email, role }`
- No raw user input in database queries
- No mass assignment (all DTOs use `whitelist: true`)

---

# Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | June 2026 | Initial authentication and security document created. |
