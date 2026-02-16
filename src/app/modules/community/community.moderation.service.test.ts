import { CommunityModerationService } from './community.moderation.service';

describe('CommunityModerationService.runFastGate', () => {
  it('rejects clearly abusive content', async () => {
    const result = await CommunityModerationService.runFastGate(
      'You are an idiot and your case is trash. Shut up.',
      0.6,
    );

    expect(['flagged', 'rejected']).toContain(result.decision);
    expect(result.reasons).toContain('toxicity');
  });

  it('flags likely spam content', async () => {
    const result = await CommunityModerationService.runFastGate(
      'Click here now https://spam.example buy now buy now buy now free free free',
      0.55,
    );

    expect(['flagged', 'rejected']).toContain(result.decision);
    expect(result.reasons).toContain('spam');
  });

  it('approves normal legal-domain discussion content', async () => {
    const result = await CommunityModerationService.runFastGate(
      'I need guidance about a contract dispute hearing and evidence filing deadlines.',
      0.72,
    );

    expect(result.decision).toBe('approved');
  });
});

