$api = "http://localhost:4000/api"
Write-Host ""
Write-Host "FLUJO 1: Visitante sin login puede ver animales" -ForegroundColor Cyan

try {
    $r = Invoke-RestMethod -Uri ($api + "/animals") -Method GET
    Write-Host "OK GET /animals sin token. Total: " + $r.meta.total -ForegroundColor Green
} catch {
    Write-Host "FAIL GET /animals sin token" -ForegroundColor Red
}

Write-Host ""
Write-Host "FLUJO 2: Registro de rescatista" -ForegroundColor Cyan

$ts = [System.DateTime]::Now.Ticks
$rEmail = "rescuer" + ($ts % 99999) + "@test.com"
$rPass = "Rescuer123"
$rToken = $null

$rescuerBody = [PSCustomObject]@{
    name = "Rescatista Test"
    email = $rEmail
    password = $rPass
    city = "Bogota"
    organizationName = "Patitas Felices"
}

try {
    $null = Invoke-RestMethod -Uri ($api + "/auth/register/rescuer") -Method POST -ContentType "application/json" -Body ($rescuerBody | ConvertTo-Json)
    Write-Host "OK POST /auth/register/rescuer email=$rEmail" -ForegroundColor Green
} catch {
    Write-Host "FAIL POST /auth/register/rescuer" -ForegroundColor Red
}

Write-Host ""
Write-Host "FLUJO 3: Login rescatista" -ForegroundColor Cyan

$loginBody = [PSCustomObject]@{ email = $rEmail; password = $rPass }
try {
    $loginRes = Invoke-RestMethod -Uri ($api + "/auth/login") -Method POST -ContentType "application/json" -Body ($loginBody | ConvertTo-Json)
    Write-Host "OK POST /auth/login role=$($loginRes.user.role)" -ForegroundColor Green
    $rToken = $loginRes.accessToken
} catch {
    Write-Host "FAIL POST /auth/login" -ForegroundColor Red
}

if ($rToken) {
    $rH = @{ Authorization = "Bearer " + $rToken }
    try {
        $profile = Invoke-RestMethod -Uri ($api + "/rescuers/me") -Method GET -Headers $rH
        Write-Host "OK GET /rescuers/me status=$($profile.status)" -ForegroundColor Green
    } catch {
        Write-Host "FAIL GET /rescuers/me" -ForegroundColor Red
    }
    
    $animalBody = [PSCustomObject]@{
        name = "TestDog"; species = "PERRO"; size = "MEDIANO"
        gender = "MACHO"; city = "Bogota"
        description = "Perro de prueba muy amigable y listo para hogar"
        vaccinated = $false; sterilized = $false
    }
    try {
        $null = Invoke-RestMethod -Uri ($api + "/animals") -Method POST -ContentType "application/json" -Body ($animalBody | ConvertTo-Json) -Headers $rH
        Write-Host "FAIL POST /animals con PENDING deberia ser 403" -ForegroundColor Red
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        if ($code -eq 403) {
            Write-Host "OK POST /animals bloqueado para PENDING (403)" -ForegroundColor Green
        } else {
            Write-Host "FAIL POST /animals devolvio HTTP $code esperaba 403" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "FLUJO 4: Registro y login de adoptante" -ForegroundColor Cyan

$ts2 = [System.DateTime]::Now.Ticks
$aEmail = "adopter" + ($ts2 % 99999) + "@test.com"
$aToken = $null

$adoptBody = [PSCustomObject]@{ name = "Juan Adoptante"; email = $aEmail; password = "Adopt1234" }
try {
    $regRes = Invoke-RestMethod -Uri ($api + "/auth/register") -Method POST -ContentType "application/json" -Body ($adoptBody | ConvertTo-Json)
    Write-Host "OK POST /auth/register role=$($regRes.user.role)" -ForegroundColor Green
    $aToken = $regRes.accessToken
} catch {
    Write-Host "FAIL POST /auth/register" -ForegroundColor Red
}

if ($aToken) {
    $aH = @{ Authorization = "Bearer " + $aToken }
    try {
        $me = Invoke-RestMethod -Uri ($api + "/users/me") -Method GET -Headers $aH
        Write-Host "OK GET /users/me email=$($me.email)" -ForegroundColor Green
    } catch {
        Write-Host "FAIL GET /users/me" -ForegroundColor Red
    }
    try {
        $myReqs = Invoke-RestMethod -Uri ($api + "/adoption-requests/my") -Method GET -Headers $aH
        Write-Host "OK GET /adoption-requests/my count=$($myReqs.Count)" -ForegroundColor Green
    } catch {
        Write-Host "FAIL GET /adoption-requests/my" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "FLUJO 5: Rutas protegidas sin token deben devolver 401" -ForegroundColor Cyan

foreach ($url in @($api + "/users/me", $api + "/adoption-requests/my", $api + "/rescuers/me")) {
    try {
        $null = Invoke-RestMethod -Uri $url -Method GET
        Write-Host "FAIL $url no bloqueo sin token" -ForegroundColor Red
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        if ($code -eq 401) {
            Write-Host "OK $url devuelve 401 sin token" -ForegroundColor Green
        } else {
            Write-Host "FAIL $url HTTP $code esperaba 401" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "Tests completados." -ForegroundColor Cyan
