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
#
#  Sale en PNG: la imagen es texto blanco sobre negro plano, y el JPG
#  ensucia los bordes de las letras. El PNG las deja limpias.
# =============================================================
param(
  [string]$Lista  = "$PSScriptRoot\nombres.txt",
  [string]$Salida = "$PSScriptRoot\salida"
)

Add-Type -AssemblyName System.Drawing

# --- Datos del evento -------------------------------------------------
$FECHA = "S" + [char]0x00C1 + "BADO 29 DE AGOSTO"
$HORA  = "9:00 HRS"
$LUGAR = "ARICA"

# --- Lienzo -----------------------------------------------------------
# Se disena sobre una reticula de 1080x1350 y se renderiza al doble, para
# que el texto quede nitido en pantallas de telefono de alta densidad.
$BASE_W = 1080; $BASE_H = 1350
$S = 2.0
$W = [int]($BASE_W * $S); $H = [int]($BASE_H * $S)

$negro   = [System.Drawing.Color]::FromArgb(10,10,10)
$blanco  = [System.Drawing.Color]::FromArgb(245,245,245)
$titanio = [System.Drawing.Color]::FromArgb(176,176,176)
$tenue   = [System.Drawing.Color]::FromArgb(125,125,125)

# Acentos por codigo, para no depender de la codificacion del archivo.
# OJO: PowerShell no distingue mayusculas en los nombres de variable, asi que
# $O_ACC y $o_acc serian la MISMA. Por eso las minusculas llevan sufijo Min.
$O_ACC = [char]0x00D3
$aMin = [char]0x00E1; $iMin = [char]0x00ED; $uMin = [char]0x00FA
$PUNTO = [char]0x00B7

if (-not (Test-Path $Salida)) { New-Item -ItemType Directory -Path $Salida | Out-Null }
if (-not (Test-Path $Lista))  { Write-Error "No encuentro $Lista"; exit 1 }

$nombres = Get-Content $Lista -Encoding UTF8 |
           ForEach-Object { $_.Trim() } |
           Where-Object { $_ -ne '' -and -not $_.StartsWith('#') }

if ($nombres.Count -eq 0) { Write-Error "nombres.txt esta vacio"; exit 1 }

function Fuente($tam, $estilo) {
  New-Object System.Drawing.Font("Arial", ($tam * $S), $estilo, [System.Drawing.GraphicsUnit]::Pixel)
}

# Mide el ancho de un texto con tracking, sin dibujarlo
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

# Dibuja letra a letra para conseguir el tracking ancho de la marca
function Escribir($g, $texto, $fuente, $color, $x, $y, $tracking) {
  $b = New-Object System.Drawing.SolidBrush($color)
  $fmt = [System.Drawing.StringFormat]::GenericTypographic
  $cursor = [float]$x
  foreach ($ch in $texto.ToCharArray()) {
    $s = [string]$ch
    $g.DrawString($s, $fuente, $b, $cursor, [float]$y, $fmt)
    $a = $g.MeasureString($s, $fuente, 0, $fmt).Width
    if ($s -eq ' ') { $a = $fuente.Size * 0.30 }
    $cursor += $a + $tracking
  }
  $b.Dispose()
}

# y y tracking se dan en la reticula base; aqui se escalan
function Centrado($g, $texto, $fuente, $color, $yBase, $trackBase) {
  $tr = $trackBase * $S
  $ancho = Medir $g $texto $fuente $tr
  Escribir $g $texto $fuente $color (($W - $ancho) / 2) ($yBase * $S) $tr
}

# Quita tildes y espacios para el nombre del archivo
function NombreArchivo($texto) {
  $d = $texto.Normalize([Text.NormalizationForm]::FormD)
  $sb = New-Object Text.StringBuilder
  foreach ($c in $d.ToCharArray()) {
    if ([Globalization.CharUnicodeInfo]::GetUnicodeCategory($c) -ne
        [Globalization.UnicodeCategory]::NonSpacingMark) { [void]$sb.Append($c) }
  }
  return ($sb.ToString() -replace '[^A-Za-z0-9]+', '-').Trim('-').ToLower()
}

foreach ($nombre in $nombres) {

  $bmp = New-Object System.Drawing.Bitmap($W, $H)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint  = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear($negro)

  # --- Marco fino, como una tarjeta -----------------------------------
  # Sin foto a proposito: el protagonista de la invitacion es quien la recibe.
  $penMarco = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(45,245,245,245), (2 * $S))
  $g.DrawRectangle($penMarco, (46 * $S), (46 * $S), (($BASE_W - 92) * $S), (($BASE_H - 92) * $S))

  $fEyebrow = Fuente 21 ([System.Drawing.FontStyle]::Regular)
  $fMarca   = Fuente 62 ([System.Drawing.FontStyle]::Bold)
  $fEdicion = Fuente 24 ([System.Drawing.FontStyle]::Regular)
  $fTitular = Fuente 40 ([System.Drawing.FontStyle]::Regular)
  $fCuerpo  = Fuente 25 ([System.Drawing.FontStyle]::Regular)
  $fDato    = Fuente 23 ([System.Drawing.FontStyle]::Bold)
  $fSello   = Fuente 19 ([System.Drawing.FontStyle]::Bold)

  # El nombre manda: se encoge solo si es largo, para que nunca se corte
  $tam = 78
  do {
    $fNombre = Fuente $tam ([System.Drawing.FontStyle]::Bold)
    $anchoNombre = Medir $g $nombre.ToUpper() $fNombre (6 * $S)
    if ($anchoNombre -gt (($BASE_W - 150) * $S)) { $fNombre.Dispose(); $tam -= 3 }
  } while ($anchoNombre -gt (($BASE_W - 150) * $S) -and $tam -gt 26)

  Centrado $g "INVITACI${O_ACC}N PERSONAL" $fEyebrow $tenue 130 10
  Centrado $g "MASTERMIND KILLER"          $fMarca   $blanco 225 6
  Centrado $g "PRIMERA EDICI${O_ACC}N"     $fEdicion $titanio 320 11

  $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(70,245,245,245), (1 * $S))
  $g.DrawLine($pen, (380 * $S), (400 * $S), (($BASE_W - 380) * $S), (400 * $S))

  Centrado $g "QUEDASTE DENTRO" $fTitular $blanco 470 12
  Centrado $g $nombre.ToUpper() $fNombre  $blanco 580 6

  Centrado $g "Postularon muchos. Hay diez puestos."  $fCuerpo $titanio 730 1
  Centrado $g "Uno de esos puestos es tuyo."          $fCuerpo $titanio 774 1

  Centrado $g "Un d${iMin}a para armar el negocio que" $fCuerpo $titanio 856 1
  Centrado $g "tu conocimiento ya se merece."          $fCuerpo $titanio 900 1

  # Sello: dice que tiene UN puesto de los diez, no que sea "el numero 1"
  $sello = "UNO DE LOS 10 PUESTOS"
  $anchoSello = Medir $g $sello $fSello (8 * $S)
  $x0 = ($W - $anchoSello) / 2
  $penSello = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(90,245,245,245), (1 * $S))
  $g.DrawRectangle($penSello, ($x0 - (34 * $S)), (990 * $S), ($anchoSello + (68 * $S)), (58 * $S))
  Centrado $g $sello $fSello $blanco 1008 8

  $g.DrawLine($pen, (380 * $S), (1120 * $S), (($BASE_W - 380) * $S), (1120 * $S))

  Centrado $g "$LUGAR  ${PUNTO}  $FECHA" $fDato $blanco 1178 6
  Centrado $g "$HORA  ${PUNTO}  5 HORAS  ${PUNTO}  MESA REDONDA" $fDato $titanio 1222 6

  $archivo = Join-Path $Salida ("invitacion-" + (NombreArchivo $nombre) + ".png")
  $bmp.Save($archivo, [System.Drawing.Imaging.ImageFormat]::Png)

  $g.Dispose(); $bmp.Dispose()
  "  {0,-30} {1} KB" -f $nombre, [Math]::Round((Get-Item $archivo).Length / 1KB, 0)
}

""
"$($nombres.Count) invitaciones de ${W}x${H}px en: $Salida"
