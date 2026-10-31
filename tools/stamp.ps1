# Run this before committing a change to anything under js/ or css/.
# GitHub Pages lets browsers keep files for ten minutes, so every module and
# stylesheet gets a version in its address. A new version means a new address,
# which means nobody keeps running yesterday's code.
$root = Split-Path -Parent $PSScriptRoot
$version = Get-Date -Format 'yyyyMMddHHmmss'

$modules = Get-ChildItem (Join-Path $root 'js') -Recurse -Filter *.js |
  ForEach-Object { './' + $_.FullName.Substring($root.Length + 1).Replace('\', '/') } |
  Sort-Object

$entries = $modules | ForEach-Object { '      "{0}": "{0}?v={1}"' -f $_, $version }
$map = "<!-- importmap:start -->`n  <script type=`"importmap`">`n  {`n    `"imports`": {`n" + ($entries -join ",`n") + "`n    }`n  }`n  </script>`n  <!-- importmap:end -->"

$index = Join-Path $root 'index.html'
$html = [IO.File]::ReadAllText($index)
$html = [regex]::Replace($html, '<!-- importmap:start -->.*?<!-- importmap:end -->', $map.Replace('$', '$$'), 'Singleline')
$html = [regex]::Replace($html, 'src="js/main\.js(\?v=\d+)?"', "src=`"js/main.js?v=$version`"")
$html = [regex]::Replace($html, 'href="css/(\w+)\.css(\?v=\d+)?"', "href=`"css/`$1.css?v=$version`"")
[IO.File]::WriteAllText($index, $html, (New-Object Text.UTF8Encoding $false))

Write-Host "stamped $($modules.Count) modules with version $version"
