let invitees = [];

async function fetchInvitees() {
    try {
        const response = await fetch("https://script.google.com/macros/s/AKfycbzK6rRX4D3In_NCqef8zAXCbrRz8iIWOOpqPkjn52Varb7blviLQfY2jfr-rhmEveo/exec");
        invitees = await response.json();

        // Now that the invitees are loaded, check if the guest is valid
        checkGuestFromURL();
    } catch (error) {
        console.error("Error fetching invitees:", error);
        showErrorScreen(); // If fetching fails, show the error screen
    }
}


// Fetch invitees on page load
fetchInvitees();


let currentIndex = 0;
const slides = document.querySelectorAll(".slide");
const music = document.getElementById("background-music");
const musicButton = document.getElementById("music-button");
let isPlaying = false;
let selectedInvitee = null;
const weddingDate = new Date("July 19, 2025 18:00:00").getTime();


window.addEventListener("touchstart", handleTouchStart, false);
window.addEventListener("touchmove", handleTouchMove, false);

let xDown = null;

function handleTouchStart(evt) {
    xDown = evt.touches[0].clientX;
}

function handleTouchMove(evt) {
    if (!xDown) return;

    let xUp = evt.touches[0].clientX;
    let xDiff = xDown - xUp;

    // Prevent swipe when on the first slide (index 0)
    // if (currentIndex === 0) return;

    if (xDiff > 0) {
        nextSlide();
    } else {
        prevSlide();
    }

    xDown = null;
}


function firstSlide() {
    music.play();
    isPlaying = false;
    toggleMusic();
    nextSlide();
}

function nextSlide() {
    if (currentIndex === 0) {
        isPlaying = false;
        toggleMusic();
    }
    if (currentIndex < slides.length - 1) {
        currentIndex++;
        updateSlidePosition();
    }
}

function prevSlide() {
    if (currentIndex > 0) {
        currentIndex--;
        updateSlidePosition();
    }
}

function updateSlidePosition() {
    slides.forEach((slide, index) => {
        slide.style.transform = `translateX(-${currentIndex * 100}vw)`;
    });
    // Show countdown ONLY if it's NOT the first slide
    const countdown = document.getElementById("sticky-countdown");
    if (currentIndex > 1) {
        countdown.style.display = "block"; // Show countdown
    } else {
        countdown.style.display = "none";  // Hide countdown
    }
}

function toggleMusic() {
    if (isPlaying) {
        music.pause();
        musicButton.innerHTML = '<i class="fas fa-play"></i>';
    } else {
        music.play();
        musicButton.innerHTML = '<i class="fas fa-pause"></i>';
    }
    isPlaying = !isPlaying;
}

function toggleMusicInitial() {
    music.play();
}

// --------------------------------------------------------------------------
// Open the modal when the RSVP button is clicked
document.querySelector("#rsvp button").addEventListener("click", openModal);

function openModal() {
    // If we already found a valid guest from the URL, show them
    if (selectedInvitee) {
        showGuest(selectedInvitee);
    }
    document.getElementById("rsvp-modal").style.display = "flex";
}

function closeModal() {
    document.getElementById("rsvp-modal").style.display = "none";
}

// Show the chosen guest's info in the modal
function showGuest(invitee) {
    selectedInvitee = invitee;
    document.getElementById("selected-name").textContent = invitee.name;

    // If maxGuests > 0, show the number field
    if (invitee.maxGuests > 0) {
        document.getElementById("guest-count").style.display = "block";
        document.getElementById("guest-number").value = invitee.maxGuests; // default
        document.getElementById("guest-number").max = invitee.maxGuests;
        document.getElementById("guest-limit").textContent =
            `${invitee.maxGuests} guests`;
    } else {
        document.getElementById("guest-count").style.display = "none";
    }

    // Show confirm button
    document.getElementById("confirm-button").style.display = "block";
}

// Confirm RSVP when user clicks the confirm button
function confirmRSVP() {
    if (!selectedInvitee) return;

    const rsvpResponse = "Confirmed";
    let guestCount = 0;

    // If guests are allowed, read the input value
    if (selectedInvitee.maxGuests > 0) {
        guestCount = parseInt(document.getElementById("guest-number").value, 10);
        if (!guestCount || guestCount <= 0 || guestCount > selectedInvitee.maxGuests) {
            showConfirmationPopup(`Please enter a valid number of guests (Max: ${selectedInvitee.maxGuests}).`, true);
            return;
        }
    }

    // Send RSVP Data
    fetch("./config.js")
        .then(response => response.text())
        .then(apiScript => {
            eval(apiScript);  // Executes the script to set apiUrl variable

            fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: selectedInvitee.name,
                    response: rsvpResponse,
                    guestCount: guestCount
                })
            });
        });

    // Custom popup message
    const message = `Thank you for your confirmation!<br>We can't wait to celebrate with you ♡`;


    showConfirmationPopup(message);
    closeModal(); // Close RSVP input modal
}

function showConfirmationPopup(message, isError = false) {
    const modal = document.getElementById("rsvp-confirm-modal");
    const messageElement = document.getElementById("confirmation-message");

    messageElement.innerHTML = message;

    // Change color for errors (optional)
    messageElement.style.color = isError ? "red" : "black";

    modal.style.display = "flex"; // Show modal
}

// Function to close the popup
function closeConfirmationModal() {
    document.getElementById("rsvp-confirm-modal").style.display = "none";
}


// --------------------------------------------------------------------------
// Function to decode the invitee's name (Shift by 3 approach)
function decodeName(encodedName) {
    return encodedName
        .split('')
        .map(char =>
            String.fromCharCode(((char.charCodeAt(0) - 3 - 32 + 95) % 95) + 32)
        )
        .join('');
}

function checkGuestFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    let encodedKey = urlParams.get("key");

    if (encodedKey) {
        encodedKey = decodeURIComponent(encodedKey);
        const guestName = decodeName(encodedKey);

        const foundInvitee = invitees.find(inv => inv.name === guestName);
        if (foundInvitee) {
            selectedInvitee = foundInvitee;
            hideLoadingScreen(); // Only hide loading if the guest is valid
        } else {
            showErrorScreen(); // If guest is not found, show error
        }
    } else {
        showErrorScreen(); // If no key exists, show error
    }
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById("loading-screen");
    loadingScreen.style.opacity = "0"; // Fade out
    document.getElementById("slides").style.display = "flex";
    setTimeout(() => {
        loadingScreen.style.display = "none"; // Hide after fade-out
    }, 500);
}

// Function to show the "Invalid Link" error screen
function showErrorScreen() {
    document.body.innerHTML = `
      <div class="background-wrapper">
          <video class="background-video" autoplay loop muted playsinline>
              <source src="background.mp4" type="video/mp4" />
              Your browser does not support the video tag.
          </video>
          <div class="background-overlay"></div>
      </div>
      <div class="error-screen">
          <div class="error-content">
              <h1>Oops! This link is invalid.</h1>
              <p>Please contact us for assistance.</p>
              <div class="buttons">
                  <a href="https://wa.me/+96170342140?text=Hello%2C%20I%20need%20help%20with%20my%20invitation%20link." class="contact-btn">Contact Joe</a>
                  <a href="https://wa.me/+96176349977?text=Hello%2C%20I%20need%20help%20with%20my%20invitation%20link." class="contact-btn">Contact Nour</a>
              </div>
          </div>
      </div>
    `;

    // Apply styling for the error screen
    const style = document.createElement("style");
    style.innerHTML = `
      .error-screen {
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: white;
      }
  
      .error-content {
          background: rgba(0, 0, 0, 0.7);
          padding: 20px;
          border-radius: 10px;
          width: 80%;
          max-width: 400px;
      }
  
      .buttons {
          display: flex;
          flex-direction: column;
          gap: 15px; /* Adds space between buttons */
          align-items: center;
      }
  
      .contact-btn {
          width: 100%; /* Make buttons full width */
          max-width: 250px; /* Prevent too wide buttons */
          text-align: center;
          padding: 12px 20px;
          font-size: 1.2rem;
          background: white; /* Match confirm button */
          color: black;
          border: none;
          border-radius: 30px;
          cursor: pointer;
          transition: background 0.3s, color 0.3s;
          text-decoration: none;
          font-weight: bold;
      }
    `;
    document.head.appendChild(style);
}

function decreaseGuest() {
    let guestInput = document.getElementById("guest-number");
    let minGuests = parseInt(guestInput.min, 10) || 1;
    let currentValue = parseInt(guestInput.value, 10) || minGuests;

    if (currentValue > minGuests) {
        guestInput.value = currentValue - 1;
    }
}

function increaseGuest() {
    let guestInput = document.getElementById("guest-number");
    let maxGuests = parseInt(guestInput.max, 10) || 10;
    let currentValue = parseInt(guestInput.value, 10) || 1;

    if (currentValue < maxGuests) {
        guestInput.value = currentValue + 1;
    }
}

// Countdown to Wedding Date
function startCountdown() {
    const countdownTimerElem = document.getElementById("countdown-timer");

    // Update every second
    const timerInterval = setInterval(() => {
        const now = new Date().getTime();
        const distance = weddingDate - now;

        if (distance <= 0) {
            // If the countdown is finished, stop updating
            clearInterval(timerInterval);
            countdownTimerElem.textContent = "It's happening now!";
            return;
        }

        // Calculate days, hours, minutes, seconds
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Display the result
        countdownTimerElem.innerHTML = `
        <div><strong>${days}</strong><br>Days</div>
        <div><strong>${hours}</strong><br>Hours</div>
        <div><strong>${minutes}</strong><br>Min</div>
        <div><strong>${seconds}</strong><br>Sec</div>
      `;
    }, 1000);
}
function startCountdownSticky() {
    const countdownTimerElem = document.getElementById("countdown-timer-sticky");

    setInterval(() => {
        const now = new Date().getTime();
        const distance = weddingDate - now;

        if (distance <= 0) {
            countdownTimerElem.innerHTML = "It's happening now!";
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        countdownTimerElem.innerHTML = `<strong>${days}</strong> days <strong>${hours}</strong>h 
                                        <strong>${minutes}</strong>m <strong>${seconds}</strong>s`;
    }, 1000);
}

// Make sure this runs once the DOM is ready (and after invitee checks)
document.addEventListener("DOMContentLoaded", () => {
    // Only start countdown if the link is valid, i.e. after hideLoadingScreen() is called
    // so that #countdown-timer is visible in the DOM.
    startCountdown();
    startCountdownSticky();
});

function startExperience() {
    const overlay = document.getElementById("tap-to-start-overlay");
    overlay.style.opacity = "0"; // Fade out effect
    setTimeout(() => {
        overlay.style.display = "none"; // Hide completely after fade
    }, 500);

    // Start music (if applicable)
    toggleMusic();

}
