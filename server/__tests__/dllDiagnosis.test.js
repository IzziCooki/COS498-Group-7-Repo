/**
 * Tests for the missing DLL diagnosis feature.
 * Covers: knowledge base lookups, skill matching, tool behavior,
 * complex multi-DLL scenarios, and safety rules.
 */

const dllKnowledge = require('../assets/dll-knowledge.json');
const { matchSkill, getAllSkills } = require('../core/skillMatcher');

// Import the lookupDll function from pcpalTools by testing the tool behavior
// We'll test the knowledge base directly and the skill matcher

describe('DLL Knowledge Base', () => {
  describe('structure', () => {
    it('has all required family entries', () => {
      expect(dllKnowledge.families.vcredist).toBeDefined();
      expect(dllKnowledge.families.ucrt).toBeDefined();
      expect(dllKnowledge.families.dotnet).toBeDefined();
      expect(dllKnowledge.families.directx).toBeDefined();
      expect(dllKnowledge.families.windows_system).toBeDefined();
    });

    it('every family has name, description, dlls, and fix_steps', () => {
      for (const [id, family] of Object.entries(dllKnowledge.families)) {
        expect(family.name).toBeTruthy();
        expect(family.description).toBeTruthy();
        expect(family.dlls).toBeInstanceOf(Array);
        expect(family.dlls.length).toBeGreaterThan(0);
        if (id !== 'vb_runtime') {
          // vb_runtime uses sfc /scannow, has no download-based fix_steps
          expect(family.fix_steps).toBeInstanceOf(Array);
        }
      }
    });

    it('all DLL names are lowercase and end with .dll', () => {
      for (const family of Object.values(dllKnowledge.families)) {
        for (const dll of family.dlls) {
          expect(dll).toBe(dll.toLowerCase());
          expect(dll).toMatch(/\.(dll|drv)$/);
        }
      }
    });

    it('no duplicate DLLs across families', () => {
      const seen = new Map();
      for (const [id, family] of Object.entries(dllKnowledge.families)) {
        for (const dll of family.dlls) {
          if (seen.has(dll)) {
            fail(`Duplicate DLL "${dll}" in families "${seen.get(dll)}" and "${id}"`);
          }
          seen.set(dll, id);
        }
      }
    });
  });

  describe('vcredist version mappings', () => {
    it('has versions for 140, 120, 110, 100, 90', () => {
      const v = dllKnowledge.families.vcredist.versions;
      expect(v['140']).toBeDefined();
      expect(v['120']).toBeDefined();
      expect(v['110']).toBeDefined();
      expect(v['100']).toBeDefined();
      expect(v['90']).toBeDefined();
    });

    it('140 version covers 2015-2022', () => {
      const v140 = dllKnowledge.families.vcredist.versions['140'];
      expect(v140.year).toContain('2015');
      expect(v140.year).toContain('2022');
      expect(v140.download_x64).toContain('aka.ms');
      expect(v140.download_x86).toContain('aka.ms');
    });

    it('all versions have at least one download link', () => {
      for (const [ver, info] of Object.entries(dllKnowledge.families.vcredist.versions)) {
        const hasDownload = info.download_x64 || info.download_x86 || info.download;
        expect(hasDownload).toBeTruthy();
      }
    });
  });

  describe('safety rules', () => {
    it('has safety rules array', () => {
      expect(dllKnowledge.safety_rules).toBeInstanceOf(Array);
      expect(dllKnowledge.safety_rules.length).toBeGreaterThan(3);
    });

    it('warns against third-party DLL download sites', () => {
      const rules = dllKnowledge.safety_rules.join(' ').toLowerCase();
      expect(rules).toContain('never');
      expect(rules).toContain('third-party');
      expect(rules).toContain('malware');
    });
  });
});

describe('DLL Lookup Logic', () => {
  // Replicate the lookupDll function for testing
  function lookupDll(dllName) {
    const name = dllName.toLowerCase().replace(/\.dll$/i, '') + '.dll';

    for (const [familyId, family] of Object.entries(dllKnowledge.families)) {
      if (family.dlls && family.dlls.includes(name)) {
        let version = null;
        if (familyId === 'vcredist' && family.versions) {
          const verMatch = name.match(/(\d{2,3})/);
          if (verMatch) version = family.versions[verMatch[1]] || null;
        }
        return { found: true, familyId, family, version, dll: name };
      }
    }

    const prefixes = {
      'msvcp': 'vcredist', 'msvcr': 'vcredist', 'vcruntime': 'vcredist',
      'mfc': 'vcredist', 'atl': 'vcredist', 'concrt': 'vcredist',
      'api-ms-win-crt': 'ucrt',
      'd3d': 'directx', 'd3dx': 'directx', 'xinput': 'directx', 'xaudio': 'directx',
      'hostfxr': 'dotnet', 'coreclr': 'dotnet',
    };

    for (const [prefix, familyId] of Object.entries(prefixes)) {
      if (name.startsWith(prefix)) {
        const family = dllKnowledge.families[familyId];
        let version = null;
        if (familyId === 'vcredist' && family.versions) {
          const verMatch = name.match(/(\d{2,3})/);
          if (verMatch) version = family.versions[verMatch[1]] || null;
        }
        return { found: true, familyId, family, version, dll: name, fuzzy: true };
      }
    }

    return { found: false, dll: name };
  }

  describe('exact matches', () => {
    it('finds MSVCP140.dll → vcredist 140', () => {
      const r = lookupDll('MSVCP140.dll');
      expect(r.found).toBe(true);
      expect(r.familyId).toBe('vcredist');
      expect(r.version).toBeDefined();
      expect(r.version.year).toContain('2015');
    });

    it('finds vcruntime140.dll → vcredist 140', () => {
      const r = lookupDll('vcruntime140.dll');
      expect(r.found).toBe(true);
      expect(r.familyId).toBe('vcredist');
    });

    it('finds MSVCR120.dll → vcredist 120', () => {
      const r = lookupDll('MSVCR120.dll');
      expect(r.found).toBe(true);
      expect(r.familyId).toBe('vcredist');
      expect(r.version.year).toBe('2013');
    });

    it('finds MSVCR100.dll → vcredist 100 (2010)', () => {
      const r = lookupDll('MSVCR100.dll');
      expect(r.found).toBe(true);
      expect(r.version.year).toBe('2010');
    });

    it('finds api-ms-win-crt-runtime-l1-1-0.dll → ucrt', () => {
      const r = lookupDll('api-ms-win-crt-runtime-l1-1-0.dll');
      expect(r.found).toBe(true);
      expect(r.familyId).toBe('ucrt');
    });

    it('finds d3dx9_43.dll → directx', () => {
      const r = lookupDll('d3dx9_43.dll');
      expect(r.found).toBe(true);
      expect(r.familyId).toBe('directx');
    });

    it('finds xinput1_3.dll → directx', () => {
      const r = lookupDll('xinput1_3.dll');
      expect(r.found).toBe(true);
      expect(r.familyId).toBe('directx');
    });

    it('finds kernel32.dll → windows_system', () => {
      const r = lookupDll('kernel32.dll');
      expect(r.found).toBe(true);
      expect(r.familyId).toBe('windows_system');
    });

    it('finds hostfxr.dll → dotnet', () => {
      const r = lookupDll('hostfxr.dll');
      expect(r.found).toBe(true);
      expect(r.familyId).toBe('dotnet');
    });

    it('finds openal32.dll → openal', () => {
      const r = lookupDll('openal32.dll');
      expect(r.found).toBe(true);
      expect(r.familyId).toBe('openal');
    });
  });

  describe('case insensitivity', () => {
    it('handles uppercase input', () => {
      expect(lookupDll('MSVCP140.DLL').found).toBe(true);
    });

    it('handles mixed case', () => {
      expect(lookupDll('Vcruntime140.dll').found).toBe(true);
    });

    it('handles no extension', () => {
      expect(lookupDll('msvcp140').found).toBe(true);
    });
  });

  describe('fuzzy/prefix matches', () => {
    it('matches unknown msvcp variants via prefix', () => {
      const r = lookupDll('msvcp999.dll');
      expect(r.found).toBe(true);
      expect(r.familyId).toBe('vcredist');
      expect(r.fuzzy).toBe(true);
    });

    it('matches unknown api-ms-win-crt variants via prefix', () => {
      const r = lookupDll('api-ms-win-crt-newone-l1-1-0.dll');
      expect(r.found).toBe(true);
      expect(r.familyId).toBe('ucrt');
    });

    it('matches unknown d3dx variants via prefix', () => {
      const r = lookupDll('d3dx11_99.dll');
      expect(r.found).toBe(true);
      expect(r.familyId).toBe('directx');
    });
  });

  describe('unknown DLLs', () => {
    it('returns not found for app-specific DLLs', () => {
      expect(lookupDll('myapp_helper.dll').found).toBe(false);
      expect(lookupDll('steam_api64.dll').found).toBe(false);
      expect(lookupDll('libcurl.dll').found).toBe(false);
    });
  });

  describe('complex multi-DLL scenarios', () => {
    it('can resolve multiple DLLs from the same error', () => {
      // Simulating: user reports both MSVCP140.dll and VCRUNTIME140.dll missing
      const r1 = lookupDll('MSVCP140.dll');
      const r2 = lookupDll('VCRUNTIME140.dll');
      // Both should map to the same family and version
      expect(r1.familyId).toBe(r2.familyId);
      expect(r1.version.download_x64).toBe(r2.version.download_x64);
    });

    it('handles mixed DLLs from different families', () => {
      // User has both VC++ and DirectX errors
      const r1 = lookupDll('MSVCP140.dll');
      const r2 = lookupDll('d3dx9_43.dll');
      expect(r1.familyId).toBe('vcredist');
      expect(r2.familyId).toBe('directx');
      // Different fixes needed
      expect(r1.family.name).not.toBe(r2.family.name);
    });

    it('handles old VC++ versions (2008 games)', () => {
      const r = lookupDll('MSVCR90.dll');
      expect(r.found).toBe(true);
      expect(r.version.year).toBe('2008');
    });

    it('handles UCRT + vcredist combo (common on Windows 7)', () => {
      const r1 = lookupDll('api-ms-win-crt-runtime-l1-1-0.dll');
      const r2 = lookupDll('MSVCP140.dll');
      expect(r1.familyId).toBe('ucrt');
      expect(r2.familyId).toBe('vcredist');
      // UCRT fix mentions Windows Update
      expect(r1.family.fix_steps.join(' ').toLowerCase()).toContain('update');
    });
  });
});

describe('Missing DLL Skill Matching', () => {
  it('skill exists and is loaded', () => {
    const skills = getAllSkills();
    const dll = skills.find(s => s.id === 'missing_dll');
    expect(dll).toBeDefined();
    expect(dll.category).toBe('diagnostics');
  });

  it('matches "MSVCP140.dll is missing"', () => {
    const m = matchSkill('MSVCP140.dll is missing from my computer');
    expect(m).not.toBeNull();
    expect(m.skill.id).toBe('missing_dll');
  });

  it('matches "vcruntime140.dll was not found"', () => {
    const m = matchSkill('vcruntime140.dll was not found');
    expect(m).not.toBeNull();
    expect(m.skill.id).toBe('missing_dll');
  });

  it('matches "program won\'t start" with DLL context', () => {
    const m = matchSkill("my program won't start it says dll is missing");
    expect(m).not.toBeNull();
    expect(m.skill.id).toBe('missing_dll');
  });

  it('matches "the program can\'t start because"', () => {
    const m = matchSkill("the program can't start because api-ms-win-crt-runtime-l1-1-0.dll");
    expect(m).not.toBeNull();
    expect(m.skill.id).toBe('missing_dll');
  });

  it('matches DirectX-related errors', () => {
    const m = matchSkill('d3dx9_43.dll is missing when I try to open a game');
    expect(m).not.toBeNull();
    expect(m.skill.id).toBe('missing_dll');
  });

  it('matches "visual c++ redistributable"', () => {
    const m = matchSkill('do I need to install visual c++ redistributable');
    expect(m).not.toBeNull();
    expect(m.skill.id).toBe('missing_dll');
  });

  it('matches runtime error messages', () => {
    const m = matchSkill('I get a runtime error when opening my game');
    expect(m).not.toBeNull();
    expect(m.skill.id).toBe('missing_dll');
  });

  it('skill prompt mentions diagnose_missing_dll tool', () => {
    const skills = getAllSkills();
    const dll = skills.find(s => s.id === 'missing_dll');
    expect(dll.prompt).toContain('diagnose_missing_dll');
  });

  it('skill prompt warns against third-party DLL sites', () => {
    const skills = getAllSkills();
    const dll = skills.find(s => s.id === 'missing_dll');
    expect(dll.prompt.toLowerCase()).toContain('never');
    expect(dll.prompt.toLowerCase()).toContain('malware');
  });
});
