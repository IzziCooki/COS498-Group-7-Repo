/**
 * Tests for systemModifyingDetector.
 *
 * Heuristic must fire on registry edits, sudo, gpedit, etc. and stay quiet
 * for general teaching, copy-paste, and scam discussion.
 */

const {
  detectSystemModifying,
  flattenGuideText,
} = require('../core/systemModifyingDetector');

describe('detectSystemModifying — positive cases', () => {
  test('fires on registry mentions', () => {
    const r = detectSystemModifying('Open the registry and find HKEY_LOCAL_MACHINE');
    expect(r.isModifying).toBe(true);
    expect(r.matched).toContain('registry');
    expect(r.matched).toContain('hkey');
  });

  test('fires on regedit', () => {
    const r = detectSystemModifying('Type regedit.exe into the Run box.');
    expect(r.isModifying).toBe(true);
    expect(r.matched).toContain('regedit');
  });

  test('fires on `reg add` / `reg delete` shell commands', () => {
    expect(detectSystemModifying('reg add HKLM\\Software\\Foo /v Bar').isModifying).toBe(true);
    expect(detectSystemModifying('reg delete HKCU\\Software').isModifying).toBe(true);
  });

  test('fires on sudo', () => {
    const r = detectSystemModifying('Run sudo apt-get install firefox');
    expect(r.isModifying).toBe(true);
    expect(r.matched).toEqual(expect.arrayContaining(['sudo']));
  });

  test('fires on gpedit / group policy', () => {
    expect(detectSystemModifying('Open gpedit.msc.').matched)
      .toEqual(expect.arrayContaining(['gpedit']));
    expect(detectSystemModifying('Right-click and Run as administrator.').matched)
      .toEqual(expect.arrayContaining(['run_as_admin']));
    expect(detectSystemModifying('Use the Group Policy Editor').matched)
      .toEqual(expect.arrayContaining(['group_policy']));
  });

  test('fires on Windows admin consoles (services.msc, msconfig)', () => {
    expect(detectSystemModifying('Open services.msc and stop the spooler.').matched)
      .toContain('services_msc');
    expect(detectSystemModifying('Type msconfig in the Start menu.').matched)
      .toContain('msconfig');
  });

  test('fires on Control Panel and System Properties', () => {
    expect(detectSystemModifying('Open the Control Panel.').isModifying).toBe(true);
    expect(detectSystemModifying('Right-click This PC and choose System Properties.').isModifying).toBe(true);
  });

  test('fires on enable/disable + setting/service/feature phrasing', () => {
    expect(detectSystemModifying('Disable audio enhancements setting.').isModifying).toBe(true);
    expect(detectSystemModifying('Turn off the Windows Update service.').isModifying).toBe(true);
    expect(detectSystemModifying('Enable the dark mode feature.').isModifying).toBe(true);
  });

  test('fires on "run this command" / "paste into terminal"', () => {
    expect(detectSystemModifying('Run this command: ipconfig /all').matched)
      .toContain('run_command');
    expect(detectSystemModifying('Paste the following into the terminal').matched)
      .toContain('paste_into_terminal');
  });

  test('fires on hosts file and PATH variable edits', () => {
    expect(detectSystemModifying('Edit your hosts file').isModifying).toBe(true);
    expect(detectSystemModifying('Update the PATH variable').isModifying).toBe(true);
  });

  test('fires on install/uninstall + package managers', () => {
    expect(detectSystemModifying('Install a driver from the manufacturer').isModifying).toBe(true);
    expect(detectSystemModifying('Run brew install node').matched).toContain('package_manager');
    expect(detectSystemModifying('Use winget install firefox').matched).toContain('package_manager');
  });

  test('fires on "elevated prompt" phrasing', () => {
    expect(detectSystemModifying('Open an elevated PowerShell').isModifying).toBe(true);
  });
});

describe('detectSystemModifying — negative cases', () => {
  test('does not fire on general teaching', () => {
    const r = detectSystemModifying(
      "Email is a great way to keep in touch with family. Let me know who you'd like to write to."
    );
    expect(r.isModifying).toBe(false);
    expect(r.matched).toEqual([]);
  });

  test('does not fire on copy-paste guidance', () => {
    const r = detectSystemModifying(
      "To copy text, highlight it and press Ctrl+C. To paste, press Ctrl+V."
    );
    expect(r.isModifying).toBe(false);
  });

  test('does not fire on scam discussion', () => {
    const r = detectSystemModifying(
      "If someone calls and says they're from Microsoft tech support, hang up — that's almost always a scam. Real Microsoft never calls you."
    );
    expect(r.isModifying).toBe(false);
  });

  test('does not fire on Wi-Fi connection walkthrough', () => {
    const r = detectSystemModifying(
      "Click the Wi-Fi icon in the strip at the bottom of your screen, then choose your home network from the list."
    );
    expect(r.isModifying).toBe(false);
  });

  test('does not fire on "enable subtitles" small-talk (no setting/service noun)', () => {
    const r = detectSystemModifying("You can enable subtitles in the YouTube player.");
    expect(r.isModifying).toBe(false);
  });

  test('does not fire on empty / non-string input', () => {
    expect(detectSystemModifying('').isModifying).toBe(false);
    expect(detectSystemModifying(null).isModifying).toBe(false);
    expect(detectSystemModifying(undefined).isModifying).toBe(false);
    expect(detectSystemModifying(42).isModifying).toBe(false);
  });
});

describe('flattenGuideText', () => {
  test('returns empty string for null / non-object', () => {
    expect(flattenGuideText(null)).toBe('');
    expect(flattenGuideText(undefined)).toBe('');
    expect(flattenGuideText('not an object')).toBe('');
  });

  test('concatenates title, description, step bodies, and commands', () => {
    const guide = {
      title: 'Edit registry',
      description: 'Change a Windows setting.',
      steps: [
        { title: 'Open regedit', body: 'Press Win+R and type regedit.' },
        { command: 'reg add HKLM\\Software\\Foo' },
        { caption: 'You should see a list of keys.', note: { text: 'Be careful here.' } },
      ],
    };
    const flat = flattenGuideText(guide);
    expect(flat).toContain('Edit registry');
    expect(flat).toContain('Press Win+R');
    expect(flat).toContain('reg add');
    expect(flat).toContain('Be careful here.');
  });

  test('detector picks up risk in a guide whose chat text was innocuous', () => {
    const guide = {
      title: 'Fix audio popping',
      steps: [
        { body: 'Open Control Panel and go to Sound.' },
        { body: 'Disable the audio enhancements setting and click OK.' },
      ],
    };
    const flat = flattenGuideText(guide);
    const r = detectSystemModifying(flat);
    expect(r.isModifying).toBe(true);
    expect(r.matched).toEqual(expect.arrayContaining(['control_panel', 'enable_disable_feature']));
  });
});
