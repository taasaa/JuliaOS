import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { init, ProjectConfig } from '../init';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import { execSync } from 'child_process';
import ora, { Ora } from 'ora';
import chalk from 'chalk';

jest.mock('inquirer');
jest.mock('fs-extra');
jest.mock('child_process');
jest.mock('ora', () => {
  const mockSpinner = {
    start: jest.fn().mockReturnThis(),
    text: '',
    succeed: jest.fn(),
    fail: jest.fn()
  } as unknown as Ora;
  return jest.fn((opts?: string) => mockSpinner);
});
jest.mock('chalk', () => {
  const mockChalk = {
    green: jest.fn((text: string) => text) as unknown as (text: string) => string,
    blue: jest.fn((text: string) => text) as unknown as (text: string) => string,
    white: jest.fn((text: string) => text) as unknown as (text: string) => string,
    red: jest.fn((text: string) => text) as unknown as (text: string) => string
  };
  return mockChalk;
});

describe('init command', () => {
  const mockAnswers: ProjectConfig = {
    name: 'test-project',
    description: 'A test project',
    author: 'Test Author',
    license: 'MIT',
    version: '0.1.0'
  };

  const mockSpinner: Partial<Ora> = {
    start: jest.fn().mockReturnThis(),
    text: '',
    succeed: jest.fn(),
    fail: jest.fn()
  };

  beforeEach(() => {
    jest.mocked(inquirer.prompt).mockResolvedValue(mockAnswers);
    (ora as unknown as jest.Mock).mockReturnValue(mockSpinner);
    process.cwd = jest.fn().mockReturnValue('/test/path');
    process.chdir = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new project with correct configuration', async () => {
    await init();

    // Verify project directory creation
    expect(fs.mkdirSync).toHaveBeenCalledWith('/test/path/test-project', { recursive: true });
    expect(process.chdir).toHaveBeenCalledWith('/test/path/test-project');

    // Verify package.json creation
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      'package.json',
      expect.stringContaining('"name": "test-project"')
    );

    // Verify tsconfig.json creation
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      'tsconfig.json',
      expect.stringContaining('"extends": "../../tsconfig.base.json"')
    );

    // Verify directory structure creation
    ['src', 'src/agents', 'src/skills', 'src/tests'].forEach(dir => {
      expect(fs.mkdirSync).toHaveBeenCalledWith(dir, { recursive: true });
    });

    // Verify .gitignore creation
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      '.gitignore',
      expect.stringContaining('node_modules/')
    );

    // Verify index.ts creation
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      'src/index.ts',
      expect.stringContaining('export class Agent')
    );

    // Verify jest.config.js creation
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      'jest.config.js',
      expect.stringContaining('preset: \'ts-jest\'')
    );

    // Verify README.md creation
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      'README.md',
      expect.stringContaining('# test-project')
    );

    // Verify success message
    expect(mockSpinner.succeed).toHaveBeenCalledWith('Project initialized successfully!');
  });

  it('should validate project name correctly', async () => {
    await init();
    const promptCalls = jest.mocked(inquirer.prompt).mock.calls[0][0] as Array<{
      name: string;
      validate?: (input: string) => boolean | string;
    }>;
    const nameQuestion = promptCalls.find(q => q.name === 'name');

    expect(nameQuestion?.validate?.('')).toBe('Project name is required');
    expect(nameQuestion?.validate?.('Invalid Name')).toBe('Project name can only contain lowercase letters, numbers, and hyphens');
    expect(nameQuestion?.validate?.('valid-name')).toBe(true);
  });

  it('should handle errors gracefully', async () => {
    const mockError = new Error('Test error');
    (fs.mkdirSync as jest.Mock).mockImplementation(() => {
      throw mockError;
    });

    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await init();

    expect(mockConsoleError).toHaveBeenCalledWith('Error:', 'Test error');
    expect(mockExit).toHaveBeenCalledWith(1);

    mockExit.mockRestore();
    mockConsoleError.mockRestore();
  });
}); 