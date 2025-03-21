import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Agent, ActionFunction } from '../../packages/core/src/agent/runtime';

describe('Agent', () => {
  let agent: Agent;

  beforeEach(() => {
    agent = new Agent({
      id: 'test-agent',
      name: 'TestAgent',
      model: 'test-model',
      platforms: [],
      actions: [],
      parameters: {}
    });
  });

  it('should have the correct name', () => {
    expect(agent.name).toBe('TestAgent');
  });

  it('should register and execute actions', async () => {
    const actionSpy = jest.fn(async () => 'action result') as unknown as ActionFunction;
    agent.registerAction('testAction', actionSpy);

    const result = await agent.executeAction('testAction', { param: 'value' });
    
    expect(actionSpy).toHaveBeenCalledWith({
      agent,
      parameters: { param: 'value' }
    });
    expect(result).toBe('action result');
  });

  it('should manage state', () => {
    agent.setState('testKey', 'testValue');
    expect(agent.getState('testKey')).toBe('testValue');
  });

  it('should emit events', (done) => {
    agent.on('stateChange', ({ key, value }) => {
      expect(key).toBe('testKey');
      expect(value).toBe('testValue');
      done();
    });

    agent.setState('testKey', 'testValue');
  });
}); 