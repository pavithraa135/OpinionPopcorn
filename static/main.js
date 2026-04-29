"use strict";

window.onload = function () {

const reviewInput = document.getElementById("review-input");
const analyseBtn = document.getElementById("analyse-btn");
const resetBtn = document.getElementById("reset-btn");

const verdictLabel = document.getElementById("verdict-label");
const verdictEmoji = document.getElementById("verdict-emoji");
const gaugePct = document.getElementById("gauge-pct");
const gaugeFill = document.getElementById("gauge-fill");


const resultDetailsEl = document.getElementById("result-details");

const tabAnalyze = document.getElementById("tab-analyze");
const tabSearch = document.getElementById("tab-search");
const modeAnalyze = document.getElementById("mode-analyze");
const modeSearch = document.getElementById("mode-search");
const movieSearchInput = document.getElementById("movie-search-input");
const searchBtn = document.getElementById("search-btn");

const stateIdle = document.getElementById("state-idle");
const stateLoading = document.getElementById("state-loading");
const stateResult = document.getElementById("state-result");

const samplePos = document.getElementById("sample-pos");
const sampleNeg = document.getElementById("sample-neg");
const sampleMid = document.getElementById("sample-mid");

const ms1 = document.getElementById("movie-sample-1");
const ms2 = document.getElementById("movie-sample-2");
const ms3 = document.getElementById("movie-sample-3");

if (ms1) ms1.onclick = () => { movieSearchInput.value = ms1.getAttribute("data-movie"); searchBtn.click(); };
if (ms2) ms2.onclick = () => { movieSearchInput.value = ms2.getAttribute("data-movie"); searchBtn.click(); };
if (ms3) ms3.onclick = () => { movieSearchInput.value = ms3.getAttribute("data-movie"); searchBtn.click(); };

if (tabAnalyze) tabAnalyze.onclick = () => {
  tabAnalyze.style.background = "rgba(124,106,247,0.2)";
  tabAnalyze.style.color = "white";
  tabSearch.style.background = "transparent";
  tabSearch.style.color = "var(--t-3)";
  modeAnalyze.style.display = "block";
  modeSearch.style.display = "none";
};

if (tabSearch) tabSearch.onclick = () => {
  tabSearch.style.background = "rgba(45,212,191,0.2)";
  tabSearch.style.color = "white";
  tabAnalyze.style.background = "transparent";
  tabAnalyze.style.color = "var(--t-3)";
  modeAnalyze.style.display = "none";
  modeSearch.style.display = "block";
};

const charCountEl = document.getElementById("char-count");
let lastReportText = ""; 
let lastReviewTextForTTS = ""; // Global to hold text for audio playback

function updateCharCount() {
  if (charCountEl) {
    charCountEl.textContent = reviewInput.value.length;
  }
}

function saveToHistory(text, type, score) {
    let history = JSON.parse(localStorage.getItem("op_history") || "[]");
    history.unshift({ text: text, type: type, score: score });
    if (history.length > 4) history.pop();
    localStorage.setItem("op_history", JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    const container = document.getElementById("history-container");
    if (!container) return;
    
    let history = JSON.parse(localStorage.getItem("op_history") || "[]");
    if (history.length === 0) {
        container.innerHTML = '<span style="color: var(--t-4); font-size: 0.8rem; font-style: italic;">No recent activity yet.</span>';
        return;
    }
    
    container.innerHTML = history.map(h => `
        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-dim); border-radius: 8px; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center; cursor: default; transition: background 0.2s ease;" onmouseover="this.style.background='rgba(255,255,255,0.06)'" onmouseout="this.style.background='rgba(255,255,255,0.03)'">
            <div style="display: flex; flex-direction: column; gap: 4px; overflow: hidden;">
                <span style="color: white; font-size: 0.8rem; font-weight: bold;">${h.type === 'search' ? '🔎 Movie Search' : '✍️ Review'}</span>
                <span style="color: var(--t-3); font-size: 0.75rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;">${h.text}</span>
            </div>
            <span style="font-size: 0.7rem; padding: 3px 6px; border-radius: 4px; font-weight: bold; background: rgba(124,106,247,0.2); color: var(--violet-lt);">${h.score}</span>
        </div>
    `).join('');
}

renderHistory();

if (reviewInput) {
  reviewInput.addEventListener("input", updateCharCount);
  reviewInput.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "Enter") {
      analyseBtn.click();
    }
  });
}

if (movieSearchInput) {
  movieSearchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      searchBtn.click();
    }
  });
}

if (samplePos) samplePos.onclick = () => {
  reviewInput.value = samplePos.getAttribute("data-review") || "An absolute masterpiece. The performances were breathtaking and deeply moving.";
  updateCharCount();
};

if (sampleNeg) sampleNeg.onclick = () => {
  reviewInput.value = sampleNeg.getAttribute("data-review") || "Absolutely dreadful. The plot made no sense and acting was terrible.";
  updateCharCount();
};

if (sampleMid) sampleMid.onclick = () => {
  reviewInput.value = sampleMid.getAttribute("data-review") || "It was okay. Some parts were good but overall average.";
  updateCharCount();
};

analyseBtn.onclick = async function () {

const review = reviewInput.value.trim();
if (!review) {
  alert("Please enter a movie review first!");
  return;
}

console.log("Sending review:", review);

stateIdle.hidden = true;
stateLoading.hidden = false;
stateResult.hidden = true;

try {
  const response = await fetch("/predict", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ review: review })
  });

  console.log("Response status:", response.status);
  
  if (!response.ok) {
    throw new Error("Server error: " + response.status);
  }

  const data = await response.json();
  console.log("Response data:", data);

  verdictLabel.textContent = data.sentiment;

  if (data.sentiment === "Positive") {
    verdictEmoji.textContent = "😊";
  } else if (data.sentiment === "Neutral") {
    verdictEmoji.textContent = "😐";
  } else {
    verdictEmoji.textContent = "👎";
  }

  gaugePct.textContent = data.confidence + "%";
  gaugeFill.style.width = data.confidence + "%";

  if (resultDetailsEl) {
    const keywordsHtml = data.key_words && data.key_words !== "None detected" 
      ? data.key_words.split(',').map(kw => `<span style="background: rgba(124,106,247,0.15); border: 1px solid rgba(124,106,247,0.3); color: var(--violet-lt); padding: 4px 10px; border-radius: 8px; font-size: 0.75rem; margin-right: 6px; display: inline-block; margin-bottom: 6px; font-weight: 500;">${kw.trim()}</span>`).join('') 
      : "<span style='color: var(--t-4); font-style: italic;'>None detected</span>";

    resultDetailsEl.innerHTML = `
      <div class="detail-card">
        <div class="detail-label">Vibe Summary</div>
        <div class="detail-val" style="font-size: 1.5rem; letter-spacing: 5px;">${data.emojis}</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">Words / Read Time</div>
        <div class="detail-val mono"><span>${data.word_count}</span> • <span>${data.reading_time}</span></div>
      </div>
      <div class="detail-card">
        <div class="detail-label">Subjectivity</div>
        <div class="detail-val mono">${data.subjectivity}% <span style="font-size:0.7rem; color:var(--t-3);">${data.subjectivity < 50 ? '(Factual)' : '(Opinionated)'}</span></div>
      </div>
      <div class="detail-card">
        <div class="detail-label">Themes Detected</div>
        <div class="detail-val">${data.themes || "General"}</div>
      </div>
      <div class="detail-card" style="grid-column: span 2;">
        <div class="detail-label" style="margin-bottom: 8px;">Key Terms Highlighted</div>
        <div class="detail-val" style="display: flex; flex-wrap: wrap;">${keywordsHtml}</div>
      </div>
    `;
  }

  lastReviewTextForTTS = data.text;

  // Create downloadable report
  lastReportText = `OPINION POPCORN - REVIEW ANALYSIS REPORT\n` +
                   `----------------------------------------\n` +
                   `Review: "${data.text}"\n\n` +
                   `Overall Sentiment : ${data.sentiment}\n` +
                   `Confidence Score  : ${data.confidence}%\n` +
                   `Subjectivity      : ${data.subjectivity}% ${data.subjectivity < 50 ? '(Factual)' : '(Opinionated)'}\n` +
                   `Reading Time      : ${data.reading_time} (${data.word_count} words)\n` +
                   `Themes Detected   : ${data.themes || "General"}\n` +
                   `Key Terms         : ${data.key_words || "None"}\n`;

  saveToHistory(review, 'analysis', data.sentiment);
  stateLoading.hidden = true;
  stateResult.hidden = false;

} catch (e) {
  console.log(e);
  alert("Error: " + e.message + "\n\nCheck console for details.");
  stateLoading.hidden = true;
  stateIdle.hidden = false;
}

};

if (searchBtn) searchBtn.onclick = async function () {
  const query = movieSearchInput.value.trim();
  if (!query) {
    alert("Please enter a movie name to search!");
    return;
  }

  stateIdle.hidden = true;
  stateLoading.hidden = false;
  stateResult.hidden = true;

  try {
    const response = await fetch("/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: query })
    });

    if (!response.ok) throw new Error("Server error: " + response.status);

    const data = await response.json();

    verdictLabel.textContent = data.sentiment;
    if (data.sentiment === "Positive") verdictEmoji.textContent = "😊";
    else if (data.sentiment === "Neutral") verdictEmoji.textContent = "😐";
    else verdictEmoji.textContent = "👎";

    gaugePct.textContent = data.confidence + "%";
    gaugeFill.style.width = data.confidence + "%";

    const reviewsHtml = data.reviews.map(r => `
      <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; font-size: 0.8rem; display: flex; flex-direction: column; gap: 4px;">
        <div style="display: flex; justify-content: space-between;">
            <span style="font-weight: bold; color: ${r.sentiment === 'Positive' ? 'var(--gold)' : r.sentiment === 'Negative' ? 'var(--rose)' : 'white'};">${r.sentiment}</span>
            <span style="color: var(--t-3); font-size: 0.7rem;">Conf: ${r.confidence}%</span>
        </div>
        <span style="color: var(--t-1); font-style: italic;">"${r.text}"</span>
      </div>
    `).join("");

    if (resultDetailsEl) {
      resultDetailsEl.innerHTML = `
        <div class="detail-card" style="grid-column: span 2; display: flex; gap: 15px; align-items: center;">
          <div style="font-size: 3.5rem; flex-shrink: 0; line-height: 1;">${data.movie.poster}</div>
          <div>
            <div class="detail-label" style="font-size: 1.1rem; color: white;">${data.movie.title}</div>
            <div style="font-size: 0.85rem; color: var(--t-2); line-height: 1.5; margin-top: 6px;">${data.movie.summary}</div>
          </div>
        </div>
        <div class="detail-card" style="grid-column: span 2; display: flex; align-items: center; justify-content: center; height: 180px;">
          <canvas id="sentimentChart"></canvas>
        </div>
        <div class="detail-card" style="grid-column: span 2;">
          <div class="detail-label" style="margin-bottom: 12px;">Aggregated Reviews</div>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${reviewsHtml}
          </div>
        </div>
      `;
      
      const ctx = document.getElementById('sentimentChart').getContext('2d');
      new Chart(ctx, {
          type: 'doughnut',
          data: {
              labels: ['Positive', 'Neutral', 'Negative'],
              datasets: [{
                  data: [data.stats.positive, data.stats.neutral, data.stats.negative],
                  backgroundColor: ['#f5a623', '#2dd4bf', '#e05c69'],
                  borderWidth: 0,
                  hoverOffset: 4
              }]
          },
          options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                  legend: { position: 'right', labels: { color: '#eeeeff', font: { family: 'Inter' } } }
              }
          }
      });
    }

    lastReportText = `OPINION POPCORN - MOVIE SEARCH REPORT\n` +
                     `----------------------------------------\n` +
                     `Movie   : ${data.movie.title}\n` +
                     `Summary : ${data.movie.summary}\n\n` +
                     `Aggregated Sentiment : ${data.sentiment}\n` +
                     `Confidence Avg       : ${data.confidence}%\n` +
                     `Total Reviews        : ${data.reviews.length}\n` +
                     `Breakdown            : Positive: ${data.stats.positive} | Neutral: ${data.stats.neutral} | Negative: ${data.stats.negative}\n\n` +
                     `TOP REVIEWS:\n` +
                     data.reviews.map((r, i) => `[${i+1}] ${r.sentiment} (${r.confidence}%) - "${r.text}"`).join("\n");

    lastReviewTextForTTS = data.movie.summary;
    saveToHistory(query, 'search', data.sentiment);
    stateLoading.hidden = true;
    stateResult.hidden = false;

  } catch (e) {
    console.log(e);
    alert("Error: " + e.message + "\n\nCheck console for details.");
    stateLoading.hidden = true;
    stateIdle.hidden = false;
  }
};

const downloadBtn = document.getElementById("download-btn");
if (downloadBtn) {
  downloadBtn.onclick = () => {
    if (!lastReportText) return;
    const blob = new Blob([lastReportText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "OpinionPopcorn_Report.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
}

const listenBtn = document.getElementById("listen-btn");
if (listenBtn) {
  listenBtn.onclick = () => {
    if (!lastReviewTextForTTS) return;
    window.speechSynthesis.cancel(); // Stop any currently playing audio
    const utterance = new SpeechSynthesisUtterance(lastReviewTextForTTS);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };
}

if (resetBtn) {
  resetBtn.onclick = () => {
    reviewInput.value = "";
    movieSearchInput.value = "";
    stateIdle.hidden = false;
    stateLoading.hidden = true;
    stateResult.hidden = true;
  };
}
};
