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

$found = 0
$curRowCells = @{}
$curRowNum = ""
$curCellRef = ""
$curCellType = ""

while ($reader.Read() -and $found -lt 5) {
    if ($reader.NodeType -eq [System.Xml.XmlNodeType]::Element) {
        if ($reader.LocalName -eq "row") {
            $curRowNum = $reader.GetAttribute("r")
            $curRowCells = @{}
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
            $curRowCells[$curCellRef] = $val
        }
    }
    elseif ($reader.NodeType -eq [System.Xml.XmlNodeType]::EndElement -and $reader.LocalName -eq "row") {
        # Buscar filas de costos o ingresos operativos (cuentas 4 o 5)
        $cta = ""
        $nomCta = ""
        foreach ($k in $curRowCells.Keys) {
            if ($k -like "G*") { $cta = $curRowCells[$k] }
            if ($k -like "H*") { $nomCta = $curRowCells[$k] }
        }
        if ($cta -like "5*" -or $cta -like "4*") {
            $found++
            Write-Host ">>> FILA $curRowNum ($cta - $nomCta):"
            $curRowCells.GetEnumerator() | Sort-Object Key | ForEach-Object {
                Write-Host "   $($_.Key): $($_.Value)"
            }
        }
    }
}
$reader.Close()
$zip.Dispose()
