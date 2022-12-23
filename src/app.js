/* ----------------------------------------

Sources that were immensely helpful:

- https://www.sitepoint.com/build-javascript-countdown-timer-no-dependencies/
- https://www.htmlcenter.com/blog/pausing-javascript-timers/

---------------------------------------- */

//
// GLOBAL VARIABLES
//

// Default times TODO
let defaultWorkTime = 1;
let defaultBreakTime = 1;
let defaultLongBreakTime = 2;

// Temporary times TODO
let tempWorkTime, tempBreakTime, tempLongBreakTime;

let minutes = 1;
let timerWorkTimeMs = minutes * 60 * 1000; // Convert to milliseconds

// Timer state/functionality
let timerInterval; // Timer's interval ID
let timerStartTime; // When timer starts
let timerFinishTime; // When timer stops
let timerDurationLeft; // How much time is left (used if paused)
let timerSessionStarted = false; // Whether session has started
let timerRunning = false; // Whether timer is running

// Get controls
let play = document.querySelector(".controls__play");
let stop = document.querySelector(".controls__stop")

//
// FUNCTIONS
//

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

	// Grab necessary timer elements
	const timer = document.querySelector(".timer");
	const timerMinutes = document.querySelector(".timer__minutes");
	const timerSeconds = document.querySelector(".timer__seconds");

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
			timerWorkTimeMs = minutes * 60 * 1000;
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
	timerDurationLeft = timerWorkTimeMs - (Date.parse(new Date()) - timerStartTime);
	// Make sure to update time, otherwise future calculations will be off
	timerWorkTimeMs = timerDurationLeft;
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
	// Check if timer is not running
	if (!timerSessionStarted) {
		return;
	}
	else {
		// It is, so stop timer and reset session
		timerRunning = false;
		timerSessionStarted = false;
		clearInterval(timerInterval);

		// Make sure to reset time to original value
		timerWorkTimeMs = minutes * 60 * 1000;
	}
}

//
// EVENTS
//

play.addEventListener("click", function() {
	// Prevent "double" running of the function by checking if a session has already been started
	if (!timerSessionStarted) {
		// Start session
		timerSessionStarted = true;

		// Calculate finish time
		timerStartTime = Date.parse(new Date());
		timerFinishTime = new Date(timerStartTime + timerWorkTimeMs);

		startTimer(timerFinishTime);
	}
	// Pause
	else if (timerRunning) {
		pauseTimer();
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

stop.addEventListener("click", stopTimer);
