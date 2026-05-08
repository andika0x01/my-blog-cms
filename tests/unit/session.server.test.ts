import { describe, it, expect, vi } from 'vitest';
import { getSessionStorage, getAuthSession, requireUser, getVisitorStorage } from '../../app/utils/session.server';

// Mock react-router methods used in session.server.ts
vi.mock('react-router', () => {
  return {
    createCookieSessionStorage: vi.fn((opts) => ({
      getSession: vi.fn(async (cookieHeader) => {
        if (cookieHeader === 'valid_cookie') {
          return { get: (key: string) => key === 'userId' ? 'user-123' : null };
        }
        return { get: () => null };
      }),
      commitSession: vi.fn(),
      destroySession: vi.fn(),
    })),
    redirect: vi.fn((url: string) => {
      const err = new Error('Redirect');
      (err as any).url = url;
      return err;
    }),
  };
});

describe('Session Server Utils', () => {
  const mockEnv = { SESSION_SECRET: 'test_secret' };

  it('getSessionStorage initializes cookie storage', () => {
    const storage = getSessionStorage(mockEnv);
    expect(storage).toBeDefined();
    expect(storage.getSession).toBeTypeOf('function');
  });

  it('getSessionStorage runs without env.SESSION_SECRET', () => {
    const storage = getSessionStorage({});
    expect(storage).toBeDefined();
  });

  it('getAuthSession returns session from request cookie', async () => {
    const req = new Request('http://localhost', { headers: { Cookie: 'valid_cookie' } });
    const session = await getAuthSession(req, mockEnv);
    expect(session.get('userId')).toBe('user-123');
  });

  it('requireUser returns userId if session is valid', async () => {
    const req = new Request('http://localhost', { headers: { Cookie: 'valid_cookie' } });
    const userId = await requireUser(req, mockEnv);
    expect(userId).toBe('user-123');
  });

  it('requireUser throws redirect if no userId in session', async () => {
    const req = new Request('http://localhost');
    await expect(requireUser(req, mockEnv)).rejects.toThrow('Redirect');
  });

  it('getVisitorStorage initializes visitor cookie storage', () => {
    const storage = getVisitorStorage(mockEnv);
    expect(storage).toBeDefined();
    expect(storage.getSession).toBeTypeOf('function');
  });
  
  it('getVisitorStorage runs without env.SESSION_SECRET', () => {
    const storage = getVisitorStorage({});
    expect(storage).toBeDefined();
  });
});
