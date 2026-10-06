Add-Type -AssemblyName System.IO.Compression.FileSystem

function Fast-Inspect-VentaCosto() {
    Write-Host "=========================================="
    Write-Host "INSPECCION EXACTA DE COLUMNAS EN LIBRO VENTA COSTO"
    Write-Host "=========================================="
    
    $zip = [System.IO.Compression.ZipFile]::OpenRead("C:\Users\franc\Downloads\LibroVentaCosto.xlsx")
    
    # Shared strings
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
    
    # Sheet1 via XmlReader (streaming)
    $s1Entry = $zip.Entries | Where-Object { $_.FullName -eq "xl/worksheets/sheet1.xml" }
    $reader = [System.Xml.XmlReader]::Create($s1Entry.Open())
    
    $headers = @{}
    $sampleRows = @()
    $rowCount = 0
    $colSet = New-Object System.Collections.Generic.HashSet[string]
    
    $currentRowNum = ""
    $currentRowCells = @{}
    $currentCellRef = ""
    $currentCellType = ""
    
    while ($reader.Read()) {
        if ($reader.NodeType -eq [System.Xml.XmlNodeType]::Element) {
            if ($reader.LocalName -eq "row") {
                $currentRowNum = $reader.GetAttribute("r")
                $currentRowCells = @{}
                $rowCount++
            }
            elseif ($reader.LocalName -eq "c") {
                $currentCellRef = $reader.GetAttribute("r")
                $currentCellType = $reader.GetAttribute("t")
                $colLetter = $currentCellRef -replace '\d+',''
                [void]$colSet.Add($colLetter)
            }
            elseif ($reader.LocalName -eq "v") {
                $val = $reader.ReadElementContentAsString()
                if ($currentCellType -eq "s") {
                    $idx = [int]$val
                    if ($idx -lt $ss.Count) { $val = $ss[$idx] }
                }
                $currentRowCells[$currentCellRef] = $val
            }
        }
        elseif ($reader.NodeType -eq [System.Xml.XmlNodeType]::EndElement -and $reader.LocalName -eq "row") {
            if ($currentRowNum -eq "1") {
                $headers = $currentRowCells
            } elseif ([int]$currentRowNum -le 5) {
                $sampleRows += [PSCustomObject]@{ Row = $currentRowNum; Cells = $currentRowCells }
            }
        }
    }
    $reader.Close()
    $zip.Dispose()
    
    Write-Host "Total Filas: $rowCount"
    Write-Host "Columnas detectadas: $(($colSet | Sort-Object) -join ', ')"
    Write-Host "`nEncabezados encontrados en Fila 1:"
    $headers.GetEnumerator() | Sort-Object Key | ForEach-Object {
        Write-Host "  $($_.Key): $($_.Value)"
    }
    
    Write-Host "`nFilas 2 a 5 completas:"
    foreach ($sr in $sampleRows) {
        Write-Host "Fila $($sr.Row):"
        $sr.Cells.GetEnumerator() | Sort-Object Key | ForEach-Object {
            Write-Host "   $($_.Key): $($_.Value)"
        }
    }
}

Fast-Inspect-VentaCosto
