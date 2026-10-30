import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long' }),
  fullName: z.string().min(2, { message: 'Full name required' }),
});

export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

export const createWorkspaceSchema = z.object({
  name: z.string().min(2, { message: 'Workspace name must be at least 2 characters' }),
  description: z.string().optional().default(''),
  domain: z.enum([
    'Medical & Healthcare',
    'Artificial Intelligence & Computer Science',
    'Climate & Environmental Science',
    'Finance & Macroeconomics',
    'Social Sciences & Humanities',
    'General Science',
  ]).default('General Science'),
});

export const searchSchema = z.object({
  workspaceId: z.string().uuid({ message: 'Valid workspace ID required' }),
  query: z.string().min(3, { message: 'Search query must be at least 3 characters' }),
  topK: z.number().int().min(1).max(20).default(5),
  domainFilter: z.string().optional(),
});

export const synthesisSchema = z.object({
  workspaceId: z.string().uuid({ message: 'Valid workspace ID required' }),
  documentIds: z.array(z.string().uuid()).min(1, { message: 'Select at least one document' }),
  prompt: z.string().min(3, { message: 'Prompt too short' }),
  temperature: z.number().min(0).max(1).default(0.2),
  citationFormat: z.enum(['superscript', 'apa', 'ieee']).default('superscript'),
  synthesisDepth: z.enum(['executive', 'critical', 'exhaustive']).default('critical'),
});

export const litReviewSchema = z.object({
  workspaceId: z.string().uuid({ message: 'Valid workspace ID required' }),
  documentIds: z.array(z.string().uuid()).min(1, { message: 'Select at least one document' }),
  researchQuestion: z.string().min(5, { message: 'Research topic or question is required' }),
  focusAreas: z.array(z.string()).optional().default([]),
  depth: z.enum(['executive', 'critical', 'exhaustive']).default('critical'),
});

export const extractionProcessSchema = z.object({
  workspaceId: z.string().uuid(),
  documentId: z.string().uuid(),
});
