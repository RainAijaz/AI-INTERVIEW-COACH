/**
 * --------------------------------------------------------------------------
 * reportGenerator.js
 * --------------------------------------------------------------------------
 * Purpose:
 * Generates a detailed AI Interview Report with:
 * - Question & Answer display
 * - Posture and Emotion charts
 * - Holistic AI feedback
 * - Answer evaluation & suggestions
 * Allows downloading the report as a multi-page PDF.
 */

/**
 * Generate the full interview report dynamically
 */
function generateReport() {
  const reportContent = document.getElementById("report-content");
  reportContent.innerHTML = "";

  // 🕵️‍♂️ DEBUGGING LOG 6: Final check of interviewData before rendering
  console.log("DEBUG 6: Generating report with this complete interviewData array:", JSON.parse(JSON.stringify(interviewData)));

  if (interviewData.length === 0) {
    reportContent.innerHTML = "<p>No answers were recorded. Practice again to see your report!</p>";
    return;
  }

  interviewData.forEach((data, index) => {
    // 🕵️‍♂️ DEBUGGING LOG 7: Inspecting each item as it's being rendered
    console.log(`DEBUG 7: Rendering report item ${index} with this data object:`, JSON.parse(JSON.stringify(data)));

    const reportItem = createReportItem(index, data);
    reportContent.appendChild(reportItem);
    renderCharts(reportItem, data, index);
  });
}

/**
 * Creates a single report item DOM element
 */
function createReportItem(index, data) {
  const reportItem = document.createElement("div");
  reportItem.id = `report-item-${index}`;
  reportItem.className = "report-item card";

  const starsHtml = (rating) => "⭐".repeat(rating || 0) + "☆".repeat(5 - (rating || 0));

  // Basic Question & Answer
  let reportHtml = `
      <h3>Question ${index + 1}: ${data.question}</h3>
      <p><strong>Your Answer:</strong> "${data.transcription}"</p>
  `;

  // Posture & Emotion Charts
  reportHtml += createChartsHtml(index, data);

  // Holistic AI feedback
  if (data.holisticFeedback && data.holisticFeedback.insight) {
    reportHtml += `
      <div class="holistic-feedback">
        <h4><span class="icon">🤖</span> AI Coach's Analysis</h4>
        <p>${data.holisticFeedback.insight}</p>
        <div class="feedback-points">
          <div><strong>⭐ Strength:</strong> ${data.holisticFeedback.strength}</div>
          <div><strong>💡 Improvement Tip:</strong> ${data.holisticFeedback.improvement_tip}</div>
        </div>
      </div>`;
  }

  // Answer Evaluation
  if (data.evaluation) {
    reportHtml += createEvaluationHtml(data.evaluation, starsHtml);
  }

  reportItem.innerHTML = reportHtml;
  return reportItem;
}

/**
 * Generates the HTML for Posture & Emotion charts
 */
function createChartsHtml(index, data) {
  // 🕵️‍♂️ DEBUGGING LOG 8: Checking the exact properties used to create the charts
  console.log(`DEBUG 8 (Item ${index}): Checking for chart data...`);
  console.log(`  - Does data.postureAnalysis exist? `, !!data.postureAnalysis);
  console.log(`  - Does data.postureAnalysis.data exist? `, !!(data.postureAnalysis && data.postureAnalysis.data));
  console.log(`  - Value of data.postureAnalysis.data:`, data.postureAnalysis ? data.postureAnalysis.data : "N/A");

  const postureChartHtml =
    data.postureAnalysis && data.postureAnalysis.data
      ? `<div class="chart-container">
          <h4>Posture Breakdown</h4>
          <canvas id="postureChart_${index}"></canvas>
        </div>`
      : "";

  const emotionChartHtml =
    data.emotionAnalysis && data.emotionAnalysis.data
      ? `<div class="chart-container">
          <h4>Emotion Breakdown</h4>
          <canvas id="emotionChart_${index}"></canvas>
        </div>`
      : "";

  // 🕵️‍♂️ DEBUGGING LOG 9: Confirming if chart HTML was generated
  console.log(`DEBUG 9 (Item ${index}): Was posture chart HTML created?`, postureChartHtml !== "");

  return postureChartHtml || emotionChartHtml ? `<div class="charts-wrapper">${postureChartHtml}${emotionChartHtml}</div>` : "";
}

/**
 * Generates the HTML for answer evaluation section
 */
function createEvaluationHtml(evaluation, starsHtml) {
  const ratings = evaluation.ratings || {};

  const howToImproveHtml =
    evaluation.howToMakeItBetter && evaluation.howToMakeItBetter.length > 0
      ? `<strong>How to Improve:</strong>
        <ul>${evaluation.howToMakeItBetter.map((tip) => `<li>${tip}</li>`).join("")}</ul>`
      : "";

  const suggestedAnswerHtml = evaluation.suggestedBetterAnswer
    ? `<details open>
        <summary class="collapsible-header">View Suggested Answer</summary>
        <div class="collapsible-content">
          <p>${evaluation.suggestedBetterAnswer}</p>
        </div>
      </details>`
    : "";

  return `
    <div class="evaluation-details">
      <h4>Answer Evaluation</h4>
      <div class="ratings-grid">
        <div class="rating-item"><strong>Clarity:</strong> <span class="stars">${starsHtml(ratings.clarity)}</span></div>
        <div class="rating-item"><strong>Relevance:</strong> <span class="stars">${starsHtml(ratings.relevance)}</span></div>
        <div class="rating-item"><strong>Completeness:</strong> <span class="stars">${starsHtml(ratings.completeness)}</span></div>
      </div>
      <p><strong>Tone Analysis:</strong> ${evaluation.sentimentTone}</p>
      <p><strong>Answer Strength:</strong> ${evaluation.answerStrength}</p>
      ${howToImproveHtml}
      ${suggestedAnswerHtml}
    </div>`;
}

/**
 * -------------------------------
 * Download Report as PDF
 * -------------------------------
 */
document.getElementById("download-report-btn").addEventListener("click", async () => {
  const { jsPDF } = window.jspdf;
  const reportElement = document.querySelector(".report-container");
  const reportControls = document.querySelector(".report-controls");

  // Hide controls & enable full scrolling
  if (reportControls) reportControls.style.display = "none";
  document.body.style.overflow = "visible";
  reportElement.classList.add("pdf-render-mode");

  // Detect background color for PDF
  const bgColor = getComputedStyle(document.body).getPropertyValue("--background") || "#ffffff";

  // Capture report as canvas
  const canvas = await html2canvas(reportElement, {
    scale: 2,
    useCORS: true,
    backgroundColor: bgColor.trim(),
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "pt", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save("AI-Interview-Report.pdf");

  // Restore UI
  if (reportControls) reportControls.style.display = "flex";
  document.body.style.overflow = "hidden";
  reportElement.classList.remove("pdf-render-mode");
});
