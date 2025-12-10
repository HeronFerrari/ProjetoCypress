$results = @()

for ($i = 1; $i -le 5; $i++) {
    Write-Host "======= RUN $i =======" -ForegroundColor Green
    $output = npx cypress run --spec "cypress/e2e/carrinho.cy.js" --headless 2>&1
    
    # Procura por "passing" e "failing" na saída
    $passMatch = $output | Select-String "(\d+) passing"
    $failMatch = $output | Select-String "(\d+) failing"
    
    if ($passMatch) {
        $pass = $passMatch.Matches[0].Groups[1].Value
        $fail = if ($failMatch) { $failMatch.Matches[0].Groups[1].Value } else { "0" }
        
        Write-Host "RESULT: $pass passing, $fail failing" -ForegroundColor Yellow
        $results += "RUN $i : $pass passing, $fail failing"
    } else {
        Write-Host "Could not parse result" -ForegroundColor Red
        $results += "RUN $i : ERROR"
    }
    Write-Host ""
}

Write-Host "`n========== SUMMARY ==========" -ForegroundColor Cyan
$results | ForEach-Object { Write-Host $_ }
