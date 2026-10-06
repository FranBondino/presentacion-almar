Add-Type -AssemblyName System.IO.Compression.FileSystem

function Inspect-All-Columns($filePath) {
    Write-Host "=========================================="
    Write-Host "ANALIZANDO DETALLADO: $filePath"
    Write-Host "=========================================="
    
    $zip = [System.IO.Compression.ZipFile]::OpenRead($filePath)
    
    # Shared Strings
    $ssEntry = $zip.Entries | Where-Object { $_.FullName -eq "xl/sharedStrings.xml" }
    $sharedStrings = New-Object System.Collections.Generic.List[string]
    if ($ssEntry) {
        $stream = $ssEntry.Open()
        $reader = New-Object System.IO.StreamReader($stream)
        $xmlContent = $reader.ReadToEnd()
        $reader.Close()
        $stream.Close()
        
        [xml]$ssXml = $xmlContent
        foreach ($si in $ssXml.sst.si) {
            $val = if ($si.t) { $si.t } elseif ($si.r) { ($si.r | ForEach-Object { $_.t }) -join "" } else { "" }
            $sharedStrings.Add($val)
        }
    }
    
    # Sheet1
    $s1Entry = $zip.Entries | Where-Object { $_.FullName -eq "xl/worksheets/sheet1.xml" }
    if ($s1Entry) {
        $stream = $s1Entry.Open()
        $reader = New-Object System.IO.StreamReader($stream)
        $xmlContent = $reader.ReadToEnd()
        $reader.Close()
        $stream.Close()
        
        [xml]$sXml = $xmlContent
        
        Write-Host "--- ENCABEZADOS (Fila 1) ---"
        $r1 = $sXml.worksheet.sheetData.row | Where-Object { $_.r -eq "1" }
        if ($r1) {
            foreach ($c in $r1.c) {
                $val = $c.v
                if ($c.t -eq "s" -and [int]$val -lt $sharedStrings.Count) { $val = $sharedStrings[[int]$val] }
                Write-Host "Col $($c.r): $val"
            }
        }
        
        Write-Host ""
        Write-Host "--- MUESTRA DE FILAS DE DATOS (Filas 2 a 5) ---"
        $rows = $sXml.worksheet.sheetData.row | Where-Object { [int]$_.r -ge 2 -and [int]$_.r -le 5 }
        foreach ($r in $rows) {
            Write-Host ">>> FILA $($r.r):"
            foreach ($c in $r.c) {
                $val = $c.v
                if ($c.t -eq "s" -and $val -ne $null -and [int]$val -lt $sharedStrings.Count) { $val = $sharedStrings[[int]$val] }
                Write-Host "   $($c.r): $val"
            }
        }
    }

    $zip.Dispose()
    Write-Host ""
}

Inspect-All-Columns "C:\Users\franc\Downloads\LibroVentaCosto.xlsx"
Inspect-All-Columns "C:\Users\franc\Downloads\LibroMayor_en moneda local.xlsx"
Inspect-All-Columns "C:\Users\franc\Downloads\LibroMayor_segunda moneda.xlsx"
