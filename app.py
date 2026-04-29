from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

def simple_predict(text):
    text = text.lower()

    positive_words = ["good", "great", "amazing", "love", "fantastic", "excellent"]
    negative_words = ["bad", "worst", "boring", "waste", "terrible", "poor"]

    score = 0

    for w in positive_words:
        if w in text:
            score += 1

    for w in negative_words:
        if w in text:
            score -= 1

    prob = 0.5 + (score * 0.1)
    prob = max(0.0, min(1.0, prob))

    if prob > 0.6:
        sentiment = "Positive"
    elif prob < 0.4:
        sentiment = "Negative"
    else:
        sentiment = "Neutral"

    return sentiment, int(prob * 100)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    review = data.get("review", "")
    sentiment, confidence = simple_predict(review)
    return jsonify({
        "sentiment": sentiment,
        "confidence": confidence
    })

if __name__ == "__main__":
    app.run(debug=True)
