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

$carpetasMayor = @{}
$curRow = ""
$curZ = ""
$curCellRef = ""
$curCellType = ""

while ($reader.Read()) {
    if ($reader.NodeType -eq [System.Xml.XmlNodeType]::Element) {
        if ($reader.LocalName -eq "row") {
            $curRow = $reader.GetAttribute("r")
            $curZ = ""
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
            if ($col -eq "Z") { $curZ = $val }
        }
    }
    elseif ($reader.NodeType -eq [System.Xml.XmlNodeType]::EndElement -and $reader.LocalName -eq "row") {
        if ($curRow -ne "1" -and $curZ) {
            if ($curZ -match "C-\d{6}([A-Za-z]{2})-") {
                $pref = $matches[1]
                $carpetasMayor[$pref] = [int]$carpetasMayor[$pref] + 1
            } else {
                $carpetasMayor["OTRO: $curZ"] = [int]$carpetasMayor["OTRO: $curZ"] + 1
            }
        }
    }
}
$reader.Close()
$zip.Dispose()

Write-Host "Distribucion de Carpetas en Libro Mayor (Columna Z):"
$carpetasMayor.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 20 | ForEach-Object {
    Write-Host "  $($_.Key): $($_.Value) movimientos"
}
