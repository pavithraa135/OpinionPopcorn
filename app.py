from flask import Flask, render_template, request, jsonify
import numpy as np
import json

app = Flask(__name__)

def simple_predict(text):
    text = text.lower()
    
    positive_words = ["good", "great", "amazing", "love", "fantastic", "excellent", "best"]
    negative_words = ["bad", "worst", "boring", "waste", "terrible", "poor"]

    score = 0

    for w in positive_words:
        if w in text:
            score += 1

    for w in negative_words:
        if w in text:
            score -= 1

    # Normalize score
    prob = 0.5 + (score * 0.1)
    prob = max(0.0, min(1.0, prob))

    # 🔥 ADD NEUTRAL LOGIC
    if prob > 0.6:
        sentiment = "Positive"
    elif prob < 0.4:
        sentiment = "Negative"
    else:
        sentiment = "Neutral"

    return sentiment, prob


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    review = data.get("review", "")

    sentiment, prob = simple_predict(review)

    return jsonify({
        "sentiment": sentiment,
        "confidence": int(prob * 100)
    })


if __name__ == "__main__":
    app.run(debug=True)