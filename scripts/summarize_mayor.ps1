Add-Type -AssemblyName System.IO.Compression.FileSystem

function Summarize-Mayor($filePath, $label) {
    Write-Host "=========================================="
    Write-Host "RESUMEN DE MAYOR: $label"
    Write-Host "=========================================="
    
    $zip = [System.IO.Compression.ZipFile]::OpenRead($filePath)
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
    
    $cuentasMap = @{}
    $padresMap = @{}
    $modosMap = @{}
    $totalDebe = 0.0
    $totalHaber = 0.0
    
    $curRow = ""
    $curCta = ""
    $curNomCta = ""
    $curPadre = ""
    $curDebe = 0.0
    $curHaber = 0.0
    $curModo = ""
    
    $curCellRef = ""
    $curCellType = ""
    
    while ($reader.Read()) {
        if ($reader.NodeType -eq [System.Xml.XmlNodeType]::Element) {
            if ($reader.LocalName -eq "row") {
                $curRow = $reader.GetAttribute("r")
                $curCta = ""
                $curNomCta = ""
                $curPadre = ""
                $curDebe = 0.0
                $curHaber = 0.0
                $curModo = ""
            }
            elseif ($reader.LocalName -eq "c") {
                $curCellRef = $reader.GetAttribute("r")
                $curCellType = $reader.GetAttribute("t")
            }
            elseif ($reader.LocalName -eq "v") {
                $val = $reader.ReadElementContentAsString()
                if ($curCellType -eq "s") {
                    $idx = [int]$val
                    if ($idx -lt $ss.Count) { $val = $ss[$idx] }
                }
                
                $col = $curCellRef -replace '\d+',''
                switch ($col) {
                    "G" { $curCta = $val } # Cuenta
                    "H" { $curNomCta = $val } # Nombre Cuenta
                    "J" { $curPadre = $val } # Cuenta Padre
                    "M" { [double]::TryParse($val, [ref]$curDebe) | Out-Null } # Debe
                    "N" { [double]::TryParse($val, [ref]$curHaber) | Out-Null } # Haber
                    "AB" { $curModo = $val } # Categoria Embarque
                }
            }
        }
        elseif ($reader.NodeType -eq [System.Xml.XmlNodeType]::EndElement -and $reader.LocalName -eq "row") {
            if ($curRow -ne "1" -and $curCta) {
                $totalDebe += $curDebe
                $totalHaber += $curHaber
                
                # Agrupar por Padre
                if (-not $padresMap.ContainsKey($curPadre)) {
                    $padresMap[$curPadre] = @{ Debe = 0.0; Haber = 0.0; Count = 0 }
                }
                $padresMap[$curPadre].Debe += $curDebe
                $padresMap[$curPadre].Haber += $curHaber
                $padresMap[$curPadre].Count++
                
                # Agrupar por Modo
                if ($curModo) {
                    if (-not $modosMap.ContainsKey($curModo)) {
                        $modosMap[$curModo] = @{ Debe = 0.0; Haber = 0.0; Count = 0 }
                    }
                    $modosMap[$curModo].Debe += $curDebe
                    $modosMap[$curModo].Haber += $curHaber
                    $modosMap[$curModo].Count++
                }
            }
        }
    }
    $reader.Close()
    $zip.Dispose()
    
    Write-Host "TOTALES GENERALES:"
    Write-Host "  Total Debe:  $('{0:N2}' -f $totalDebe)"
    Write-Host "  Total Haber: $('{0:N2}' -f $totalHaber)"
    
    Write-Host "`nAGRUPADO POR CUENTA PADRE (Muestra):"
    $padresMap.GetEnumerator() | Sort-Object { $_.Value.Debe + $_.Value.Haber } -Descending | Select-Object -First 12 | ForEach-Object {
        $saldo = $_.Value.Debe - $_.Value.Haber
        Write-Host "  $($_.Key): Debe=$('{0:N2}' -f $_.Value.Debe) | Haber=$('{0:N2}' -f $_.Value.Haber) | Saldo=$('{0:N2}' -f $saldo) | Regs=$($_.Value.Count)"
    }
    
    Write-Host "`nAGRUPADO POR CATEGORIA EMBARQUE (Columna AB):"
    $modosMap.GetEnumerator() | Sort-Object { $_.Value.Count } -Descending | ForEach-Object {
        Write-Host "  $($_.Key): Regs=$($_.Value.Count) | Debe=$('{0:N2}' -f $_.Value.Debe) | Haber=$('{0:N2}' -f $_.Value.Haber)"
    }
    Write-Host ""
}

Summarize-Mayor "C:\Users\franc\Downloads\LibroMayor_en_moneda_local_REPARADO.xlsx" "MONEDA LOCAL (ARS)"
Summarize-Mayor "C:\Users\franc\Downloads\LibroMayor_segunda_moneda_REPARADO.xlsx" "SEGUNDA MONEDA (USD)"
