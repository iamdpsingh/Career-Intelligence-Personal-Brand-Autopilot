import { describe, it, expect, vi } from 'vitest';
import { generateNvidiaNimText } from '../lib/ai/nvidia-nim';

// Mock fetch for tests
global.fetch = vi.fn();

describe('NvidiaNimProvider', () => {
  it('should generate text using deepseek-v4.1-flash', async () => {
    // Setup mock response
    const mockResponse = {
      choices: [{ message: { content: 'This is a mock response from Nvidia NIM.' } }],
    };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await generateNvidiaNimText('Hello, world!');
    
    expect(result).toBe('This is a mock response from Nvidia NIM.');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://integrate.api.nvidia.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: expect.stringContaining('deepseek-v4.1-flash'),
      })
    );
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(generateNvidiaNimText('Hello')).rejects.toThrow('Nvidia NIM API error: 500 Internal Server Error');
  });
});
