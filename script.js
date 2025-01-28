const messageContainer = document.getElementById("messageContainer");
const messageInput = document.getElementById("messageInput");
const sendMessageButton = document.getElementById("sendMessageButton");
const typingIndicator = document.getElementById("typingIndicator");
const warningMessage = document.getElementById("warningMessage");
const muteButton = document.getElementById("muteButton");


const currentUser = "me";
let isMuted = false; // Tracks mute state
let typingTimeout;
let warningTimeout;
let isInitialLoad = true; // Detects the first message load
let isTypingVisible = false; // Track if the dots are currently shown
let lastTypingState = false; // Store last state to prevent unnecessary updates

const userProfiles = {
    me: "/img/mario.png",
    user1: "/img/peach.png",
};

// Helper function to create a new message group
function createMessageGroup(sender, isCurrentUser) {
    const messageGroup = document.createElement("div");
    messageGroup.classList.add("message-group");
    messageGroup.setAttribute("data-user", sender);

    if (isCurrentUser) messageGroup.classList.add("sent");

    const pfp = document.createElement("img");
    pfp.classList.add("pfp");
    pfp.src = userProfiles[sender] || "https://i.imgur.com/4M34hi2.png";
    messageGroup.appendChild(pfp);

    const contentContainer = document.createElement("div");
    messageGroup.appendChild(contentContainer);

    const username = document.createElement("div");
    username.classList.add("username");
    username.textContent = sender;
    contentContainer.appendChild(username);

    messageContainer.appendChild(messageGroup);

    return messageGroup;
}

// Helper function to add a message to a group
function addMessageToGroup(messageGroup, messageText, timestamp) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message-box");
    messageElement.textContent = messageText;

    // Add reaction functionality
    const reactionContainer = createReactionContainer();
    messageElement.appendChild(reactionContainer);

    // Add the message to the group
    messageGroup.lastElementChild.appendChild(messageElement);

    // Add a timestamp after the message
    const timestampElement = document.createElement("div");
    timestampElement.classList.add("group-timestamp");
    timestampElement.textContent = `Sent: ${timestamp}`;
    messageElement.after(timestampElement);
}

// Create a reaction container (❤️ button and count)
function createReactionContainer() {
    const reactionContainer = document.createElement("div");
    reactionContainer.classList.add("reaction-container");

    const heartIcon = document.createElement("i");
    heartIcon.classList.add("nes-icon", "heart");

    // ❤️ Click event: Keep heart visible in the same spot
    heartIcon.addEventListener("click", (event) => {
        event.stopPropagation(); // Prevent accidental message clicks
        reactionContainer.classList.add("pinned"); // Lock visibility
    });

    reactionContainer.appendChild(heartIcon);
    return reactionContainer;
}

// Add reaction logic (click events for reactions)
document.addEventListener("click", (event) => {
    if (event.target.classList.contains("reaction-button")) {
        const reactionCountSpan = event.target.nextElementSibling;
        let currentCount = parseInt(reactionCountSpan.textContent, 10);
        reactionCountSpan.textContent = currentCount + 1; // Increment reaction count
    }
});

// Load chat messages
async function loadMessages() {
    try {
        typingIndicator.style.display = "none"; // Temporarily disable typing indicator

        const response = await fetch("https://cloud24chat.azurewebsites.net/api/messages");
        if (!response.ok) throw new Error("Failed to fetch messages");

        const messages = await response.json();
        messageContainer.innerHTML = ""; // Clear the container

        let lastSender = null;

        messages.reverse().forEach((msg, index) => {
            const isCurrentUser = msg.sender === currentUser;
            const isSameUser = msg.sender === lastSender;

            let messageGroup;

            if (isSameUser) {
                messageGroup = document.querySelector(`.message-group[data-user="${msg.sender}"]:last-of-type`);
            } else {
                messageGroup = createMessageGroup(msg.sender, isCurrentUser);
            }

            const messageElement = document.createElement("div");
            messageElement.classList.add("message-box");
            messageElement.textContent = msg.text;

            // Add reaction container
            const reactionContainer = createReactionContainer();
            messageElement.appendChild(reactionContainer);

            messageGroup.lastElementChild.appendChild(messageElement);

            const isLastMessageInGroup =
                index === messages.length - 1 || messages[index + 1]?.sender !== msg.sender;

            if (isLastMessageInGroup) {
                const timestamp = msg.timestamp
                    ? new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "Unknown Time";

                const timestampElement = document.createElement("div");
                timestampElement.classList.add("group-timestamp");
                timestampElement.textContent = `Sent: ${timestamp}`;
                messageElement.after(timestampElement);
            }

            lastSender = msg.sender;
        });

        setTimeout(() => {
            messageContainer.scrollTop = messageContainer.scrollHeight;
            if (messageInput.value.trim().length > 0) {
                typingIndicator.style.display = "flex";
            }
        }, 2);
    } catch (error) {
        console.error("Error loading messages:", error.message);
    }
}

// Trigger simulated typing every 5 seconds
//setInterval(simulateTyping, 5000);

// Send a message
async function sendMessage() {
    const messageText = messageInput.value.trim();
    if (!messageText) {
        playWarningSound();
        showWarningMessage();
        return;
    }

    let lastMessageGroup = document.querySelector(`.message-group[data-user="${currentUser}"]:last-of-type`);
    let messageGroup = lastMessageGroup || createMessageGroup(currentUser, true);

    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    addMessageToGroup(messageGroup, messageText, timestamp);

    // Auto-scroll to the latest message
    messageContainer.scrollTop = messageContainer.scrollHeight;

    try {
        const response = await fetch("https://cloud24chat.azurewebsites.net/api/message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: messageText, sender: currentUser }),
        });

        if (!response.ok) throw new Error("Failed to send message");

        messageInput.value = "";
    } catch (error) {
        console.error("Error sending message:", error.message);
    }
}

// Play a warning sound
function playWarningSound() {
    if (isMuted) return;

    const warningSound = new Audio("/sounds/SuperMarioWarning.mp3");
    try {
        warningSound.play();
    } catch (error) {
        console.error("Failed to play warning sound:", error.message);
    }
}



async function checkTypingUsers() {
    try {
        const response = await fetch("https://cloud24chat.azurewebsites.net/api/messages");
        if (!response.ok) throw new Error("Failed to check typing users");

        const typingUsers = await response.json();

        // ✅ Check if at least one other user (not currentUser) is typing
        const someoneElseTyping = typingUsers.some(user => user !== currentUser);

        // ✅ Only update if the state actually changes (prevents flickering)
        if (someoneElseTyping !== lastTypingState) {
            typingIndicator.style.display = someoneElseTyping ? "flex" : "none";
            lastTypingState = someoneElseTyping; // Store new state
        }
    } catch (error) {
        console.error("Error checking typing users:", error.message);
    }
}

// Show a warning message
function showWarningMessage() {
    warningMessage.style.display = "block";
    warningMessage.style.visibility = "visible";
    warningMessage.style.animation = "fadeInOut 2s ease";

    clearTimeout(warningTimeout);

    warningTimeout = setTimeout(() => {
        warningMessage.style.display = "none";
    }, 2000);
}

warningMessage.addEventListener("animationend", () => {
    warningMessage.style.visibility = "hidden";
    warningMessage.style.display = "none";
});

// Toggle mute button
muteButton.addEventListener("click", () => {
    isMuted = !isMuted;
    muteButton.textContent = isMuted ? "Unmute" : "Mute";
});

// Event listeners
sendMessageButton.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") sendMessage();
});

messageInput.addEventListener("input", () => {
    typingIndicator.style.display = "flex";
    clearTimeout(typingTimeout);

    typingTimeout = setTimeout(() => {
        typingIndicator.style.display = "none";
    }, 500);
});

// Load messages on page load
loadMessages();
