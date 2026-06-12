#!/usr/bin/env bash
# Assemble a captioned demo video from the on-device proof screenshots.
# (Captions rendered with Pillow because this ffmpeg lacks drawtext.)
# Output: docs/assets/demo.mp4
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d)"

python3 - "$HERE/docs/assets" "$TMP" <<'PY'
import sys
from PIL import Image, ImageDraw, ImageFont
assets, tmp = sys.argv[1], sys.argv[2]
font_path = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
W, H = 900, 820

def font(sz): return ImageFont.truetype(font_path, sz)

def center_text(d, text, y, f, fill=(20,20,20)):
    w = d.textbbox((0,0), text, font=f)[2]
    d.text(((W-w)//2, y), text, font=f, fill=fill)

# title card
img = Image.new("RGB", (W, H), "white"); d = ImageDraw.Draw(img)
center_text(d, "Clear-Claim", 320, font(72))
center_text(d, "a keyless DePIN agent that clear-signs on Ledger", 430, font(28), (90,90,90))
img.save(f"{tmp}/f00.png")

slides = [
    ("01-without-descriptor-refused.png", "No descriptor: the Ledger REFUSES to sign"),
    ("02-clearsign-intent.png",           "With our ERC-7730 descriptor: Claim DePIN rewards"),
    ("amoy-amount.png",                   "Reward = live WeatherXM rate: Claim 36.75 RWRD"),
    ("amoy-network.png",                  "Signed on a real Ledger (Speculos) - Polygon Amoy"),
]
for i, (shot, cap) in enumerate(slides, 1):
    img = Image.new("RGB", (W, H), "white"); d = ImageDraw.Draw(img)
    center_text(d, cap, 48, font(30))
    s = Image.open(f"{assets}/{shot}").convert("RGB")
    scale = 560 / s.height
    s = s.resize((int(s.width*scale), 560))
    img.paste(s, ((W - s.width)//2, 150))
    img.save(f"{tmp}/f{i:02d}.png")
print("frames built")
PY

# hold each frame: title 2.5s, slides 3/3/3.5/3.5s
mk() { ffmpeg -y -loop 1 -t "$2" -i "$TMP/$1" -r 30 -pix_fmt yuv420p -vf scale=900:820 "$TMP/$1.mp4" >/dev/null 2>&1; }
mk f00.png 2.5; mk f01.png 3; mk f02.png 3; mk f03.png 3.5; mk f04.png 3.5
printf "file '%s'\n" "$TMP"/f0{0,1,2,3,4}.png.mp4 > "$TMP/list.txt"
ffmpeg -y -f concat -safe 0 -i "$TMP/list.txt" -c copy "$HERE/docs/assets/demo.mp4" >/dev/null 2>&1
echo "wrote docs/assets/demo.mp4"
rm -rf "$TMP"
