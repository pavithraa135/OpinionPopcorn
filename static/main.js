"use strict";

/* WAIT UNTIL FULL PAGE LOAD */
window.onload = function () {

const reviewInput = document.getElementById("review-input");
const charCount = document.getElementById("char-count");
const analyseBtn = document.getElementById("analyse-btn");
const resetBtn = document.getElementById("reset-btn");

const samplePos = document.getElementById("sample-pos");
const sampleNeg = document.getElementById("sample-neg");
const sampleMid = document.getElementById("sample-mid");

/* 🔥 SAMPLE BUTTON FIX (GUARANTEED) */
[samplePos, sampleNeg, sampleMid].forEach(btn => {
if (!btn) return;

```
btn.onclick = function () {
  const text = this.getAttribute("data-review");
  reviewInput.value = text;
  charCount.textContent = text.length;
  reviewInput.focus();
};
```

});

/* CHAR COUNT */
reviewInput.addEventListener("input", () => {
charCount.textContent = reviewInput.value.length;
});

/* STATES */
const stateIdle = document.getElementById("state-idle");
const stateLoading = document.getElementById("state-loading");
const stateResult = document.getElementById("state-result");

function showState(state) {
stateIdle.hidden = state !== "idle";
stateLoading.hidden = state !== "loading";
stateResult.hidden = state !== "result";
}

/* RESULT ELEMENTS */
const verdictSplash = document.getElementById("verdict-splash");
const verdictEmoji = document.getElementById("verdict-emoji");
const verdictLabel = document.getElementById("verdict-label");
const gaugePct = document.getElementById("gauge-pct");
const gaugeFill = document.getElementById("gauge-fill");
const gaugeGlow = document.getElementById("gauge-glow");

function renderResult(data) {
const isPositive = data.sentiment === "Positive";

```
verdictSplash.classList.remove("pos", "neg");
verdictSplash.classList.add(isPositive ? "pos" : "neg");

verdictEmoji.textContent = isPositive ? "🎉" : "👎";
verdictLabel.textContent = data.sentiment;

let raw = data.confidence / 100;
let boosted = raw * 0.5 + 0.5;
let pct = (boosted * 100).toFixed(1);

gaugePct.textContent = pct + "%";

const fillColor = isPositive
  ? "linear-gradient(90deg, #d97706, #f5a623, #fbbf24)"
  : "linear-gradient(90deg, #be123c, #e05c69, #fb7185)";

gaugeFill.style.width = pct + "%";
gaugeFill.style.background = fillColor;
gaugeGlow.style.width = pct + "%";

showState("result");
```

}

/* ANALYSE */
async function analyse() {
const review = reviewInput.value.trim();
if (!review || review.length < 5) return;

```
analyseBtn.disabled = true;
showState("loading");

try {
  const resp = await fetch("/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({review: review }),
  });

  const data = await resp.json();
  setTimeout(() => renderResult(data), 300);

} catch {
  showState("idle");
} finally {
  analyseBtn.disabled = false;
}
```

}

analyseBtn.onclick = analyse;

resetBtn.onclick = () => {
reviewInput.value = "";
charCount.textContent = "0";
showState("idle");
};
};
