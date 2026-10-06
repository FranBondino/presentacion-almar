Add-Type -AssemblyName System.IO.Compression.FileSystem

$zip = [System.IO.Compression.ZipFile]::OpenRead("C:\Users\franc\Downloads\LibroMayor_en_moneda_local_REPARADO.xlsx")
$ss = New-Object System.Collections.Generic.List[string]
$ssEntry = $zip.Entries | Where-Object { $_.FullName -eq "xl/sharedStrings.xml" }
if ($ssEntry) {
    $reader = [System.Xml.XmlReader]::Create($ssEntry.Open())
    while ($reader.Read()) {
        if ($reader.NodeType -eq [System.Xml.XmlNodeType]::Element -and $reader.LocalName -eq "t") {
            $ss.Add($reader.ReadElementContentAsString())
        }
    }
    $reader.Close()
}

$s1Entry = $zip.Entries | Where-Object { $_.FullName -eq "xl/worksheets/sheet1.xml" }
$reader = [System.Xml.XmlReader]::Create($s1Entry.Open())

$ventasPorCuenta = @{}
$curRow = ""
$curCta = ""
$curNomCta = ""
$curPadre = ""
$curHaber = 0.0
$curImpOrig = 0.0
$curCellRef = ""
$curCellType = ""

while ($reader.Read()) {
    if ($reader.NodeType -eq [System.Xml.XmlNodeType]::Element) {
        if ($reader.LocalName -eq "row") {
            $curRow = $reader.GetAttribute("r")
            $curCta = ""
            $curNomCta = ""
            $curPadre = ""
            $curHaber = 0.0
            $curImpOrig = 0.0
        }
        elseif ($reader.LocalName -eq "c") {
            $curCellRef = $reader.GetAttribute("r")
            $curCellType = $reader.GetAttribute("t")
        }
        elseif ($reader.NodeType -eq [System.Xml.XmlNodeType]::Element -and $reader.LocalName -eq "v") {
            $val = $reader.ReadElementContentAsString()
            if ($curCellType -eq "s") {
                $idx = [int]$val
                if ($idx -lt $ss.Count) { $val = $ss[$idx] }
            }
            $col = $curCellRef -replace '\d+',''
            switch ($col) {
                "G" { $curCta = $val }
                "H" { $curNomCta = $val }
                "J" { $curPadre = $val }
                "N" { [double]::TryParse($val, [ref]$curHaber) | Out-Null }
                "S" { [double]::TryParse($val, [ref]$curImpOrig) | Out-Null }
            }
        }
    }
    elseif ($reader.NodeType -eq [System.Xml.XmlNodeType]::EndElement -and $reader.LocalName -eq "row") {
        if ($curRow -ne "1" -and ($curPadre -like "INGRESOS*" -or $curCta -like "4*")) {
            if (-not $ventasPorCuenta.ContainsKey($curNomCta)) {
                $ventasPorCuenta[$curNomCta] = @{ HaberARS = 0.0; ImpOrig = 0.0; Padre = $curPadre }
            }
            $ventasPorCuenta[$curNomCta].HaberARS += $curHaber
            $ventasPorCuenta[$curNomCta].ImpOrig += $curImpOrig
        }
    }
}
$reader.Close()
$zip.Dispose()

Write-Host "COMPARATIVA DE CUENTAS DE INGRESOS (Haber en Pesos vs Suma de Importe Original):"
$totalHaber = 0.0
$totalImpOrig = 0.0
$ventasPorCuenta.GetEnumerator() | Sort-Object { $_.Value.HaberARS } -Descending | ForEach-Object {
    Write-Host ("  {0,-45} | Haber ARS: {1,15:N2} | Importe Orig: {2,15:N2}" -f $_.Key, $_.Value.HaberARS, $_.Value.ImpOrig)
    $totalHaber += $_.Value.HaberARS
    $totalImpOrig += $_.Value.ImpOrig
}
Write-Host "--------------------------------------------------------------------------------"
Write-Host ("TOTAL INGRESOS OPERATIVOS:                  | Haber ARS: {0,15:N2} | Importe Orig: {1,15:N2}" -f $totalHaber, $totalImpOrig)
