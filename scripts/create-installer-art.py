"""Create WiX wizard artwork from the original Overline icon."""

from pathlib import Path
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
ICON = Image.open(ROOT / "resources/icons/overline.png").convert("RGBA")
DEST = ROOT / "resources/installer"
DEST.mkdir(parents=True, exist_ok=True)


def background(size: tuple[int, int]) -> Image.Image:
    width, height = size
    image = Image.new("RGB", size)
    pixels = image.load()
    for y in range(height):
        for x in range(width):
            shade = int(246 - 9 * x / width - 4 * y / height)
            pixels[x, y] = (shade - 2, shade, shade + 1)
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, 5, height), fill=(20, 135, 137))
    return image


welcome = background((493, 312))
large_icon = ICON.resize((144, 144), Image.Resampling.LANCZOS)
welcome.paste(large_icon, (322, 145), large_icon)
welcome.save(DEST / "overline-welcome.jpg", quality=95, subsampling=0)

banner = background((493, 58))
small_icon = ICON.resize((46, 46), Image.Resampling.LANCZOS)
banner.paste(small_icon, (435, 6), small_icon)
banner.save(DEST / "overline-banner.jpg", quality=95, subsampling=0)
