import { describe, it, expect, vi } from 'vitest';
import { NvidiaNimProvider } from '../lib/ai/nvidia-nim';

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

    const provider = new NvidiaNimProvider();
    const result = await provider.generateText('Hello, world!');
    
    expect(result).toBe('This is a mock response from Nvidia NIM.');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://integrate.api.nvidia.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: expect.stringContaining('deepseek-ai/deepseek-v4.1-flash'),
      })
    );
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const provider = new NvidiaNimProvider();
    await expect(provider.generateText('Hello')).rejects.toThrow('NVIDIA NIM API Error: Internal Server Error');
  });
});
