try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    
    # 1. Reparar Segunda Moneda
    $wb2 = $excel.Workbooks.Open("C:\Users\franc\Downloads\LibroMayor_segunda moneda.xlsx")
    $outputPath2 = "C:\Users\franc\Downloads\LibroMayor_segunda_moneda_REPARADO.xlsx"
    $wb2.SaveAs($outputPath2)
    $wb2.Close($false)
    Write-Host "Segunda moneda guardado en: $outputPath2"
    
    # 2. Reparar LibroVentaCosto
    $wb3 = $excel.Workbooks.Open("C:\Users\franc\Downloads\LibroVentaCosto.xlsx")
    $outputPath3 = "C:\Users\franc\Downloads\LibroVentaCosto_REPARADO.xlsx"
    $wb3.SaveAs($outputPath3)
    $wb3.Close($false)
    Write-Host "LibroVentaCosto guardado en: $outputPath3"
    
    $excel.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
    Write-Host "Proceso completado exitosamente."
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}
