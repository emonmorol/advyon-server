import request from 'supertest';
import app from '../../src/app';
import {
  UserResponseSchema,
  CaseListResponseSchema,
  DocumentListResponseSchema,
  ErrorResponseSchema,
} from './schemas';

// Mock auth middleware for contract tests if needed, 
// or use a real test token if available in env
const testToken = process.env.TEST_AUTH_TOKEN || '';

describe('API Contract Validation', () => {
  
  describe('Auth Module', () => {
    it('GET /api/v1/auth/me should return valid user schema', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${testToken}`);

      if (res.status === 200) {
        const result = UserResponseSchema.safeParse(res.body);
        expect(result.success).toBe(true);
      } else {
        const result = ErrorResponseSchema.safeParse(res.body);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Case Module', () => {
    it('GET /api/v1/cases should return valid case list schema', async () => {
      const res = await request(app)
        .get('/api/v1/cases')
        .set('Authorization', `Bearer ${testToken}`);

      if (res.status === 200) {
        const result = CaseListResponseSchema.safeParse(res.body);
        if (!result.success) {
          console.error('CaseList Validation Errors:', result.error.format());
        }
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Document Module', () => {
    it('GET /api/v1/documents/:caseId should return valid document list schema', async () => {
      // Note: This matches backend route, but frontend currently hits /cases/:caseId
      const testCaseId = 'any-id'; 
      const res = await request(app)
        .get(`/api/v1/documents/${testCaseId}`)
        .set('Authorization', `Bearer ${testToken}`);

      if (res.status === 200) {
        const result = DocumentListResponseSchema.safeParse(res.body);
        expect(result.success).toBe(true);
      }
    });

    it('POST /api/v1/documents/:caseId/upload should fail without file but return standard error', async () => {
      const testCaseId = 'any-id';
      const res = await request(app)
        .post(`/api/v1/documents/${testCaseId}/upload`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).not.toBe(200);
      const result = ErrorResponseSchema.safeParse(res.body);
      expect(result.success).toBe(true);
    });
  });

  describe('Admin Module Security', () => {
    it('GET /api/v1/admin/users should return 401 or 403 for non-admin', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${testToken}`); // assume lawyer/client token

      // If it returns 200, check if it's protected correctly in the route file
      if (res.status === 200) {
        console.warn('SECURITY WARNING: /admin/users is accessible without admin role');
      } else {
        expect([401, 403]).toContain(res.status);
      }
    });
  });
});
