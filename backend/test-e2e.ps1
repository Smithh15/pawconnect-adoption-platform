$api = "http://localhost:4000/api"

Write-Host ""
Write-Host "===== FLUJO E2E PawConnect =====" -ForegroundColor White

# 1. Login admin
Write-Host "[1/7] Login admin" -ForegroundColor Cyan
$lbAdmin = [PSCustomObject]@{ email = "admin@pawconnect.com"; password = "Admin1234" } | ConvertTo-Json
$adminRes = Invoke-RestMethod -Uri ($api + "/auth/login") -Method POST -ContentType "application/json" -Body $lbAdmin
$adminTok = $adminRes.accessToken
$adminHdr = @{ Authorization = "Bearer " + $adminTok }
Write-Host "OK role=" + $adminRes.user.role -ForegroundColor Green

# 2. Registro rescatista
Write-Host "[2/7] Registro rescatista" -ForegroundColor Cyan
$ts = [System.DateTime]::Now.Millisecond.ToString() + (Get-Random -Maximum 999).ToString()
$rMail = "rescuer_" + $ts + "@test.com"
$rPwd  = "Rescuer123"
$rbody = [PSCustomObject]@{ name="Laura Rescatista"; email=$rMail; password=$rPwd; city="Medellin"; organizationName="Huellitas del Valle" } | ConvertTo-Json
Invoke-RestMethod -Uri ($api + "/auth/register/rescuer") -Method POST -ContentType "application/json" -Body $rbody | Out-Null
Write-Host "OK email=$rMail" -ForegroundColor Green

# 3. Admin aprueba rescatista
Write-Host "[3/7] Admin aprueba rescatista" -ForegroundColor Cyan
$pending = Invoke-RestMethod -Uri ($api + "/admin/rescuers/pending") -Method GET -Headers $adminHdr
Write-Host "Pendientes: $($pending.Count)" -ForegroundColor Gray
$toApprove = $pending | Where-Object { $_.user.email -eq $rMail }
$rid = $toApprove.id
Invoke-RestMethod -Uri ($api + "/admin/rescuers/" + $rid + "/approve") -Method PATCH -Headers $adminHdr | Out-Null
Write-Host "OK aprobado id=$rid" -ForegroundColor Green

# 4. Login rescatista — verificar APPROVED
Write-Host "[4/7] Login rescatista y verificar APPROVED" -ForegroundColor Cyan
$rlb = [PSCustomObject]@{ email = $rMail; password = $rPwd } | ConvertTo-Json
$rLoginRes = Invoke-RestMethod -Uri ($api + "/auth/login") -Method POST -ContentType "application/json" -Body $rlb
$rTok = $rLoginRes.accessToken
$rHdr = @{ Authorization = "Bearer " + $rTok }
$rProfile = Invoke-RestMethod -Uri ($api + "/rescuers/me") -Method GET -Headers $rHdr
Write-Host "OK status=$($rProfile.status) org=$($rProfile.organizationName)" -ForegroundColor Green

# 5. Rescatista publica animal
Write-Host "[5/7] Rescatista publica animal" -ForegroundColor Cyan
$ab = [PSCustomObject]@{
    name        = "Firulais"
    species     = "PERRO"
    breed       = "Labrador mix"
    ageMonths   = 18
    size        = "MEDIANO"
    gender      = "MACHO"
    city        = "Medellin"
    description = "Firulais es muy amigable, jugueton y leal. Convive bien con ninos y otros perros."
    vaccinated  = $true
    sterilized  = $false
} | ConvertTo-Json
$animal = Invoke-RestMethod -Uri ($api + "/animals") -Method POST -ContentType "application/json" -Body $ab -Headers $rHdr
$animalId = $animal.id
Write-Host "OK nombre=$($animal.name) id=$animalId status=$($animal.status)" -ForegroundColor Green

# 6. Visitante busca animales sin token
Write-Host "[6/7] Visitante sin login ve el catalogo" -ForegroundColor Cyan
$catalog = Invoke-RestMethod -Uri ($api + "/animals") -Method GET
Write-Host "OK total en catalogo: $($catalog.meta.total)" -ForegroundColor Green
$detail = Invoke-RestMethod -Uri ($api + "/animals/" + $animalId) -Method GET
Write-Host "OK detalle publico: $($detail.name) en $($detail.city)" -ForegroundColor Green

# 7. Adoptante se registra, solicita, rescatista aprueba
Write-Host "[7/7] Adoptante registra, solicita, rescatista aprueba" -ForegroundColor Cyan
$aMail = "adopter_" + $ts + "@test.com"
$adBody = [PSCustomObject]@{ name="Carlos Adoptante"; email=$aMail; password="Adopt1234" } | ConvertTo-Json
$adRes = Invoke-RestMethod -Uri ($api + "/auth/register") -Method POST -ContentType "application/json" -Body $adBody
$aTok = $adRes.accessToken
$aHdr = @{ Authorization = "Bearer " + $aTok }
Write-Host "OK adoptante role=$($adRes.user.role)" -ForegroundColor Green

$reqBody = [PSCustomObject]@{
    animalId   = $animalId
    motivation = "Tengo un hogar amplio con jardin, experiencia con perros y mucho amor para dar a Firulais y darle un buen hogar definitivo."
} | ConvertTo-Json
$adoption = Invoke-RestMethod -Uri ($api + "/adoption-requests") -Method POST -ContentType "application/json" -Body $reqBody -Headers $aHdr
Write-Host "OK solicitud enviada id=$($adoption.id) status=$($adoption.status)" -ForegroundColor Green

# Rescatista ve pendientes y aprueba
$rReqs = Invoke-RestMethod -Uri ($api + "/adoption-requests/rescuer") -Method GET -Headers $rHdr
$myPending = $rReqs | Where-Object { $_.status -eq "PENDIENTE" }
Write-Host "OK rescatista ve $($myPending.Count) solicitud(es) pendiente(s)" -ForegroundColor Green

Invoke-RestMethod -Uri ($api + "/adoption-requests/" + $adoption.id + "/approve") -Method PATCH -Headers $rHdr | Out-Null
Write-Host "OK rescatista aprobo la solicitud" -ForegroundColor Green

# Animal debe estar EN_PROCESO ahora
$updated = Invoke-RestMethod -Uri ($api + "/animals/" + $animalId) -Method GET
Write-Host "OK animal ahora en status=$($updated.status)" -ForegroundColor Green

# Rescatista finaliza adopcion
Invoke-RestMethod -Uri ($api + "/adoption-requests/" + $adoption.id + "/finalize") -Method PATCH -Headers $rHdr | Out-Null
$final = Invoke-RestMethod -Uri ($api + "/animals/" + $animalId) -Method GET
Write-Host "OK adopcion finalizada. Animal status=$($final.status)" -ForegroundColor Green

Write-Host ""
Write-Host "================================" -ForegroundColor White
Write-Host "FLUJO E2E COMPLETADO" -ForegroundColor Green
Write-Host "================================" -ForegroundColor White
Write-Host ""
Write-Host "Credenciales:" -ForegroundColor Yellow
Write-Host "  Admin:      admin@pawconnect.com / Admin1234" -ForegroundColor Yellow
Write-Host "  Rescatista: $rMail / $rPwd" -ForegroundColor Yellow
Write-Host "  Adoptante:  $aMail / Adopt1234" -ForegroundColor Yellow
