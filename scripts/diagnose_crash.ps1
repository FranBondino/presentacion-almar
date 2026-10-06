Add-Type -AssemblyName System.IO.Compression.FileSystem

function Diagnose-ExcelCrash($file) {
    Write-Host "=========================================="
    Write-Host "DIAGNOSTICANDO CRASH EN: $file"
    Write-Host "=========================================="
    
    $zip = [System.IO.Compression.ZipFile]::OpenRead($file)
    
    Write-Host "1. Verificando tamano y estructura de entradas..."
    foreach ($entry in $zip.Entries) {
        Write-Host "  Entry: $($entry.FullName) ($($entry.Length) bytes decompressed)"
    }
    
    # Check sheet1.xml for unusual elements, xmlns issues, or corrupt attributes
    $s1 = $zip.Entries | Where-Object { $_.FullName -eq "xl/worksheets/sheet1.xml" }
    $reader = [System.Xml.XmlReader]::Create($s1.Open())
    
    $dimension = ""
    $sheetFormatPr = ""
    $cols = 0
    $rows = 0
    $nullCellCount = 0
    $corruptTypes = 0
    
    while ($reader.Read()) {
        if ($reader.NodeType -eq [System.Xml.XmlNodeType]::Element) {
            if ($reader.LocalName -eq "dimension") {
                $dimension = $reader.GetAttribute("ref")
            }
            if ($reader.LocalName -eq "sheetFormatPr") {
                $sheetFormatPr = $reader.GetAttribute("defaultRowHeight")
            }
            if ($reader.LocalName -eq "row") {
                $rows++
            }
            if ($reader.LocalName -eq "c") {
                $t = $reader.GetAttribute("t")
                if ($t -eq "e" -or $t -eq "str") {
                    $corruptTypes++
                }
            }
        }
    }
    $reader.Close()
    
    Write-Host "Dimension ref: $dimension"
    Write-Host "Total rows: $rows"
    Write-Host "Cells with error/str type: $corruptTypes"
    
    # Check styles.xml
    $stylesEntry = $zip.Entries | Where-Object { $_.FullName -eq "xl/styles.xml" }
    if ($stylesEntry) {
        Write-Host "Styles.xml presente ($($stylesEntry.Length) bytes)"
        $sr = New-Object System.IO.StreamReader($stylesEntry.Open())
        $stylesTxt = $sr.ReadToEnd()
        $sr.Close()
        Write-Host "Styles snippet: $($stylesTxt.Substring(0, [Math]::Min(300, $stylesTxt.Length)))"
    } else {
        Write-Host "ALERTA: No existe styles.xml!"
    }

    # Check xl/_rels/workbook.xml.rels
    $relsEntry = $zip.Entries | Where-Object { $_.FullName -eq "xl/_rels/workbook.xml.rels" }
    if ($relsEntry) {
        $sr = New-Object System.IO.StreamReader($relsEntry.Open())
        $relsTxt = $sr.ReadToEnd()
        $sr.Close()
        Write-Host "Workbook rels: $relsTxt"
    }
    
    $zip.Dispose()
    Write-Host ""
}

Diagnose-ExcelCrash "C:\Users\franc\Downloads\LibroMayor_en moneda local.xlsx"
