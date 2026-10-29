from pathlib import Path
from PIL import Image

image_dir = Path("data/train/images")

total = 0
valid = 0
invalid = []

for image_path in image_dir.iterdir():
    if image_path.suffix.lower() not in [".jpg", ".jpeg", ".png"]:
        continue

    total += 1

    try:
        with Image.open(image_path) as img:
            img.verify()
        valid += 1

    except Exception as e:
        invalid.append((image_path.name, str(e)))

print("Total images:", total)
print("Valid images:", valid)
print("Invalid images:", len(invalid))

if invalid:
    print("\nInvalid files:")
    for name, error in invalid:
        print(name, error)