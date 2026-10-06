Add-Type -AssemblyName System.IO.Compression.FileSystem
$docx = (Get-ChildItem -Path "C:\Users\franc\Downloads" -Filter "*2026_10_05*.docx")[0].FullName
Write-Host "Reading file: $docx"

$zip = [System.IO.Compression.ZipFile]::OpenRead($docx)
$entry = $zip.GetEntry("word/document.xml")
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$xmlText = $reader.ReadToEnd()
$reader.Close()
$stream.Close()
$zip.Dispose()

[xml]$xml = $xmlText
$ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
$ns.AddNamespace("w", "http://schemas.openxmlformats.org/wordprocessingml/2006/main")

$paragraphs = $xml.SelectNodes("//w:p", $ns)
$output = @()
foreach ($p in $paragraphs) {
    $texts = $p.SelectNodes(".//w:t", $ns)
    $line = ""
    foreach ($t in $texts) {
        $line += $t.InnerText
    }
    if ($line.Trim().Length -gt 0) {
        $output += $line
    }
}

$output | Out-File -FilePath "scripts/docx_output.txt" -Encoding utf8
Write-Host "Extraction complete. Total paragraphs: $($output.Count)"
