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

function updateCharCount() {
  if (charCountEl) {
    charCountEl.textContent = reviewInput.value.length;
  }
}

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
    resultDetailsEl.innerHTML = `
      <div class="detail-card">
        <div class="detail-label">Words / Read Time</div>
        <div class="detail-val mono"><span>${data.word_count}</span> • <span>${data.reading_time}</span></div>
      </div>
      <div class="detail-card">
        <div class="detail-label">Themes Detected</div>
        <div class="detail-val">${data.themes || "General"}</div>
      </div>
      <div class="detail-card" style="grid-column: span 2;">
        <div class="detail-label">Key Terms Highlighted</div>
        <div class="detail-val">${data.key_words || "None"}</div>
      </div>
    `;
  }

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
        <div class="detail-card" style="grid-column: span 2;">
          <div class="detail-label" style="margin-bottom: 12px;">Aggregated Reviews</div>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${reviewsHtml}
          </div>
        </div>
      `;
    }

    stateLoading.hidden = true;
    stateResult.hidden = false;

  } catch (e) {
    console.log(e);
    alert("Error: " + e.message + "\n\nCheck console for details.");
    stateLoading.hidden = true;
    stateIdle.hidden = false;
  }
};

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
