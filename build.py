# Monta la app como una sola página a partir de src/.
#   python3 build.py                      -> index.html (web pública, datos de prueba inventados)
#   python3 build.py SEED.js SALIDA.html --fragmento   -> página sin cabecera, para una vista previa privada
import pathlib, sys
src = pathlib.Path(__file__).parent / 'src'
seed_path = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else src / 'seed-demo.js'
out_path = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else pathlib.Path(__file__).parent / 'index.html'
fragment = '--fragmento' in sys.argv
css, mock, app, seed = [(p.read_text('utf-8')) for p in (src / 'app.css', src / 'mock.js', src / 'app.js', seed_path)]
assert all('</script' not in x for x in (mock, app, seed))
FONT = 'https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,62..125,100..900;1,62..125,100..900&amp;display=swap'
body = f'''<title>TalentoSEK</title>
<link rel="stylesheet" href="{FONT}">
<style>
{css}</style>
<div id="app"></div>
<script>
{seed}</script>
<script>
{mock}</script>
<script>
{app}</script>
'''
if fragment:
    html = body
else:
    html = ('<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
            '<meta name="theme-color" content="#ffd400">\n'
            '<style>html{padding-top:env(safe-area-inset-top,0px)}body{margin:0}[hidden]{display:none!important}</style>\n'
            '</head>\n<body>\n' + body + '</body>\n</html>\n')
out_path.write_text(html, 'utf-8'); print(out_path, len(html))
