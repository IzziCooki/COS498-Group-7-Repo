const { gatherDiagnosticContext } = require('../core/mockResponder');

describe('mockResponder — diagnostic context', () => {
  describe('gatherDiagnosticContext', () => {
    it('returns empty string for null skill', () => {
      expect(gatherDiagnosticContext(null)).toBe('');
    });

    it('returns empty string for non-diagnostic skill', () => {
      const skill = { id: 'copy-paste', category: 'basics', prompt: 'test' };
      expect(gatherDiagnosticContext(skill)).toBe('');
    });

    it('gathers system info and running apps for slow_computer', () => {
      const skill = { id: 'slow_computer', category: 'diagnostics', prompt: 'test' };
      const ctx = gatherDiagnosticContext(skill);
      expect(ctx).toContain('SYSTEM INFO');
      expect(ctx).toContain('RUNNING APPS');
      expect(ctx).toContain('Operating System');
    });

    it('gathers network status for network_fix', () => {
      const skill = { id: 'network_fix', category: 'diagnostics', prompt: 'test' };
      const ctx = gatherDiagnosticContext(skill);
      expect(ctx).toContain('NETWORK STATUS');
      expect(ctx).toContain('Internet Connection');
    });

    it('gathers system info and error logs for diagnose_system', () => {
      const skill = { id: 'diagnose_system', category: 'diagnostics', prompt: 'test' };
      const ctx = gatherDiagnosticContext(skill);
      expect(ctx).toContain('SYSTEM INFO');
      expect(ctx).toContain('RECENT ERRORS');
    });

    it('gathers disk health for disk_cleanup', () => {
      const skill = { id: 'disk_cleanup', category: 'diagnostics', prompt: 'test' };
      const ctx = gatherDiagnosticContext(skill);
      expect(ctx).toContain('DISK HEALTH');
      expect(ctx).toContain('Disk Usage');
    });

    it('gathers running apps and installed software for app_troubleshoot', () => {
      const skill = { id: 'app_troubleshoot', category: 'diagnostics', prompt: 'test' };
      const ctx = gatherDiagnosticContext(skill);
      expect(ctx).toContain('RUNNING APPS');
      expect(ctx).toContain('INSTALLED SOFTWARE');
    });

    it('gathers battery status for battery_power', () => {
      const skill = { id: 'battery_power', category: 'diagnostics', prompt: 'test' };
      const ctx = gatherDiagnosticContext(skill);
      expect(ctx).toContain('BATTERY STATUS');
      expect(ctx).toContain('SYSTEM INFO');
    });

    it('gathers everything for system_checkup', () => {
      const skill = { id: 'system_checkup', category: 'diagnostics', prompt: 'test' };
      const ctx = gatherDiagnosticContext(skill);
      expect(ctx).toContain('SYSTEM INFO');
      expect(ctx).toContain('NETWORK STATUS');
      expect(ctx).toContain('DISK HEALTH');
      expect(ctx).toContain('BATTERY STATUS');
      expect(ctx).toContain('RUNNING APPS');
    });

    it('gathers network for wifi skill with check_network in prompt', () => {
      const skill = { id: 'wifi', category: 'connectivity', prompt: 'use check_network to see their actual connection' };
      // Not a diagnostics category, but has check_network in prompt — falls to default in switch
      // The function only gathers for category === 'diagnostics', so this returns ''
      const ctx = gatherDiagnosticContext(skill);
      expect(ctx).toBe('');
    });

    it('includes the "never show raw output" instruction', () => {
      const skill = { id: 'slow_computer', category: 'diagnostics', prompt: 'test' };
      const ctx = gatherDiagnosticContext(skill);
      expect(ctx).toContain('NEVER show raw output');
    });
  });
});
