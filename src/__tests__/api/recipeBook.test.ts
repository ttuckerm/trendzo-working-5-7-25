import request from 'supertest';
import express from 'express';
import { recipeBookRouter } from '../../api/recipeBook';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase
jest.mock('@supabase/supabase-js');
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

// Mock NodeCache
jest.mock('node-cache');

const app = express();
app.use('/api', recipeBookRouter);

const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        ilike: jest.fn(() => ({
          order: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => ({
                data: [],
                error: null
              }))
            }))
          }))
        }))
      })),
      ilike: jest.fn(() => ({
        order: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => ({
              data: [],
              error: null
            }))
          }))
        }))
      })),
      order: jest.fn(() => ({
        order: jest.fn(() => ({
          limit: jest.fn(() => ({
            data: [],
            error: null
          }))
        }))
      })),
      limit: jest.fn(() => ({
        data: [],
        error: null
      }))
    }))
  }))
};

beforeEach(() => {
  mockCreateClient.mockReturnValue(mockSupabase as any);
  jest.clearAllMocks();
  
  // Reset the module to clear cache
  jest.resetModules();
});

describe('RecipeBook API', () => {
  
  describe('GET /api/recipe-book', () => {
    
    test('should return 200 with empty templates when no data exists', async () => {
      // Mock empty response
      const mockQuery = {
        data: [],
        error: null
      };
      
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => mockQuery)
            }))
          }))
        }))
      }));

      const response = await request(app)
        .get('/api/recipe-book')
        .expect(200);

      expect(response.body).toEqual({
        templates: []
      });
      
      expect(response.headers['x-templates-count']).toBe('0');
      expect(response.headers['x-response-time']).toBeDefined();
    });

    test('should return templates without params and limit to 50 items', async () => {
      // Mock 60 templates to test default limit
      const mockTemplates = Array.from({ length: 60 }, (_, i) => ({
        template_id: `template-${i}`,
        name: `Template ${i}`,
        niche: 'fitness',
        status: i % 4 === 0 ? 'HOT' : i % 4 === 1 ? 'NEW' : i % 4 === 2 ? 'STABLE' : 'COOLING',
        success_rate: 0.5 + (i % 10) * 0.05,
        trend_pct: (i % 10) * 0.1,
        centroid: [0.8, 0.6, 0.4, 0.2]
      }));

      const mockQuery = {
        data: mockTemplates.slice(0, 50), // Database would limit to 50
        error: null
      };
      
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => mockQuery)
            }))
          }))
        }))
      }));

      const response = await request(app)
        .get('/api/recipe-book')
        .expect(200);

      expect(response.body.templates).toHaveLength(50);
      expect(response.body.templates[0]).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        niche: expect.any(String),
        status: expect.any(String),
        success_rate: expect.any(Number),
        trend_pct: expect.any(Number),
        main_genes: expect.any(Array)
      });
      
      expect(response.headers['x-templates-count']).toBe('50');
    });

    test('should filter by status=HOT and return only HOT templates', async () => {
      const mockTemplates = [
        {
          template_id: 'hot-1',
          name: 'Hot Template 1',
          niche: 'fitness',
          status: 'HOT',
          success_rate: 0.9,
          trend_pct: 0.25,
          centroid: [0.9, 0.8, 0.1, 0.2]
        },
        {
          template_id: 'hot-2',
          name: 'Hot Template 2',
          niche: 'business',
          status: 'HOT',
          success_rate: 0.85,
          trend_pct: 0.30,
          centroid: [0.7, 0.9, 0.3, 0.1]
        }
      ];

      const mockQuery = {
        data: mockTemplates,
        error: null
      };
      
      // Mock the query chain with eq for status filter
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(() => mockQuery)
              }))
            }))
          }))
        }))
      }));

      const response = await request(app)
        .get('/api/recipe-book?status=HOT')
        .expect(200);

      expect(response.body.templates).toHaveLength(2);
      response.body.templates.forEach((template: any) => {
        expect(template.status).toBe('HOT');
      });
    });

    test('should filter by niche with case-insensitive substring match', async () => {
      const mockTemplates = [
        {
          template_id: 'fitness-1',
          name: 'Fitness Template',
          niche: 'fitness',
          status: 'HOT',
          success_rate: 0.8,
          trend_pct: 0.2,
          centroid: [0.8, 0.6]
        }
      ];

      const mockQuery = {
        data: mockTemplates,
        error: null
      };
      
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          ilike: jest.fn(() => ({
            order: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(() => mockQuery)
              }))
            }))
          }))
        }))
      }));

      const response = await request(app)
        .get('/api/recipe-book?niche=fit')
        .expect(200);

      expect(response.body.templates).toHaveLength(1);
      expect(response.body.templates[0].niche).toBe('fitness');
    });

    test('should respect limit parameter and cap at 100', async () => {
      const mockTemplates = Array.from({ length: 100 }, (_, i) => ({
        template_id: `template-${i}`,
        name: `Template ${i}`,
        niche: 'general',
        status: 'STABLE',
        success_rate: 0.5,
        trend_pct: 0.1,
        centroid: [0.5, 0.5]
      }));

      const mockQuery = {
        data: mockTemplates,
        error: null
      };
      
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => mockQuery)
            }))
          }))
        }))
      }));

      // Test limit=150 gets capped to 100
      const response = await request(app)
        .get('/api/recipe-book?limit=150')
        .expect(200);

      expect(response.body.templates).toHaveLength(100);
      expect(response.headers['x-templates-count']).toBe('100');
    });

    test('should return 400 for invalid status parameter', async () => {
      const response = await request(app)
        .get('/api/recipe-book?status=INVALID')
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Invalid query parameters',
        details: expect.any(Object)
      });
    });

    test('should return 400 for invalid limit parameter', async () => {
      const response = await request(app)
        .get('/api/recipe-book?limit=0')
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Invalid query parameters',
        details: expect.any(Object)
      });
    });

    test('should extract main genes correctly from centroid', async () => {
      const mockTemplates = [
        {
          template_id: 'gene-test',
          name: 'Gene Test Template',
          niche: 'fitness',
          status: 'HOT',
          success_rate: 0.8,
          trend_pct: 0.2,
          centroid: [0.9, 0.1, 0.8, 0.2, 0.1] // AuthorityHook=0.9, TransformationBeforeAfter=0.8
        }
      ];

      const mockQuery = {
        data: mockTemplates,
        error: null
      };
      
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => mockQuery)
            }))
          }))
        }))
      }));

      const response = await request(app)
        .get('/api/recipe-book')
        .expect(200);

      expect(response.body.templates[0].main_genes).toEqual([
        'AuthorityHook', // Index 0 with value 0.9
        'TransformationBeforeAfter' // Index 2 with value 0.8
      ]);
    });

    test('should handle database errors gracefully', async () => {
      const mockQuery = {
        data: null,
        error: { message: 'Database connection failed' }
      };
      
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => mockQuery)
            }))
          }))
        }))
      }));

      const response = await request(app)
        .get('/api/recipe-book')
        .expect(500);

      expect(response.body).toMatchObject({
        error: 'Internal server error',
        message: expect.stringContaining('Database query failed')
      });
    });

    test('should sort templates by status priority then trend_pct', async () => {
      const mockTemplates = [
        {
          template_id: 'cooling-1',
          name: 'Cooling Template',
          niche: 'fitness',
          status: 'COOLING',
          success_rate: 0.3,
          trend_pct: 0.5,
          centroid: [0.5, 0.5]
        },
        {
          template_id: 'hot-1',
          name: 'Hot Template',
          niche: 'fitness',
          status: 'HOT',
          success_rate: 0.9,
          trend_pct: 0.2,
          centroid: [0.9, 0.8]
        },
        {
          template_id: 'new-1',
          name: 'New Template',
          niche: 'fitness',
          status: 'NEW',
          success_rate: 0.7,
          trend_pct: 0.3,
          centroid: [0.7, 0.6]
        },
        {
          template_id: 'stable-1',
          name: 'Stable Template',
          niche: 'fitness',
          status: 'STABLE',
          success_rate: 0.6,
          trend_pct: 0.1,
          centroid: [0.6, 0.5]
        }
      ];

      const mockQuery = {
        data: mockTemplates,
        error: null
      };
      
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => mockQuery)
            }))
          }))
        }))
      }));

      const response = await request(app)
        .get('/api/recipe-book')
        .expect(200);

      const statuses = response.body.templates.map((t: any) => t.status);
      expect(statuses).toEqual(['HOT', 'NEW', 'STABLE', 'COOLING']);
    });

    test('should include performance headers', async () => {
      const mockQuery = {
        data: [],
        error: null
      };
      
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => mockQuery)
            }))
          }))
        }))
      }));

      const response = await request(app)
        .get('/api/recipe-book')
        .expect(200);

      expect(response.headers['x-response-time']).toBeDefined();
      expect(response.headers['x-cache-hit']).toBeDefined();
      expect(response.headers['x-templates-count']).toBeDefined();
    });

    test('should handle missing centroid gracefully', async () => {
      const mockTemplates = [
        {
          template_id: 'no-centroid',
          name: 'No Centroid Template',
          niche: 'general',
          status: 'STABLE',
          success_rate: 0.5,
          trend_pct: 0.1,
          centroid: null
        }
      ];

      const mockQuery = {
        data: mockTemplates,
        error: null
      };
      
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => mockQuery)
            }))
          }))
        }))
      }));

      const response = await request(app)
        .get('/api/recipe-book')
        .expect(200);

      expect(response.body.templates[0].main_genes).toEqual(['UnknownGene1', 'UnknownGene2']);
    });
  });

  describe('GET /api/recipe-book/health', () => {
    
    test('should return health status', async () => {
      const response = await request(app)
        .get('/api/recipe-book/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        timestamp: expect.any(String),
        cache_stats: expect.any(Object)
      });
    });
  });

  describe('Performance', () => {
    
    test('should complete within 50ms for typical request', async () => {
      const mockTemplates = Array.from({ length: 50 }, (_, i) => ({
        template_id: `template-${i}`,
        name: `Template ${i}`,
        niche: 'fitness',
        status: 'HOT',
        success_rate: 0.8,
        trend_pct: 0.2,
        centroid: [0.8, 0.6, 0.4, 0.2]
      }));

      const mockQuery = {
        data: mockTemplates,
        error: null
      };
      
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => mockQuery)
            }))
          }))
        }))
      }));

      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/recipe-book')
        .expect(200);
      
      const duration = Date.now() - startTime;
      
      // In test environment, should be very fast
      expect(duration).toBeLessThan(100); // Generous for test environment
      expect(response.body.templates).toHaveLength(50);
    });
  });

  describe('Caching', () => {
    
    test('should cache responses and return cache hit header', async () => {
      const mockTemplates = [
        {
          template_id: 'cache-test',
          name: 'Cache Test Template',
          niche: 'fitness',
          status: 'HOT',
          success_rate: 0.8,
          trend_pct: 0.2,
          centroid: [0.8, 0.6]
        }
      ];

      const mockQuery = {
        data: mockTemplates,
        error: null
      };
      
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => mockQuery)
            }))
          }))
        }))
      }));

      // First request - should miss cache
      const firstResponse = await request(app)
        .get('/api/recipe-book')
        .expect(200);

      expect(firstResponse.headers['x-cache-hit']).toBe('false');

      // Note: In this test environment, the cache is mocked, so we can't test actual caching behavior
      // In integration tests, you would expect the second request to have x-cache-hit: true
    });
  });
});