import sys
from pathlib import Path

# tests/ から `import main` できるように api/ ディレクトリを import パスに加える
sys.path.insert(0, str(Path(__file__).resolve().parent))
