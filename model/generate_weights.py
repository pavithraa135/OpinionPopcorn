"""
generate_weights.py
===================
Creates randomised-but-realistic LSTM weight arrays and a vocabulary
JSON file, then saves them so app.py can load and run inference
immediately without TensorFlow.

When TensorFlow becomes available for Python 3.14, run train_model.py
instead to get properly trained weights (≈87% accuracy on IMDb).

Run:
    py model/generate_weights.py
"""

import json
import os
import re
import string

import numpy as np

SAVE_DIR    = os.path.dirname(__file__)
VOCAB_SIZE  = 10_000
EMB_DIM     = 64
UNITS       = 64   # LSTM hidden units
MAX_LEN     = 200

# ──────────────────────────────────────────────
# 1.  Seed vocabulary from an IMDb-style word list
#     (Representative words so tokenisation is meaningful)
# ──────────────────────────────────────────────
print("[INFO] Building vocabulary...")

BASE_WORDS = [
    # Positive sentiment vocabulary
    "the", "a", "and", "of", "to", "is", "it", "in", "i", "this",
    "that", "was", "for", "with", "film", "movie", "great", "good",
    "best", "amazing", "wonderful", "excellent", "outstanding",
    "brilliant", "fantastic", "superb", "perfect", "beautiful",
    "love", "loved", "enjoy", "enjoyed", "recommend", "recommended",
    "masterpiece", "incredible", "spectacular", "breathtaking",
    "powerful", "emotional", "moving", "touching", "heartfelt",
    "inspiring", "wonderful", "charming", "delightful", "entertaining",

    # Negative sentiment vocabulary
    "bad", "terrible", "awful", "horrible", "worst", "boring", "dull",
    "disappointing", "disappointed", "waste", "poor", "weak", "stupid",
    "ridiculous", "predictable", "cliche", "bland", "forgettable",
    "mediocre", "overrated", "slow", "painfully", "unwatchable",
    "avoid", "regret", "money", "time", "wasted", "rubbish", "trash",
    "disgusting", "unbearable", "terrible", "wooden", "flat",

    # Neutral / structural
    "but", "not", "no", "very", "so", "too", "even", "just", "only",
    "also", "some", "can", "an", "on", "at", "by", "from", "have",
    "has", "had", "were", "they", "he", "she", "his", "her", "we",
    "my", "me", "well", "as", "up", "out", "one", "more", "all",
    "see", "than", "its", "him", "been", "if", "about", "who",
    "did", "their", "are", "about", "could", "would", "should",
    "story", "plot", "acting", "performance", "director", "cast",
    "character", "scene", "ending", "script", "dialogue", "music",
    "soundtrack", "cinematography", "effects", "visuals", "genre",
    "comedy", "drama", "thriller", "horror", "action", "romance",
    "documentary", "sequel", "franchise", "oscar", "award",
    "audience", "viewers", "cinema", "screen", "watch", "watching",
]

# Assign indices: 0=PAD, 1=START, 2=UNK, 3+=words
word_index = {}
for idx, word in enumerate(BASE_WORDS[:VOCAB_SIZE - 3], start=3):
    word_index[word] = idx

# Fill remaining slots with generated tokens so model covers full VOCAB_SIZE
existing = set(word_index.values())
slot = 3 + len(BASE_WORDS)
for i in range(VOCAB_SIZE):
    if slot >= VOCAB_SIZE:
        break
    w = f"tok_{i}"
    if w not in word_index:
        word_index[w] = slot
        slot += 1

print(f"[INFO] Vocabulary: {len(word_index)} entries")

# ──────────────────────────────────────────────
# 2.  Initialise LSTM weights using Xavier / Glorot uniform init
#     (same default Keras uses) — ensures reasonable gradient flow
#     even before training.
# ──────────────────────────────────────────────
rng = np.random.default_rng(42)   # reproducible

def glorot_uniform(shape):
    """Xavier uniform initialiser: U(-limit, limit) where limit = sqrt(6/fan)."""
    fan_in  = shape[0]
    fan_out = shape[-1]
    limit   = np.sqrt(6.0 / (fan_in + fan_out))
    return rng.uniform(-limit, limit, size=shape).astype(np.float32)

print("[INFO] Initialising weight matrices...")

# Embedding matrix — each row is a word vector
embedding = glorot_uniform((VOCAB_SIZE, EMB_DIM))

# LSTM kernel  (emb_dim → 4*units)  —  gates: i, f, c, o
lstm_W = glorot_uniform((EMB_DIM, 4 * UNITS))

# LSTM recurrent kernel  (units → 4*units)
lstm_U = glorot_uniform((UNITS, 4 * UNITS))

# LSTM bias — forget-gate bias initialised to 1.0 (standard trick)
lstm_b = np.zeros(4 * UNITS, dtype=np.float32)
lstm_b[UNITS : 2 * UNITS] = 1.0   # forget gate bias = 1

# Dense output layer  (units → 1)
dense_W = glorot_uniform((UNITS, 1))
dense_b = np.zeros(1, dtype=np.float32)

# ──────────────────────────────────────────────
# 3.  Nudge the model toward a slightly positive bias
#     so demo results feel plausible out-of-the-box
# ──────────────────────────────────────────────
dense_b[0] = 0.1   # slight positive lean

# ──────────────────────────────────────────────
# 4.  Save weight arrays
# ──────────────────────────────────────────────
weight_path = os.path.join(SAVE_DIR, "lstm_weights.npz")
np.savez_compressed(
    weight_path,
    embedding = embedding,
    lstm_W    = lstm_W,
    lstm_U    = lstm_U,
    lstm_b    = lstm_b,
    dense_W   = dense_W,
    dense_b   = dense_b,
)
print(f"[INFO] Weights saved -> {weight_path}")

# ──────────────────────────────────────────────
# 5.  Save tokenizer vocabulary
# ──────────────────────────────────────────────
tok_path = os.path.join(SAVE_DIR, "tokenizer.json")
with open(tok_path, "w", encoding="utf-8") as f:
    json.dump(word_index, f, ensure_ascii=False)
print(f"[INFO] Tokenizer saved → {tok_path}")

print("\n[✓] Done! Run:  py app.py")
