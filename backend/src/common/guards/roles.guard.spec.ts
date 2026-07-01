import { RolesGuard } from './roles.guard';

function makeContext(role: string | undefined, reflectorReturn: string[] | undefined): any {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ user: role !== undefined ? { role } : undefined }),
    }),
  };
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: { getAllAndOverride: jest.Mock };

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(reflector as any);
  });

  it('allows access when no required roles are set on the route', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    const result = guard.canActivate(makeContext('student', undefined));

    expect(result).toBe(true);
  });

  it('allows access when the user has a required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);

    const result = guard.canActivate(makeContext('admin', ['admin']));

    expect(result).toBe(true);
  });

  it('denies access when the user does not have any required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);

    const result = guard.canActivate(makeContext('student', ['admin']));

    expect(result).toBe(false);
  });

  it('denies access when the user is undefined', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);

    const result = guard.canActivate(makeContext(undefined, ['admin']));

    expect(result).toBe(false);
  });

  it('allows access when the user has one of multiple allowed roles', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin', 'teacher']);

    const result = guard.canActivate(makeContext('teacher', ['admin', 'teacher']));

    expect(result).toBe(true);
  });
});
