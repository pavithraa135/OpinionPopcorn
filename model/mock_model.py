"""
mock_model.py
=============
Creates and saves a LIGHTWEIGHT but real LSTM model pre-initialised with
random weights.  This lets you run the Flask demo immediately without
waiting for full IMDb training.

The real-world accuracy will be near 50 % (random weights), but the
end-to-end inference pipeline (tokenise → pad → LSTM → sigmoid) is
identical to the trained version.  Replace lstm_model.h5 / tokenizer.pkl
with the outputs of train_model.py for accurate predictions.
"""

import os
import pickle
import re
import string

import numpy as np
from tensorflow.keras.layers import Dense, Embedding, LSTM
from tensorflow.keras.models import Sequential
from tensorflow.keras.preprocessing.text import Tokenizer

SAVE_DIR     = os.path.dirname(__file__)
VOCAB_SIZE   = 10_000
MAX_LEN      = 200
EMBEDDING_DIM = 64
LSTM_UNITS   = 64

# ──────────────────────────────────────────────
# Seed corpus – a handful of representative IMDb-style phrases
# ──────────────────────────────────────────────
SEED_REVIEWS = [
    "this movie was absolutely fantastic loved every moment of it",
    "brilliant acting and superb direction a must watch film",
    "terrible boring and a complete waste of time avoid this",
    "outstanding performances moving story highly recommended",
    "dull predictable plot with wooden acting total disappointment",
    "an emotional rollercoaster with stunning visuals pure masterpiece",
    "horrible script bad acting worst film i have ever seen",
    "delightful charming film that keeps you engaged throughout",
    "mediocre at best nothing special about this production",
    "gripping thriller with unexpected twists loved it",
]

# ──────────────────────────────────────────────
# 1.  Fit a tiny tokenizer on the seed corpus
# ──────────────────────────────────────────────
def clean(text: str) -> str:
    """Lowercase and strip punctuation."""
    text = text.lower()
    text = re.sub(f"[{re.escape(string.punctuation)}]", " ", text)
    return " ".join(text.split())

tokenizer = Tokenizer(num_words=VOCAB_SIZE, oov_token="<UNK>")
tokenizer.fit_on_texts([clean(r) for r in SEED_REVIEWS])

# ──────────────────────────────────────────────
# 2.  Build the LSTM model (same architecture as train_model.py)
# ──────────────────────────────────────────────
print("[INFO] Building mock LSTM model …")
model = Sequential([
    Embedding(input_dim=VOCAB_SIZE,
              output_dim=EMBEDDING_DIM,
              input_length=MAX_LEN,
              name="embedding"),
    LSTM(units=LSTM_UNITS,
         dropout=0.2,
         recurrent_dropout=0.2,
         name="lstm"),
    Dense(1, activation="sigmoid", name="output"),
])
model.compile(optimizer="adam", loss="binary_crossentropy", metrics=["accuracy"])

# Force weight initialisation by running one dummy forward pass
dummy = np.zeros((1, MAX_LEN), dtype=np.int32)
model.predict(dummy, verbose=0)

# ──────────────────────────────────────────────
# 3.  Save artefacts
# ──────────────────────────────────────────────
model_path = os.path.join(SAVE_DIR, "lstm_model.h5")
model.save(model_path)
print(f"[INFO] Mock model saved → {model_path}")

tok_path = os.path.join(SAVE_DIR, "tokenizer.pkl")
with open(tok_path, "wb") as f:
    pickle.dump(tokenizer, f)
print(f"[INFO] Tokenizer saved  → {tok_path}")
print("[INFO] Mock model ready. Run app.py to start the server.")
