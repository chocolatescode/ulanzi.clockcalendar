# Opens the Thunderbird window and switches it to the Calendar tab (Alt+3).
param([string]$Exe = "thunderbird.exe")
$ErrorActionPreference = 'Stop'
$log = Join-Path $PSScriptRoot '..\plugin.log'
function Log($m) { try { Add-Content -Path $log -Value ("{0} [ps] {1}" -f (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ'), $m) } catch {} }
try {
  Add-Type -Namespace TbCal -Name W -MemberDefinition @'
[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
[DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int n);
[DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h);
[DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
[DllImport("user32.dll")] public static extern void keybd_event(byte vk, byte scan, uint flags, UIntPtr extra);
'@
  function Get-TbWindow { Get-Process thunderbird -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero } | Select-Object -First 1 }

  $p = Get-TbWindow
  if (-not $p) {
    Log "starting $Exe"
    Start-Process -FilePath $Exe
    for ($i = 0; $i -lt 60 -and -not $p; $i++) { Start-Sleep -Milliseconds 500; $p = Get-TbWindow }
    if (-not $p) { Log 'thunderbird window not found'; exit 1 }
    Start-Sleep -Seconds 3   # let the UI finish loading
    $p = Get-TbWindow
  }
  $h = $p.MainWindowHandle
  if ([TbCal.W]::IsIconic($h)) { [TbCal.W]::ShowWindow($h, 9) | Out-Null }

  $sh = New-Object -ComObject WScript.Shell
  $null = $sh.AppActivate($p.Id)
  Start-Sleep -Milliseconds 150
  if ([TbCal.W]::GetForegroundWindow() -ne $h) {
    # Windows blocks focus stealing from background processes; a short Alt tap lifts that.
    [TbCal.W]::keybd_event(0x12, 0, 0, [UIntPtr]::Zero); [TbCal.W]::keybd_event(0x12, 0, 2, [UIntPtr]::Zero)
    [TbCal.W]::SetForegroundWindow($h) | Out-Null
  }
  for ($i = 0; $i -lt 20 -and [TbCal.W]::GetForegroundWindow() -ne $h; $i++) { Start-Sleep -Milliseconds 100 }
  if ([TbCal.W]::GetForegroundWindow() -ne $h) { Log 'could not focus thunderbird window'; exit 2 }

  Start-Sleep -Milliseconds 150
  $sh.SendKeys('%3')
  Log 'calendar: sent Alt+3'
} catch {
  Log ("error: " + $_.Exception.Message)
  exit 3
}
