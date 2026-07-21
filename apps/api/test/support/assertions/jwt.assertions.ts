// test/support/assertions/jwt.assertions.ts
import { decode } from 'jsonwebtoken';

export interface ExpectedJwtPayload {
  sub?: string;
  email?: string;
  role?: string;
}

export function expectJwtPayload(
  token: string,
  expected: ExpectedJwtPayload = {},
): void {
  const decoded = decode(token);

  expect(decoded).toEqual(expect.any(Object));

  const payload = decoded as Record<string, unknown>;

  expect(typeof payload.sub).toBe('string');
  expect(typeof payload.email).toBe('string');
  expect(typeof payload.role).toBe('string');

  if (expected.sub !== undefined) {
    expect(payload.sub).toBe(expected.sub);
  }

  if (expected.email !== undefined) {
    expect(payload.email).toBe(expected.email);
  }

  if (expected.role !== undefined) {
    expect(payload.role).toBe(expected.role);
  }
}
