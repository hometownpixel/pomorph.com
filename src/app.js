/* ----------------------------------------

Sources that were immensely helpful:

- https://www.sitepoint.com/build-javascript-countdown-timer-no-dependencies/
- https://www.htmlcenter.com/blog/pausing-javascript-timers/
- https://knplabs.com/en/blog/how2-tips-how-to-restrict-allowed-characters-inside-a-text-input-in-one-line-of-code
- https://gomakethings.com/how-to-play-a-sound-with-javascript/

---------------------------------------- */

//
// GLOBAL VARIABLES
//

// Times
let defaultWorkMinutes = .05;
let defaultBreakMinutes = .05;
let defaultLongBreakMinutes = .2;
let tempWorkMinutes, tempBreakMinutes, tempLongBreakMinutes;
let minutes, minutesInMs;

// Stats
let statsSessions = 0;
let statsAverageSession = 0;
let statsTotalTime = 0;

// Timer state and functionality
let timerInterval; // Timer's interval ID
let timerStartTime; // When timer starts
let timerFinishTime; // When timer stops
let timerDurationLeft; // How much time is left (used if paused)
let timerSessionStarted = false; // Whether session has started
let timerWorkSession = false; // Whether it's a work session
let timerBreakSession = false; // Whether it's a break session
let timerLongBreakSession = false; // Whether it's a long break session
let timerRunning = false; // Whether timer is running
let timerSessions = 0; // Keep track of the number of work sessions

// Get UI elements
const root = document.documentElement;
const subdialPies = document.querySelectorAll(".subdials__pie");
const pieClasses = ["one-to-ten__pie", "total__pie", "one-to-sixty__pie"];
const toggle = document.querySelector(".session-toggle__btn");
const timer = document.querySelector(".timer-display");
const timerMinutes = document.querySelector(".timer-display__minutes");
const timerSeconds = document.querySelector(".timer-display__seconds");
const timerInput = document.querySelector(".timer-input");
const timerInputMinutes = document.querySelector(".timer-input__minutes");
const reset = document.querySelector(".timer-reset");
const play = document.querySelector(".controls__play");
const pause = document.querySelector(".controls__pause");
const stop = document.querySelector(".controls__stop");
const sessionMarkers = document.querySelectorAll(".sessions__marker");
const sessionCompleted = "sessions__marker_completed";
const sessionOne = document.querySelector(".sessions__one");
const sessionTwo = document.querySelector(".sessions__two");
const sessionThree = document.querySelector(".sessions__three");
const sessionFour = document.querySelector(".sessions__four");
const btnSound = document.querySelector(".menu-bar__btn-sound");
const itemSound = document.querySelector(".menu-bar__item-sound");
const btnSoundOff = document.querySelector(".menu-bar__btn-sound-off");
const itemSoundOff = document.querySelector(".menu-bar__item-sound-off");
const stats = document.querySelector(".menu-bar__btn-stats");
const btnCloseStats = document.querySelector(".stats__btn-close");
const spanStatsSessions = document.querySelector(".stats__figure-sessions");
const spanStatsAverage = document.querySelector(".stats__figure-average");
const spanStatsTotal = document.querySelector(".stats__figure-total");
const settings = document.querySelector(".menu-bar__btn-settings");
const drawerStats = document.querySelector(".stats");
const settingsDrawer = document.querySelector(".settings");
const settingsClose = document.querySelector(".settings__btn-close");
const settingsTimeInputs = document.querySelectorAll(".settings__input");
const settingsSave = document.querySelector(".settings__btn-save");
const settingsSaveReady = "settings__btn-save_ready";
const settingsWorkTime = document.querySelector(".settings__work-time");
const settingsBreakTime = document.querySelector(".settings__short-break-time");
const settingsLongBreakTime = document.querySelector(".settings__long-break-time");

// Sounds
let soundMuted = false;
const soundChime = new Audio("/sound/rcp-chime-bell-ding-3x.mp3");
const soundClick = new Audio("/sound/rcp-click-04.mp3");

//
// FUNCTIONS
//

// HELPERS //

function switchTheme(theme) {
	if (theme == "default") {
		root.classList.remove("theme-break", "theme-long-break");
		root.classList.add("theme-default");
	}
	else if (theme == "break") {
		root.classList.remove("theme-default");
		root.classList.add("theme-break");
	}
	else if (theme == "longbreak") {
		root.classList.remove("theme-default");
		root.classList.add("theme-long-break");
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

function outputNumHoursMinutes(minutes) {
	numHours = parseInt(minutes / 60);
	numMinutes = minutes % 60;

	return numHours + "h " + numMinutes + "m";
}

function initLocalStorage() {
	if (localStorage.getItem("defaultWorkMinutes")) {
		defaultWorkMinutes = localStorage.getItem("defaultWorkMinutes");
	}

	if (localStorage.getItem("defaultBreakMinutes")) {
		defaultBreakMinutes = localStorage.getItem("defaultBreakMinutes");
	}

	if (localStorage.getItem("defaultLongBreakMinutes")) {
		defaultLongBreakMinutes = localStorage.getItem("defaultLongBreakMinutes");
	}

	if (localStorage.getItem("tempWorkMinutes")) {
		tempWorkMinutes = localStorage.getItem("tempWorkMinutes");
	}

	if (localStorage.getItem("tempBreakMinutes")) {
		tempBreakMinutes = localStorage.getItem("tempBreakMinutes");
	}

	if (localStorage.getItem("tempLongBreakMinutes")) {
		tempLongBreakMinutes = localStorage.getItem("tempLongBreakMinutes");
	}

	if (localStorage.getItem("timerSessions")) {
		timerSessions = parseInt(localStorage.getItem("timerSessions"));
	}
}

function initStats() {
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

function updateStats() {
	// Increment sessions
	statsSessions++;
	
	// Calculate total time
	statsTotalTime += minutes;

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

function playSound(sound) {
	if (!soundMuted) {
		sound.play();
	}
}

// INITIAL LOAD //

function initialLoad() {
	// Initialize localStorage
	initLocalStorage();

	// When page is first loaded...
	// Set minutes
	if (tempWorkMinutes) {
		minutes = tempWorkMinutes;
	}
	else {
		minutes = defaultWorkMinutes;
	}

	// Make sure work session is ready to go
	timerWorkSession = true;

	// Make timer clickable
	clickable(timer, true);

	// Add time to timer interface
	timerMinutes.innerHTML = ("0" + minutes).slice(-2);
	timerSeconds.innerHTML = "00";

	// See if reset button should be displayed
	decideReset();
	initSessions();
	initStats();
	initSettings();
}

// TIMER //

function startSubdials() {
	// Add subdial animations by adding classes to their respective elements
	for (let i = 0; i < subdialPies.length; i++) {
		subdialPies[i].classList.add(pieClasses[i]);
	}

	// Provide time in seconds to CSS variable (used by total subdial)
	root.style.setProperty("--subdial-seconds", minutes * 60 + "s")

	// Change CSS variable that controls animation play state
	root.style.setProperty("--animation-play-state", "running");
}

function pauseSubdials() {
	// Change CSS variable that controls animation play state
	root.style.setProperty("--animation-play-state", "paused");
}

function resumeSubdials() {
	// Change CSS variable that controls animation play state
	root.style.setProperty("--animation-play-state", "running");
}

function stopSubdials() {
	// Change CSS variable that controls animation play state
	root.style.setProperty("--animation-play-state", "paused");

	// Remove subdial animations by removing classes from their respective elements
	for (let i = 0; i < subdialPies.length; i++) {
		subdialPies[i].classList.remove(pieClasses[i]);
	}
}

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
			if (t < 1) {
				// Work session
				if (timerWorkSession) {
					tempWorkMinutes = .1; // Test value
					
					// Update localStorage
					localStorage.setItem("tempWorkMinutes", tempWorkMinutes);

					return tempWorkMinutes;
				}
				// Break session
				else if (timerBreakSession) {
					tempBreakMinutes = .05; // Test value

					// Update localStorage
					localStorage.setItem("tempBreakMinutes", tempBreakMinutes);

					return tempBreakMinutes;
				}
				// Long break session
				else if (timerLongBreakSession) {
					tempLongBreakMinutes = .2; // Test value

					// Update localStorage
					localStorage.setItem("tempLongBreakMinutes", tempLongBreakMinutes);

					return tempLongBreakMinutes;
				}
			}
			else if (t > 55) {
				// Work session
				if (timerWorkSession) {
					tempWorkMinutes = .2; // Test value

					// Update localStorage
					localStorage.setItem("tempWorkMinutes", tempWorkMinutes);

					return tempWorkMinutes;
				}
				// Break session
				else if (timerBreakSession) {
					tempBreakMinutes = .1; // Test value

					// Update localStorage
					localStorage.setItem("tempBreakMinutes", tempBreakMinutes);

					return tempBreakMinutes;
				}
				// Long break session
				else if (timerLongBreakSession) {
					tempLongBreakMinutes = .2; // Test value

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
				// Break session
				else if (timerBreakSession) {
					tempBreakMinutes = t;

					// Update localStorage
					localStorage.setItem("tempBreakMinutes", tempBreakMinutes);

					return tempBreakMinutes;
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
		// Break session
		else if (timerBreakSession) {
			if (tempBreakMinutes) {
				return tempBreakMinutes;
			}
			else {
				return defaultBreakMinutes;
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
			timerRunning = false;
			clearInterval(timerInterval)

			// Make sure to reset time to original value
			minutesInMs = minutesToMs(minutes);

			// Update UI
			hide(pause);
			show(play);
			hide(stop);
			stopSubdials();
			clickable(timer, true);
			updateSessions();

			// Play sound
			playSound(soundChime);

			// Automatically swich to a work/break session
			if (timerWorkSession) {
				// Update stats too
				updateStats();

				// Decide whether a regular or long break
				if (timerSessions < 4) {
					breakSession();
				}
				else {
					longBreakSession();
				}
				// Make sure to run this last, otherwise the reset button will carry over between sessions
				decideReset();
			}
			else if (timerBreakSession) {
				workSession();
				decideReset();
			}
			else if (timerLongBreakSession) {
				workSession();
				decideReset();
			}
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
	pauseSubdials();
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
	resumeSubdials();
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

		// Hide stop and stop subdials since the session has been terminated
		hide(stop);
		stopSubdials();

		// Reset timer interface values
		timerMinutes.innerHTML = ("0" + minutes).slice(-2);
		timerSeconds.innerHTML = "00";

		// Make clickable
		clickable(timer, true);

		// See if reset button should be displayed
		decideReset()
	}
	else {
		// No session, so don't do anything
		return;
	}
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
	// Make sure both break sessions are reset
	timerBreakSession = false;
	timerLongBreakSession = false;
	timerWorkSession = true;

	// Update UI
	toggle.removeAttribute("aria-pressed");
	switchTheme("default");

	// Reset timer interface values
	timerMinutes.innerHTML = ("0" + minutes).slice(-2);
	timerSeconds.innerHTML = "00";
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

function longBreakSession() {
	// Check if a temporay time has been set, then reset minutes
	if (tempLongBreakMinutes) {
		minutes = tempLongBreakMinutes;
	}
	else {
		minutes = defaultLongBreakMinutes;
	}

	// Update session type
	timerWorkSession = false;
	timerLongBreakSession = true;

	// Update UI
	toggle.setAttribute("aria-pressed", "true");
	switchTheme("longbreak");

	// Reset timer interface values
	timerMinutes.innerHTML = ("0" + minutes).slice(-2);
	timerSeconds.innerHTML = "00";
}

function decideReset() {
	// Hide first
	// Handles cases where the timer is started and when the timer is toggled to another session
	hide(reset);

	// If the timer hasn't started, only show reset button on appropriate session
	if (!timerSessionStarted) {
		if (tempWorkMinutes && timerWorkSession) {
			show(reset);
		}
		else if (tempBreakMinutes && timerBreakSession) {
			show(reset);
		}
		else if (tempLongBreakMinutes && timerLongBreakSession) {
			show(reset);
		}
	}
}

function initSessions() {
	// Update UI
	switch(timerSessions) {
		case 1:
			sessionOne.classList.add(sessionCompleted);
			break;
		case 2:
			sessionOne.classList.add(sessionCompleted);
			sessionTwo.classList.add(sessionCompleted);
			break;
		case 3:
			sessionOne.classList.add(sessionCompleted);
			sessionTwo.classList.add(sessionCompleted);
			sessionThree.classList.add(sessionCompleted);
			break;
		case 4:
			sessionOne.classList.add(sessionCompleted);
			sessionTwo.classList.add(sessionCompleted);
			sessionThree.classList.add(sessionCompleted);
			sessionFour.classList.add(sessionCompleted);
			break;
	}
}

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
				sessionOne.classList.add(sessionCompleted);
				break;
			case 2:
				sessionTwo.classList.add(sessionCompleted);
				break;
			case 3:
				sessionThree.classList.add(sessionCompleted);
				break;
			case 4:
				sessionFour.classList.add(sessionCompleted);
				break;
		}
	}
}

function clearSessions() {
	timerSessions = 0;

	sessionMarkers.forEach((marker) => {
		marker.classList.remove(sessionCompleted);
	});
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
		// Decide whether regular or break session
		if (timerSessions < 4) {
			breakSession();
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

// Minutes input
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

			// Remove from localStorage
			localStorage.removeItem("tempWorkMinutes");

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

			// Remove from localStorage
			localStorage.removeItem("tempBreakMinutes");

			minutes = defaultBreakMinutes;

			// Update UI
			hide(timerInput);
			show(timer);
			hide(reset);

			// Reset timer interface values
			timerMinutes.innerHTML = ("0" + minutes).slice(-2);
			timerSeconds.innerHTML = "00";
		}
		else if (timerLongBreakSession) {
			tempLongBreakMinutes = null;

			// Remove from localStorage
			localStorage.removeItem("tempLongBreakMinutes");
			
			minutes = defaultLongBreakMinutes;

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
	// Play sound
	playSound(soundClick);

	// Prevent "double" running of the function by checking if a session has already been started
	if (!timerSessionStarted) {
		// Decide time
		minutes = decideTime(timerInputMinutes);

		// Clear value in timer input so that it's not "saved" and carried between sessions
		timerInputMinutes.value = "";

		// Start session
		timerSessionStarted = true;

		// Hide reset button
		decideReset();

		// Clear sessions if session set has been reached
		if (timerWorkSession && timerSessions == 4) {
			clearSessions();
		}

		// Calculate finish time and start timer and subdials
		timerStartTime = Date.parse(new Date());
		minutesInMs = minutesToMs(minutes);
		timerFinishTime = new Date(timerStartTime + minutesInMs);
		startTimer(timerFinishTime);
		startSubdials();
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

		// Play sound
		playSound(soundClick);
	}
	// Prevent "double" running
	else {
		return;
	}
});

// Stop
stop.addEventListener("click", function() {
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
stats.addEventListener("click", function() {
	// Close settings drawer if it's open
	if (!settingsDrawer.classList.contains("hidden")) {
		hide(settingsDrawer);
	}

	// Check whether stats drawer should be hidden or closed
	if (drawerStats.classList.contains("hidden")) {
		show(drawerStats);
	}
	else {
		hide(drawerStats);
	}
});

// Settings button
settings.addEventListener("click", function() {
	// Close stats drawer if it's open
	if (!drawerStats.classList.contains("hidden")) {
		hide(drawerStats);
	}

	// Check whether settings drawer should be hidden or closed
	if (settingsDrawer.classList.contains("hidden")) {
		show(settingsDrawer);
	}
	else {
		hide(settingsDrawer);
	}
});

// Close stats button
btnCloseStats.addEventListener("click", function() {
	hide(drawerStats);
});

// Close settings button
settingsClose.addEventListener("click", function() {
	hide(settingsDrawer);
});

settingsTimeInputs.forEach((timeInput) => {
		timeInput.addEventListener("input", function() {
			// Replace any character that is not a number
			// Adapted from: https://knplabs.com/en/blog/how2-tips-how-to-restrict-allowed-characters-inside-a-text-input-in-one-line-of-code
			timeInput.value = timeInput.value.replace(/[^0-9+]/g, "");

			// Check for value
			if (timeInput.value) {
				// Remove disabled attribute and add ready class
				settingsSave.removeAttribute("disabled");
				settingsSave.classList.add(settingsSaveReady);
			}
			else {
				// Check if all the inputs are empty
				if (!settingsWorkTime.value && !settingsBreakTime.value && !settingsLongBreakTime.value) {
					// No values, so make sure disabled attribute is set and ready class is removed
					settingsSave.setAttribute("disabled", "");
					settingsSave.classList.remove(settingsSaveReady);
				}
			}
		});
	});

function decideDefaultTime(value) {
	let t = parseInt(value);

	// Check if value is not a number
	if (isNaN(t)) {
		return;
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
		// Number seems to be fine so return it
		else {
			return t;
		}
	}
}

function initSettings() {
	// Remove input values in case they were carried over from page load/no save
	settingsWorkTime.value = "";
	settingsBreakTime.value = "";
	settingsLongBreakTime.value = "";

	// Add placeholders
	settingsWorkTime.setAttribute("placeholder", defaultWorkMinutes + " mins");
	settingsBreakTime.setAttribute("placeholder", defaultBreakMinutes + " mins");
	settingsLongBreakTime.setAttribute("placeholder", defaultLongBreakMinutes + " mins");
}

// Settings save
settingsSave.addEventListener("click", function() {
	if (settingsWorkTime.value) {
		let time = decideDefaultTime(settingsWorkTime.value);

		if (time) {
			defaultWorkMinutes = time;

			// Update localStorage
			localStorage.setItem("defaultWorkMinutes", defaultWorkMinutes);

			// Also reset temp minutes
			tempWorkMinutes = null;
			localStorage.removeItem("tempWorkMinutes");

			// Update placeholder
			settingsWorkTime.value = "";
			settingsWorkTime.setAttribute("placeholder", time + " mins");

			// If possible, update UI and pass new value to minutes
			if (!timerRunning && timerWorkSession) {
				minutes = defaultWorkMinutes;

				// Reset timer interface values
				timerMinutes.innerHTML = ("0" + minutes).slice(-2);
				timerSeconds.innerHTML = "00";

				// Hide reset button in case a temp time was already set
				decideReset();
			}
		}
	}

	if (settingsBreakTime.value) {
		let time = decideDefaultTime(settingsBreakTime.value);

		if (time) {
			defaultBreakMinutes = time;

			// Update localStorage
			localStorage.setItem("defaultBreakMinutes", defaultBreakMinutes);

			// Also reset temp minutes
			tempBreakMinutes = null;
			localStorage.removeItem("tempBreakMinutes");

			// Update placeholder
			settingsBreakTime.value = "";
			settingsBreakTime.setAttribute("placeholder", time + " mins");

			// If possible, update UI and pass new value to minutes
			if (!timerRunning && timerBreakSession) {
					minutes = defaultBreakMinutes;

					// Reset timer interface values
					timerMinutes.innerHTML = ("0" + minutes).slice(-2);
					timerSeconds.innerHTML = "00";

					// Hide reset button in case a temp time was already set
					decideReset();
			}
		}
	}

	if (settingsLongBreakTime.value) {
		let time = decideDefaultTime(settingsLongBreakTime.value);

		if (time) {
			defaultLongBreakMinutes = time;

			// Update localStorage
			localStorage.setItem("defaultLongBreakMinutes", defaultLongBreakMinutes);

			// Also reset temp minutes
			tempLongBreakMinutes = null;
			localStorage.removeItem("tempLongBreakMinutes");

			// Update placeholder
			settingsLongBreakTime.value = "";
			settingsLongBreakTime.setAttribute("placeholder", time + " mins");

			// If possible, update UI and pass new value to minutes
			if (!timerRunning && timerLongBreakSession) {
					minutes = defaultLongBreakMinutes;

					// Reset timer interface values
					timerMinutes.innerHTML = ("0" + minutes).slice(-2);
					timerSeconds.innerHTML = "00";

					// Hide reset button in case a temp time was already set
					decideReset();
			}
		}
	}

	// Disable after "save"
	settingsSave.setAttribute("disabled", "");
	settingsSave.classList.remove(settingsSaveReady);
});

//
// RUN
//

initialLoad();
