/**
 * Validates a project name according to npm package naming rules
 * @param name The project name to validate
 * @returns boolean indicating if the name is valid
 */
export function validateProjectName(name: string): boolean {
  if (!name) {
    return false;
  }

  // Only allow lowercase letters, numbers, and hyphens
  const validNameRegex = /^[a-z0-9-]+$/;
  return validNameRegex.test(name);
} 