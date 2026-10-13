from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parent.parent
output = root / 'dist' / 'bgv-checker-source.zip'
output.parent.mkdir(exist_ok=True)
files = ['App.tsx', 'index.ts', 'package.json', 'package-lock.json', 'app.json', 'tsconfig.json', 'eas.json', 'playwright.config.ts', 'README.md', 'LICENSE', '.gitignore']
folders = ['components', 'screens', 'lib', 'tests', 'scripts', 'assets']
with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
    for name in files:
        path = root / name
        if path.is_file():
            archive.write(path, 'bgv-checker/' + name)
    for name in folders:
        for path in (root / name).rglob('*'):
            if path.is_file() and '__pycache__' not in str(path):
                archive.write(path, 'bgv-checker/' + str(path.relative_to(root)))
print(f'Source packaged: {output.name} ({output.stat().st_size:,} bytes)')
