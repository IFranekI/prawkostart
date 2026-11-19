# Windows PowerShell. media_src = oryginalne pliki, wynik trafia do media_out
$src = "media_src"; $out = "media_out"
New-Item -ItemType Directory -Force $out | Out-Null
foreach ($line in Get-Content media_map.txt -Encoding UTF8) {
  if (-not $line.Trim()) { continue }
  $p = $line -split "`t"; $in = Join-Path $src $p[0]; $o = Join-Path $out $p[1]
  if (-not (Test-Path -LiteralPath $in)) { Write-Host "BRAK: $($p[0])"; continue }
  if (Test-Path -LiteralPath $o) { continue }
  if ($p[0] -match '\.wmv$') { ffmpeg -loglevel error -y -i $in -an -vf "scale='min(640,iw)':-2" -c:v libx264 -crf 30 -preset medium -pix_fmt yuv420p -movflags +faststart $o }
  else { Copy-Item -LiteralPath $in -Destination $o -Force }
}
Write-Host "Gotowe"
