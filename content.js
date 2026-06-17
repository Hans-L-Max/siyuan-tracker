/**
 * @file content.js
 * @description Injected content script designed to intercept and record flashcard reviews within SiYuan Notes.
 * It uses the event capturing phase to bypass internal event propagation restrictions and handles
 * both precision pointer events and native application keyboard shortcuts.
 * @version 1.0.0
 */

(() => {
  "use strict";

  /**
   * Internal enumeration mapping SiYuan's data-type values to clean string representations.
   * @type {Readonly<{ '1': string, '2': string, '3': string, '4': string }>}
   */
  const RATING_MAP = Object.freeze({
    "1": "Again",
    "2": "Hard",
    "3": "Good",
    "4": "Easy"
  });

  /**
   * Persists a card review event locally into the browser storage.
   * @param {string} rating - The mapped difficulty rating chosen by the user (Again, Hard, Good, Easy).
   * @returns {void}
   */
  const logReview = (rating) => {
    const today = new Date().toISOString().split("T")[0];
    const timestamp = Date.now();

    browser.storage.local.get({ reviews: [] })
      .then((data) => {
        const updatedReviews = [...data.reviews, { date: today, timestamp, rating }];
        return browser.storage.local.set({ reviews: updatedReviews });
      })
      .then(() => {
        console.info(`[SiYuan Tracker] Successfully recorded rating: "${rating}"`);
      })
      .catch((error) => {
        console.error("[SiYuan Tracker] Failed to save review entry:", error);
      });
  };

  /**
   * Handles pointer click operations on flashcard action targets.
   * Leverages the capturing phase to intercept events before internal framework halt signals.
   * @param {MouseEvent} event - The standard DOM click event object.
   * @returns {void}
   */
  const handleDeckClick = (event) => {
    if (!document.querySelector(".card__main")) {
      return;
    }

    // Precise query logic targeting the structural button node
    let button = event.target.closest("button[data-type]");

    // Fallback tolerance mechanism: capture boundary container clicks
    if (!button) {
      const outerWrapper = event.target.closest(".card__action > div");
      if (outerWrapper) {
        button = outerWrapper.querySelector("button[data-type]");
      }
    }

    if (!button) {
      return;
    }

    const dataType = button.getAttribute("data-type");
    if (RATING_MAP[dataType]) {
      logReview(RATING_MAP[dataType]);
    }
  };

  /**
   * Handles keyboard sequence shortcuts natively mapped within SiYuan Notes interface.
   * @param {KeyboardEvent} event - The standard DOM keydown event object.
   * @returns {void}
   */
  const handleKeyboardShortcut = (event) => {
    if (!document.querySelector(".card__main")) {
      return;
    }

    const activeElement = document.activeElement;
    const isInputField = activeElement && (
      activeElement.tagName === "INPUT" ||
      activeElement.tagName === "TEXTAREA" ||
      activeElement.hasAttribute("contenteditable")
    );

    if (isInputField) {
      return;
    }

    const functionalControls = document.querySelector(".card__action:not(.fn__none)");
    if (!functionalControls) {
      return;
    }

    // Double check that flashcard interactive buttons are active and visible
    const isShowAnswerScreen = functionalControls.querySelector('button[data-type="-1"]');
    if (isShowAnswerScreen) {
      return; 
    }
  
    const standardInputKey = event.key.toLowerCase();

    if (["1", "j", "a"].includes(standardInputKey)) {
      logReview("Again");
    } else if (["2", "k", "s"].includes(standardInputKey)) {
      logReview("Hard");
    } else if (["3", "l", "d", " ", "enter"].includes(standardInputKey)) {
      logReview("Good");
    } else if (["4", ";", "f"].includes(standardInputKey)) {
      logReview("Easy");
    }
  };

  // Register Event Observers using professional architectures
  document.addEventListener("click", handleDeckClick, { capture: true });
  document.addEventListener("keydown", handleKeyboardShortcut);
})();