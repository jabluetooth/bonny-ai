Add-Type -AssemblyName System.Drawing

$repoRoot = Split-Path -Parent $PSScriptRoot
$srcPath = Join-Path $repoRoot "public\bot-avatar.png"
$outPath = Join-Path $repoRoot "public\og-image.png"

$width = 1200
$height = 630

$bg = [System.Drawing.Color]::FromArgb(255, 10, 10, 10)      # #0a0a0a
$fg = [System.Drawing.Color]::FromArgb(255, 245, 245, 245)   # near-white
$muted = [System.Drawing.Color]::FromArgb(255, 163, 163, 163) # zinc-400
$accent = [System.Drawing.Color]::FromArgb(255, 99, 102, 241) # indigo-500

$canvas = New-Object System.Drawing.Bitmap $width, $height
$g = [System.Drawing.Graphics]::FromImage($canvas)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

$g.Clear($bg)

# Thin accent rule across the top
$accentBrush = New-Object System.Drawing.SolidBrush $accent
$g.FillRectangle($accentBrush, 0, 0, $width, 6)

# Avatar, scaled to fit a fixed height, left side, vertically centered
$src = [System.Drawing.Image]::FromFile($srcPath)
$targetH = 470
$targetW = [int]($src.Width * ($targetH / $src.Height))
$imgX = 100
$imgY = [int](($height - $targetH) / 2)

# Rounded-rect clip for the avatar
$radius = 24
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$d = $radius * 2
$path.AddArc($imgX, $imgY, $d, $d, 180, 90)
$path.AddArc($imgX + $targetW - $d, $imgY, $d, $d, 270, 90)
$path.AddArc($imgX + $targetW - $d, $imgY + $targetH - $d, $d, $d, 0, 90)
$path.AddArc($imgX, $imgY + $targetH - $d, $d, $d, 90, 90)
$path.CloseFigure()
$g.SetClip($path)
$g.DrawImage($src, $imgX, $imgY, $targetW, $targetH)
$g.ResetClip()

$src.Dispose()

# Text block, right of the avatar
$textX = $imgX + $targetW + 70
$textWidth = $width - $textX - 80

$titleFont = New-Object System.Drawing.Font("Segoe UI", 54, [System.Drawing.FontStyle]::Bold)
$subtitleFont = New-Object System.Drawing.Font("Segoe UI", 26, [System.Drawing.FontStyle]::Regular)
$taglineFont = New-Object System.Drawing.Font("Segoe UI", 20, [System.Drawing.FontStyle]::Regular)

$fgBrush = New-Object System.Drawing.SolidBrush $fg
$mutedBrush = New-Object System.Drawing.SolidBrush $muted

$titleY = 210
$g.DrawString("Fil Heinz", $titleFont, $fgBrush, $textX, $titleY)

$subtitleY = $titleY + 78
$g.DrawString("Software Engineer", $subtitleFont, $accentBrush, $textX, $subtitleY)

$taglineY = $subtitleY + 56
$taglineRect = New-Object System.Drawing.RectangleF($textX, $taglineY, $textWidth, 100)
$g.DrawString("Talk to my AI-powered portfolio.", $taglineFont, $mutedBrush, $taglineRect)

$canvas.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose()
$canvas.Dispose()
$titleFont.Dispose()
$subtitleFont.Dispose()
$taglineFont.Dispose()
$fgBrush.Dispose()
$mutedBrush.Dispose()
$accentBrush.Dispose()

Write-Output "Wrote $outPath"
