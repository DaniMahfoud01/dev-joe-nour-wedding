let invitees = []; // Empty list until data is fetched

async function fetchInvitees() {
    try {
        const response = await fetch("https://script.google.com/macros/s/AKfycbzK6rRX4D3In_NCqef8zAXCbrRz8iIWOOpqPkjn52Varb7blviLQfY2jfr-rhmEveo/exec");
        invitees = await response.json();
        console.log("Invitees loaded:", invitees);

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
    if (currentIndex === 0) return;

    if (xDiff > 0) {
        nextSlide();
    } else {
        prevSlide();
    }

    xDown = null;
}


function firstSlide() {
    isPlaying = false;
    toggleMusic();
    nextSlide();
}

function nextSlide() {
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
        document.getElementById("guest-number").value = 1; // default
        document.getElementById("guest-number").max = invitee.maxGuests;
        document.getElementById("guest-limit").textContent =
            `Max: ${invitee.maxGuests} guests`;
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
    fetch("https://script.google.com/macros/s/AKfycbzK6rRX4D3In_NCqef8zAXCbrRz8iIWOOpqPkjn52Varb7blviLQfY2jfr-rhmEveo/exec", {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: selectedInvitee.name,
            response: rsvpResponse,
            guestCount: guestCount
        })
    });

    // Custom popup message
    const message = guestCount > 0
        ? `RSVP confirmed for ${selectedInvitee.name} with ${guestCount} guests.`
        : `RSVP confirmed for ${selectedInvitee.name}.`;

    showConfirmationPopup(message);
    closeModal(); // Close RSVP input modal
}

function showConfirmationPopup(message, isError = false) {
    const modal = document.getElementById("rsvp-confirm-modal");
    const messageElement = document.getElementById("confirmation-message");

    messageElement.textContent = message;

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
        console.log("Decoded guest name:", guestName);

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


// // Properly extract the "key" parameter from the full URL
// const urlParams = new URLSearchParams(window.location.search);
// let encodedKey = urlParams.get("key");

// // Ensure we properly decode the full encoded string
// if (encodedKey) {
//     encodedKey = decodeURIComponent(encodedKey); // Decode URL encoding
//     const guestName = decodeName(encodedKey);
//     console.log("Decoded guest name:", guestName);

//     // Find the matching invitee in the list
//     const foundInvitee = invitees.find(inv => inv.name === guestName);
//     if (foundInvitee) {
//         // Store it so it can be used when opening the RSVP modal
//         selectedInvitee = foundInvitee;
//     } else {
//         showErrorScreen(); // Show contact options instead of an alert
//     }
// } else {
//     showErrorScreen(); // If there's no key, show the contact options
// }

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
