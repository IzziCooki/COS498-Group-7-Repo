# Security — Command Execution Model

PC Pal can run terminal commands on the user's computer for diagnostics. All commands pass through a two-layer security filter.

## Layer 1: Block List (always denied)

These patterns are **instantly blocked** regardless of context — the agent cannot run them, and neither can the user via the "Run" button:

| Blocked | Why |
|---|---|
| `; \| & \` $` | Prevents command chaining / injection |
| `rm`, `del` | No file deletion |
| `sudo`, `runas` | No privilege escalation |
| `curl`, `wget` | No internet downloads |
| `kill`, `taskkill` | No process killing |
| `shutdown`, `reboot` | No system shutdown |
| `chmod`, `chown` | No permission changes |
| `format`, `mkfs`, `dd` | No disk formatting |
| `npm`, `pip`, `apt`, `brew` | No package installation |
| `reg` | No Windows registry access |
| `>` | No output redirection / file writing |

## Layer 2: Allow List (must match to run)

Commands that pass the block list must also match a **specific regex pattern** for the user's platform. Only read-only diagnostic commands are allowed:

**Allowed categories:** system info, network diagnostics (ping, nslookup, ifconfig), process listing, disk usage, file reading (text/log/config files only), battery status, installed software listing.

See `server/core/systemDiagnostics.js` lines 244-314 for the full regex list per platform (~24 Mac, ~17 Windows, ~17 Linux patterns).

## What the agent runs automatically (no user approval)

The agent's built-in diagnostic tools (`get_system_info`, `check_network`, etc.) run hardcoded commands — not arbitrary strings. These execute automatically when the agent decides to diagnose a problem:

- `sw_vers`, `vm_stat`, `df -h` — system info
- `ping`, `nslookup`, `ifconfig` — network checks
- `ps aux` — running processes
- `log show` — error logs
- `pmset -g batt` — battery
- `ls /Applications/` — installed software

## What the user can approve via "Run" buttons

Guide artifacts show terminal commands with "Run" buttons. When clicked, the command goes through **the same block list + allow list** as everything else. The "Run" button does NOT bypass the sandbox.

## What cannot be run at all

Even with user approval: installing software, downloading files, running scripts, modifying files, changing system config, or anything not in the allow list.

## Relay Agent Security

The relay agent (`agent/pcpal-agent.js`) for remote connections has its own block list for destructive commands. Pairing codes expire after 5 minutes and are rate-limited to 5 attempts per minute.

## Reporting a Vulnerability

Report security issues to the project maintainers via GitHub Issues.
