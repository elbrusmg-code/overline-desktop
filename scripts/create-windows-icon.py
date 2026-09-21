"""Build a multi-resolution Windows ICO from the original Overline PNG."""

from io import BytesIO
from pathlib import Path
import struct

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "resources/icons/overline.png"
TARGET = ROOT / "resources/icons/overline.ico"
SIZES = (16, 24, 32, 48, 64, 128, 256)

source = Image.open(SOURCE).convert("RGBA")
payloads = []
for size in SIZES:
    image = source.resize((size, size), Image.Resampling.LANCZOS)
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    payloads.append(buffer.getvalue())

header = struct.pack("<HHH", 0, 1, len(SIZES))
offset = len(header) + 16 * len(SIZES)
entries = []
for size, payload in zip(SIZES, payloads):
    entries.append(struct.pack("<BBBBHHII", size % 256, size % 256, 0, 0, 1, 32, len(payload), offset))
    offset += len(payload)

TARGET.write_bytes(header + b"".join(entries) + b"".join(payloads))
print(f"Created {TARGET.name}: {', '.join(str(size) for size in SIZES)} px")
