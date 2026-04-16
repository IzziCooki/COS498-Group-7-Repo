/**
 * System Diagnostics Module
 *
 * Provides sandboxed, read-only system diagnostic capabilities
 * for the PC Pal agent when running as a desktop (Electron) app.
 *
 * All commands are allowlisted — no arbitrary execution.
 */

const { execSync } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { BLOCKED_PATTERNS } = require('./sharedConstants');

const COMMAND_TIMEOUT = 10000; // 10 seconds max per command

/** Safely execute a command with timeout and size limits. */
function safeExec(cmd, timeoutMs = COMMAND_TIMEOUT) {
  try {
    const output = execSync(cmd, {
      timeout: timeoutMs,
      maxBuffer: 1024 * 512, // 512KB max output
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return output.trim();
  } catch (err) {
    if (err.killed) return `Command timed out after ${timeoutMs}ms`;
    // Return stderr if available, otherwise the error message
    return err.stderr ? err.stderr.trim() : err.message;
  }
}

/** Detect the current platform for command selection. */
function getPlatform() {
  const p = process.platform;
  if (p === 'win32') return 'windows';
  if (p === 'darwin') return 'mac';
  return 'linux';
}

// Tool Implementations

/** get_system_info — OS version, CPU, RAM, disk space, uptime. */
function getSystemInfo() {
  const platform = getPlatform();

  // Get accurate available memory (macOS reports free RAM too low because of file cache)
  let freeRamGb, ramUsagePercent;
  const totalRamGb = os.totalmem() / (1024 ** 3);

  if (platform === 'mac') {
    // Use vm_stat for accurate available memory on macOS
    const vmStat = safeExec('vm_stat');
    const pageSize = 16384; // Apple Silicon uses 16K pages
    const freeMatch = vmStat.match(/Pages free:\s+(\d+)/);
    const inactiveMatch = vmStat.match(/Pages inactive:\s+(\d+)/);
    const purgableMatch = vmStat.match(/Pages purgeable:\s+(\d+)/);
    if (freeMatch && inactiveMatch) {
      const freePages = parseInt(freeMatch[1]) + parseInt(inactiveMatch[1]) + parseInt(purgableMatch?.[1] || 0);
      freeRamGb = (freePages * pageSize / (1024 ** 3)).toFixed(1);
    } else {
      freeRamGb = (os.freemem() / (1024 ** 3)).toFixed(1);
    }
  } else {
    freeRamGb = (os.freemem() / (1024 ** 3)).toFixed(1);
  }
  ramUsagePercent = ((1 - freeRamGb / totalRamGb) * 100).toFixed(0);

  const info = {
    platform: platform,
    os_version: '',
    cpu: '',
    cpu_cores: os.cpus().length,
    total_ram_gb: totalRamGb.toFixed(1),
    free_ram_gb: freeRamGb,
    ram_usage_percent: ramUsagePercent,
    uptime_hours: (os.uptime() / 3600).toFixed(1),
    hostname: os.hostname(),
    username: os.userInfo().username,
    disk: '',
  };

  // OS version
  if (platform === 'windows') {
    info.os_version = safeExec('ver') || `Windows ${os.release()}`;
    info.cpu = safeExec('wmic cpu get name /value').replace('Name=', '').trim() || os.cpus()[0]?.model;
    info.disk = safeExec('wmic logicaldisk get size,freespace,caption /format:list');
  } else if (platform === 'mac') {
    info.os_version = safeExec('sw_vers -productName') + ' ' + safeExec('sw_vers -productVersion');
    info.cpu = os.cpus()[0]?.model || 'Unknown';
    // Show the Data volume which has the user's actual storage
    const diskOutput = safeExec('df -h /System/Volumes/Data 2>/dev/null | tail -1') || safeExec('df -h / | tail -1');
    info.disk = diskOutput;
  } else {
    info.os_version = safeExec('cat /etc/os-release 2>/dev/null | head -2') || `Linux ${os.release()}`;
    info.cpu = os.cpus()[0]?.model || 'Unknown';
    info.disk = safeExec('df -h / | tail -1');
  }

  // Format for the AI
  const lines = [
    `Operating System: ${info.os_version}`,
    `Computer Name: ${info.hostname}`,
    `User: ${info.username}`,
    `Processor: ${info.cpu} (${info.cpu_cores} cores)`,
    `Memory: ${info.free_ram_gb} GB free of ${info.total_ram_gb} GB total (${info.ram_usage_percent}% used)`,
    `Computer has been on for: ${info.uptime_hours} hours`,
    `Disk Space: ${info.disk}`,
  ];

  return lines.join('\n');
}

/** check_network — connectivity, DNS, Wi-Fi status, IP info. */
function checkNetwork() {
  const platform = getPlatform();
  const results = [];

  // Basic connectivity: ping a reliable host
  const pingCmd = platform === 'windows'
    ? 'ping -n 1 -w 3000 8.8.8.8'
    : 'ping -c 1 -W 3 8.8.8.8';
  const pingResult = safeExec(pingCmd);
  const isConnected = pingResult.includes('bytes') || pingResult.includes('TTL') || pingResult.includes('ttl');
  results.push(`Internet Connection: ${isConnected ? 'CONNECTED' : 'NOT CONNECTED'}`);

  // DNS check
  const dnsCmd = platform === 'windows'
    ? 'nslookup google.com'
    : 'nslookup google.com 2>&1 | head -6';
  const dnsResult = safeExec(dnsCmd);
  const dnsWorks = dnsResult.includes('Address') || dnsResult.includes('address');
  results.push(`DNS Resolution: ${dnsWorks ? 'Working' : 'FAILING — this could cause websites not to load'}`);

  // Wi-Fi status
  if (platform === 'windows') {
    const wifi = safeExec('netsh wlan show interfaces');
    results.push(`Wi-Fi Details:\n${wifi}`);
  } else if (platform === 'mac') {
    const wifiName = safeExec('/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I 2>/dev/null | grep -E "SSID|BSSID|channel|agrCtlRSSI" || networksetup -getairportnetwork en0 2>/dev/null');
    results.push(`Wi-Fi Details:\n${wifiName}`);
  } else {
    const wifi = safeExec('nmcli dev wifi list 2>/dev/null | head -5 || iwconfig 2>/dev/null | head -5');
    results.push(`Wi-Fi Details:\n${wifi}`);
  }

  // IP address
  if (platform === 'windows') {
    const ip = safeExec('ipconfig | findstr /i "IPv4"');
    results.push(`IP Address: ${ip}`);
  } else {
    const iface = platform === 'mac' ? 'en0' : 'eth0';
    const ip = safeExec(`ifconfig ${iface} 2>/dev/null | grep 'inet ' || hostname -I 2>/dev/null`);
    results.push(`IP Address: ${ip}`);
  }

  // Speed test — just measure latency to Google
  const latencyCmd = platform === 'windows'
    ? 'ping -n 3 google.com'
    : 'ping -c 3 google.com 2>&1';
  const latencyResult = safeExec(latencyCmd, 15000);
  const avgMatch = latencyResult.match(/avg[^=]*=\s*[\d.]+\/([\d.]+)/) || latencyResult.match(/Average\s*=\s*(\d+)ms/);
  if (avgMatch) {
    results.push(`Average Latency to Google: ${avgMatch[1]}ms`);
  }

  return results.join('\n\n');
}

/** list_running_apps — show running applications and resource usage. */
function listRunningApps() {
  const platform = getPlatform();

  if (platform === 'windows') {
    // Get top processes by memory usage
    return safeExec('tasklist /FO TABLE /NH | sort /R | findstr /V "svchost csrss" | head -20') ||
           safeExec('tasklist /FO TABLE | head -25');
  } else if (platform === 'mac') {
    // ps sorted by CPU, top 20, with friendly formatting
    return safeExec('ps aux -r | head -1 && ps aux -r | head -20 | awk \'{printf "%-6s %-5s%% %-5s%% %s\\n", $2, $3, $4, $11}\'');
  } else {
    return safeExec('ps aux --sort=-%cpu | head -20');
  }
}

/** read_error_log — grab recent system/application error logs. */
function readErrorLog(source) {
  const platform = getPlatform();
  const src = (source || 'system').toLowerCase();

  if (platform === 'windows') {
    if (src === 'system') {
      return safeExec('wevtutil qe System /c:20 /f:text /rd:true /q:"*[System[(Level=1 or Level=2)]]"', 15000);
    } else if (src === 'application') {
      return safeExec('wevtutil qe Application /c:20 /f:text /rd:true /q:"*[System[(Level=1 or Level=2)]]"', 15000);
    }
    return 'Unknown log source. Available: system, application';
  } else if (platform === 'mac') {
    if (src === 'system') {
      return safeExec('log show --last 30m --predicate \'eventType == logEvent AND messageType == error\' --style compact 2>/dev/null | tail -30');
    } else if (src === 'crash') {
      // List recent crash reports
      const crashDir = path.join(os.homedir(), 'Library/Logs/DiagnosticReports');
      try {
        const files = fs.readdirSync(crashDir)
          .filter(f => f.endsWith('.crash') || f.endsWith('.ips'))
          .sort()
          .slice(-5);
        if (files.length === 0) return 'No recent crash reports found — that\'s good!';
        return 'Recent crash reports:\n' + files.map(f => `  - ${f}`).join('\n');
      } catch {
        return 'Unable to read crash reports directory.';
      }
    }
    return safeExec('log show --last 30m --predicate \'messageType == error\' --style compact 2>/dev/null | tail -20');
  } else {
    if (src === 'system') {
      return safeExec('journalctl -p err --no-pager -n 20 2>/dev/null || tail -30 /var/log/syslog 2>/dev/null');
    }
    return safeExec('journalctl -p err --no-pager -n 20 2>/dev/null');
  }
}

// Allowlisted command patterns (regex)
const ALLOWED_COMMANDS = {
  windows: [
    /^ipconfig(\s+\/all)?$/i,
    /^systeminfo$/i,
    /^hostname$/i,
    /^whoami$/i,
    /^ver$/i,
    /^netsh wlan show\s+(interfaces|profiles|networks)$/i,
    /^netsh interface show interface$/i,
    /^ping\s+-n\s+[1-4]\s+\S+$/i,
    /^nslookup\s+\S+$/i,
    /^tracert\s+-d\s+\S+$/i,
    /^tasklist(\s+\/FO\s+\w+)?$/i,
    /^wmic\s+(os|cpu|memorychip|diskdrive|nic)\s+get\s+\S+/i,
    /^dir\s+"[^"]+"\s*$/i,
    /^type\s+"[^"]+\.(txt|log|cfg|ini|json)"\s*$/i,
    /^netstat\s+-an$/i,
    /^route\s+print$/i,
    /^powershell\s+-Command\s+"Get-NetAdapter"/i,
    /^powershell\s+-Command\s+"Get-WmiObject/i,
  ],
  mac: [
    /^sw_vers/i,
    /^uname\s+-[a-z]+$/i,
    /^hostname$/i,
    /^whoami$/i,
    /^ifconfig(\s+\w+)?$/i,
    /^networksetup\s+-(getairportnetwork|listallhardwareports|getinfo)\s+\S+$/i,
    /^ping\s+-c\s+[1-4]\s+\S+$/i,
    /^nslookup\s+\S+$/i,
    /^traceroute\s+-m\s+\d+\s+\S+$/i,
    /^ps\s+aux/i,
    /^top\s+-l\s+1/i,
    /^df\s+-h/i,
    /^du\s+-sh\s+/i,
    /^ls\s+-la?\s+"?[^;|&]+"?\s*$/i,
    /^cat\s+"?[^;|&]+\.(txt|log|cfg|ini|json|plist|conf)"?\s*$/i,
    /^defaults\s+read\s+/i,
    /^system_profiler\s+SP\w+$/i,
    /^diskutil\s+(list|info)\s*/i,
    /^netstat\s+-an$/i,
    /^scutil\s+--dns$/i,
    /^pmset\s+-g\s+(batt|assertions|log)$/i,
    /^launchctl\s+list$/i,
    /^softwareupdate\s+-l$/i,
    /^mdutil\s+-s\s+\//i,
    // App and system interaction (read-only / safe open)
    /^open\s+-a\s+"[^"]+"\s*$/i,                          // open an app by name
    /^open\s+"?[^;|&]+"?\s*$/i,                           // open a file/folder/URL
    /^mdfind\s+"[^"]+"\s*$/i,                             // spotlight search
    /^which\s+\w+$/i,                                     // find a command
    /^sysctl\s+(hw\.|machdep\.cpu)/i,                     // hardware info
    /^vm_stat$/i,                                          // memory stats
    /^ioreg\s+-l\s+-w\s+0$/i,                              // hardware registry
    /^plutil\s+-p\s+"?[^;|&]+"?\s*$/i,                   // read plist files
    /^dscl\s+\.\s+-read\s+/i,                             // directory service read
    /^spctl\s+--status$/i,                                 // Gatekeeper status
    /^csrutil\s+status$/i,                                 // SIP status
    /^xcode-select\s+-p$/i,                                // Xcode CLI tools path
    /^python3?\s+--version$/i,                             // Python version
    /^node\s+--version$/i,                                 // Node version
    /^git\s+--version$/i,                                  // Git version
    /^ollama\s+(list|show|ps)$/i,                          // Ollama model listing (no run/pull)
    /^docker\s+(ps|images|version)$/i,                     // Docker read-only status
  ],
  linux: [
    /^uname\s+-[a-z]+$/i,
    /^hostname$/i,
    /^whoami$/i,
    /^ifconfig(\s+\w+)?$/i,
    /^ip\s+(addr|route|link)\s*(show)?/i,
    /^ping\s+-c\s+[1-4]\s+\S+$/i,
    /^nslookup\s+\S+$/i,
    /^traceroute\s+-m\s+\d+\s+\S+$/i,
    /^ps\s+aux/i,
    /^top\s+-bn1/i,
    /^df\s+-h/i,
    /^du\s+-sh\s+/i,
    /^ls\s+-la?\s+"?[^;|&]+"?\s*$/i,
    /^cat\s+"?[^;|&]+\.(txt|log|cfg|ini|json|conf|yaml|yml)"?\s*$/i,
    /^free\s+-[mgh]$/i,
    /^lsblk$/i,
    /^nmcli\s+(dev|con)\s+(show|status|wifi)/i,
    /^netstat\s+-an$/i,
    /^ss\s+-tulpn$/i,
    /^systemctl\s+(status|list-units|is-active)\s+/i,
    /^journalctl\s+/i,
    /^lsb_release\s+-a$/i,
  ],
};

// BLOCKED_PATTERNS imported from sharedConstants.js — single source of truth

function runSafeCommand(command) {
  if (!command || typeof command !== 'string') {
    return 'Error: No command provided.';
  }

  const cmd = command.trim();

  // Check blocked patterns first
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(cmd)) {
      return `BLOCKED: This command is not allowed for safety reasons. PC Pal can only run read-only diagnostic commands. The command "${cmd}" was blocked because it matches a restricted pattern.`;
    }
  }

  // Check against allowlist
  const platform = getPlatform();
  const allowed = ALLOWED_COMMANDS[platform] || [];
  const isAllowed = allowed.some(pattern => pattern.test(cmd));

  if (!isAllowed) {
    return `BLOCKED: The command "${cmd}" is not in the allowed list of diagnostic commands for ${platform}. ` +
      `PC Pal can run: system info commands, network diagnostics (ping, nslookup, ifconfig), ` +
      `process listing, disk usage, and file reading (text/log files only). ` +
      `Ask me what specific information you need and I'll use the right diagnostic tool.`;
  }

  return safeExec(cmd);
}

/** check_disk_health — disk usage, large files, temp file cleanup suggestions. */
function checkDiskHealth() {
  const platform = getPlatform();
  const results = [];

  // Disk usage overview
  if (platform === 'windows') {
    results.push('Disk Usage:');
    results.push(safeExec('wmic logicaldisk get caption,size,freespace /format:list'));
  } else {
    results.push('Disk Usage:');
    results.push(safeExec('df -h'));
  }

  // Home directory size
  const home = os.homedir();
  if (platform === 'windows') {
    results.push('\nUser folder sizes:');
    results.push(safeExec(`dir "${path.join(home, 'Desktop')}" /s /-c 2>nul | findstr "File(s)"`) || '');
    results.push(safeExec(`dir "${path.join(home, 'Downloads')}" /s /-c 2>nul | findstr "File(s)"`) || '');
    results.push(safeExec(`dir "${path.join(home, 'Documents')}" /s /-c 2>nul | findstr "File(s)"`) || '');
  } else {
    results.push('\nUser folder sizes:');
    results.push(safeExec(`du -sh "${path.join(home, 'Desktop')}" "${path.join(home, 'Downloads')}" "${path.join(home, 'Documents')}" 2>/dev/null`));
  }

  // Temp files
  if (platform === 'windows') {
    const tempSize = safeExec('dir "%TEMP%" /s /-c 2>nul | findstr "File(s)"');
    results.push(`\nTemp files: ${tempSize}`);
  } else if (platform === 'mac') {
    const tmpSize = safeExec('du -sh /tmp 2>/dev/null');
    const cacheSize = safeExec(`du -sh "${path.join(home, 'Library/Caches')}" 2>/dev/null`);
    results.push(`\nTemp files: ${tmpSize}`);
    results.push(`Cache files: ${cacheSize}`);
  }

  return results.join('\n');
}

/** check_installed_software — list installed applications. */
function checkInstalledSoftware(searchTerm) {
  const platform = getPlatform();

  if (platform === 'windows') {
    const cmd = searchTerm
      ? `wmic product where "name like '%${searchTerm.replace(/'/g, "''")}%'" get name,version /format:list`
      : 'wmic product get name,version /format:list';
    return safeExec(cmd, 30000);
  } else if (platform === 'mac') {
    // List apps in /Applications
    let apps = safeExec('ls /Applications/ 2>/dev/null');
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      apps = apps.split('\n').filter(a => a.toLowerCase().includes(term)).join('\n');
      if (!apps) return `No application matching "${searchTerm}" found in /Applications.`;
    }
    return apps;
  } else {
    const cmd = searchTerm
      ? `dpkg -l 2>/dev/null | grep -i "${searchTerm}" || rpm -qa 2>/dev/null | grep -i "${searchTerm}"`
      : 'dpkg -l 2>/dev/null | head -30 || rpm -qa 2>/dev/null | head -30';
    return safeExec(cmd);
  }
}

/** get_battery_status — battery level and charging state (laptops). */
function getBatteryStatus() {
  const platform = getPlatform();

  if (platform === 'windows') {
    return safeExec('wmic path Win32_Battery get EstimatedChargeRemaining,BatteryStatus /format:list');
  } else if (platform === 'mac') {
    return safeExec('pmset -g batt');
  } else {
    const hasBattery = fs.existsSync('/sys/class/power_supply/BAT0');
    if (!hasBattery) return 'No battery detected — this appears to be a desktop computer.';
    const capacity = safeExec('cat /sys/class/power_supply/BAT0/capacity 2>/dev/null');
    const status = safeExec('cat /sys/class/power_supply/BAT0/status 2>/dev/null');
    return `Battery: ${capacity}% (${status})`;
  }
}

module.exports = {
  getSystemInfo,
  checkNetwork,
  listRunningApps,
  readErrorLog,
  runSafeCommand,
  checkDiskHealth,
  checkInstalledSoftware,
  getBatteryStatus,
  getPlatform,
};
