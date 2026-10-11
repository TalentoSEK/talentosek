# Monta la app como páginas sueltas a partir de src/.
#   python3 build.py
#       demo.html   -> la app con datos de prueba inventados (no guarda nada)
#       index.html  -> la app conectada a Firebase si existe firebase-config.json; si no, igual que demo.html
#   python3 build.py --fragmento SEED.js SALIDA.html   -> vista previa privada sin cabecera, con otros datos de prueba
#   python3 build.py --real CONFIG.json SALIDA.html    -> la app conectada, con otra configuración (para pruebas)
import json, pathlib, sys
root = pathlib.Path(__file__).parent
src = root / 'src'
read = lambda p: pathlib.Path(p).read_text('utf-8')
FONT = 'https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,62..125,100..900;1,62..125,100..900&amp;display=swap'

def page(scripts, fragment=False):
    body = (f'<title>TalentoSEK</title>\n<link rel="stylesheet" href="{FONT}">\n<style>\n{read(src / "app.css")}</style>\n'
            f'<div id="app"></div>\n{scripts}')
    if fragment:
        return body
    return ('<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
            '<meta name="theme-color" content="#fde100">\n'
            '<style>html{padding-top:env(safe-area-inset-top,0px)}body{margin:0}[hidden]{display:none!important}</style>\n'
            '</head>\n<body>\n' + body + '</body>\n</html>\n')

def mock_scripts(seed_path):
    parts = [read(seed_path), read(src / 'mock.js'), read(src / 'app.js')]
    assert all('</script' not in x for x in parts)
    return ''.join(f'<script>\n{x}</script>\n' for x in parts)

def real_scripts(config_path):
    cfg = json.loads(read(config_path))
    parts = ['window.TS_FIREBASE = ' + json.dumps(cfg) + ';\n', read(src / 'firebase.js'), read(src / 'app.js')]
    assert all('</script' not in x for x in parts)
    return '<script type="module">\n' + ''.join(parts) + '</script>\n'

def write(path, html):
    pathlib.Path(path).write_text(html, 'utf-8'); print(path, len(html))

args = sys.argv[1:]
if args[:1] == ['--fragmento']:
    write(args[2], page(mock_scripts(args[1]), fragment=True))
elif args[:1] == ['--real']:
    write(args[2], page(real_scripts(args[1])))
else:
    demo = page(mock_scripts(src / 'seed-demo.js'))
    write(root / 'demo.html', demo)
    cfg = root / 'firebase-config.json'
    write(root / 'index.html', page(real_scripts(cfg)) if cfg.exists() else demo)
