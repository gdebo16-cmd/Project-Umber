param([string]$Target,[string]$File,[string]$Cmd)
$root='C:\Users\gdebo\.cursor\Project-Umber'
$e=@{}; Get-Content "$root\.env" | ? { $_ -match '^\s*[^#].*=' } | % { $k,$v = $_ -split '=',2; $e[$k.Trim()] = $v.Trim().Trim('"').Trim("'") }
$a=@('-X','-q','-v','ON_ERROR_STOP=1','-A','-F','|','-P','pager=off')
if($File){$a+=@('-f',$File)} else {$a+=@('-c',$Cmd)}
if($Target -eq 'neon'){ & psql $e.NEON_URL @a }
else { $env:PGPASSWORD=$e.DB_PASSWORD; try { & psql -U $e.DB_USER -h $e.DB_HOST -p $e.DB_PORT -d $e.DB_NAME @a } finally { Remove-Item Env:PGPASSWORD } }