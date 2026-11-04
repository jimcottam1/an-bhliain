# Draws site/og.png (1200 x 630) from scripts/og-shapes.json, the same picture as site/og.svg.
Add-Type -AssemblyName System.Drawing
$root = Split-Path -Parent $PSScriptRoot
$s = Get-Content (Join-Path $PSScriptRoot 'og-shapes.json') -Raw -Encoding UTF8 | ConvertFrom-Json
function Col($hex) { [System.Drawing.ColorTranslator]::FromHtml($hex) }
$bmp = New-Object System.Drawing.Bitmap $s.W, $s.H
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = 'AntiAlias'; $g.TextRenderingHint = 'AntiAlias'
$g.Clear((Col $s.BG))
$ring = New-Object System.Drawing.Pen (Col '#2b3d4a'), 2
$r0 = $s.R_OUT + 24
$g.DrawEllipse($ring, $s.CX - $r0, $s.CY - $r0, 2 * $r0, 2 * $r0)
$ro = [single]$s.R_OUT; $ri = [single]$s.R_IN; $cx = [single]$s.CX; $cy = [single]$s.CY
foreach ($w in $s.wedges) {
  $start = [single]($w.a0 - 90); $sweep = [single]($w.a1 - $w.a0)
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $p.AddArc($cx - $ro, $cy - $ro, 2 * $ro, 2 * $ro, $start, $sweep)
  $p.AddArc($cx - $ri, $cy - $ri, 2 * $ri, 2 * $ri, [single]($start + $sweep), [single](-$sweep))
  $p.CloseFigure()
  $g.FillPath((New-Object System.Drawing.SolidBrush (Col $w.colour)), $p)
}
$center = New-Object System.Drawing.StringFormat; $center.Alignment = 'Center'; $center.LineAlignment = 'Center'
$left = New-Object System.Drawing.StringFormat; $left.Alignment = 'Near'; $left.LineAlignment = 'Far'
function Font($size, $style) { New-Object System.Drawing.Font 'Georgia', $size, $style, ([System.Drawing.GraphicsUnit]::Pixel) }
$white = [System.Drawing.Brushes]::White
foreach ($w in $s.wedges) {
  $g.DrawString($w.irish, (Font 30 'Bold'), $white, [single]$w.labelX, [single]($w.labelY - 10), $center)
  $g.DrawString($w.english, (Font 22 'Italic'), $white, [single]$w.labelX, [single]($w.labelY + 20), $center)
}
$gold = New-Object System.Drawing.SolidBrush (Col $s.GOLD)
$glow = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(90, (Col $s.GOLD)))
$dx = [single]$s.dot[0]; $dy = [single]$s.dot[1]
$g.FillEllipse($glow, $dx - 22, $dy - 22, 44, 44)
$g.FillEllipse((New-Object System.Drawing.SolidBrush (Col $s.BG)), $dx - 17, $dy - 17, 34, 34)
$g.FillEllipse($gold, $dx - 13, $dy - 13, 26, 26)
$ink = New-Object System.Drawing.SolidBrush (Col $s.INK); $muted = New-Object System.Drawing.SolidBrush (Col $s.MUTED)
$g.DrawString('Samhain', (Font 46 'Bold'), $ink, $cx, $cy - 6, $center)
$g.DrawString('the year begins', (Font 26 'Italic'), $gold, $cx, $cy + 38, $center)
$g.DrawString('An Bhliain', (Font 86 'Bold'), $ink, 656, 238, $left)
$g.DrawString('The old Irish year', (Font 40 'Italic'), $gold, 660, 304, $left)
$mid = [string][char]0x00B7
$g.DrawString(('Samhain ' + $mid + ' Imbolc ' + $mid + ' Bealtaine ' + $mid + ' Lughnasa'), (Font 27 'Regular'), $muted, 660, 400, $left)
$g.DrawString('Where are we today, and how much light?', (Font 27 'Regular'), $muted, 660, 446, $left)
$out = Join-Path $root 'site\og.png'
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
(Get-Item $out).Length
