const dllKnowledge = require('../assets/dll-knowledge.json');

const DLL_PREFIX_MAP = {
  'msvcp': 'vcredist', 'msvcr': 'vcredist', 'vcruntime': 'vcredist',
  'mfc': 'vcredist', 'atl': 'vcredist', 'concrt': 'vcredist', 'vcomp': 'vcredist',
  'api-ms-win-crt': 'ucrt',
  'd3d': 'directx', 'd3dx': 'directx', 'xinput': 'directx',
  'xaudio': 'directx', 'x3daudio': 'directx',
  'hostfxr': 'dotnet', 'hostpolicy': 'dotnet', 'coreclr': 'dotnet',
};

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

  for (const [prefix, familyId] of Object.entries(DLL_PREFIX_MAP)) {
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

function formatDllDiagnosis(dllName, result, programName) {
  if (!result.found) {
    const lines = [
      `DLL: ${dllName}`,
      'STATUS: Not a standard Windows/runtime DLL — likely belongs to a specific program.',
      '',
      'RECOMMENDED FIX:',
      `1. Reinstall the program${programName ? ` (${programName})` : ''} — this will restore its missing files`,
      '2. If reinstalling does not work, also install the Visual C++ 2015-2022 Redistributable from Microsoft',
      '3. Run Windows Update to make sure your system is current',
      '',
      'SAFETY WARNING:',
    ];
    if (dllKnowledge.safety_rules) {
      lines.push(...dllKnowledge.safety_rules.map(r => `- ${r}`));
    } else {
      lines.push('- NEVER download individual DLL files from third-party websites — they often contain malware');
      lines.push('- Only use official Microsoft installers or reinstall the program');
    }
    return lines.join('\n');
  }

  const { family, version, familyId } = result;
  const lines = [
    `DLL: ${dllName}`,
    `IDENTIFIED AS: ${family.name}`,
    `DESCRIPTION: ${family.description}`,
    '',
  ];

  if (version) {
    lines.push(`VERSION: ${version.year} (${version.note})`);
    if (version.download_x64) lines.push(`DOWNLOAD (64-bit): ${version.download_x64}`);
    if (version.download_x86) lines.push(`DOWNLOAD (32-bit): ${version.download_x86}`);
    if (version.download) lines.push(`DOWNLOAD: ${version.download}`);
  } else if (family.download) {
    lines.push(`DOWNLOAD: ${family.download}`);
  } else if (familyId === 'ucrt' && family.download_standalone) {
    lines.push(`DOWNLOAD: ${family.download_standalone}`);
  } else if (familyId === 'dotnet') {
    lines.push('DOWNLOAD: https://dotnet.microsoft.com/en-us/download');
  }

  if (familyId === 'vcredist' && family.install_both_note) {
    lines.push('', `TIP: ${family.install_both_note}`);
  }

  lines.push('', 'FIX STEPS:');
  family.fix_steps.forEach((step, i) => lines.push(`${i + 1}. ${step}`));

  if (family.note) lines.push('', `NOTE: ${family.note}`);

  lines.push('', 'SAFETY WARNING:');
  lines.push('- NEVER download individual DLL files from third-party websites — they often contain malware');
  lines.push('- Only use official Microsoft installers or reinstall the program');

  if (programName) {
    lines.push('', `PROGRAM CONTEXT: The user is trying to run "${programName}". After installing the fix above, they should try opening it again.`);
  }

  return lines.join('\n');
}

module.exports = { lookupDll, formatDllDiagnosis };
