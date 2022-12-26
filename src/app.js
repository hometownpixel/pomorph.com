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
let minutes = 1;
let minutesInMs;

// Timer state and functionality
let timerInterval; // Timer's interval ID
let timerStartTime; // When timer starts
let timerFinishTime; // When timer stops
let timerDurationLeft; // How much time is left (used if paused)
let timerSessionStarted = false; // Whether session has started
let timerRunning = false; // Whether timer is running

// Get UI elements
const timer = document.querySelector(".timer");
const timerMinutes = document.querySelector(".timer__minutes");
const timerSeconds = document.querySelector(".timer__seconds");
const timerInput = document.querySelector(".timer-input");
const timerInputMinutes = document.querySelector(".timer-input__minutes");
const play = document.querySelector(".controls__play");
const pause = document.querySelector(".controls__pause");
const stop = document.querySelector(".controls__stop");

//
// FUNCTIONS
//

// HELPERS //

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
	// When page is first loaded, make timer clickable
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
			// It's not, so return default time
			return minutes;
		}
		// It is a number...
		else {
			// If number is too big or small, return "reasonable" defaults
			if (t < 1) {
				return 1;
			}
			else if (t > 55) {
				return 55;
			}
			// Number seems to be fine, so return it
			else {
				return t;
			}
		}
	}
	// Value doesn't exist, so return default
	else {
		return minutes;
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
}

function resumeTimer() {
	// Calculate new finish time
	timerStartTime = Date.parse(new Date());
	timerFinishTime = new Date(timerStartTime + timerDurationLeft);

	// Start
	timerRunning = true;
	startTimer(timerFinishTime);
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
	}
	else {
		// No session, so don't do anything
		return;
	}
}

//
// EVENTS
//

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

// Start
play.addEventListener("click", function() {
	// Prevent "double" running of the function by checking if a session has already been started
	if (!timerSessionStarted) {
		// Decide time
		minutes = decideTime(timerInputMinutes);

		// Start session
		timerSessionStarted = true;

		// Calculate finish time and start timer
		timerStartTime = Date.parse(new Date());
		minutesInMs = minutesToMs(minutes);
		timerFinishTime = new Date(timerStartTime + minutesInMs);
		startTimer(timerFinishTime);

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
	}
	// Resume
	else if (!timerRunning) {
		resumeTimer();

		// Update UI
		hide(play);
		show(pause);
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

		// Update UI
		hide(pause);
		show(play);
	}
	// Prevent "double" running
	else {
		return;
	}
});

// Stop
stop.addEventListener("click", function() {
	stopTimer();

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
});

//
// RUN
//

initialLoad();
