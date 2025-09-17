/**
 * uiController.js
 * ----------------------
 * Handles all UI-related functionality for the AI Interview Coach.
 */

// ----------------------
// DOM ELEMENT REFERENCES
// ----------------------
const screens = {
  welcome: document.getElementById("welcome-screen"),
  setup: document.getElementById("setup-screen"),
  interview: document.getElementById("main-interview-screen"),
  report: document.getElementById("final-report-screen"),
};

// ----------------------
// SCREEN MANAGEMENT
// ----------------------
function showScreen(screenName) {
  Object.values(screens).forEach((screen) => screen.classList.remove("visible"));
  screens[screenName].classList.add("visible");
}

// ----------------------
// NOTIFICATIONS
// ----------------------
function showNotification(message, type = "success") {
  const notification = document.getElementById("notification");
  notification.textContent = message;
  notification.className = `notification show ${type}`;

  setTimeout(() => {
    notification.classList.remove("show");
  }, 3000);
}

// ----------------------
// QUESTION DISPLAY
// ----------------------
function displayCurrentQuestion() {
  if (currentQuestionIndex < questions.length) {
    const questionText = questions[currentQuestionIndex].text;
    questionTextElement.textContent = questionText;
    questionCounterElement.textContent = `Question ${currentQuestionIndex + 1}/${totalQuestions}`;
    answerBtn.disabled = false;

    if (currentQuestionIndex === 0) showNotification("Interview started!", "success");

    currentQuestionIndex++;
    speak(questionText);
  } else if (!isFetchingQuestions) {
    endInterview();
  } else {
    questionTextElement.textContent = "Loading Interview Questions...";
  }
}

// ----------------------
// CHART RENDERING
// ----------------------
function renderCharts(containerElement, data, index) {
  // 🕵️‍♂️ DEBUGGING LOG 10: Confirming renderCharts is being called
  console.log(`DEBUG 10 (Item ${index}): renderCharts function called.`);

  // Posture chart
  if (data.postureAnalysis?.data) {
    const canvasId = `#postureChart_${index}`;
    // 🕵️‍♂️ DEBUGGING LOG 11: Checking if the canvas element can be found
    const postureCanvas = containerElement.querySelector(canvasId);
    console.log(`DEBUG 11 (Item ${index}): Searching for canvas with ID "${canvasId}". Found element:`, postureCanvas);

    if (postureCanvas) {
      const postureCtx = postureCanvas.getContext("2d");
      const postureLabels = Object.keys(data.postureAnalysis.data);
      const postureValues = Object.values(data.postureAnalysis.data);

      // 🕵️‍♂️ DEBUGGING LOG 12: Inspecting the data being passed to the chart constructor
      console.log(`DEBUG 12 (Item ${index}): Preparing to draw Posture chart with labels:`, postureLabels, `and data:`, postureValues);

      new Chart(postureCtx, {
        type: "doughnut",
        data: {
          labels: postureLabels,
          datasets: [
            {
              data: postureValues,
              backgroundColor: ["#28A745", "#E63946", "#FFC107", "#1E6FBF", "#9966FF"],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "bottom" } },
        },
      });
      // 🕵️‍♂️ DEBUGGING LOG 13: Confirmation that the Chart constructor was called without error
      console.log(`DEBUG 13 (Item ${index}): ✅ Chart.js constructor called for Posture chart.`);
    }
  }

  // Emotion chart
  if (data.emotionAnalysis?.data) {
    const canvasId = `#emotionChart_${index}`;
    // 🕵️‍♂️ DEBUGGING LOG 11: Checking if the canvas element can be found
    const emotionCanvas = containerElement.querySelector(canvasId);
    console.log(`DEBUG 11 (Item ${index}): Searching for canvas with ID "${canvasId}". Found element:`, emotionCanvas);

    if (emotionCanvas) {
      const emotionCtx = emotionCanvas.getContext("2d");
      const emotionLabels = Object.keys(data.emotionAnalysis.data);
      const emotionValues = Object.values(data.emotionAnalysis.data);

      // 🕵️‍♂️ DEBUGGING LOG 12: Inspecting the data being passed to the chart constructor
      console.log(`DEBUG 12 (Item ${index}): Preparing to draw Emotion chart with labels:`, emotionLabels, `and data:`, emotionValues);

      new Chart(emotionCtx, {
        type: "doughnut",
        data: {
          labels: emotionLabels,
          datasets: [
            {
              data: emotionValues,
              backgroundColor: ["#4BC0C0", "#FF6384", "#FFCE56", "#9966FF", "#36A2EB", "#E63946"],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "bottom" } },
        },
      });
      // 🕵️‍♂️ DEBUGGING LOG 13: Confirmation that the Chart constructor was called without error
      console.log(`DEBUG 13 (Item ${index}): ✅ Chart.js constructor called for Emotion chart.`);
    }
  }
}

// ----------------------
// THEME TOGGLE
// ----------------------
document.addEventListener("DOMContentLoaded", () => {
  const themeToggleBtn = document.getElementById("theme-toggle-btn");

  const applyTheme = (theme) => {
    if (theme === "dark") {
      document.body.classList.add("dark-theme");
      themeToggleBtn.textContent = "☀️";
    } else {
      document.body.classList.remove("dark-theme");
      themeToggleBtn.textContent = "🌙";
    }
  };

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) applyTheme(savedTheme);

  themeToggleBtn.addEventListener("click", () => {
    const isDark = document.body.classList.contains("dark-theme");
    if (isDark) {
      localStorage.removeItem("theme");
      applyTheme("light");
    } else {
      localStorage.setItem("theme", "dark");
      applyTheme("dark");
    }
  });
});
