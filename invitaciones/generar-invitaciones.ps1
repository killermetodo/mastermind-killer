# =============================================================
#  INVITACIONES — Mastermind Killer, Primera Edicion
#
#  Genera una imagen personalizada por persona, lista para
#  mandar por WhatsApp.
#
#  USO:
#    1. Escribe un nombre por linea en  nombres.txt
#    2. Ejecuta:  .\generar-invitaciones.ps1
#    3. Las imagenes quedan en la carpeta  salida\
#
#  Solo hay que tocar nombres.txt. Nada mas.
# =============================================================
param(
  [string]$Lista  = "$PSScriptRoot\nombres.txt",
  [string]$Salida = "$PSScriptRoot\salida",
  [string]$Foto   = "$PSScriptRoot\..\assets\img\camilo-retrato-1200.jpg"
)

Add-Type -AssemblyName System.Drawing

# --- Datos del evento -------------------------------------------------
$FECHA  = "S" + [char]0x00C1 + "BADO 29 DE AGOSTO"
$HORA   = "9:00 HRS"
$LUGAR  = "ARICA"

# --- Marca ------------------------------------------------------------
$W = 1080; $H = 1350          # 4:5, el formato que mejor entra en WhatsApp
$negro   = [System.Drawing.Color]::FromArgb(10,10,10)
$blanco  = [System.Drawing.Color]::FromArgb(245,245,245)
$titanio = [System.Drawing.Color]::FromArgb(176,176,176)
$tenue   = [System.Drawing.Color]::FromArgb(120,120,120)

# Acentos por codigo, para no depender de la codificacion del archivo.
# OJO: PowerShell no distingue mayusculas en los nombres de variable, asi que
# $O_ACC y $o_acc serian la MISMA. Por eso las minusculas llevan sufijo Min.
$A_ACC = [char]0x00C1; $O_ACC = [char]0x00D3; $U_ACC = [char]0x00DA
$aMin  = [char]0x00E1; $eMin  = [char]0x00E9; $iMin  = [char]0x00ED
$oMin  = [char]0x00F3; $uMin  = [char]0x00FA; $PUNTO = [char]0x00B7

if (-not (Test-Path $Salida)) { New-Item -ItemType Directory -Path $Salida | Out-Null }
if (-not (Test-Path $Lista))  { Write-Error "No encuentro $Lista"; exit 1 }

$nombres = Get-Content $Lista -Encoding UTF8 |
           ForEach-Object { $_.Trim() } |
           Where-Object { $_ -ne '' -and -not $_.StartsWith('#') }

if ($nombres.Count -eq 0) { Write-Error "nombres.txt esta vacio"; exit 1 }

# Escribe texto separando las letras (el tracking ancho de la marca)
function Escribir($g, $texto, $fuente, $color, $x, $y, $tracking) {
  $b = New-Object System.Drawing.SolidBrush($color)
  $fmt = [System.Drawing.StringFormat]::GenericTypographic
  $cursor = [float]$x
  foreach ($ch in $texto.ToCharArray()) {
    $s = [string]$ch
    $g.DrawString($s, $fuente, $b, $cursor, [float]$y, $fmt)
    $ancho = $g.MeasureString($s, $fuente, 0, $fmt).Width
    if ($s -eq ' ') { $ancho = $fuente.Size * 0.30 }
    $cursor += $ancho + $tracking
  }
  $b.Dispose()
  return $cursor - $x   # ancho total dibujado
}

# Mide sin dibujar, para poder centrar
function Medir($g, $texto, $fuente, $tracking) {
  $fmt = [System.Drawing.StringFormat]::GenericTypographic
  $total = 0.0
  foreach ($ch in $texto.ToCharArray()) {
    $s = [string]$ch
    $a = $g.MeasureString($s, $fuente, 0, $fmt).Width
    if ($s -eq ' ') { $a = $fuente.Size * 0.30 }
    $total += $a + $tracking
  }
  return $total - $tracking
}

function EscribirCentrado($g, $texto, $fuente, $color, $y, $tracking) {
  $ancho = Medir $g $texto $fuente $tracking
  Escribir $g $texto $fuente $color (($W - $ancho) / 2) $y $tracking | Out-Null
}

# Quita tildes y caracteres raros para el nombre del archivo
function NombreArchivo($texto) {
  $limpio = $texto.Normalize([Text.NormalizationForm]::FormD)
  $sb = New-Object Text.StringBuilder
  foreach ($c in $limpio.ToCharArray()) {
    if ([Globalization.CharUnicodeInfo]::GetUnicodeCategory($c) -ne
        [Globalization.UnicodeCategory]::NonSpacingMark) { [void]$sb.Append($c) }
  }
  $r = $sb.ToString() -replace '[^A-Za-z0-9]+', '-'
  return $r.Trim('-').ToLower()
}

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
         Where-Object { $_.MimeType -eq 'image/jpeg' }
$params = New-Object System.Drawing.Imaging.EncoderParameters(1)
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
  [System.Drawing.Imaging.Encoder]::Quality, [long]88)

$fondo = $null
if (Test-Path $Foto) { $fondo = [System.Drawing.Image]::FromFile($Foto) }

foreach ($nombre in $nombres) {

  $bmp = New-Object System.Drawing.Bitmap($W, $H)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint  = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $g.Clear($negro)

  # --- Marco fino, como una tarjeta -----------------------------------
  # Sin foto a proposito: el protagonista de la invitacion es quien la recibe.
  $penMarco = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(45,245,245,245), 2)
  $g.DrawRectangle($penMarco, 46, 46, ($W - 92), ($H - 92))

  # --- Tipografia -----------------------------------------------------
  $fEyebrow = New-Object System.Drawing.Font("Arial", 21, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $fMarca   = New-Object System.Drawing.Font("Arial", 62, [System.Drawing.FontStyle]::Bold,    [System.Drawing.GraphicsUnit]::Pixel)
  $fEdicion = New-Object System.Drawing.Font("Arial", 24, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $fTitular = New-Object System.Drawing.Font("Arial", 40, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $fCuerpo  = New-Object System.Drawing.Font("Arial", 25, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $fDato    = New-Object System.Drawing.Font("Arial", 23, [System.Drawing.FontStyle]::Bold,    [System.Drawing.GraphicsUnit]::Pixel)

  # El nombre manda: se encoge solo si es largo, para que nunca se corte
  $tamNombre = 78
  do {
    $fNombre = New-Object System.Drawing.Font("Arial", $tamNombre, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $anchoNombre = Medir $g $nombre.ToUpper() $fNombre 6
    if ($anchoNombre -gt ($W - 140)) { $fNombre.Dispose(); $tamNombre -= 4 }
  } while ($anchoNombre -gt ($W - 140) -and $tamNombre -gt 30)

  EscribirCentrado $g "INVITACI${O_ACC}N PERSONAL" $fEyebrow $tenue 130 10

  EscribirCentrado $g "MASTERMIND KILLER" $fMarca   $blanco  225 6
  EscribirCentrado $g "PRIMERA EDICI${O_ACC}N" $fEdicion $titanio 320 11

  $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(70,245,245,245), 1)
  $g.DrawLine($pen, 380, 400, ($W - 380), 400)

  EscribirCentrado $g "QUEDASTE DENTRO" $fTitular $blanco 470 12

  EscribirCentrado $g $nombre.ToUpper() $fNombre $blanco 580 6

  EscribirCentrado $g "Postularon muchos. Entran diez."          $fCuerpo $titanio 730 1
  EscribirCentrado $g "T${uMin} est${aMin}s dentro."             $fCuerpo $titanio 774 1

  EscribirCentrado $g "Un d${iMin}a para armar el negocio que"   $fCuerpo $titanio 856 1
  EscribirCentrado $g "tu conocimiento ya se merece."            $fCuerpo $titanio 900 1

  # Sello: refuerza la exclusividad sin decirlo
  $fSello = New-Object System.Drawing.Font("Arial", 20, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $anchoSello = Medir $g "1 DE 10" $fSello 8
  $x0 = ($W - $anchoSello) / 2
  $penSello = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(90,245,245,245), 1)
  $g.DrawRectangle($penSello, ($x0 - 34), 990, ($anchoSello + 68), 58)
  EscribirCentrado $g "1 DE 10" $fSello $blanco 1008 8

  $g.DrawLine($pen, 380, 1120, ($W - 380), 1120)

  EscribirCentrado $g "$LUGAR  ${PUNTO}  $FECHA" $fDato $blanco 1178 6
  EscribirCentrado $g "$HORA  ${PUNTO}  5 HORAS  ${PUNTO}  MESA REDONDA" $fDato $titanio 1222 6

  $archivo = Join-Path $Salida ("invitacion-" + (NombreArchivo $nombre) + ".jpg")
  $bmp.Save($archivo, $codec, $params)

  $g.Dispose(); $bmp.Dispose()
  "  {0,-28} -> {1} KB" -f $nombre, [Math]::Round((Get-Item $archivo).Length / 1KB, 0)
}

if ($fondo) { $fondo.Dispose() }
""
"$($nombres.Count) invitaciones en: $Salida"
