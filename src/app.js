/* ----------------------------------------

Sources that were immensely helpful:

- https://www.sitepoint.com/build-javascript-countdown-timer-no-dependencies/
- https://www.htmlcenter.com/blog/pausing-javascript-timers/
- https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Client-side_web_APIs/Client-side_storage
- https://kittygiraudel.com/2021/04/05/an-accessible-toggle/
- https://knplabs.com/en/blog/how2-tips-how-to-restrict-allowed-characters-inside-a-text-input-in-one-line-of-code
- https://gomakethings.com/how-to-play-a-sound-with-javascript/

---------------------------------------- */

//
// GLOBAL VARIABLES
//

// TIMES //

let defaultWorkMinutes = 25;
let defaultShortBreakMinutes = 5;
let defaultLongBreakMinutes = 20;
let tempWorkMinutes, tempShortBreakMinutes, tempLongBreakMinutes;
let minMinutes = 1;
let maxMinutes = 55;

// STATS //

let statsSessions = 0;
let statsAverageSession = 0;
let statsTotalTime = 0;

// SOUNDS //

let soundMuted = false; // Whether sound is muted
const soundChime = new Audio("/sound/rcp-chime-bell-ding-3x.mp3");
const soundClick = new Audio("/sound/rcp-click-04.mp3");

// TIMER STATE AND FUNCTIONALITY //

let timerInterval; // Timer's interval ID
let timerStartTime; // When timer starts
let timerFinishTime; // When timer stops
let timerDurationLeft; // How much time is left (used if paused)
let timerSessionStarted = false; // Whether session has started
let timerWorkSession = false; // Whether it's a work session
let timerShortBreakSession = false; // Whether it's a short break session
let timerLongBreakSession = false; // Whether it's a long break session
let timerRunning = false; // Whether timer is running
let timerSessions = 0; // The number of work sessions

// Vitally important (updated by many timer-related functions)
let timerMinutes; // Hold current session's time value
let timerMinutesInMs; // Current session's time value in ms

// UI ELEMENTS AND CLASSES //

const root = document.documentElement;

// Subdials
const divsSubdialPie = document.querySelectorAll(".subdials__pie");
const classesSubdialPie = ["one-to-ten__pie", "total__pie", "one-to-sixty__pie"];

// Toggle
const btnToggle = document.querySelector(".session-toggle__btn");

// Timer display
const divTimerDisplay = document.querySelector(".timer-display");
const spanTimerDisplayMinutes = document.querySelector(".timer-display__minutes");
const spanTimerDisplaySeconds = document.querySelector(".timer-display__seconds");

// Timer input
const divTimerInput = document.querySelector(".timer-input");
const inputTimerMinutes = document.querySelector(".timer-input__minutes");

// Controls
const btnReset = document.querySelector(".timer-reset");
const btnPlay = document.querySelector(".controls__play");
const btnPause = document.querySelector(".controls__pause");
const btnStop = document.querySelector(".controls__stop");

// Sessions
const divsSessionMarker = document.querySelectorAll(".sessions__marker");
const divSessionOne = document.querySelector(".sessions__one");
const divSessionTwo = document.querySelector(".sessions__two");
const divSessionThree = document.querySelector(".sessions__three");
const divSessionFour = document.querySelector(".sessions__four");
const classSessionCompleted = "sessions__marker_completed";

// Sound
const itemSound = document.querySelector(".menu-bar__item-sound");
const itemSoundOff = document.querySelector(".menu-bar__item-sound-off");
const btnSound = document.querySelector(".menu-bar__btn-sound");
const btnSoundOff = document.querySelector(".menu-bar__btn-sound-off");

// Stats
const btnStats = document.querySelector(".menu-bar__btn-stats");
const drawerStats = document.querySelector(".stats");
const spanStatsSessions = document.querySelector(".stats__figure-sessions");
const spanStatsAverage = document.querySelector(".stats__figure-average");
const spanStatsTotal = document.querySelector(".stats__figure-total");
const btnStatsClose = document.querySelector(".stats__btn-close");

// Settings
const btnSettings = document.querySelector(".menu-bar__btn-settings");
const drawerSettings = document.querySelector(".settings");
const inputsSettingsTime = document.querySelectorAll(".settings__input");
const inputSettingsWorkTime = document.querySelector(".settings__work-time");
const inputSettingsShortBreakTime = document.querySelector(".settings__short-break-time");
const inputSettingsLongBreaktime = document.querySelector(".settings__long-break-time");
const btnSettingsSave = document.querySelector(".settings__btn-save");
const classSettingsSaveReady = "settings__btn-save_ready";
const btnSettingsClose = document.querySelector(".settings__btn-close");

//
// FUNCTIONS
//

// HELPERS //

// Show an element
function hide(selector) {
	selector.classList.add("hidden");
}

// Hide an element
function show(selector) {
	selector.classList.remove("hidden");
}

// Decide whether an element is "clickable"
function clickable(selector, bool) {
	// If true, add clickable class
	if (bool) {
		selector.classList.add("clickable");
	}
	// False, so remove clickable class
	else {
		selector.classList.remove("clickable");
	}
}

// Add a theme class to the root element
function switchTheme(theme) {
	if (theme == "default") {
		// Remove both break classes in case either is set
		root.classList.remove("theme-short-break", "theme-long-break");
		root.classList.add("theme-default");
	}
	else if (theme == "shortbreak") {
		root.classList.remove("theme-default");
		root.classList.add("theme-short-break");
	}
	else if (theme == "longbreak") {
		root.classList.remove("theme-default");
		root.classList.add("theme-long-break");
	}
}

// Convert minutes to ms
function minutesToMs(minutes) {
	return minutes * 60 * 1000;
}

// Calculate the number of hours and minutes from a minutes value and return a formatted string
function outputNumHoursMinutes(minutes) {
	numHours = parseInt(minutes / 60);
	numMinutes = minutes % 60;

	return numHours + "h " + numMinutes + "m";
}

function playSound(sound) {
	// Only play if sound is not muted
	if (!soundMuted) {
		sound.play();
	}
}

// INITS //

// Initialize time values
function initTime() {
	// See if localStorage values can be retrieved; if they can, update global variables
	if (localStorage.getItem("defaultWorkMinutes")) {
		defaultWorkMinutes = localStorage.getItem("defaultWorkMinutes");
	}

	if (localStorage.getItem("defaultShortBreakMinutes")) {
		defaultShortBreakMinutes = localStorage.getItem("defaultShortBreakMinutes");
	}

	if (localStorage.getItem("defaultLongBreakMinutes")) {
		defaultLongBreakMinutes = localStorage.getItem("defaultLongBreakMinutes");
	}

	if (localStorage.getItem("tempWorkMinutes")) {
		tempWorkMinutes = localStorage.getItem("tempWorkMinutes");
	}

	if (localStorage.getItem("tempShortBreakMinutes")) {
		tempShortBreakMinutes = localStorage.getItem("tempShortBreakMinutes");
	}

	if (localStorage.getItem("tempLongBreakMinutes")) {
		tempLongBreakMinutes = localStorage.getItem("tempLongBreakMinutes");
	}
}

// Initialize session markers
function initSessions() {
	// See if localStorage value can be retrieved; if it can, update global variable
	if (localStorage.getItem("timerSessions")) {
		// Make sure to convert to int so value can be incremented
		timerSessions = parseInt(localStorage.getItem("timerSessions"));
	}

	// Update UI
	switch(timerSessions) {
		case 1:
			divSessionOne.classList.add(classSessionCompleted);
			break;
		case 2:
			divSessionOne.classList.add(classSessionCompleted);
			divSessionTwo.classList.add(classSessionCompleted);
			break;
		case 3:
			divSessionOne.classList.add(classSessionCompleted);
			divSessionTwo.classList.add(classSessionCompleted);
			divSessionThree.classList.add(classSessionCompleted);
			break;
		case 4:
			divSessionOne.classList.add(classSessionCompleted);
			divSessionTwo.classList.add(classSessionCompleted);
			divSessionThree.classList.add(classSessionCompleted);
			divSessionFour.classList.add(classSessionCompleted);
			break;
	}
}

// Initialize stats
function initStats() {
	// See if localStorage values can be retrieved; if they can, update global variables
	if (localStorage.getItem("statsSessions")) {
		statsSessions = localStorage.getItem("statsSessions");
	}

	if (localStorage.getItem("statsAverageSession")) {
		statsAverageSession = localStorage.getItem("statsAverageSession");
	}

	if (localStorage.getItem("statsTotalTime")) {
		statsTotalTime = localStorage.getItem("statsTotalTime");
	}

	// Update UI
	spanStatsSessions.innerHTML = statsSessions;
	spanStatsAverage.innerHTML = statsAverageSession + "m";
	spanStatsTotal.innerHTML = outputNumHoursMinutes(statsTotalTime);
}

// Initialize settings
function initSettings() {
	// Remove input values in case they were carried over from page load
	inputSettingsWorkTime.value = "";
	inputSettingsShortBreakTime.value = "";
	inputSettingsLongBreaktime.value = "";

	// Add placeholders
	inputSettingsWorkTime.setAttribute("placeholder", defaultWorkMinutes + " mins");
	inputSettingsShortBreakTime.setAttribute("placeholder", defaultShortBreakMinutes + " mins");
	inputSettingsLongBreaktime.setAttribute("placeholder", defaultLongBreakMinutes + " mins");
}

//  TIMER  //

// Decide what a session's time should be depending on the value passed
function decideSessionTime(value) {
	// Get time value
	let t = value;

	// Check if value exists
	if (t) {
		// Try to convert to int
		t = parseInt(t);

		// Check if value is not a number
		if (isNaN(t)) {
			// It's not, so check the session and return appropriate time
			// Work session
			if (timerWorkSession) {
				if (tempWorkMinutes) {
					return tempWorkMinutes;
				}
				else {
					return defaultWorkMinutes;
				}
			}
			// Short break session
			else if (timerShortBreakSession) {
				if (tempShortBreakMinutes) {
					return tempShortBreakMinutes;
				}
				else {
					return defaultShortBreakMinutes;
				}
			}
			// Long break session
			else if (timerLongBreakSession) {
				if (tempLongBreakMinutes) {
					return tempLongBreakMinutes;
				}
				else {
					return defaultLongBreakMinutes;
				}
			}
		}
		// It is a number...
		else {
			// If number is too big or small, return "reasonable" defaults
			if (t < minMinutes) {
				// Work session
				if (timerWorkSession) {
					tempWorkMinutes = minMinutes;
					
					// Update localStorage
					localStorage.setItem("tempWorkMinutes", tempWorkMinutes);

					return tempWorkMinutes;
				}
				// Short break session
				else if (timerShortBreakSession) {
					tempShortBreakMinutes = minMinutes;

					// Update localStorage
					localStorage.setItem("tempShortBreakMinutes", tempShortBreakMinutes);

					return tempShortBreakMinutes;
				}
				// Long break session
				else if (timerLongBreakSession) {
					tempLongBreakMinutes = minMinutes;

					// Update localStorage
					localStorage.setItem("tempLongBreakMinutes", tempLongBreakMinutes);

					return tempLongBreakMinutes;
				}
			}
			else if (t > maxMinutes) {
				// Work session
				if (timerWorkSession) {
					tempWorkMinutes = maxMinutes;

					// Update localStorage
					localStorage.setItem("tempWorkMinutes", tempWorkMinutes);

					return tempWorkMinutes;
				}
				// Short break session
				else if (timerShortBreakSession) {
					tempShortBreakMinutes = maxMinutes;

					// Update localStorage
					localStorage.setItem("tempShortBreakMinutes", tempShortBreakMinutes);

					return tempShortBreakMinutes;
				}
				// Long break session
				else if (timerLongBreakSession) {
					tempLongBreakMinutes = maxMinutes;

					// Update localStorage
					localStorage.setItem("tempLongBreakMinutes", tempLongBreakMinutes);

					return tempLongBreakMinutes;
				}
			}
			// Number seems to be fine, so return it
			else {
				// Work session
				if (timerWorkSession) {
					tempWorkMinutes = t;

					// Update localStorage
					localStorage.setItem("tempWorkMinutes", tempWorkMinutes);

					return tempWorkMinutes;
				}
				// Short break session
				else if (timerShortBreakSession) {
					tempShortBreakMinutes = t;

					// Update localStorage
					localStorage.setItem("tempShortBreakMinutes", tempShortBreakMinutes);

					return tempShortBreakMinutes;
				}
				// Long break session
				else if (timerLongBreakSession) {
					tempLongBreakMinutes = t;

					// Update localStorage
					localStorage.setItem("tempLongBreakMinutes", tempLongBreakMinutes);

					return tempLongBreakMinutes;
				}
			}
		}
	}
	// Value doesn't exist, so return default
	else {
		// Work session
		if (timerWorkSession) {
			if (tempWorkMinutes) {
				return tempWorkMinutes;
			}
			else {
				return defaultWorkMinutes;
			}
		}
		// Short break session
		else if (timerShortBreakSession) {
			if (tempShortBreakMinutes) {
				return tempShortBreakMinutes;
			}
			else {
				return defaultShortBreakMinutes;
			}
		}
		// Long break session
		else if (timerLongBreakSession) {
			if (tempLongBreakMinutes) {
				return tempLongBreakMinutes;
			}
			else {
				return defaultLongBreakMinutes;
			}
		}
	}
}

// Decide whether a default time is acceptable (used in by save button in settings drawer)
function decideDefaultTime(value) {
	// Try to convert to int
	let t = parseInt(value);

	// Check if value is not a number
	if (isNaN(t)) {
		return;
	}
	// It is a number...
	else {
		// If number is too big or small, return "reasonable" defaults
		if (t < minMinutes) {
			return minMinutes;
		}
		else if (t > maxMinutes) {
			return maxMinutes;
		}
		// Number seems to be fine so return it
		else {
			return t;
		}
	}
}

// Decide wehther the reset button should be hidden or shown
function decideReset() {
	// Hide first
	// Handles cases where the timer is started and when the timer is toggled to another session
	hide(btnReset);

	// If the timer hasn't started, only show reset button on appropriate session
	if (!timerSessionStarted) {
		// work session
		if (tempWorkMinutes && timerWorkSession) {
			show(btnReset);
		}
		// Short break session
		else if (tempShortBreakMinutes && timerShortBreakSession) {
			show(btnReset);
		}
		// Long break sessioon
		else if (tempLongBreakMinutes && timerLongBreakSession) {
			show(btnReset);
		}
	}
}

// Start subdial animations
function startSubdials() {
	// Add subdial animations by adding classes to their respective elements
	for (let i = 0; i < divsSubdialPie.length; i++) {
		divsSubdialPie[i].classList.add(classesSubdialPie[i]);
	}

	// Provide time in seconds to CSS variable (used by total subdial)
	root.style.setProperty("--subdial-seconds", timerMinutes * 60 + "s")

	// Change CSS variable that controls animation play state
	root.style.setProperty("--animation-play-state", "running");
}

// Pause subdial animations
function pauseSubdials() {
	// Change CSS variable that controls animation play state
	root.style.setProperty("--animation-play-state", "paused");
}

// Resume subdial animations
function resumeSubdials() {
	// Change CSS variable that controls animation play state
	root.style.setProperty("--animation-play-state", "running");
}

// Stop subidal animations
function stopSubdials() {
	// Change CSS variable that controls animation play state
	root.style.setProperty("--animation-play-state", "paused");

	// Remove subdial animations by removing classes from their respective elements
	for (let i = 0; i < divsSubdialPie.length; i++) {
		divsSubdialPie[i].classList.remove(classesSubdialPie[i]);
	}
}

// Handle a work session
function workSession() {
	// Check if a temporay time has been set, then reset minutes
	if (tempWorkMinutes) {
		timerMinutes = tempWorkMinutes;
	}
	else {
		timerMinutes = defaultWorkMinutes;
	}

	// Update session type
	// Make sure both break sessions are reset
	timerShortBreakSession = false;
	timerLongBreakSession = false;
	timerWorkSession = true;

	// Update UI
	btnToggle.removeAttribute("aria-pressed");
	switchTheme("default");

	// Reset timer interface values
	spanTimerDisplayMinutes.innerHTML = ("0" + timerMinutes).slice(-2);
	spanTimerDisplaySeconds.innerHTML = "00";
}

// Handle a short break session
function shortBreakSession() {
	// Check if a temporay time has been set, then reset minutes
	if (tempShortBreakMinutes) {
		timerMinutes = tempShortBreakMinutes;
	}
	else {
		timerMinutes = defaultShortBreakMinutes;
	}

	// Update session type
	timerWorkSession = false;
	timerShortBreakSession = true;

	// Update UI
	btnToggle.setAttribute("aria-pressed", "true");
	switchTheme("shortbreak");

	// Reset timer interface values
	spanTimerDisplayMinutes.innerHTML = ("0" + timerMinutes).slice(-2);
	spanTimerDisplaySeconds.innerHTML = "00";
}

// Handle a long break session
function longBreakSession() {
	// Check if a temporay time has been set, then reset minutes
	if (tempLongBreakMinutes) {
		timerMinutes = tempLongBreakMinutes;
	}
	else {
		timerMinutes = defaultLongBreakMinutes;
	}

	// Update session type
	timerWorkSession = false;
	timerLongBreakSession = true;

	// Update UI
	btnToggle.setAttribute("aria-pressed", "true");
	switchTheme("longbreak");

	// Reset timer interface values
	spanTimerDisplayMinutes.innerHTML = ("0" + timerMinutes).slice(-2);
	spanTimerDisplaySeconds.innerHTML = "00";
}

// Handle updates to session markers
function updateSessions() {
	// Only track/update if it's a work session
	if (timerWorkSession) {
		// Increment sessions
		timerSessions++;

		// Update local storage
		localStorage.setItem("timerSessions", timerSessions);

		// Update UI
		switch(timerSessions) {
			case 1:
				divSessionOne.classList.add(classSessionCompleted);
				break;
			case 2:
				divSessionTwo.classList.add(classSessionCompleted);
				break;
			case 3:
				divSessionThree.classList.add(classSessionCompleted);
				break;
			case 4:
				divSessionFour.classList.add(classSessionCompleted);
				break;
		}
	}
}

// Clear session markers
function clearSessions() {
	// Reset global variable
	timerSessions = 0;

	// Remove completed class from each session marker
	divsSessionMarker.forEach((marker) => {
		marker.classList.remove(classSessionCompleted);
	});
}

// Handle updates to stats
function updateStats() {
	// Increment sessions
	statsSessions++;
	
	// Calculate total time using minutes global variable (holds the current session's time value)
	statsTotalTime += timerMinutes;

	// Calculate average work session time
	statsAverageSession = parseFloat(statsTotalTime / statsSessions).toFixed(2);

	// Update localStorage
	localStorage.setItem("statsSessions", statsSessions);
	localStorage.setItem("statsAverageSession", statsAverageSession);
	localStorage.setItem("statsTotalTime", statsTotalTime);

	// Update UI
	spanStatsSessions.innerHTML = statsSessions;
	spanStatsAverage.innerHTML = statsAverageSession + "m";
	spanStatsTotal.innerHTML = outputNumHoursMinutes(statsTotalTime);
}

// Calculate time remaining and return dictionary that can be used by the timer
// Adapted from Yaphi Berhanu and Nilson Jacques' "Build a Countdown Timer in Just 18 Lines of JavaScript"
// https://www.sitepoint.com/build-javascript-countdown-timer-no-dependencies/
function timeRemaining(finishTime) {
	// Calculate time remaining by subtracting finish time from current time
	const total = Date.parse(finishTime) - Date.parse(new Date());

	// Convert to seconds and minutes
	const seconds = Math.floor((total / 1000) % 60);
	const minutes = Math.floor((total / 1000 / 60) % 60);

	return {
		total,
		seconds,
		minutes
	};
}

// Start the timer
// Also adapted from Yaphi Berhanu and Nilson Jacques' "Build a Countdown Timer in Just 18 Lines of JavaScript"
function startTimer(finishTime) {
	timerRunning = true;

	// Update UI
	// Hide timer input (in case it was activated) and show timer that can no longer be clicked
	hide(divTimerInput);
	show(divTimerDisplay);
	clickable(divTimerDisplay, false);

	// Hide play button and show pause
	hide(btnPlay);
	show(btnPause);

	// Since the session has started, show stop
	show(btnStop);

	function updateTimer() {
		// Calculate remaing time
		const time = timeRemaining(finishTime);

		// Provide time values with leading zeros to elements
		spanTimerDisplayMinutes.innerHTML = ("0" + time.minutes).slice(-2);
		spanTimerDisplaySeconds.innerHTML = ("0" + time.seconds).slice(-2);

		// Stop when the remaing time gets to zero
		if (time.total <= 0) {
			timerSessionStarted = false;
			timerRunning = false;
			clearInterval(timerInterval)

			// Make sure to reset time to original value
			timerMinutesInMs = minutesToMs(timerMinutes);

			// Update UI
			hide(btnPause);
			show(btnPlay);
			hide(btnStop);
			stopSubdials();
			clickable(divTimerDisplay, true);
			updateSessions();

			// Play sound
			playSound(soundChime);

			// Automatically swich to a work/break session
			if (timerWorkSession) {
				// Update stats too
				updateStats();

				// Decide whether a regular or long break
				if (timerSessions < 4) {
					shortBreakSession();
				}
				else {
					longBreakSession();
				}
			}
			else if (timerShortBreakSession) {
				workSession();
			}
			else if (timerLongBreakSession) {
				workSession();
			}

			// Make sure to run this last, otherwise the reset button may carry over between sessions
			decideReset();
		}
	}

	// Run first to avoid delay
	updateTimer();

	// Execute every second
	timerInterval = setInterval(updateTimer, 1000);
}

// Pause the timer
function pauseTimer() {
	// Stop
	timerRunning = false;
	clearInterval(timerInterval);

	// Calculate how much time has passed between now and the start of the timer
	timerDurationLeft = timerMinutesInMs - (Date.parse(new Date()) - timerStartTime);

	// Make sure to update time, otherwise future calculations will be off
	timerMinutesInMs = timerDurationLeft;

	// Update UI
	hide(btnPause);
	show(btnPlay);
	pauseSubdials();
}

// Resume the timer
function resumeTimer() {
	// Calculate new finish time
	timerStartTime = Date.parse(new Date());
	timerFinishTime = new Date(timerStartTime + timerDurationLeft);

	// Start
	timerRunning = true;
	startTimer(timerFinishTime);

	// Update UI
	hide(btnPlay);
	show(btnPause);
	resumeSubdials();
}

// Stop the timer
function stopTimer() {
	// Check if timer session has started
	if (timerSessionStarted) {
		// There is a session, so stop timer (just in case it isn't stopped) and reset session
		timerRunning = false;
		timerSessionStarted = false;
		clearInterval(timerInterval);

		// Make sure to reset time to original value
		timerMinutesInMs = minutesToMs(timerMinutes);

		// Update UI
		// Show play button in case the timer was playing when stopped
		hide(btnPause);
		show(btnPlay);

		// Hide stop and stop subdials since the session has been terminated
		hide(btnStop);
		stopSubdials();

		// Reset timer interface values
		spanTimerDisplayMinutes.innerHTML = ("0" + timerMinutes).slice(-2);
		spanTimerDisplaySeconds.innerHTML = "00";

		// Make clickable
		clickable(divTimerDisplay, true);

		// See if reset button should be displayed
		decideReset()
	}
	else {
		// No session, so don't do anything
		return;
	}
}

// INITIAL LOAD //

// When page is first loaded...
function initialLoad() {
	// Initialize localStorage/UI
	initTime();
	initSessions();
	initStats();
	initSettings();

	// Set minutes
	if (tempWorkMinutes) {
		timerMinutes = tempWorkMinutes;
	}
	else {
		timerMinutes = defaultWorkMinutes;
	}

	// Make sure work session is ready to go
	timerWorkSession = true;

	// Make timer clickable
	clickable(divTimerDisplay, true);

	// Add time to timer interface
	spanTimerDisplayMinutes.innerHTML = ("0" + timerMinutes).slice(-2);
	spanTimerDisplaySeconds.innerHTML = "00";

	// See if reset button should be displayed
	decideReset();
}

//
// EVENTS
//

// Toggle button
// Adapted from Kitty Giraudel's "An accessible toggle"
// https://kittygiraudel.com/2021/04/05/an-accessible-toggle/#button-variant
btnToggle.addEventListener("click", function() {
	// Check if timer has started
	if (timerSessionStarted) {
		// It has, so the timer needs to stop
		stopTimer();
	}

	// In case time input is active, clear value so that it's not "saved", hide timer input, and show timer
	inputTimerMinutes.value = "";
	hide(divTimerInput);
	show(divTimerDisplay);

	// Work session
	if (btnToggle.getAttribute("aria-pressed") === "true") {
		workSession();
	}
	// Break session
	else {
		// Decide whether regular or break session
		if (timerSessions < 4) {
			shortBreakSession();
		}
		else {
			longBreakSession();
		}
	}

	// See if reset button should be displayed
	decideReset();

	// Play sound
	playSound(soundClick);
});

// Timer display
divTimerDisplay.addEventListener("click", function() {
	// Check if the session has started
	if (timerSessionStarted) {
		// Don't do anything if it has
		return;
	}
	// The session has not started so allow the user to input time
	else if (!timerSessionStarted) {
		// Update UI
		hide(divTimerDisplay);
		show(divTimerInput);
		clickable(divTimerInput, true);
		inputTimerMinutes.focus();
	}
});

// Timer minutes input
inputTimerMinutes.addEventListener("input", function() {
	// Replace any character that is not a number
	// Adapted from: https://knplabs.com/en/blog/how2-tips-how-to-restrict-allowed-characters-inside-a-text-input-in-one-line-of-code
	inputTimerMinutes.value = inputTimerMinutes.value.replace(/[^0-9+]/g, "");
});

// Reset button
btnReset.addEventListener("click", function() {
	// Only reset time if timer session has not started
	if (!timerSessionStarted) {
		// Work session
		if (timerWorkSession) {
			// Reset temporary minutes
			tempWorkMinutes = null;

			// Remove from localStorage
			localStorage.removeItem("tempWorkMinutes");

			timerMinutes = defaultWorkMinutes;

			// Update UI
			hide(divTimerInput);
			show(divTimerDisplay);
			hide(btnReset);

			// Reset timer interface values
			spanTimerDisplayMinutes.innerHTML = ("0" + timerMinutes).slice(-2);
			spanTimerDisplaySeconds.innerHTML = "00";
		}
		// Short break session
		else if (timerShortBreakSession) {
			// Reset temporary minutes
			tempShortBreakMinutes = null;

			// Remove from localStorage
			localStorage.removeItem("tempShortBreakMinutes");

			timerMinutes = defaultShortBreakMinutes;

			// Update UI
			hide(divTimerInput);
			show(divTimerDisplay);
			hide(btnReset);

			// Reset timer interface values
			spanTimerDisplayMinutes.innerHTML = ("0" + timerMinutes).slice(-2);
			spanTimerDisplaySeconds.innerHTML = "00";
		}
		// Long break session
		else if (timerLongBreakSession) {
			// Reset temporary minutes
			tempLongBreakMinutes = null;

			// Remove from localStorage
			localStorage.removeItem("tempLongBreakMinutes");
			
			timerMinutes = defaultLongBreakMinutes;

			// Update UI
			hide(divTimerInput);
			show(divTimerDisplay);
			hide(btnReset);

			// Reset timer interface values
			spanTimerDisplayMinutes.innerHTML = ("0" + timerMinutes).slice(-2);
			spanTimerDisplaySeconds.innerHTML = "00";
		}
	}
});

// Play/start button
btnPlay.addEventListener("click", function() {
	// Prevent "double" running of the function by checking if a session has already been started
	if (!timerSessionStarted) {
		// Start session (make sure this is set first so reset button is not displayed)
		timerSessionStarted = true;

		// Get value from timer minutes input
		let timeVal = inputTimerMinutes.value;

		// Decide time
		timerMinutes = decideSessionTime(timeVal);

		// Clear value in timer input so that it's not "saved" and carried between sessions
		inputTimerMinutes.value = "";

		// Hide reset button (dependent on whether timer session has started or not)
		decideReset();

		// Clear sessions if session set has been reached
		if (timerWorkSession && timerSessions == 4) {
			clearSessions();
		}

		// Calculate finish time
		timerStartTime = Date.parse(new Date());
		timerMinutesInMs = minutesToMs(timerMinutes);
		timerFinishTime = new Date(timerStartTime + timerMinutesInMs);

		// Start timer and subdials
		startTimer(timerFinishTime);
		startSubdials();

		// Play sound
		playSound(soundClick);
	}
	// Resume
	else if (!timerRunning) {
		resumeTimer();
	}
	// Prevent "double" running
	else {
		return;
	}
});

// Pause button
btnPause.addEventListener("click", function() {
	// Check if timer is running
	if (timerRunning) {
		pauseTimer();

		// Play sound
		playSound(soundClick);
	}
	// Prevent "double" running
	else {
		return;
	}
});

// Stop
btnStop.addEventListener("click", function() {
	stopTimer();

	// Play sound
	playSound(soundClick);
});

// Sound button
btnSound.addEventListener("click", function() {
	// Mute
	soundMuted = true;

	// Update UI
	hide(itemSound);
	show(itemSoundOff);
});

// Sound off button
btnSoundOff.addEventListener("click", function() {
	// Unmute
	soundMuted = false;

	// Update UI
	hide(itemSoundOff);
	show(itemSound);
});

// Stats button
btnStats.addEventListener("click", function() {
	// Close settings drawer if it's open
	if (!drawerSettings.classList.contains("hidden")) {
		hide(drawerSettings);
	}

	// Check whether stats drawer should be hidden or closed
	if (drawerStats.classList.contains("hidden")) {
		show(drawerStats);
	}
	else {
		hide(drawerStats);
	}
});

// Close stats button
btnStatsClose.addEventListener("click", function() {
	hide(drawerStats);
});

// Settings button
btnSettings.addEventListener("click", function() {
	// Close stats drawer if it's open
	if (!drawerStats.classList.contains("hidden")) {
		hide(drawerStats);
	}

	// Check whether settings drawer should be hidden or closed
	if (drawerSettings.classList.contains("hidden")) {
		show(drawerSettings);
	}
	else {
		hide(drawerSettings);
	}
});

// Settings time inputs
inputsSettingsTime.forEach((timeInput) => {
	timeInput.addEventListener("input", function() {
		// Replace any character that is not a number
		// Adapted from: https://knplabs.com/en/blog/how2-tips-how-to-restrict-allowed-characters-inside-a-text-input-in-one-line-of-code
		timeInput.value = timeInput.value.replace(/[^0-9+]/g, "");

		// Check for value
		if (timeInput.value) {
			// Remove disabled attribute and add ready class
			btnSettingsSave.removeAttribute("disabled");
			btnSettingsSave.classList.add(classSettingsSaveReady);
		}
		else {
			// Check if all the inputs are empty
			if (!inputSettingsWorkTime.value && !inputSettingsShortBreakTime.value && !inputSettingsLongBreaktime.value) {
				// No values, so make sure disabled attribute is set and ready class is removed
				btnSettingsSave.setAttribute("disabled", "");
				btnSettingsSave.classList.remove(classSettingsSaveReady);
			}
		}
	});
});

// Settings save button
btnSettingsSave.addEventListener("click", function() {
	// Work time
	if (inputSettingsWorkTime.value) {
		let time = decideDefaultTime(inputSettingsWorkTime.value);

		if (time) {
			defaultWorkMinutes = time;

			// Update localStorage
			localStorage.setItem("defaultWorkMinutes", defaultWorkMinutes);

			// Also reset temp minutes
			tempWorkMinutes = null;
			localStorage.removeItem("tempWorkMinutes");

			// Update placeholder
			inputSettingsWorkTime.value = "";
			inputSettingsWorkTime.setAttribute("placeholder", time + " mins");

			// If possible, update UI and pass new value to minutes
			if (!timerRunning && timerWorkSession) {
				timerMinutes = defaultWorkMinutes;

				// Reset timer interface values
				spanTimerDisplayMinutes.innerHTML = ("0" + timerMinutes).slice(-2);
				spanTimerDisplaySeconds.innerHTML = "00";

				// Hide reset button in case a temp time was already set
				decideReset();
			}
		}
	}

	// Short break time
	if (inputSettingsShortBreakTime.value) {
		let time = decideDefaultTime(inputSettingsShortBreakTime.value);

		if (time) {
			defaultShortBreakMinutes = time;

			// Update localStorage
			localStorage.setItem("defaultShortBreakMinutes", defaultShortBreakMinutes);

			// Also reset temp minutes
			tempShortBreakMinutes = null;
			localStorage.removeItem("tempShortBreakMinutes");

			// Update placeholder
			inputSettingsShortBreakTime.value = "";
			inputSettingsShortBreakTime.setAttribute("placeholder", time + " mins");

			// If possible, update UI and pass new value to minutes
			if (!timerRunning && timerShortBreakSession) {
					timerMinutes = defaultShortBreakMinutes;

					// Reset timer interface values
					spanTimerDisplayMinutes.innerHTML = ("0" + timerMinutes).slice(-2);
					spanTimerDisplaySeconds.innerHTML = "00";

					// Hide reset button in case a temp time was already set
					decideReset();
			}
		}
	}

	// Long break time
	if (inputSettingsLongBreaktime.value) {
		let time = decideDefaultTime(inputSettingsLongBreaktime.value);

		if (time) {
			defaultLongBreakMinutes = time;

			// Update localStorage
			localStorage.setItem("defaultLongBreakMinutes", defaultLongBreakMinutes);

			// Also reset temp minutes
			tempLongBreakMinutes = null;
			localStorage.removeItem("tempLongBreakMinutes");

			// Update placeholder
			inputSettingsLongBreaktime.value = "";
			inputSettingsLongBreaktime.setAttribute("placeholder", time + " mins");

			// If possible, update UI and pass new value to minutes
			if (!timerRunning && timerLongBreakSession) {
					timerMinutes = defaultLongBreakMinutes;

					// Reset timer interface values
					spanTimerDisplayMinutes.innerHTML = ("0" + timerMinutes).slice(-2);
					spanTimerDisplaySeconds.innerHTML = "00";

					// Hide reset button in case a temp time was already set
					decideReset();
			}
		}
	}

	// Disable after "save"
	btnSettingsSave.setAttribute("disabled", "");
	btnSettingsSave.classList.remove(classSettingsSaveReady);
});

// Close settings button
btnSettingsClose.addEventListener("click", function() {
	hide(drawerSettings);
});

//
// RUN
//

initialLoad();
