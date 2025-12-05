import { Case } from './case.model';

/**
 * Generate unique case ID
 * Format: CS-YYYY-XXXX (e.g., CS-2024-0001)
 */
export const generateCaseId = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const prefix = `CS-${currentYear}`;

  // Find the latest case ID for the current year
  const latestCase = await Case.findOne({
    id: new RegExp(`^${prefix}-`),
  })
    .sort({ id: -1 })
    .select('id');

  if (!latestCase) {
    return `${prefix}-0001`;
  }

  // Extract the number part and increment
  const lastNumber = parseInt(latestCase.id.split('-')[2]);
  const nextNumber = (lastNumber + 1).toString().padStart(4, '0');

  return `${prefix}-${nextNumber}`;
};

/**
 * Calculate case progress based on various factors
 * This is a placeholder - can be enhanced with more complex logic
 */
export const calculateCaseProgress = (
  documentsCount: number,
  tasksCompleted: number,
  totalTasks: number,
): number => {
  if (totalTasks === 0) return 0;

  const taskProgress = (tasksCompleted / totalTasks) * 100;
  return Math.min(Math.round(taskProgress), 100);
};
