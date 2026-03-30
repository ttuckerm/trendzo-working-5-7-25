import { tagGenes, testGeneTagger } from '@/lib/services/geneTagger';
import fs from 'fs/promises';
import path from 'path';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabaseClient: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: {
              frames_path: '/mnt/c/Projects/CleanCopy/data/test-frames',
              audio_path: '/mnt/c/Projects/CleanCopy/data/test-audio.wav',
              ocr_text: 'Hot take: Nobody talks about this shocking truth! I\'m a doctor with 10 years of experience.',
              transcript: 'Hot take: Nobody talks about this shocking truth! I\'m a doctor with 10 years of experience.',
              caption: 'Doctor reveals shocking health secret'
            },
            error: null
          }))
        }))
      })),
      upsert: jest.fn(() => Promise.resolve({ error: null }))
    }))
  }
}));

// Mock sharp
jest.mock('sharp', () => {
  return jest.fn(() => ({
    metadata: jest.fn(() => Promise.resolve({ width: 640, height: 480 })),
    extract: jest.fn(() => ({
      greyscale: jest.fn(() => ({
        raw: jest.fn(() => ({
          toBuffer: jest.fn(() => Promise.resolve(Buffer.alloc(1000)))
        }))
      }))
    })),
    raw: jest.fn(() => ({
      toBuffer: jest.fn(() => Promise.resolve({
        data: Buffer.alloc(640 * 480 * 3),
        info: { width: 640, height: 480 }
      }))
    })),
    resize: jest.fn(() => ({
      greyscale: jest.fn(() => ({
        raw: jest.fn(() => ({
          toBuffer: jest.fn(() => Promise.resolve({
            data: Buffer.alloc(100 * 100),
            info: { width: 100, height: 100 }
          }))
        }))
      }))
    })),
    stats: jest.fn(() => Promise.resolve({
      channels: [
        { stdev: 50 },
        { stdev: 60 },
        { stdev: 55 }
      ]
    }))
  }));
});

// Mock tesseract.js
jest.mock('tesseract.js', () => ({
  createWorker: jest.fn(() => ({
    load: jest.fn(),
    loadLanguage: jest.fn(),
    initialize: jest.fn(),
    recognize: jest.fn(() => Promise.resolve({ data: { text: 'Sample OCR text' } })),
    terminate: jest.fn()
  }))
}));

// Mock fs
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  readdir: jest.fn(),
  stat: jest.fn(() => Promise.resolve({ isDirectory: () => true }))
}));

describe('GeneTagger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock framework genes file
    (fs.readFile as jest.Mock).mockImplementation((filePath: string) => {
      if (filePath.includes('framework_genes.json')) {
        return Promise.resolve(JSON.stringify({
          genes: [
            {
              id: 0,
              name: 'AuthorityHook',
              description: 'Content creator establishes expertise or credentials',
              type: 'text',
              detection_method: 'regex',
              pattern: '(?i)(doctor|expert|coach|professional|certified|licensed|I\'m a [a-z]+|my background|years of experience|specialist)'
            },
            {
              id: 1,
              name: 'ControversyHook',
              description: 'Provocative or contrarian opening statement',
              type: 'text',
              detection_method: 'regex',
              pattern: '(?i)(hot take|unpopular opinion|nobody talks about|controversial|they don\'t want you to know|truth is|shocking)'
            },
            {
              id: 2,
              name: 'GreenScreen',
              description: 'Uses green screen or chroma key background',
              type: 'visual',
              detection_method: 'color_analysis',
              threshold: 0.25,
              frames_to_check: 5
            },
            {
              id: 3,
              name: 'TextOverlay',
              description: 'Heavy use of text overlays on video',
              type: 'ocr',
              detection_method: 'text_density',
              threshold: 50
            },
            {
              id: 4,
              name: 'Storytelling',
              description: 'Narrative structure with beginning, middle, end',
              type: 'text',
              detection_method: 'story_structure',
              min_length: 100
            }
          ]
        }));
      }
      return Promise.resolve('');
    });
    
    // Mock frame files
    (fs.readdir as jest.Mock).mockResolvedValue([
      '0001.jpg', '0002.jpg', '0003.jpg', '0004.jpg', '0005.jpg'
    ]);
  });

  describe('Unit Tests', () => {
    test('should detect AuthorityHook gene when caption contains "I\'m a doctor"', async () => {
      const result = await tagGenes('test-video-id');
      
      expect(result).toHaveLength(5);
      expect(result[0]).toBe(true); // AuthorityHook should be detected
    });

    test('should detect ControversyHook gene when transcript contains "hot take"', async () => {
      const result = await tagGenes('test-video-id');
      
      expect(result).toHaveLength(5);
      expect(result[1]).toBe(true); // ControversyHook should be detected
    });

    test('should handle missing transcript gracefully', async () => {
      // Mock empty transcript
      const { supabaseClient } = require('@/lib/supabase/client');
      supabaseClient.from.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: {
                frames_path: null,
                audio_path: null,
                ocr_text: '',
                transcript: null,
                caption: ''
              },
              error: null
            })
          })
        })
      });

      const result = await tagGenes('test-video-id');
      
      expect(result).toHaveLength(5);
      expect(result.every(gene => gene === false)).toBe(true); // All genes should be false
    });

    test('should handle missing frames path', async () => {
      // Mock null frames path
      const { supabaseClient } = require('@/lib/supabase/client');
      supabaseClient.from.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: {
                frames_path: null,
                audio_path: '/test/audio.wav',
                ocr_text: 'Sample OCR text with more than fifty characters to test density',
                transcript: 'This is a story with narrative structure. First, something happened. Then, after that, something else occurred. Finally, the story concluded.',
                caption: 'Test caption'
              },
              error: null
            })
          })
        })
      });

      const result = await tagGenes('test-video-id');
      
      expect(result).toHaveLength(5);
      expect(result[2]).toBe(false); // GreenScreen should be false (no frames)
      expect(result[3]).toBe(true);  // TextOverlay should be true (OCR density)
      expect(result[4]).toBe(true);  // Storytelling should be true (narrative structure)
    });

    test('should truncate OCR text longer than 1000 characters', async () => {
      const longOCRText = 'A'.repeat(1500);
      
      const { supabaseClient } = require('@/lib/supabase/client');
      supabaseClient.from.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: {
                frames_path: '/test/frames',
                audio_path: '/test/audio.wav',
                ocr_text: longOCRText,
                transcript: 'Test transcript',
                caption: 'Test caption'
              },
              error: null
            })
          })
        })
      });

      const result = await tagGenes('test-video-id');
      
      expect(result).toHaveLength(5);
      // Should not crash due to long OCR text
    });

    test('should handle invalid video ID', async () => {
      const { supabaseClient } = require('@/lib/supabase/client');
      supabaseClient.from.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: null,
              error: { message: 'Video not found' }
            })
          })
        })
      });

      await expect(tagGenes('invalid-video-id')).rejects.toThrow('Video features not found');
    });
  });

  describe('Integration Tests', () => {
    test('should complete full gene tagging workflow', async () => {
      const result = await tagGenes('sample-test-video');
      
      expect(result).toHaveLength(5);
      expect(Array.isArray(result)).toBe(true);
      expect(result.every(gene => typeof gene === 'boolean')).toBe(true);
      
      // Check that at least some genes are detected
      const detectedGenes = result.filter(Boolean).length;
      expect(detectedGenes).toBeGreaterThan(0);
    });

    test('should store results in database', async () => {
      const { supabaseClient } = require('@/lib/supabase/client');
      const mockUpsert = jest.fn().mockResolvedValue({ error: null });
      
      supabaseClient.from.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: {
                frames_path: '/test/frames',
                audio_path: '/test/audio.wav',
                ocr_text: 'Test OCR',
                transcript: 'Test transcript',
                caption: 'Test caption'
              },
              error: null
            })
          })
        }),
        upsert: mockUpsert
      });

      await tagGenes('test-video-id');
      
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          video_id: 'test-video-id',
          genes: expect.any(Array),
          created_at: expect.any(String)
        })
      );
    });

    test('should handle database storage failure', async () => {
      const { supabaseClient } = require('@/lib/supabase/client');
      
      supabaseClient.from.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: {
                frames_path: '/test/frames',
                audio_path: '/test/audio.wav',
                ocr_text: 'Test OCR',
                transcript: 'Test transcript',
                caption: 'Test caption'
              },
              error: null
            })
          })
        }),
        upsert: () => Promise.resolve({ error: { message: 'Database error' } })
      });

      await expect(tagGenes('test-video-id')).rejects.toThrow('Database error');
    });

    test('should run test function without errors', async () => {
      // Mock console.log to capture output
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await expect(testGeneTagger()).resolves.not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Testing GeneTagger'));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Performance Tests', () => {
    test('should complete gene tagging within 5 seconds', async () => {
      const startTime = Date.now();
      
      await tagGenes('performance-test-video');
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Less than 5 seconds
    });

    test('should handle multiple concurrent gene tagging requests', async () => {
      const promises = Array.from({ length: 3 }, (_, i) => 
        tagGenes(`concurrent-test-${i}`)
      );
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toHaveLength(5);
        expect(Array.isArray(result)).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty transcript and caption', async () => {
      const { supabaseClient } = require('@/lib/supabase/client');
      supabaseClient.from.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: {
                frames_path: null,
                audio_path: null,
                ocr_text: '',
                transcript: '',
                caption: ''
              },
              error: null
            })
          })
        })
      });

      const result = await tagGenes('empty-content-video');
      
      expect(result).toHaveLength(5);
      expect(result.every(gene => gene === false)).toBe(true);
    });

    test('should handle malformed frames directory', async () => {
      (fs.readdir as jest.Mock).mockRejectedValue(new Error('Directory not found'));
      
      const result = await tagGenes('malformed-frames-video');
      
      expect(result).toHaveLength(5);
      // Should not crash, visual genes should be false
    });

    test('should handle regex pattern errors gracefully', async () => {
      // Mock framework with invalid regex
      (fs.readFile as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.includes('framework_genes.json')) {
          return Promise.resolve(JSON.stringify({
            genes: [
              {
                id: 0,
                name: 'InvalidRegex',
                type: 'text',
                detection_method: 'regex',
                pattern: '[invalid regex pattern'
              }
            ]
          }));
        }
        return Promise.resolve('');
      });

      const result = await tagGenes('invalid-regex-test');
      
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(false); // Should handle gracefully
    });
  });
});