/* ----------------------------------------

Sources that were immensely helpful:

- https://www.sitepoint.com/build-javascript-countdown-timer-no-dependencies/
- https://www.htmlcenter.com/blog/pausing-javascript-timers/
- https://knplabs.com/en/blog/how2-tips-how-to-restrict-allowed-characters-inside-a-text-input-in-one-line-of-code

---------------------------------------- */

//
// GLOBAL VARIABLES
//

// Times
let defaultWorkMinutes = .1;
let defaultBreakMinutes = .05;
let tempWorkMinutes, tempBreakMinutes;
let minutes, minutesInMs;

// Timer state and functionality
let timerInterval; // Timer's interval ID
let timerStartTime; // When timer starts
let timerFinishTime; // When timer stops
let timerDurationLeft; // How much time is left (used if paused)
let timerSessionStarted = false; // Whether session has started
let timerWorkSession = false; // Whether it's a work session
let timerBreakSession = false; // Whether it's a break session
let timerRunning = false; // Whether timer is running

// Get UI elements
const root = document.querySelector("html")
const toggle = document.querySelector(".session-toggle__btn")
const timer = document.querySelector(".timer-display");
const timerMinutes = document.querySelector(".timer-display__minutes");
const timerSeconds = document.querySelector(".timer-display__seconds");
const timerInput = document.querySelector(".timer-input");
const timerInputMinutes = document.querySelector(".timer-input__minutes");
const reset = document.querySelector(".timer-reset");
const play = document.querySelector(".controls__play");
const pause = document.querySelector(".controls__pause");
const stop = document.querySelector(".controls__stop");

//
// FUNCTIONS
//

// HELPERS //

function switchTheme(theme) {
	if (theme == "break") {
		root.classList.remove("theme-default");
		root.classList.add("theme-break");
	}
	else if (theme == "default") {
		root.classList.remove("theme-break");
		root.classList.add("theme-default");
	}
}

function hide(selector) {
	selector.classList.add("hidden");
}

function show(selector) {
	selector.classList.remove("hidden");
}

function clickable(selector, bool) {
	// If true
	if (bool) {
		selector.classList.add("clickable");
	}
	else {
		selector.classList.remove("clickable");
	}
}

function minutesToMs(minutes) {
	return minutes * 60 * 1000;
}

// INITIAL LOAD //

function initialLoad() {
	// When page is first loaded...
	// Set minutes to default
	minutes = defaultWorkMinutes;

	// Make sure work session is ready to go
	timerWorkSession = true;

	// Make timer clickable
	clickable(timer, true);

	// Add time to timer interface
	timerMinutes.innerHTML = ("0" + minutes).slice(-2);
	timerSeconds.innerHTML = "00";
}

// TIMER //

function decideTime(selector) {
	// Get time value
	let t = selector.value;

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
			// Break session
			else if (timerBreakSession) {
				if (tempBreakMinutes) {
					return tempBreakMinutes;
				}
				else {
					return defaultBreakMinutes;
				}
			}
		}
		// It is a number...
		else {
			// If number is too big or small, return "reasonable" defaults
			if (t < 1) {
				// Work session
				if (timerWorkSession) {
					tempWorkMinutes = .1; // Test value
					return tempWorkMinutes;
				}
				// Break session
				else if (timerBreakSession) {
					tempBreakMinutes = .05; // Test value
					return tempBreakMinutes;
				}
			}
			else if (t > 55) {
				// Work session
				if (timerWorkSession) {
					tempWorkMinutes = .2; // Test value
					return tempWorkMinutes;
				}
				// Break session
				else if (timerBreakSession) {
					tempBreakMinutes = .1; // Test value
					return tempBreakMinutes;
				}
			}
			// Number seems to be fine, so return it
			else {
				// Work session
				if (timerWorkSession) {
					tempWorkMinutes = t;
					return tempWorkMinutes;
				}
				else if (timerBreakSession) {
					tempBreakMinutes = t;
					return tempBreakMinutes;
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
		// Break session
		else if (timerBreakSession) {
			if (tempBreakMinutes) {
				return tempBreakMinutes;
			}
			else {
				return defaultBreakMinutes;
			}
		}
	}
}

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

function startTimer(finishTime) {
	timerRunning = true;

	// Update UI
	// Hide timer input (in case it was activated) and show timer that can no longer be clicked
	hide(timerInput);
	show(timer);
	clickable(timer, false);

	// Hide play button and show pause
	hide(play);
	show(pause);

	// Since the session has started, show stop
	show(stop);

	function updateTimer() {
		// Calculate remaing time
		const time = timeRemaining(finishTime);

		// Provide time values with leading zeros to elements
		timerMinutes.innerHTML = ("0" + time.minutes).slice(-2);
		timerSeconds.innerHTML = ("0" + time.seconds).slice(-2);

		// Stop when the remaing time gets to zero
		if (time.total <= 0) {
			timerSessionStarted = false;
			clearInterval(timerInterval)

			// Make sure to reset time to original value
			minutesInMs = minutesToMs(minutes);

			// Update UI
			hide(pause);
			show(play);
			hide(stop);
			clickable(timer, true);
			checkReset();
		}
	}

	// Run first to avoid delay
	updateTimer();

	// Execute every second
	timerInterval = setInterval(updateTimer, 1000);
}

function pauseTimer() {
	// Stop
	timerRunning = false;
	clearInterval(timerInterval);

	// Calculate how much time has passed between now and the start of the timer
	timerDurationLeft = minutesInMs - (Date.parse(new Date()) - timerStartTime);

	// Make sure to update time, otherwise future calculations will be off
	minutesInMs = timerDurationLeft;

	// Update UI
	hide(pause);
	show(play);
}

function resumeTimer() {
	// Calculate new finish time
	timerStartTime = Date.parse(new Date());
	timerFinishTime = new Date(timerStartTime + timerDurationLeft);

	// Start
	timerRunning = true;
	startTimer(timerFinishTime);

	// Update UI
	hide(play);
	show(pause);
}

function stopTimer() {
	// Check if timer session has started
	if (timerSessionStarted) {
		// There is a session, so stop timer (just in case it isn't stopped) and reset session
		timerRunning = false;
		timerSessionStarted = false;
		clearInterval(timerInterval);

		// Make sure to reset time to original value
		minutesInMs = minutesToMs(minutes);

		// Update UI
		// Show play button in case the timer was playing when stopped
		hide(pause);
		show(play);

		// Hide stop since the session has been terminated
		hide(stop);

		// Reset timer interface values
		timerMinutes.innerHTML = ("0" + minutes).slice(-2);
		timerSeconds.innerHTML = "00";

		// Make clickable
		clickable(timer, true);

		// See if reset button should be displayed
		checkReset()
	}
	else {
		// No session, so don't do anything
		return;
	}
}

function breakSession() {
	// Check if a temporay time has been set, then reset minutes
	if (tempBreakMinutes) {
		minutes = tempBreakMinutes;
	}
	else {
		minutes = defaultBreakMinutes;
	}

	// Update session type
	timerWorkSession = false;
	timerBreakSession = true;

	// Update UI
	toggle.setAttribute("aria-pressed", "true");
	switchTheme("break");

	// Reset timer interface values
	timerMinutes.innerHTML = ("0" + minutes).slice(-2);
	timerSeconds.innerHTML = "00";
}

function workSession() {
	// Check if a temporay time has been set, then reset minutes
	if (tempWorkMinutes) {
		minutes = tempWorkMinutes;
	}
	else {
		minutes = defaultWorkMinutes;
	}

	// Update session type
	timerBreakSession = false;
	timerWorkSession = true;

	// Update UI
	toggle.removeAttribute("aria-pressed");
	switchTheme("default");

	// Reset timer interface values
	timerMinutes.innerHTML = ("0" + minutes).slice(-2);
	timerSeconds.innerHTML = "00";
}

function checkReset() {
	// Hide first
	// Handles cases where the timer is started and when the timer is toggled to another session
	hide(reset);

	// Only show on appropriate session and if the timer hasn't started
	if (!timerSessionStarted) {
		if (tempWorkMinutes && timerWorkSession) {
			show(reset);
		}
		else if (tempBreakMinutes && timerBreakSession) {
			show(reset);
		}
	}
}

//
// EVENTS
//

// Toggle
// Adapted from Kitty Giraudel's "An accessible toggle"
// https://kittygiraudel.com/2021/04/05/an-accessible-toggle/#button-variant
toggle.addEventListener("click", function() {
	// Check if timer has started
	if (timerSessionStarted) {
		// It has, so the timer needs to stop
		stopTimer();
	}

	// In case time input is active, clear value so that it's not "saved", hide timer input, and show timer
	timerInputMinutes.value = "";
	hide(timerInput);
	show(timer);

	// Work session
	if (toggle.getAttribute("aria-pressed") === "true") {
		workSession();
	}
	// Break session
	else {
		breakSession();
	}

	// See if reset button should be displayed
	checkReset();
});

// Timer
timer.addEventListener("click", function() {
	// Check if the session has started
	if (timerSessionStarted) {
		// Don't do anything if it has
		return;
	}
	// The session has not started so allow the user to input time
	else if (!timerSessionStarted) {
		// Update UI
		hide(timer);
		show(timerInput);
		clickable(timerInput, true);
		timerInputMinutes.focus();
	}
});

// Input
timerInputMinutes.addEventListener("input", function() {
	// Replace any character that is not a number
	// Adapted from: https://knplabs.com/en/blog/how2-tips-how-to-restrict-allowed-characters-inside-a-text-input-in-one-line-of-code
	timerInputMinutes.value = timerInputMinutes.value.replace(/[^0-9+]/g, "");
});

// Reset
reset.addEventListener("click", function() {
	if (!timerSessionStarted) {
		if (timerWorkSession) {
			tempWorkMinutes = null;
			minutes = defaultWorkMinutes;

			// Update UI
			hide(timerInput);
			show(timer);
			hide(reset);

			// Reset timer interface values
			timerMinutes.innerHTML = ("0" + minutes).slice(-2);
			timerSeconds.innerHTML = "00";
		}
		else if (timerBreakSession) {
			tempBreakMinutes = null;
			minutes = defaultBreakMinutes;

			// Update UI
			hide(timerInput);
			show(timer);
			hide(reset);

			// Reset timer interface values
			timerMinutes.innerHTML = ("0" + minutes).slice(-2);
			timerSeconds.innerHTML = "00";
		}
	}
});

// Start
play.addEventListener("click", function() {
	// Prevent "double" running of the function by checking if a session has already been started
	if (!timerSessionStarted) {
		// Decide time
		minutes = decideTime(timerInputMinutes);

		// Clear value in timer input so that it's not "saved" and carried between sessions
		timerInputMinutes.value = "";

		// Start session
		timerSessionStarted = true;

		// Hide reset button
		checkReset();

		// Calculate finish time and start timer
		timerStartTime = Date.parse(new Date());
		minutesInMs = minutesToMs(minutes);
		timerFinishTime = new Date(timerStartTime + minutesInMs);
		startTimer(timerFinishTime);
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

// Pause
pause.addEventListener("click", function() {
	// Check if timer is running
	if (timerRunning) {
		pauseTimer();
	}
	// Prevent "double" running
	else {
		return;
	}
});

// Stop
stop.addEventListener("click", function() {
	stopTimer();
});

//
// RUN
//

initialLoad();
