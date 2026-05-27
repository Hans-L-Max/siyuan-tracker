/**
 * @file popup.js
 * @description Controls UI logic, data aggregation and view toggling in the Extension's popup dialog.
 * Fully compliant with Mozilla Security Standards (No innerHTML, pure DOM manipulation).
 * @version 1.4.0
 */

document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const outputContainer = document.getElementById("output");
  const tabDateBtn = document.getElementById("tabDate");
  const tabRatingBtn = document.getElementById("tabRating");
  const tabHistoryBtn = document.getElementById("tabHistory");
  const clearDataBtn = document.getElementById("clearData");

  /** @type {'date' | 'rating' | 'history'} */
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
        
        outputContainer.textContent = "";

        if (reviews.length === 0) {
          renderEmptyState();
          return;
        }

        if (activeViewMode === "date") {
          renderChronologicalMetrics(reviews);
        } else if (activeViewMode === "rating") {
          renderQualitativeMetrics(reviews);
        } else if (activeViewMode === "history") {
          renderHistoryMetrics(reviews);
        }
      })
      .catch((error) => {
        console.error("[SiYuan Tracker Dashboard] Error processing data payload:", error);
      });
  };

  /**
   * Aggregates and renders analytics grouped chronologically by calendar date.
   * @param {Array<{date: string, timestamp: number, rating: string}>} reviews
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
   * @param {Array<{date: string, timestamp: number, rating: string}>} reviews
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

  /**
   * Renders the raw chronological history of all reviews, allowing individual deletion.
   * @param {Array<{date: string, timestamp: number, rating: string}>} reviews
   */
  const renderHistoryMetrics = (reviews) => {
    // Neueste Einträge ganz oben (absteigend sortieren)
    const sortedReviews = [...reviews].sort((a, b) => b.timestamp - a.timestamp);

    sortedReviews.forEach((item) => {
      const dashboardRowElement = document.createElement("div");
      dashboardRowElement.className = "data-row";
      dashboardRowElement.style.padding = "8px 12px"; // Etwas kompakter für Listen

      // Linke Seite: Datum und formatierte Uhrzeit
      const metaContainer = document.createElement("div");
      
      const titleEl = document.createElement("div");
      titleEl.className = "meta-title";
      titleEl.textContent = item.date;

      const subtitleEl = document.createElement("div");
      subtitleEl.className = "meta-subtitle";
      const timeString = new Date(item.timestamp).toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
      subtitleEl.textContent = `${timeString} Uhr`;

      metaContainer.appendChild(titleEl);
      metaContainer.appendChild(subtitleEl);

      // Rechte Seite: Badge + Lösch-Button
      const rightContainer = document.createElement("div");
      rightContainer.style.display = "flex";
      rightContainer.style.alignItems = "center";
      rightContainer.style.gap = "10px";

      const badge = document.createElement("span");
      badge.className = `badge ${item.rating}`;
      badge.textContent = item.rating;

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "✕";
      deleteBtn.className = "clear-btn";
      deleteBtn.style.padding = "2px 6px";
      deleteBtn.title = "Diesen Eintrag löschen";

      // Lösch-Logik für genau diesen Eintrag anhand des einmaligen Timestamps
      deleteBtn.addEventListener("click", () => {
        browser.storage.local.get({ reviews: [] }).then(data => {
          const filteredReviews = data.reviews.filter(r => r.timestamp !== item.timestamp);
          return browser.storage.local.set({ reviews: filteredReviews });
        }).then(() => {
          updateAnalyticsDashboard(); // Lade die Liste sofort flüssig neu
        });
      });

      rightContainer.appendChild(badge);
      rightContainer.appendChild(deleteBtn);

      dashboardRowElement.appendChild(metaContainer);
      dashboardRowElement.appendChild(rightContainer);
      outputContainer.appendChild(dashboardRowElement);
    });
  };

  /**
   * Helper function to manage tab state classes
   * @param {HTMLElement} activeBtn 
   * @param {string} mode 
   */
  const switchTab = (activeBtn, mode) => {
    activeViewMode = mode;
    
    [tabDateBtn, tabRatingBtn, tabHistoryBtn].forEach(btn => {
      btn.classList.remove("active");
      btn.setAttribute("aria-selected", "false");
    });

    activeBtn.classList.add("active");
    activeBtn.setAttribute("aria-selected", "true");
    
    updateAnalyticsDashboard();
  };

  // Event Orchestration Bindings
  tabDateBtn.addEventListener("click", () => switchTab(tabDateBtn, "date"));
  tabRatingBtn.addEventListener("click", () => switchTab(tabRatingBtn, "rating"));
  tabHistoryBtn.addEventListener("click", () => switchTab(tabHistoryBtn, "history"));

  clearDataBtn.addEventListener("click", () => {
    if (confirm("Möchtest du alle aufgezeichneten Lernstatistiken unwiderruflich löschen?")) {
      browser.storage.local.set({ reviews: [] })
        .then(() => updateAnalyticsDashboard());
    }
  });

  // Initial Boot Run Execution
  updateAnalyticsDashboard();
});