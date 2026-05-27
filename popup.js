/**
 * @file popup.js
 * @description Controls UI logic, data aggregation and view toggling in the Extension's popup dialog.
 * Fully compliant with Mozilla Security Standards (No innerHTML, pure DOM manipulation).
 * @version 1.3.1
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
   * Renders a secure fallback element if no review entries exist.
   * @returns {void}
   */
  const renderEmptyState = () => {
    const row = document.createElement("div");
    row.className = "data-row";
    row.style.justifyContent = "center";
    row.style.color = "var(--muted)";
    row.style.fontSize = "0.85rem";
    row.textContent = "Keine Daten erfasst. Lern fleißig!";
    outputContainer.appendChild(row);
  };

  /**
   * Main rendering processor calculating flashcard metrics.
   * @returns {void}
   */
  const updateAnalyticsDashboard = () => {
    browser.storage.local.get({ reviews: [] })
      .then((data) => {
        const { reviews } = data;
        
        // Sicherer Reset des Containers ohne innerHTML zu nutzen
        outputContainer.textContent = "";

        if (reviews.length === 0) {
          renderEmptyState();
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

      // Sicheres Erstellen des Zeilen-Containers
      const dashboardRowElement = document.createElement("div");
      dashboardRowElement.className = "data-row";

      const metaContainer = document.createElement("div");
      
      const titleEl = document.createElement("div");
      titleEl.className = "meta-title";
      titleEl.textContent = calendarDate;

      const subtitleEl = document.createElement("div");
      subtitleEl.className = "meta-subtitle";
      subtitleEl.textContent = `Gesamt gelernt: ${activeSessionReviews.length}`;

      metaContainer.appendChild(titleEl);
      metaContainer.appendChild(subtitleEl);

      const badgeContainer = document.createElement("div");
      badgeContainer.className = "badge-container";

      Object.entries(distributionCounts).forEach(([ratingLabel, frequencyCount]) => {
        const badge = document.createElement("span");
        badge.className = `badge ${ratingLabel}`;
        badge.title = ratingLabel;
        badge.textContent = String(frequencyCount);
        badgeContainer.appendChild(badge);
      });

      dashboardRowElement.appendChild(metaContainer);
      dashboardRowElement.appendChild(badgeContainer);
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

      const badgeWrap = document.createElement("div");
      const badge = document.createElement("span");
      badge.className = `badge ${ratingKey}`;
      badge.style.fontSize = "0.8rem";
      badge.style.padding = "4px 8px";
      badge.textContent = ratingKey;
      badgeWrap.appendChild(badge);

      const statsWrap = document.createElement("div");
      statsWrap.className = "meta-title";
      
      const counterStrong = document.createElement("strong");
      counterStrong.textContent = String(isolatedReviewsCollection.length);
      
      statsWrap.appendChild(counterStrong);
      statsWrap.append(" Mal gewählt");

      dashboardRowElement.appendChild(badgeWrap);
      dashboardRowElement.appendChild(statsWrap);
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