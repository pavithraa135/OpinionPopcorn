"""
train_model.py
==============
Trains a simple LSTM-based binary sentiment classifier on the IMDb dataset
and saves the Keras model + tokenizer to disk so the Flask app can load them.

Architecture overview:
  Input review (text)
       │
  Embedding layer  – maps each token ID to a dense vector
       │
  LSTM layer       – captures long-range sequential dependencies
       │
  Dense (sigmoid)  – outputs a single probability (positive / negative)
"""

import os
import pickle

import numpy as np
from tensorflow.keras.datasets import imdb                   # Built-in IMDb corpus
from tensorflow.keras.layers import Dense, Embedding, LSTM
from tensorflow.keras.models import Sequential
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.preprocessing.text import Tokenizer

# ──────────────────────────────────────────────
# 1.  Hyper-parameters
# ──────────────────────────────────────────────
VOCAB_SIZE   = 10_000   # Keep only the top-10 k most frequent words
MAX_LEN      = 200      # Pad / truncate every review to this many tokens
EMBEDDING_DIM = 64      # Size of each word-embedding vector
LSTM_UNITS   = 64       # Number of LSTM memory cells
BATCH_SIZE   = 128
EPOCHS       = 3        # Increase for better accuracy; 3 is enough for demo

SAVE_DIR = os.path.dirname(__file__)   # Save artefacts beside this script

# ──────────────────────────────────────────────
# 2.  Load IMDb data  (already tokenised by Keras)
# ──────────────────────────────────────────────
print("[INFO] Loading IMDb dataset …")
(x_train, y_train), (x_test, y_test) = imdb.load_data(num_words=VOCAB_SIZE)

# Retrieve the word-index so we can rebuild a human-readable Tokenizer
word_index = imdb.get_word_index()
# Keras reserves indices 0-3 for padding / start / unknown / unused
index_word = {v + 3: k for k, v in word_index.items()}
index_word[0] = "<PAD>"
index_word[1] = "<START>"
index_word[2] = "<UNK>"
index_word[3] = "<UNUSED>"

# ──────────────────────────────────────────────
# 3.  Pad sequences to a fixed length
# ──────────────────────────────────────────────
print("[INFO] Padding sequences …")
x_train = pad_sequences(x_train, maxlen=MAX_LEN, padding="post", truncating="post")
x_test  = pad_sequences(x_test,  maxlen=MAX_LEN, padding="post", truncating="post")

# ──────────────────────────────────────────────
# 4.  Build the LSTM model
# ──────────────────────────────────────────────
print("[INFO] Building LSTM model …")
model = Sequential([
    # Embedding: turns integer token IDs into dense float vectors
    Embedding(input_dim=VOCAB_SIZE,
              output_dim=EMBEDDING_DIM,
              input_length=MAX_LEN,
              name="embedding"),

    # LSTM: recurrent layer that reads the sequence and remembers context
    LSTM(units=LSTM_UNITS,
         dropout=0.2,          # Regularise inputs
         recurrent_dropout=0.2, # Regularise recurrent connections
         name="lstm"),

    # Dense sigmoid head: outputs P(positive)
    Dense(1, activation="sigmoid", name="output"),
])

model.compile(
    optimizer="adam",
    loss="binary_crossentropy",
    metrics=["accuracy"],
)
model.summary()

# ──────────────────────────────────────────────
# 5.  Train
# ──────────────────────────────────────────────
print("[INFO] Training …")
model.fit(
    x_train, y_train,
    validation_data=(x_test, y_test),
    epochs=EPOCHS,
    batch_size=BATCH_SIZE,
)

# ──────────────────────────────────────────────
# 6.  Evaluate
# ──────────────────────────────────────────────
loss, acc = model.evaluate(x_test, y_test, verbose=0)
print(f"[INFO] Test accuracy: {acc:.4f}")

# ──────────────────────────────────────────────
# 7.  Save model weights + architecture
# ──────────────────────────────────────────────
model_path = os.path.join(SAVE_DIR, "lstm_model.h5")
model.save(model_path)
print(f"[INFO] Model saved → {model_path}")

# ──────────────────────────────────────────────
# 8.  Build & save a Tokenizer that mirrors the IMDb index
#     (needed at inference time to convert raw text → token IDs)
# ──────────────────────────────────────────────
tokenizer = Tokenizer(num_words=VOCAB_SIZE, oov_token="<UNK>")
tokenizer.word_index = {w: i + 3 for w, i in word_index.items() if i < VOCAB_SIZE}
tokenizer.word_index["<PAD>"]   = 0
tokenizer.word_index["<START>"] = 1
tokenizer.word_index["<UNK>"]   = 2

tok_path = os.path.join(SAVE_DIR, "tokenizer.pkl")
with open(tok_path, "wb") as f:
    pickle.dump(tokenizer, f)
print(f"[INFO] Tokenizer saved → {tok_path}")
print("[INFO] Done! Run app.py to start the web server.")
