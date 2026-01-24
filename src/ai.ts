import { generateText } from 'ai';
import { logger } from './logger.js';

export async function generateChangesetMessage(
  packageName: string,
  releaseType: 'patch' | 'minor' | 'major',
  recentCommits: string[]
): Promise<string> {
  logger.detail('Generating changeset description with AI...');

  const commitContext = recentCommits.length > 0
    ? `Recent commits:\n${recentCommits.map(c => `- ${c}`).join('\n')}`
    : 'No recent commits provided.';

  const prompt = `You are writing a changeset description for an npm package release.

Package: ${packageName}
Release type: ${releaseType}

${commitContext}

Write a concise, clear changeset description (1-3 sentences) that describes what changed in this release. 
Focus on user-facing changes and benefits. Do not include markdown formatting, bullet points, or headers.
Just write the plain text description.`;

  try {
    const { text } = await generateText({
      model: 'openai/gpt-4o-mini' as any,
      prompt,
    });

    return text.trim();
  } catch (error) {
    logger.warn(`AI generation failed: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

export async function suggestReleaseType(
  recentCommits: string[]
): Promise<'patch' | 'minor' | 'major'> {
  logger.detail('Analyzing commits to suggest release type...');

  if (recentCommits.length === 0) {
    return 'patch';
  }

  const prompt = `Analyze these git commits and determine the appropriate semantic version bump:

${recentCommits.map(c => `- ${c}`).join('\n')}

Rules:
- "patch" for bug fixes, small changes, documentation
- "minor" for new features that are backwards compatible
- "major" for breaking changes

Respond with ONLY one word: patch, minor, or major`;

  try {
    const { text } = await generateText({
      model: 'openai/gpt-4o-mini' as any,
      prompt,
    });

    const suggestion = text.trim().toLowerCase();
    if (suggestion === 'major' || suggestion === 'minor' || suggestion === 'patch') {
      return suggestion;
    }
    return 'patch';
  } catch {
    return 'patch';
  }
}
