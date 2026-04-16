/**
 * Collects system information available through browser APIs.
 * Returns a plain object — all APIs used are synchronous.
 */
export function collectBrowserSystemInfo() {
  const info = {
    userAgent: navigator.userAgent || null,
    os: parseOS(),
    browser: parseBrowser(),
    cpuCores: navigator.hardwareConcurrency || null,
    deviceMemoryGb: navigator.deviceMemory || null,
    screenResolution: `${screen.width}x${screen.height}`,
    devicePixelRatio: window.devicePixelRatio || null,
    gpu: getGPU(),
    touchScreen: navigator.maxTouchPoints > 0,
    language: navigator.language || null,
  };

  return info;
}

function parseOS() {
  // Try User-Agent Client Hints first (Chrome 90+)
  const uaData = navigator.userAgentData;
  if (uaData?.platform) {
    return uaData.platform;
  }

  const ua = navigator.userAgent;
  if (/Windows NT 10/.test(ua)) return 'Windows 10/11';
  if (/Windows NT/.test(ua)) return 'Windows';
  if (/Mac OS X\s*([\d._]+)/.test(ua)) {
    const ver = ua.match(/Mac OS X\s*([\d._]+)/)[1].replace(/_/g, '.');
    return `macOS ${ver}`;
  }
  if (/CrOS/.test(ua)) return 'Chrome OS';
  if (/Android\s*([\d.]+)/.test(ua)) return `Android ${ua.match(/Android\s*([\d.]+)/)[1]}`;
  if (/iPhone|iPad/.test(ua)) {
    const ver = ua.match(/OS\s*([\d_]+)/);
    return ver ? `iOS ${ver[1].replace(/_/g, '.')}` : 'iOS';
  }
  if (/Linux/.test(ua)) return 'Linux';
  return 'Unknown';
}

function parseBrowser() {
  const uaData = navigator.userAgentData;
  if (uaData?.brands?.length) {
    // Filter out the "Not A;Brand" type entries
    const real = uaData.brands.find(b => !/not/i.test(b.brand));
    if (real) return `${real.brand} ${real.version}`;
  }

  const ua = navigator.userAgent;
  if (/Edg\/([\d.]+)/.test(ua)) return `Edge ${ua.match(/Edg\/([\d.]+)/)[1]}`;
  if (/Chrome\/([\d.]+)/.test(ua) && !/Edg/.test(ua)) return `Chrome ${ua.match(/Chrome\/([\d.]+)/)[1]}`;
  if (/Firefox\/([\d.]+)/.test(ua)) return `Firefox ${ua.match(/Firefox\/([\d.]+)/)[1]}`;
  if (/Safari\/([\d.]+)/.test(ua) && !/Chrome/.test(ua)) {
    const ver = ua.match(/Version\/([\d.]+)/);
    return ver ? `Safari ${ver[1]}` : 'Safari';
  }
  return 'Unknown';
}

function getGPU() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return null;

    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return null;

    const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
    return renderer || null;
  } catch {
    return null;
  }
}
