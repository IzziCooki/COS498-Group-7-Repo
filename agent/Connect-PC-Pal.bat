@echo off
REM PC Pal — Connect Your Computer
REM Double-click this file to connect your Windows PC to PC Pal!

cls
echo.
echo   ╔══════════════════════════════════════╗
echo   ║     PC Pal - Connect Your Computer  ║
echo   ╚══════════════════════════════════════╝
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo   Node.js is needed but not installed.
    echo   Opening the download page for you...
    start https://nodejs.org
    echo.
    echo   After installing Node.js, double-click this file again.
    echo.
    pause
    exit /b 1
)

REM Create working directory
set WORKDIR=%USERPROFILE%\.pcpal-agent
if not exist "%WORKDIR%" mkdir "%WORKDIR%"

REM Write the agent script
(
echo const { execSync } = require('child_process'^);
echo const os = require('os'^);
echo const WebSocket = require('ws'^);
echo const serverUrl = process.env.PCPAL_SERVER ^|^| 'ws://localhost:3001/ws';
echo const BLOCKED = [/\brm\s+-rf\s+\//, /\bmkfs\b/, /\bdd\b.*of=\/dev/, /\bshutdown\b/, /\breboot\b/, /\bformat\b/];
echo function run(cmd, t^) { if (BLOCKED.some(p =^> p.test(cmd^)^)^) return {output:'BLOCKED',error:true}; try { return {output:execSync(cmd,{encoding:'utf-8',timeout:t^|^|15000,maxBuffer:512*1024,stdio:['pipe','pipe','pipe']}^).trim(^),error:false}; } catch(e^) { return {output:e.stderr?e.stderr.trim(^):e.message,error:true}; } }
echo function sysInfo(^) { return {platform:process.platform,hostname:os.hostname(^),username:os.userInfo(^).username,cpu:os.cpus(^)[0]?.model,cpu_cores:os.cpus(^).length,total_ram_gb:(os.totalmem(^)/(1024**3^)^).toFixed(1^),free_ram_gb:(os.freemem(^)/(1024**3^)^).toFixed(1^)}; }
echo function connect(^) {
echo   const ws = new WebSocket(serverUrl^);
echo   ws.on('open', (^) =^> ws.send(JSON.stringify({type:'agent_register',systemInfo:sysInfo(^)}^)^)^);
echo   ws.on('message', (data^) =^> { let m; try{m=JSON.parse(data^);}catch{return;} if(m.type==='agent_registered'^){console.log('');console.log('  Your code: '+m.pairingCode^);console.log('');console.log('  Type this code in PC Pal and click Connect.'^);console.log('  Keep this window open!'^);console.log(''^);} else if(m.type==='agent_paired'^){console.log('  Connected to PC Pal!'^);} else if(m.type==='agent_command'^){const r=run(m.command,m.timeout^);ws.send(JSON.stringify({type:'agent_command_result',requestId:m.requestId,command:m.command,output:r.output,error:r.error}^)^);} else if(m.type==='agent_ping'^){ws.send(JSON.stringify({type:'agent_pong'}^)^);} }^);
echo   ws.on('close',(^)=^>{console.log('  Reconnecting...'^);setTimeout(connect,5000^);}^);
echo   ws.on('error',(e^)=^>{console.log('  Waiting for PC Pal...'^);setTimeout(connect,5000^);}^);
echo   process.on('SIGINT',(^)=^>{ws.close(^);process.exit(0^);}^);
echo }
echo connect(^);
) > "%WORKDIR%\agent.js"

REM Write package.json
echo {"name":"pcpal-agent","version":"1.0.0","dependencies":{"ws":"^8.16.0"}} > "%WORKDIR%\package.json"

REM Install ws if needed
if not exist "%WORKDIR%\node_modules\ws" (
    echo   Setting up (one-time only^)...
    cd /d "%WORKDIR%" && npm install --silent 2>nul
    echo   Done!
    echo.
)

echo   Starting PC Pal helper...
echo.
cd /d "%WORKDIR%" && node agent.js

pause
