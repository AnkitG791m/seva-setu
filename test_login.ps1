$body = @{email='admin@sevasetu.app'; password='SevaSetu@2026'} | ConvertTo-Json
$resp = Invoke-RestMethod -Uri 'https://sevasetu-api-1032768844799.asia-south1.run.app/api/auth/login' -Method POST -ContentType 'application/json' -Body $body
$resp | ConvertTo-Json -Depth 3
