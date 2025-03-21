import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import ora, { Ora, Options } from 'ora';
import chalk from 'chalk';
import '../../__tests__/setup';
import { create } from '../create';

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
  const mockOra = jest.fn((opts?: string | Options) => mockSpinner) as unknown as typeof ora;
  return mockOra;
});
jest.mock('chalk', () => {
  const mockChalk = {
    green: jest.fn((text: string) => text),
    blue: jest.fn((text: string) => text),
    white: jest.fn((text: string) => text),
    red: jest.fn((text: string) => text)
  };
  return mockChalk;
});

describe('create command', () => {
  const mockAnswers = {
    name: 'TestComponent',
    description: 'A test component',
    type: 'agent'
  };

  const mockSpinner = {
    start: jest.fn().mockReturnThis(),
    text: '',
    succeed: jest.fn(),
    fail: jest.fn()
  } as unknown as Ora;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(inquirer.prompt).mockResolvedValue(mockAnswers);
    (ora as unknown as jest.Mock).mockReturnValue(mockSpinner);
    (fs.mkdirSync as jest.Mock).mockImplementation(() => undefined);
    (fs.writeFileSync as jest.Mock).mockImplementation(() => undefined);
    process.cwd = jest.fn().mockReturnValue('/test/path');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new agent component', async () => {
    await create('agent');

    // Verify directory creation
    expect(fs.mkdirSync).toHaveBeenCalledWith(
      '/test/path/src/agents/test-component',
      { recursive: true }
    );

    // Verify component file creation
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join('/test/path/src/agents/test-component', 'index.ts'),
      expect.stringContaining('class TestComponentAgent extends SwarmAgent')
    );

    // Verify test file creation
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join('/test/path/src/agents/test-component/__tests__', 'index.test.ts'),
      expect.stringContaining('describe(\'TestComponentAgent\'')
    );

    // Verify success message
    expect(mockSpinner.succeed).toHaveBeenCalledWith('Component created successfully!');
  });

  it('should create a new skill component', async () => {
    mockAnswers.type = 'skill';
    await create('skill');

    expect(fs.mkdirSync).toHaveBeenCalledWith(
      '/test/path/src/skills/test-component',
      { recursive: true }
    );

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join('/test/path/src/skills/test-component', 'index.ts'),
      expect.stringContaining('class TestComponentSkill extends AgentSkill')
    );
  });

  it('should create a new connector component', async () => {
    mockAnswers.type = 'connector';
    await create('connector');

    expect(fs.mkdirSync).toHaveBeenCalledWith(
      '/test/path/src/connectors/test-component',
      { recursive: true }
    );

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join('/test/path/src/connectors/test-component', 'index.ts'),
      expect.stringContaining('class TestComponentConnector extends PlatformConnector')
    );
  });

  it('should validate component name', async () => {
    await create('agent');
    const promptCalls = jest.mocked(inquirer.prompt).mock.calls[0][0] as Array<{
      name: string;
      validate?: (input: string) => boolean | string;
    }>;
    const nameQuestion = promptCalls.find(q => q.name === 'name');

    expect(nameQuestion?.validate?.('')).toBe('Component name is required');
    expect(nameQuestion?.validate?.('invalidName')).toBe(
      'Component name must start with a capital letter and contain only letters and numbers'
    );
    expect(nameQuestion?.validate?.('ValidName')).toBe(true);
  });

  it('should handle errors gracefully', async () => {
    const mockError = new Error('Component creation failed');
    (fs.mkdirSync as jest.Mock).mockImplementation(() => {
      throw mockError;
    });

    await expect(create('agent')).rejects.toThrow('Component creation failed');
  });
}); 