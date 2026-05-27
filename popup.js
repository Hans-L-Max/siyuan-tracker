/**
 * @file popup.js
 * @description Controls UI logic, data aggregation and view toggling in the Extension's popup dialog.
 * Leverages ES2026 data grouping standard pipelines for clean, responsive visualization updates.
 * @version 1.3.0
 */

document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const outputContainer = document.getElementById("output");
  const tabDateBtn = document.getElementById("tabDate");
  const tabRatingBtn = document.getElementById("tabRating");
  const clearDataBtn = document.getElementById("clearData");

  /** @type {'date' | 'rating'} */
  let activeViewMode = "date";

  /**
   * Generates a structural localized fallback element if no review entries exist.
   * @returns {string} Fully formed HTML element string.
   */
  const getEmptyStateMarkup = () => `
    <div class="data-row" style="justify-content: center; color: var(--muted); font-size: 0.85rem;">
      Keine Daten erfasst. Lern fleißig!
    </div>
  `;

  /**
   * Main rendering processor calculating flashcard metrics.
   * @returns {void}
   */
  const updateAnalyticsDashboard = () => {
    browser.storage.local.get({ reviews: [] })
      .then((data) => {
        const { reviews } = data;
        outputContainer.innerHTML = "";

        if (reviews.length === 0) {
          outputContainer.innerHTML = getEmptyStateMarkup();
          return;
        }

        if (activeViewMode === "date") {
          renderChronologicalMetrics(reviews);
        } else {
          renderQualitativeMetrics(reviews);
        }
      })
      .catch((error) => {
        console.error("[SiYuan Tracker Dashboard] Error processing data payload:", error);
      });
  };

  /**
   * Aggregates and renders analytics grouped chronologically by calendar date.
   * Utilizing modern Object.groupBy pattern architectures.
   * @param {Array<{date: string, timestamp: number, rating: string}>} reviews - Raw storage arrays.
   * @returns {void}
   */
  const renderChronologicalMetrics = (reviews) => {
    const historicalGroupings = Object.groupBy(reviews, (item) => item.date);
    const timelineKeysSorted = Object.keys(historicalGroupings).sort((a, b) => b.localeCompare(a));

    timelineKeysSorted.forEach((calendarDate) => {
      const activeSessionReviews = historicalGroupings[calendarDate];
      
      const distributionCounts = activeSessionReviews.reduce((accumulator, currentElement) => {
        accumulator[currentElement.rating] = (accumulator[currentElement.rating] || 0) + 1;
        return accumulator;
      }, {});

      const dashboardRowElement = document.createElement("div");
      dashboardRowElement.className = "data-row";
      dashboardRowElement.innerHTML = `
        <div>
          <div class="meta-title">${calendarDate}</div>
          <div class="meta-subtitle">Gesamt gelernt: ${activeSessionReviews.length}</div>
        </div>
        <div class="badge-container">
          ${Object.entries(distributionCounts).map(([ratingLabel, frequencyCount]) => `
            <span class="badge ${ratingLabel}" title="${ratingLabel}">${frequencyCount}</span>
          `).join("")}
        </div>
      `;
      outputContainer.appendChild(dashboardRowElement);
    });
  };

  /**
   * Aggregates and renders analytics categorized purely by answer quality ratings.
   * @param {Array<{date: string, timestamp: number, rating: string}>} reviews - Raw storage arrays.
   * @returns {void}
   */
  const renderQualitativeMetrics = (reviews) => {
    const metricsGroupedByRating = Object.groupBy(reviews, (item) => item.rating);
    const linearPresentationOrder = ["Easy", "Good", "Hard", "Again"];

    linearPresentationOrder.forEach((ratingKey) => {
      const isolatedReviewsCollection = metricsGroupedByRating[ratingKey] || [];
      
      const dashboardRowElement = document.createElement("div");
      dashboardRowElement.className = "data-row";
      dashboardRowElement.innerHTML = `
        <div>
          <span class="badge ${ratingKey}" style="font-size: 0.8rem; padding: 4px 8px;">${ratingKey}</span>
        </div>
        <div class="meta-title">
          <strong>${isolatedReviewsCollection.length}</strong> Mal gewählt
        </div>
      `;
      outputContainer.appendChild(dashboardRowElement);
    });
  };

  // Event Orchestration Bindings
  tabDateBtn.addEventListener("click", () => {
    activeViewMode = "date";
    tabDateBtn.classList.add("active");
    tabDateBtn.setAttribute("aria-selected", "true");
    tabRatingBtn.classList.remove("active");
    tabRatingBtn.setAttribute("aria-selected", "false");
    updateAnalyticsDashboard();
  });

  tabRatingBtn.addEventListener("click", () => {
    activeViewMode = "rating";
    tabRatingBtn.classList.add("active");
    tabRatingBtn.setAttribute("aria-selected", "true");
    tabDateBtn.classList.remove("active");
    tabDateBtn.setAttribute("aria-selected", "false");
    updateAnalyticsDashboard();
  });

  clearDataBtn.addEventListener("click", () => {
    if (confirm("Möchtest du alle aufgezeichneten Lernstatistiken unwiderruflich löschen?")) {
      browser.storage.local.set({ reviews: [] })
        .then(() => updateAnalyticsDashboard());
    }
  });

  // Initial Boot Run Execution
  updateAnalyticsDashboard();
});