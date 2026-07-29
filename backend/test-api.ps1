# Test register adoptante
$body = @{ name = "Test User"; email = "test@pawconnect.com"; password = "Test1234" } | ConvertTo-Json
$r = Invoke-RestMethod -Uri "http://localhost:4000/api/auth/register" -Method POST -ContentType "application/json" -Body $body
Write-Host "REGISTER OK:" ($r | ConvertTo-Json -Depth 5)

# Test login
$body2 = @{ email = "test@pawconnect.com"; password = "Test1234" } | ConvertTo-Json
$r2 = Invoke-RestMethod -Uri "http://localhost:4000/api/auth/login" -Method POST -ContentType "application/json" -Body $body2
Write-Host "LOGIN OK:" ($r2 | ConvertTo-Json -Depth 5)

# Test ruta protegida GET /api/users/me
$token = $r2.accessToken
$headers = @{ Authorization = "Bearer $token" }
$r3 = Invoke-RestMethod -Uri "http://localhost:4000/api/users/me" -Method GET -Headers $headers
Write-Host "GET ME OK:" ($r3 | ConvertTo-Json -Depth 5)

Write-Host "`n✅ Todos los endpoints respondieron correctamente"
