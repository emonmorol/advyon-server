import { buildToolPrompt, serializeHistoryToCsv } from './ai.tool.service';

describe('AIToolService helpers', () => {
  it('buildToolPrompt injects tool-specific instruction and input', () => {
    const prompt = buildToolPrompt(
      'contract-analyzer',
      'Review this contract for termination risks.',
    );

    expect(prompt).toContain('TOOL: Contract Analyzer');
    expect(prompt).toContain('termination risks');
  });

  it('serializeHistoryToCsv escapes values safely', () => {
    const csv = serializeHistoryToCsv([
      {
        createdAt: new Date('2026-02-16T00:00:00.000Z'),
        toolKey: 'brief-analyzer',
        status: 'success',
        latencyMs: 1234,
        input: 'line1\nline2',
        output: 'quoted "value"',
      },
    ]);

    expect(csv.split('\n').length).toBe(2);
    expect(csv).toContain('brief-analyzer');
    expect(csv).toContain('quoted ""value""');
  });
});

