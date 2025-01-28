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

const userProfiles = {
    me: "https://w7.pngwing.com/pngs/106/506/png-transparent-super-mario-bros-super-nintendo-entertainment-system-super-mario-world-mario-bros.png",
    user1: "https://e7.pngegg.com/pngimages/299/182/png-clipart-super-princess-peach-luigi-mario-yoshi-luigi-super-mario-bros-text-thumbnail.png",
    user2: "https://e7.pngegg.com/pngimages/299/182/png-clipart-super-princess-peach-luigi-mario-yoshi-luigi-super-mario-bros-text-thumbnail.png",
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

    // Add the message to the group
    messageGroup.lastElementChild.appendChild(messageElement);

    // Add a timestamp after the message
    const timestampElement = document.createElement("div");
    timestampElement.classList.add("group-timestamp");
    timestampElement.textContent = `Sent: ${timestamp}`;
    messageElement.after(timestampElement);
}

// Load chat messages
async function loadMessages() {
    try {
        // Temporarily disable typing indicator during message reload
        typingIndicator.style.display = "none";

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
                messageGroup = document.createElement("div");
                messageGroup.classList.add("message-group");
                messageGroup.setAttribute("data-user", msg.sender);

                if (isCurrentUser) messageGroup.classList.add("sent");

                const pfp = document.createElement("img");
                pfp.classList.add("pfp");
                pfp.src = userProfiles[msg.sender] || "https://i.imgur.com/4M34hi2.png";
                messageGroup.appendChild(pfp);

                const contentContainer = document.createElement("div");
                messageGroup.appendChild(contentContainer);

                const username = document.createElement("div");
                username.classList.add("username");
                username.textContent = msg.sender;
                contentContainer.appendChild(username);

                messageContainer.appendChild(messageGroup);
            }

            const messageElement = document.createElement("div");
            messageElement.classList.add("message-box");
            messageElement.textContent = msg.text;
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

        // Scroll to the bottom after loading messages
        setTimeout(() => {
            messageContainer.scrollTop = messageContainer.scrollHeight;

            // Restore typing indicator after messages are loaded
            if (messageInput.value.trim().length > 0) {
                typingIndicator.style.display = "flex";
            }
        }, 2);
    } catch (error) {
        console.error("Error loading messages:", error.message);
    }
}


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

// Show a warning message
function showWarningMessage() {
    warningMessage.style.display = "block";

    clearTimeout(warningTimeout);
    warningTimeout = setTimeout(() => {
        warningMessage.style.display = "none";
    }, 3000);
}

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
