try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    Write-Host "Excel COM Object creado con exito. Version: $($excel.Version)"
    
    $wb = $excel.Workbooks.Open("C:\Users\franc\Downloads\LibroMayor_en moneda local.xlsx")
    Write-Host "Libro abierto exitosamente en Excel. Sheets count: $($wb.Sheets.Count)"
    
    $ws = $wb.Sheets.Item(1)
    Write-Host "Sheet name: $($ws.Name), UsedRange rows: $($ws.UsedRange.Rows.Count), cols: $($ws.UsedRange.Columns.Count)"
    
    # Intentar hacer una modificación pequeña (ej: escribir en una celda y guardar)
    $ws.Cells.Item(1, 1).Value2 = "Fecha Contable"
    
    Write-Host "Guardando copia reparada..."
    $outputPath = "C:\Users\franc\Downloads\LibroMayor_en_moneda_local_REPARADO.xlsx"
    $wb.SaveAs($outputPath)
    $wb.Close($false)
    $excel.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
    Write-Host "Archivo reparado y guardado con éxito en: $outputPath"
} catch {
    Write-Host "Error durante prueba de Excel COM: $($_.Exception.Message)"
    Write-Host $_.Exception.ToString()
}
