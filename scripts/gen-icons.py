#!/usr/bin/env python3
"""Generate bang-store PWA icons (192, 512, maskable 512, favicon 32+16+apple 180)."""
from PIL import Image, ImageDraw, ImageFont
import os

ACCENT = (99, 102, 241)       # #6366f1
ACCENT_HOVER = (79, 70, 229)  # #4f46e5
WHITE = (255, 255, 255)

PUBLIC = os.path.join(os.path.dirname(__file__), "..", "public")
FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def draw_icon(size: int, text: str = "B", font_ratio: float = 0.52,
              bg: tuple = ACCENT, fg: tuple = WHITE, maskable: bool = False) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    if maskable:
        # Full-bleed background, safe zone at 80%
        d.rounded_rectangle([0, 0, size, size], radius=int(size * 0.22), fill=bg)
        letter_size = int(size * 0.52)
    else:
        # Rounded square with padding + letter
        pad = int(size * 0.06)
        d.rounded_rectangle([pad, pad, size - pad, size - pad],
                            radius=int(size * 0.18), fill=bg)
        letter_size = int(size * 0.55)

    font = ImageFont.truetype(FONT_PATH, letter_size)
    bbox = d.textbbox((0, 0), text, font=font)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (size - w) / 2 - bbox[0]
    y = (size - h) / 2 - bbox[1]
    d.text((x, y), text, font=font, fill=fg)
    return img


def main():
    os.makedirs(PUBLIC, exist_ok=True)

    draw_icon(512).save(os.path.join(PUBLIC, "icon-512x512.png"))
    draw_icon(192).save(os.path.join(PUBLIC, "icon-192x192.png"))
    draw_icon(512, maskable=True).save(os.path.join(PUBLIC, "icon-maskable-512x512.png"))
    draw_icon(192, maskable=True).save(os.path.join(PUBLIC, "icon-maskable-192x192.png"))
    draw_icon(512, bg=ACCENT_HOVER).save(os.path.join(PUBLIC, "icon-512x512.png"))
    draw_icon(180, text="B", font_ratio=0.5).save(os.path.join(PUBLIC, "apple-touch-icon.png"))
    draw_icon(32, text="B", font_ratio=0.5).save(os.path.join(PUBLIC, "favicon-32x32.png"))
    draw_icon(16, text="B", font_ratio=0.5).save(os.path.join(PUBLIC, "favicon-16x16.png"))

    # favicon.ico from 16/32
    imgs = [Image.open(os.path.join(PUBLIC, f"favicon-{s}x{s}.png")).convert("RGBA") for s in (16, 32)]
    imgs[0].save(os.path.join(PUBLIC, "favicon.ico"), format="ICO", sizes=[(16, 16), (32, 32)],
                 append_images=imgs[1:])

    print("Icons written to", PUBLIC)


if __name__ == "__main__":
    main()