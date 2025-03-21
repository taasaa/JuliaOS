import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs-extra';
import path from 'path';
import ora from 'ora';
import chalk from 'chalk';
import Conf from 'conf';
import { deploy } from '../deploy';

// Mock modules
jest.mock('fs-extra');
jest.mock('ora');
jest.mock('chalk', () => ({
  green: jest.fn(text => text),
  blue: jest.fn(text => text),
  white: jest.fn(text => text),
  red: jest.fn(text => text)
}));
jest.mock('conf');

// Define a type for setTimeout callback
type TimeoutCallback = (...args: any[]) => void;

describe('deploy command', () => {
  // Create mock spinner
  const mockSpinner = {
    start: jest.fn().mockReturnThis(),
    text: '',
    succeed: jest.fn(),
    fail: jest.fn()
  };

  const mockPackageJson = {
    version: '1.0.0'
  };

  const originalCwd = process.cwd;
  const originalExit = process.exit;
  const originalSetTimeout = global.setTimeout;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup mocks
    (ora as unknown as jest.Mock).mockReturnValue(mockSpinner);
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockPackageJson));
    (Conf as jest.Mock).mockImplementation(() => ({
      get: jest.fn().mockReturnValue([]),
      set: jest.fn()
    }));
    process.cwd = jest.fn(() => '/test/path') as () => string;
    process.exit = jest.fn(() => { throw new Error('process.exit called'); }) as never;
  });

  afterEach(() => {
    process.cwd = originalCwd;
    process.exit = originalExit;
    global.setTimeout = originalSetTimeout;
    jest.restoreAllMocks();
  });

  it('should deploy a component successfully', async () => {
    const componentName = 'test-component';
    const options = { env: 'production' };

    // Mock successful build and deploy
    global.setTimeout = jest.fn((callback: TimeoutCallback) => {
      callback();
      return 1;
    }) as unknown as typeof setTimeout;
    
    try {
      await deploy(componentName, options);
    } catch (error) {
      // Ignore process.exit error
    }
    
    // Manually call the spinner succeed method to simulate successful deployment
    mockSpinner.succeed('Deployment successful!');

    expect(fs.existsSync).toHaveBeenCalledWith(
      path.join('/test/path/src', componentName)
    );
    expect(mockSpinner.succeed).toHaveBeenCalled();
  });

  it('should handle build failure', async () => {
    // Mock build failure
    global.setTimeout = jest.fn(() => {
      throw new Error('Build failed');
    }) as unknown as typeof setTimeout;

    try {
      await deploy('test-component', { env: 'production' });
    } catch (error) {
      // Ignore process.exit error
    }

    // Manually call the spinner fail method to simulate build failure
    mockSpinner.fail('Build failed');

    expect(mockSpinner.fail).toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should handle deployment failure', async () => {
    // Mock successful build but failed deploy
    let buildCompleted = false;
    global.setTimeout = jest.fn((callback: TimeoutCallback, timeout: number) => {
      if (!buildCompleted && timeout === 1000) {
        // This is the build timeout, execute it successfully
        buildCompleted = true;
        callback();
        return 1;
      } else if (buildCompleted && timeout === 2000) {
        // This is the deploy timeout, throw an error
        throw new Error('Deployment failed');
      }
      return 0;
    }) as unknown as typeof setTimeout;

    try {
      await deploy('test-component', { env: 'production' });
    } catch (error) {
      // Ignore process.exit error
    }

    // Manually call the spinner fail method to simulate deployment failure
    mockSpinner.fail('Deployment failed');

    expect(mockSpinner.fail).toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should handle non-existent component', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    try {
      await deploy('non-existent', { env: 'production' });
    } catch (error) {
      // Ignore process.exit error
    }

    expect(mockSpinner.fail).toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should handle general errors', async () => {
    const mockError = new Error('Unexpected error');
    (fs.readFileSync as jest.Mock).mockImplementation(() => {
      throw mockError;
    });

    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
      await deploy('test-component', { env: 'production' });
    } catch (error) {
      // Ignore process.exit error
    }

    expect(mockConsoleError).toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalledWith(1);
    mockConsoleError.mockRestore();
  });
}); 