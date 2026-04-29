from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

import re
import random
from textblob import TextBlob

def search_movie_mock(query):
    query = query.lower().strip()
    
    # Simple mocked database
    db = {
        "inception": {
            "title": "Inception (2010)",
            "poster": "🪐",
            "summary": "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
            "reviews": [
                "An absolute masterpiece. The directing was brilliant and fantastic.",
                "Visually stunning and the score by Hans Zimmer is amazing.",
                "A bit confusing at times, and the pacing was boring."
            ]
        },
        "dark knight": {
            "title": "The Dark Knight (2008)",
            "poster": "🦇",
            "summary": "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest tests of his ability.",
            "reviews": [
                "The greatest comic book movie ever made. Heath Ledger is perfect.",
                "Thrilling from start to finish. Amazing action.",
                "A little too dark for my taste, but excellent performances."
            ]
        },
        "interstellar": {
            "title": "Interstellar (2014)",
            "poster": "🚀",
            "summary": "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
            "reviews": [
                "Breathtaking visuals and a deeply moving story about love.",
                "The science is fascinating, excellent movie.",
                "Too long and the ending didn't make much sense to me."
            ]
        },
        "titanic": {
            "title": "Titanic (1997)",
            "poster": "🚢",
            "summary": "A seventeen-year-old aristocrat falls in love with a kind but poor artist aboard the luxurious, ill-fated R.M.S. Titanic.",
            "reviews": [
                "An absolute masterpiece. The directing was brilliant and deeply moving.",
                "Visually stunning and the score by James Horner is beautiful.",
                "A bit boring at times, and the pacing was slow."
            ]
        },
        "lion king": {
            "title": "The Lion King (1994)",
            "poster": "🦁",
            "summary": "Lion prince Simba and his father are targeted by his bitter uncle, who wants to ascend the throne himself.",
            "reviews": [
                "A perfect movie! Great animation, amazing songs, hilarious characters.",
                "The storyline is moving and the voice acting is fantastic.",
                "A little scary for very young children, but otherwise excellent."
            ]
        },
        "michael": {
            "title": "Michael",
            "poster": "👼",
            "summary": "Two tabloid reporters check out a report of the Archangel Michael living with an old woman in Iowa.",
            "reviews": [
                "A fun, moving story with a great performance by John Travolta.",
                "A beautiful movie with a sweet story and great music.",
                "Sometimes felt a bit lame and predictable, but enjoyable."
            ]
        },
        "2012": {
            "title": "2012 (2009)",
            "poster": "🌋",
            "summary": "A frustrated writer struggles to keep his family alive when a series of global catastrophes threatens to annihilate mankind.",
            "reviews": [
                "Breathtaking visuals and fantastic non-stop action!",
                "The plot is pretty stupid and lame, but the CGI is amazing.",
                "A complete waste of time, terrible writing and dreadful acting."
            ]
        }
    }
    
    fallback_summaries = [
        "A gripping tale of adventure and self-discovery that pushes boundaries.",
        "An action-packed thrill ride from start to finish with great visuals.",
        "A quiet, emotional drama that explores the human condition deeply."
    ]
    
    fallback_reviews = [
        ["I really enjoyed it! Great acting and story.", "A bit boring in the middle.", "Fantastic visuals and beautiful cinematography!"],
        ["Terrible script, total waste of time.", "The lead actor was amazing.", "I wouldn't watch it again, very poor pacing."],
        ["An absolute masterpiece, breathtaking.", "Loved the soundtrack and directing.", "Good, but not perfect, somewhat lame ending."]
    ]
    
    for k, v in db.items():
        if k in query or query in k:
            return v
            
    # Return random if not found
    return {
        "title": f"{query.title()} (Film)",
        "poster": "🎬",
        "summary": random.choice(fallback_summaries),
        "reviews": random.choice(fallback_reviews)
    }

def generate_emojis(text):
    text_lower = text.lower()
    emojis = []
    
    if re.search(r'\b(funny|hilarious|laugh|comedy)\b', text_lower): emojis.append("😂")
    if re.search(r'\b(sad|cry|emotional|heartbreaking)\b', text_lower): emojis.append("😢")
    if re.search(r'\b(scary|horror|terrifying|jump)\b', text_lower): emojis.append("😱")
    if re.search(r'\b(action|explosions|thrilling|fast)\b', text_lower): emojis.append("🔥")
    if re.search(r'\b(love|romance|sweet|beautiful)\b', text_lower): emojis.append("❤️")
    if re.search(r'\b(space|aliens|sci-fi|universe)\b', text_lower): emojis.append("👽")
    if re.search(r'\b(boring|sleep|dull|slow)\b', text_lower): emojis.append("😴")
    if re.search(r'\b(masterpiece|perfect|best|amazing)\b', text_lower): emojis.append("👑")
    if re.search(r'\b(bad|terrible|worst|trash)\b', text_lower): emojis.append("🗑️")
    if re.search(r'\b(music|score|soundtrack|song)\b', text_lower): emojis.append("🎵")
    if re.search(r'\b(magic|fantasy|wizard|spell)\b', text_lower): emojis.append("✨")
    
    if not emojis:
        emojis = ["🍿", "🎬", "👀"]
        
    return "".join(emojis[:3])

def detailed_analysis(text):
    text_lower = text.lower()
    
    # --- AI/ML Sentiment Engine (TextBlob) ---
    blob = TextBlob(text)
    polarity = blob.sentiment.polarity  # Range: -1.0 to 1.0
    subjectivity = blob.sentiment.subjectivity  # Range: 0.0 to 1.0
    
    if polarity >= 0.1:
        sentiment = "Positive"
        prob = 0.6 + (polarity - 0.1) / 0.9 * 0.4
    elif polarity <= -0.1:
        sentiment = "Negative"
        prob = (polarity + 1.0) / 0.9 * 0.4
    else:
        sentiment = "Neutral"
        prob = 0.5 + (polarity / 0.1) * 0.1
        
    prob = max(0.0, min(1.0, prob))
        
    # Stats
    words = [w for w in re.split(r'\s+', text) if w]
    word_count = len(words)
    reading_time = round(word_count / 200, 1)
    reading_time_str = "< 1 min" if reading_time < 1 else f"~{int(reading_time)} mins"
        
    # Extract themes based on keywords
    themes = []
    if re.search(r'\b(plot|story|script|writing|pacing)\b', text_lower):
        themes.append("Storyline")
    if re.search(r'\b(acting|actor|actress|cast|performance|performances)\b', text_lower):
        themes.append("Acting")
    if re.search(r'\b(music|score|soundtrack|audio|sound)\b', text_lower):
        themes.append("Audio & Score")
    if re.search(r'\b(visuals|cinematography|cgi|effects|looks|vfx)\b', text_lower):
        themes.append("Visuals")
    if re.search(r'\b(directing|director|directed)\b', text_lower):
        themes.append("Direction")
        
    if not themes:
        themes.append("General Impressions")
        
    positive_words = ["good", "great", "amazing", "love", "fantastic", "excellent", "masterpiece", "breathtaking", "moving", "brilliant", "perfect", "enjoyed", "hilarious", "beautiful"]
    negative_words = ["bad", "worst", "boring", "waste", "terrible", "poor", "dreadful", "awful", "stupid", "lame", "garbage", "trash", "disappointing"]

    found_pos = [w for w in positive_words if re.search(r'\b' + w + r'\b', text_lower)]
    found_neg = [w for w in negative_words if re.search(r'\b' + w + r'\b', text_lower)]
    key_words = found_pos + found_neg
    
    emojis = generate_emojis(text)
    
    return {
        "text": text,
        "sentiment": sentiment,
        "confidence": int(prob * 100),
        "subjectivity": int(subjectivity * 100),
        "word_count": word_count,
        "reading_time": reading_time_str,
        "themes": ", ".join(themes),
        "key_words": ", ".join(key_words) if key_words else "None detected",
        "emojis": emojis
    }

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    review = data.get("review", "")
    analysis = detailed_analysis(review)
    return jsonify(analysis)

@app.route("/search", methods=["POST"])
def search_movie():
    data = request.get_json()
    query = data.get("query", "")
    
    movie_info = search_movie_mock(query)
    
    # Analyze the reviews
    analyzed_reviews = [detailed_analysis(r) for r in movie_info["reviews"]]
    
    # Aggregate sentiment
    if not analyzed_reviews:
        avg_conf = 0
        overall = "Neutral"
        pos_count = 0
        neg_count = 0
        neu_count = 0
    else:
        avg_conf = sum(s["confidence"] for s in analyzed_reviews) // len(analyzed_reviews)
        pos_count = sum(1 for s in analyzed_reviews if s["sentiment"] == "Positive")
        neg_count = sum(1 for s in analyzed_reviews if s["sentiment"] == "Negative")
        neu_count = len(analyzed_reviews) - pos_count - neg_count
        
        if pos_count > neg_count:
            overall = "Positive"
        elif neg_count > pos_count:
            overall = "Negative"
        else:
            overall = "Neutral"
            
    return jsonify({
        "movie": movie_info,
        "sentiment": overall,
        "confidence": avg_conf,
        "reviews": analyzed_reviews,
        "stats": {
            "positive": pos_count,
            "negative": neg_count,
            "neutral": neu_count
        }
    })

if __name__ == "__main__":
    app.run(debug=True)
