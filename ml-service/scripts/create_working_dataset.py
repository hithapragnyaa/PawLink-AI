from pathlib import Path
import random
import shutil


SOURCE = Path("data/train")
OUTPUT = Path("data/animal_injury_working")

SEED = 42

EXCLUDED = {
    "bleeding5_jpg.rf.4167f772d4860078f5e1a2b4aca86849.jpg"
}


# -----------------------------
# Find usable image-label pairs
# -----------------------------

images_dir = SOURCE / "images"
labels_dir = SOURCE / "labels"

pairs = []

for image in sorted(images_dir.glob("*.jpg")):

    if image.name in EXCLUDED:
        continue

    label = labels_dir / f"{image.stem}.txt"

    if not label.exists():
        raise RuntimeError(f"Missing label: {image.name}")

    if not label.read_text(encoding="utf-8").strip():
        continue

    pairs.append((image, label))


print(f"Source images: {len(list(images_dir.glob('*.jpg')))}")
print(f"Usable pairs: {len(pairs)}")
print(f"Excluded: {len(EXCLUDED)}")


if len(pairs) != 384:
    raise RuntimeError(
        f"Expected 384 usable images, found {len(pairs)}"
    )


# -----------------------------
# Deterministic shuffle
# -----------------------------

random.seed(SEED)
random.shuffle(pairs)


# -----------------------------
# Calculate split sizes
# -----------------------------

total = len(pairs)

train_count = int(total * 0.70)
valid_count = int(total * 0.20)
test_count = total - train_count - valid_count

print()
print("Planned split:")
print("Train:", train_count)
print("Valid:", valid_count)
print("Test :", test_count)
print("Total :", train_count + valid_count + test_count)


# -----------------------------
# Create directories
# -----------------------------

for split in ["train", "valid", "test"]:

    (OUTPUT / split / "images").mkdir(
        parents=True,
        exist_ok=True
    )

    (OUTPUT / split / "labels").mkdir(
        parents=True,
        exist_ok=True
    )


# -----------------------------
# Split
# -----------------------------

splits = {
    "train": pairs[:train_count],
    "valid": pairs[train_count:train_count + valid_count],
    "test": pairs[train_count + valid_count:]
}


# -----------------------------
# Copy files
# -----------------------------

for split, split_pairs in splits.items():

    for image, label in split_pairs:

        shutil.copy2(
            image,
            OUTPUT / split / "images" / image.name
        )

        shutil.copy2(
            label,
            OUTPUT / split / "labels" / label.name
        )


# -----------------------------
# Verify
# -----------------------------

print()
print("Verification:")

copied_total = 0

for split in ["train", "valid", "test"]:

    image_count = len(
        list((OUTPUT / split / "images").glob("*.jpg"))
    )

    label_count = len(
        list((OUTPUT / split / "labels").glob("*.txt"))
    )

    print(
        f"{split}: "
        f"{image_count} images, "
        f"{label_count} labels"
    )

    if image_count != label_count:
        raise RuntimeError(
            f"{split}: image/label mismatch"
        )

    copied_total += image_count


if copied_total != 384:
    raise RuntimeError(
        f"Expected 384 copied images, got {copied_total}"
    )


# -----------------------------
# YAML
# -----------------------------

yaml = """train: train/images
val: valid/images
test: test/images

nc: 4
names: ['bleeding', 'cut', 'fracture', 'infection']
"""

(OUTPUT / "data.yaml").write_text(
    yaml,
    encoding="utf-8"
)


print()
print("=" * 50)
print("WORKING DATASET CREATED SUCCESSFULLY")
print("=" * 50)
print(f"Location: {OUTPUT}")
print(f"Images copied: {copied_total}")
print("Original dataset was not modified.")