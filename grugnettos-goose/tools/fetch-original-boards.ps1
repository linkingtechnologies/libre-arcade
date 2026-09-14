$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Dest = Join-Path $Root 'public\assets\boards\original'
New-Item -ItemType Directory -Force -Path $Dest | Out-Null

$Headers = @{ 'User-Agent' = 'Grugnettos-Goose/0.13 software-archaeology asset fetcher' }
$PdUrl = 'https://upload.wikimedia.org/wikipedia/commons/8/88/Ganzenbord_pd.svg'
$HistoricUrl = 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Ganzenbordspel.jpg'
$PdPath = Join-Path $Dest 'Ganzenbord_pd.svg'
$HistoricPath = Join-Path $Dest 'Ganzenbordspel.jpg'

Write-Host 'Fetching Ganzenbord_pd.svg ...'
Invoke-WebRequest -Uri $PdUrl -Headers $Headers -OutFile "$PdPath.part"
Move-Item -Force "$PdPath.part" $PdPath

Write-Host 'Fetching Ganzenbordspel.jpg ...'
Invoke-WebRequest -Uri $HistoricUrl -Headers $Headers -OutFile "$HistoricPath.part"
Move-Item -Force "$HistoricPath.part" $HistoricPath

$SvgHead = Get-Content -Raw -TotalCount 20 $PdPath
if ($SvgHead -notmatch '<svg') { throw 'Ganzenbord_pd.svg is not an SVG.' }
$JpgBytes = [System.IO.File]::ReadAllBytes($HistoricPath)
if ($JpgBytes.Length -lt 3 -or $JpgBytes[0] -ne 0xFF -or $JpgBytes[1] -ne 0xD8 -or $JpgBytes[2] -ne 0xFF) {
  throw 'Ganzenbordspel.jpg is not a JPEG.'
}

$ExpectedSha1 = '2324f0f685f17a39771bb4b42617b52dc0b2953f'
$ActualSha1 = (Get-FileHash -Algorithm SHA1 $PdPath).Hash.ToLowerInvariant()
Write-Host "Ganzenbord_pd.svg SHA-1 expected: $ExpectedSha1"
Write-Host "Ganzenbord_pd.svg SHA-1 actual:   $ActualSha1"
if ($ActualSha1 -ne $ExpectedSha1) { throw 'Commons SHA-1 did not match.' }

$Rows = @(
  Get-FileHash -Algorithm SHA256 $PdPath
  Get-FileHash -Algorithm SHA256 $HistoricPath
)
$Rows | ForEach-Object { "{0}  {1}" -f $_.Hash.ToLowerInvariant(), [System.IO.Path]::GetFileName($_.Path) } |
  Set-Content -Encoding ascii (Join-Path $Dest 'SHA256SUMS.txt')

Write-Host ''
Get-Item $PdPath, $HistoricPath | Select-Object Name, Length, LastWriteTime | Format-Table
Write-Host 'Done. Both board images are now local.'
