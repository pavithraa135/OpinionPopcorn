"use strict";

window.onload = function () {

const reviewInput = document.getElementById("review-input");
const analyseBtn = document.getElementById("analyse-btn");
const resetBtn = document.getElementById("reset-btn");

const verdictLabel = document.getElementById("verdict-label");
const verdictEmoji = document.getElementById("verdict-emoji");
const gaugePct = document.getElementById("gauge-pct");
const gaugeFill = document.getElementById("gauge-fill");

const stateIdle = document.getElementById("state-idle");
const stateLoading = document.getElementById("state-loading");
const stateResult = document.getElementById("state-result");

const samplePos = document.getElementById("sample-pos");
const sampleNeg = document.getElementById("sample-neg");
const sampleMid = document.getElementById("sample-mid");

if (samplePos) samplePos.onclick = () => {
reviewInput.value = "The movie was amazing and fantastic, I loved it.";
};

if (sampleNeg) sampleNeg.onclick = () => {
reviewInput.value = "The movie was terrible and boring.";
};

if (sampleMid) sampleMid.onclick = () => {
reviewInput.value = "The movie was okay, some parts were good.";
};

analyseBtn.onclick = async function () {

```
const review = reviewInput.value.trim();
if (!review) return;

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

  const data = await response.json();

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

  stateLoading.hidden = true;
  stateResult.hidden = false;

} catch (e) {
  console.log(e);
  stateLoading.hidden = true;
  stateIdle.hidden = false;
}
```

};

if (resetBtn) {
resetBtn.onclick = () => {
reviewInput.value = "";
stateIdle.hidden = false;
stateLoading.hidden = true;
stateResult.hidden = true;
};
}
};
