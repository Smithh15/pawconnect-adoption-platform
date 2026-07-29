$routes = @('/', '/login', '/register', '/register/rescuer', '/animals')
foreach ($r in $routes) {
    try {
        $res = Invoke-WebRequest -Uri "http://localhost:3000$r" -UseBasicParsing -TimeoutSec 10
        Write-Host "$($res.StatusCode)  http://localhost:3000$r"
    } catch {
        Write-Host "ERR  http://localhost:3000$r  $($_.Exception.Message)"
    }
}
Write-Host "`nDone."
