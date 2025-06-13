let xDown = null;
let invitees = [];
let currentIndex = 0;
let isPlaying = false;
let selectedInvitee = null;
const slides = document.querySelectorAll(".slide");
const music = document.getElementById("background-music");
const musicButton = document.getElementById("music-button");
const weddingDate = new Date("July 19, 2025 18:30:00").getTime();

// const parts = [
//     "aHR0cHM6Ly9zY3JpcHQu", // https://script.
//     "Z29vZ2xlLmNvbS9tYWNyb3M", // google.com/macros
//     "vcy9BS2Z5Y2J3SWlLZllBUzVic1h6N3hoRXhfTjg4d0c4eWctZGpyM3p0RjJEWURWaUln", // /s/AKfycbwIiKfYAS5bsXz7xhEx_N88wG8yg-djr3ztF2DYDVaIg
//     "Ulh4THBCY3lLX0ZrQWVqdGRKbXF5eC9leGVj" // RXxLpBcyK_xFkAejtdJmqyx/exec
// ];

// const ShParts = [parts[2], parts[0], parts[3], parts[1]];
// const CoOrParts = [ShParts[1], ShParts[3], ShParts[0], ShParts[2]];
// const fuEnParts = CoOrParts.join("");
// const aU = atob(fuEnParts);


document.addEventListener("DOMContentLoaded", () => {
    // Only start countdown if the link is valid, i.e. after hideLoadingScreen() is called
    // so that #countdown-timer is visible in the DOM.
    startCountdown();
    startCountdownSticky();
});
document.querySelector("#rsvp button").addEventListener("click", openModal);

window.addEventListener("touchmove", handleTouchMove, false);
window.addEventListener("touchstart", handleTouchStart, false);

fetchInvitees();

async function fetchInvitees() {
    // Start UI while data is loading
    hideLoadingScreen(); // ✅ Don't wait

    try {
        const response = await fetch('https://script.google.com/macros/s/AKfycbwIiKfYAS5bsXz7xhEx_N88wG8yg-djr3ztF2DYDVaIgRXxLpBcyK_xFkAejtdJmqyx/exec');
        invitees = await response.json();
    } catch (error) {
        console.error("Error fetching invitees:", error);
        showErrorScreen();
        return;
    }

    checkGuestFromURL(); // ✅ Now runs after data is fetched
}


function checkGuestFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    let encodedKey = urlParams.get("key");

    if (!encodedKey) return showErrorScreen();

    encodedKey = decodeURIComponent(encodedKey);
    const guestName = decodeName(encodedKey);
    const foundInvitee = invitees.find(inv => inv.name === guestName);

    if (foundInvitee) {
        selectedInvitee = foundInvitee;
        hideLoadingScreen(); // Slide transition starts here
    } else {
        showErrorScreen();
    }
}


function handleTouchStart(evt) {
    xDown = evt.touches[0].clientX;
}

function handleTouchMove(evt) {
    if (!xDown) return;

    let xUp = evt.touches[0].clientX;
    let xDiff = xDown - xUp;

    // Prevent swipe when on the first slide (index 0)
    if (currentIndex === 0) return;

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
    if (currentIndex > 1) {
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

function showGuest(invitee) {
    selectedInvitee = invitee;
    const modal = document.getElementById("rsvp-modal");
    const nameField = document.getElementById("selected-name");
    const guestCountDiv = document.getElementById("guest-count");
    const confirmBtn = document.getElementById("confirm-button");

    nameField.textContent = `RSVP for ${invitee.name}`;

    if (invitee.rsvp === "Confirmed") {
        guestCountDiv.style.display = "none";
        confirmBtn.style.display = "none";

        nameField.innerHTML = `${invitee.name} already confirmed for ${invitee.confirmedGuests} guest${invitee.confirmedGuests > 1 ? 's' : ''}`;
    } else {
        if (invitee.maxGuests > 0) {
            guestCountDiv.style.display = "block";
            document.getElementById("guest-number").value = invitee.maxGuests;
            document.getElementById("guest-number").max = invitee.maxGuests;
            document.getElementById("guest-limit").textContent = `${invitee.maxGuests} guests`;
        } else {
            guestCountDiv.style.display = "none";
        }
        confirmBtn.style.display = "block";
    }

    modal.style.display = "flex";
}


// Optimized confirmRSVP with better user experience (no visual changes)
function confirmRSVP() {
    if (!selectedInvitee) return;

    const rsvpResponse = "Confirmed";
    let guestCount = 0;

    if (selectedInvitee.maxGuests > 0) {
        guestCount = parseInt(document.getElementById("guest-number").value, 10);
        if (!guestCount || guestCount <= 0 || guestCount > selectedInvitee.maxGuests) {
            showConfirmationPopup(`Please enter a valid number of guests (Max: ${selectedInvitee.maxGuests}).`, true);
            return;
        }
    }

    // Disable confirm button to prevent multiple clicks
    const confirmBtn = document.getElementById("confirm-button");
    confirmBtn.disabled = true;
    confirmBtn.textContent = "Submitting...";
    spawnHearts();


    // Send RSVP Data
    fetch('https://script.google.com/macros/s/AKfycbwIiKfYAS5bsXz7xhEx_N88wG8yg-djr3ztF2DYDVaIgRXxLpBcyK_xFkAejtdJmqyx/exec', {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: selectedInvitee.name,
            response: rsvpResponse,
            guestCount: guestCount
        })
    })
        .then(() => {
            const message = `Thank you for your confirmation!<br>We can't wait to celebrate with you ♡`;
            showConfirmationPopup(message);
            selectedInvitee.confirmedGuests = guestCount;
            selectedInvitee.rsvp = rsvpResponse;
            closeModal();
        })
        .catch(() => {
            showConfirmationPopup("Something went wrong. Please try again.", true);
        })
        .finally(() => {
            confirmBtn.disabled = false;
            confirmBtn.textContent = "Confirm";
        });
}


function showConfirmationPopup(message, isError = false) {
    const modal = document.getElementById("rsvp-confirm-modal");
    const messageElement = document.getElementById("confirmation-message");

    messageElement.innerHTML = message;

    // Change color for errors (optional)
    messageElement.style.color = isError ? "red" : "black";

    modal.style.display = "flex"; // Show modal
}

function closeConfirmationModal() {
    document.getElementById("rsvp-confirm-modal").style.display = "none";
}

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

function startExperience() {
    const overlay = document.getElementById("tap-to-start-overlay");
    overlay.style.opacity = "0"; // Fade out effect
    setTimeout(() => {
        overlay.style.display = "none"; // Hide completely after fade
    }, 500);

    // Start music (if applicable)
    toggleMusic();

}

function spawnHearts(count = 10) {
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const heart = document.createElement("div");
            heart.className = "heart";

            // Random horizontal position
            const leftOffset = 40 + Math.random() * 20; // 40% to 60%
            heart.style.left = `${leftOffset}%`;

            // Random font size
            heart.style.fontSize = `${22 + Math.random() * 14}px`;

            // Slight rotation
            heart.style.transform = `rotate(${Math.random() * 40 - 20}deg)`;

            // Use various pink emojis for fun
            const emojis = ["💗", "💖", "💕", "💞"];
            heart.textContent = emojis[Math.floor(Math.random() * emojis.length)];

            document.body.appendChild(heart);

            setTimeout(() => {
                heart.remove();
            }, 2500); // match CSS animation duration
        }, i * 250); // space out creation: 150ms between each
    }
}