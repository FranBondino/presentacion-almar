Add-Type -AssemblyName System.IO.Compression.FileSystem

function Deep-Analyze-VentaCosto() {
    Write-Host "=== ANALIZANDO LIBRO DE VENTA COSTO EN DETALLE ==="
    $zip = [System.IO.Compression.ZipFile]::OpenRead("C:\Users\franc\Downloads\LibroVentaCosto.xlsx")
    
    # Shared strings
    $ssEntry = $zip.Entries | Where-Object { $_.FullName -eq "xl/sharedStrings.xml" }
    $ss = New-Object System.Collections.Generic.List[string]
    if ($ssEntry) {
        $reader = New-Object System.IO.StreamReader($ssEntry.Open())
        [xml]$ssXml = $reader.ReadToEnd()
        $reader.Close()
        foreach ($si in $ssXml.sst.si) {
            $val = if ($si.t) { $si.t } elseif ($si.r) { ($si.r | ForEach-Object { $_.t }) -join "" } else { "" }
            $ss.Add($val)
        }
    }
    
    $s1Entry = $zip.Entries | Where-Object { $_.FullName -eq "xl/worksheets/sheet1.xml" }
    $reader = New-Object System.IO.StreamReader($s1Entry.Open())
    [xml]$sXml = $reader.ReadToEnd()
    $reader.Close()
    
    # Ver todas las columnas encontradas en el archivo
    $allColLetters = New-Object System.Collections.Generic.HashSet[string]
    foreach ($r in $sXml.worksheet.sheetData.row) {
        foreach ($c in $r.c) {
            $colLetter = $c.r -replace '\d+',''
            [void]$allColLetters.Add($colLetter)
        }
    }
    Write-Host "Columnas encontradas en el archivo: $(($allColLetters | Sort-Object) -join ', ')"
    
    # Ver Fila 1 completa
    $r1 = $sXml.worksheet.sheetData.row | Where-Object { $_.r -eq "1" }
    Write-Host "Encabezados Fila 1:"
    foreach ($c in $r1.c) {
        $val = $c.v
        if ($c.t -eq "s") { $val = $ss[[int]$val] }
        Write-Host "  Col $($c.r): $val"
    }

    # Analizar formatos de Carpetas
    $carpetas = @{}
    $tiposOperacion = @{}
    $totalRows = $sXml.worksheet.sheetData.row.Count
    Write-Host "Total filas de datos: $totalRows"
    
    foreach ($r in $sXml.worksheet.sheetData.row) {
        if ($r.r -eq "1") { continue }
        $carpetaCell = $r.c | Where-Object { $_.r -like "O*" }
        if ($carpetaCell) {
            $cVal = $carpetaCell.v
            if ($carpetaCell.t -eq "s") { $cVal = $ss[[int]$cVal] }
            if ($cVal) {
                # Extraer codigo (ej: IA, IM, EA, EM, etc.)
                if ($cVal -match "C-\d{6}([A-Za-z]{2})-") {
                    $pref = $matches[1]
                    $tiposOperacion[$pref] = [int]$tiposOperacion[$pref] + 1
                } else {
                    $tiposOperacion["OTRO: $cVal"] = [int]$tiposOperacion["OTRO: $cVal"] + 1
                }
            }
        }
    }
    
    Write-Host "`nDistribucion de Codigos de Operacion en Carpetas (LibroVentaCosto):"
    $tiposOperacion.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object {
        Write-Host "  $($_.Key): $($_.Value) comprobantes"
    }

    $zip.Dispose()
}

function Deep-Analyze-LibroMayor($file) {
    Write-Host "`n=== ANALIZANDO $file ==="
    $zip = [System.IO.Compression.ZipFile]::OpenRead($file)
    
    # Shared strings
    $ssEntry = $zip.Entries | Where-Object { $_.FullName -eq "xl/sharedStrings.xml" }
    $ss = New-Object System.Collections.Generic.List[string]
    if ($ssEntry) {
        $reader = New-Object System.IO.StreamReader($ssEntry.Open())
        [xml]$ssXml = $reader.ReadToEnd()
        $reader.Close()
        foreach ($si in $ssXml.sst.si) {
            $val = if ($si.t) { $si.t } elseif ($si.r) { ($si.r | ForEach-Object { $_.t }) -join "" } else { "" }
            $ss.Add($val)
        }
    }
    
    $s1Entry = $zip.Entries | Where-Object { $_.FullName -eq "xl/worksheets/sheet1.xml" }
    $reader = New-Object System.IO.StreamReader($s1Entry.Open())
    [xml]$sXml = $reader.ReadToEnd()
    $reader.Close()
    
    Write-Host "Total filas: $($sXml.worksheet.sheetData.row.Count)"
    
    # Ver Cuentas de Costos (Cuentas que empiezan con 4 o 5 o 'COSTO' o 'GASTO')
    $cuentasCostos = @{}
    $categoriasEmbarque = @{}
    
    foreach ($r in $sXml.worksheet.sheetData.row) {
        if ($r.r -eq "1") { continue }
        $cuentaCell = $r.c | Where-Object { $_.r -like "G*" } # Cuenta Contable
        $nomCuentaCell = $r.c | Where-Object { $_.r -like "H*" } # Nombre Cuenta
        $debeCell = $r.c | Where-Object { $_.r -like "M*" }
        $haberCell = $r.c | Where-Object { $_.r -like "N*" }
        $catEmbCell = $r.c | Where-Object { $_.r -like "AB*" } # Categoria Embarque
        
        $nomCuenta = ""
        if ($nomCuentaCell) {
            $nomCuenta = $nomCuentaCell.v
            if ($nomCuentaCell.t -eq "s") { $nomCuenta = $ss[[int]$nomCuenta] }
        }
        $cta = ""
        if ($cuentaCell) {
            $cta = $cuentaCell.v
            if ($cuentaCell.t -eq "s") { $cta = $ss[[int]$cta] }
        }
        
        if ($cta -like "5*" -or $nomCuenta -like "*COSTO*" -or $nomCuenta -like "*GASTO*" -or $nomCuenta -like "*FLETE*") {
            $key = "$cta - $nomCuenta"
            $cuentasCostos[$key] = [int]$cuentasCostos[$key] + 1
        }
        
        if ($catEmbCell) {
            $cat = $catEmbCell.v
            if ($catEmbCell.t -eq "s") { $cat = $ss[[int]$cat] }
            if ($cat) {
                $categoriasEmbarque[$cat] = [int]$categoriasEmbarque[$cat] + 1
            }
        }
    }
    
    Write-Host "`nCategorias de Embarque encontradas en Libro Mayor:"
    $categoriasEmbarque.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object {
        Write-Host "  $($_.Key): $($_.Value) movimientos"
    }

    Write-Host "`nCuentas de Costos/Gastos detectadas (Muestra de 15):"
    $cuentasCostos.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 15 | ForEach-Object {
        Write-Host "  $($_.Key): $($_.Value) movimientos"
    }

    $zip.Dispose()
}

Deep-Analyze-VentaCosto
Deep-Analyze-LibroMayor "C:\Users\franc\Downloads\LibroMayor_en moneda local.xlsx"
