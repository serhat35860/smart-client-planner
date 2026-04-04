param(
  [Parameter(Mandatory = $true)][string]$ProjectRoot,
  [Parameter(Mandatory = $true)][int]$SafePid
)

function Get-AncestorPids([int]$startPid) {
  $set = [System.Collections.Generic.HashSet[int]]::new()
  [void]$set.Add($startPid)
  $current = $startPid
  for ($i = 0; $i -lt 96; $i++) {
    $p = Get-CimInstance Win32_Process -Filter "ProcessId = $current" -ErrorAction SilentlyContinue
    if (-not $p) { break }
    $parentId = [int]$p.ParentProcessId
    if ($parentId -le 0) { break }
    [void]$set.Add($parentId)
    $current = $parentId
  }
  return $set
}

$ancestors = Get-AncestorPids $SafePid
try {
  $rootNorm = [System.IO.Path]::GetFullPath($ProjectRoot).ToLowerInvariant()
}
catch {
  $rootNorm = $ProjectRoot.ToLowerInvariant()
}

function Test-ShouldStopNode([string]$cmd) {
  if (-not $cmd) { return $false }
  $c = $cmd.ToLowerInvariant()
  if (-not $c.Contains($rootNorm)) { return $false }
  if ($c -match 'next(\\|/)dist(\\|/)bin(\\|/)next' -and ($c -match '\bdev\b' -or $c -match '\bstart\b')) { return $true }
  if ($c -match '\bprisma\s+studio\b') { return $true }
  if ($c -match '\bwait-on\b') { return $true }
  if ($c -match '\bconcurrently\b') { return $true }
  if ($c -match '\belectron(\.cmd)?\b') { return $true }
  return $false
}

function Test-ShouldStopElectron([string]$cmd) {
  if (-not $cmd) { return $false }
  return $cmd.ToLowerInvariant().Contains($rootNorm)
}

$stopped = 0
foreach ($row in Get-CimInstance Win32_Process -ErrorAction SilentlyContinue) {
  $pid = $row.ProcessId
  if ($ancestors.Contains($pid)) { continue }
  $name = $row.Name
  $cmd = $row.CommandLine
  $kill = $false
  if ($name -eq 'node.exe') { $kill = Test-ShouldStopNode $cmd }
  elseif ($name -eq 'electron.exe') { $kill = Test-ShouldStopElectron $cmd }
  if (-not $kill) { continue }
  Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
  $stopped++
  Write-Host "SPC: durduruldu PID $pid ($name)"
}

if ($stopped -gt 0) {
  Write-Host "SPC: $stopped gelistirme sureci sonlandirildi (Prisma dosya kilidi icin)."
  Start-Sleep -Milliseconds 400
}
