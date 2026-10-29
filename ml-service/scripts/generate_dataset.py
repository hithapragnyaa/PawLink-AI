
import numpy as np
import pandas as pd

from pathlib import Path


# --------------------------------------------------
# CONFIGURATION
# --------------------------------------------------

NUM_SAMPLES = 25000
RANDOM_SEED = 42

rng = np.random.default_rng(RANDOM_SEED)

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

DATA_DIR.mkdir(parents=True, exist_ok=True)

OUTPUT_FILE = DATA_DIR / "rescue_priority_synthetic.csv"


# --------------------------------------------------
# 1. GENERATE ANIMAL INFORMATION
# --------------------------------------------------

animal_types = ["DOG", "CAT", "COW", "BIRD", "OTHER"]

animal_type = rng.choice(
    animal_types,
    size=NUM_SAMPLES,
    p=[0.45, 0.25, 0.12, 0.08, 0.10]
)

age_group = rng.choice(
    ["JUVENILE", "ADULT", "SENIOR", "UNKNOWN"],
    size=NUM_SAMPLES,
    p=[0.20, 0.50, 0.15, 0.15]
)


# --------------------------------------------------
# 2. GENERATE MEDICAL CONDITION FEATURES
# --------------------------------------------------

injury_severity = rng.choice(
    [1, 2, 3, 4, 5],
    size=NUM_SAMPLES,
    p=[0.15, 0.25, 0.25, 0.22, 0.13]
)

visible_bleeding = rng.choice(
    [True, False],
    size=NUM_SAMPLES,
    p=[0.30, 0.70]
)

mobility_status = rng.choice(
    ["NORMAL", "LIMITED", "UNABLE_TO_WALK"],
    size=NUM_SAMPLES,
    p=[0.55, 0.30, 0.15]
)

consciousness = rng.choice(
    ["CONSCIOUS", "DISORIENTED", "UNCONSCIOUS"],
    size=NUM_SAMPLES,
    p=[0.82, 0.13, 0.05]
)

breathing_difficulty = rng.choice(
    [True, False],
    size=NUM_SAMPLES,
    p=[0.12, 0.88]
)

time_since_injury_hours = np.round(
    rng.exponential(scale=5.0, size=NUM_SAMPLES),
    2
)

time_since_injury_hours = np.clip(
    time_since_injury_hours,
    0.1,
    72
)


# --------------------------------------------------
# 3. GENERATE ENVIRONMENTAL FEATURES
# --------------------------------------------------

location_type = rng.choice(
    ["ROAD", "RESIDENTIAL", "COMMERCIAL", "RURAL", "OTHER"],
    size=NUM_SAMPLES,
    p=[0.35, 0.25, 0.15, 0.15, 0.10]
)

traffic_risk = rng.choice(
    ["LOW", "MEDIUM", "HIGH"],
    size=NUM_SAMPLES,
    p=[0.40, 0.35, 0.25]
)

weather_condition = rng.choice(
    ["CLEAR", "RAINY", "HOT", "COLD", "OTHER"],
    size=NUM_SAMPLES,
    p=[0.50, 0.20, 0.15, 0.10, 0.05]
)

previous_reports = rng.choice(
    [0, 1, 2, 3, 4, 5],
    size=NUM_SAMPLES,
    p=[0.70, 0.15, 0.07, 0.04, 0.025, 0.015]
)


# --------------------------------------------------
# 4. SYNTHETIC PRIORITY LABELING
# --------------------------------------------------

# This is a transparent prototype rule, NOT a
# clinically validated veterinary triage standard.

risk_score = (
    injury_severity * 11
    + visible_bleeding.astype(int) * 14
    + breathing_difficulty.astype(int) * 22
    + np.select(
        [
            consciousness == "UNCONSCIOUS",
            consciousness == "DISORIENTED"
        ],
        [25, 12],
        default=0
    )
    + np.select(
        [
            mobility_status == "UNABLE_TO_WALK",
            mobility_status == "LIMITED"
        ],
        [15, 7],
        default=0
    )
    + np.select(
        [
            time_since_injury_hours > 12,
            time_since_injury_hours > 4
        ],
        [8, 4],
        default=0
    )
    + np.select(
        [
            traffic_risk == "HIGH",
            traffic_risk == "MEDIUM"
        ],
        [12, 6],
        default=0
    )
    + (location_type == "ROAD").astype(int) * 5
    + (weather_condition == "RAINY").astype(int) * 3
)

priority = np.select(
    [
        risk_score >= 68,
        risk_score >= 38
    ],
    [
        "HIGH",
        "MEDIUM"
    ],
    default="LOW"
)


# --------------------------------------------------
# 5. CREATE DATAFRAME
# --------------------------------------------------

df = pd.DataFrame({
    "animal_type": animal_type,
    "age_group": age_group,
    "injury_severity": injury_severity,
    "visible_bleeding": visible_bleeding,
    "mobility_status": mobility_status,
    "consciousness": consciousness,
    "breathing_difficulty": breathing_difficulty,
    "time_since_injury_hours": time_since_injury_hours,
    "location_type": location_type,
    "traffic_risk": traffic_risk,
    "weather_condition": weather_condition,
    "previous_reports": previous_reports,
    "risk_score": risk_score,
    "priority": priority,
    "data_source": "synthetic_rule_based",
    "label_rule_version": "pawlink-synthetic-v1"
})


# --------------------------------------------------
# 6. SAVE DATASET
# --------------------------------------------------

df.to_csv(OUTPUT_FILE, index=False)


# --------------------------------------------------
# 7. DATASET SUMMARY
# --------------------------------------------------

print("\n====================================")
print("PAWLINK AI DATASET GENERATION")
print("====================================")

print(f"\nTotal records: {len(df)}")

print("\nPriority distribution:")
print(df["priority"].value_counts())

print("\nPriority percentages:")
print(
    (df["priority"].value_counts(normalize=True) * 100)
    .round(2)
)

print("\nMissing values:")
print(df.isnull().sum().sum())

print("\nFirst five records:")
print(df.head())

print("\nDataset saved successfully:")
print(OUTPUT_FILE)

print("\n====================================")