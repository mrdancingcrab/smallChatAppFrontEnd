const messageContainer = document.getElementById("messageContainer");
const messageInput = document.getElementById("messageInput");
const sendMessageButton = document.getElementById("sendMessageButton");
const typingIndicator = document.getElementById("typingIndicator");
const warningMessage = document.getElementById("warningMessage");
// Example user ID (Replace with actual user authentication)
const currentUser = "me";

let typingTimeout;
let lastMessageCount = 0;
let warningTimeout;


// Dummy profile pictures (Replace with actual user data)
const userProfiles = {
    "me": "https://w7.pngwing.com/pngs/106/506/png-transparent-super-mario-bros-super-nintendo-entertainment-system-super-mario-world-mario-bros.png", // Your profile pic
    "user1": "https://e7.pngegg.com/pngimages/299/182/png-clipart-super-princess-peach-luigi-mario-yoshi-luigi-super-mario-bros-text-thumbnail.png", // Another user
    "user2": "https://e7.pngegg.com/pngimages/299/182/png-clipart-super-princess-peach-luigi-mario-yoshi-luigi-super-mario-bros-text-thumbnail.png"  // Another user
};

// Load chat messages from API
async function loadMessages() {
    try {
        typingIndicator.style.display = "none";

        const response = await fetch("https://cloud24chat.azurewebsites.net/api/messages");
        if (!response.ok) throw new Error("Failed to fetch messages");

        const messages = await response.json();
        messageContainer.innerHTML = ""; // Clear the container

        let lastSender = null;

        // Play sound if new messages are detected
        if (messages.length > lastMessageCount) {
            const newMessageSound = new Audio("/sounds/SuperMarioMessageRecieved.mp3");
            newMessageSound.play();
        }

        // Update the message count
        lastMessageCount = messages.length;

        // Loop through the messages in reverse order (oldest to newest)
        messages.reverse().forEach((msg) => {
            const isCurrentUser = msg.sender === currentUser;
            const isSameUser = msg.sender === lastSender;

            let messageGroup;

            if (isSameUser) {
                // If same user, just reuse the previous message group
                messageGroup = document.querySelector(`.message-group[data-user="${msg.sender}"]:last-of-type`);
            } else {
                // Create a new message group for a new user
                messageGroup = document.createElement("div");
                messageGroup.classList.add("message-group");
                messageGroup.setAttribute("data-user", msg.sender);

                // If the sender is the current user, mark it as a sent message
                if (isCurrentUser) messageGroup.classList.add("sent");

                // Profile Picture (only for the first message from a user in the group)
                const pfp = document.createElement("img");
                pfp.classList.add("pfp");
                pfp.src = userProfiles[msg.sender] || "https://i.imgur.com/4M34hi2.png"; // Default PFP

                // Only append PFP if this is the first message of the user in the group
                if (!isSameUser) {
                    messageGroup.appendChild(pfp);
                }

                // Create message content container
                const contentContainer = document.createElement("div");
                messageGroup.appendChild(contentContainer);

                // Username (Only for first message in group)
                if (!isSameUser) {
                    const username = document.createElement("div");
                    username.classList.add("username");
                    username.textContent = msg.sender;
                    contentContainer.appendChild(username);
                }

                // Append new group
                messageContainer.appendChild(messageGroup);
            }

            // Create message box
            const messageElement = document.createElement("div");
            messageElement.classList.add("message-box");
            messageElement.textContent = msg.text;

            // Append message to the correct group
            messageGroup.lastElementChild.appendChild(messageElement);

            // Update lastSender after appending the message
            lastSender = msg.sender;
        });

        // Auto-scroll to the latest message
        messageContainer.scrollTop = messageContainer.scrollHeight;

    } catch (error) {
        console.error("Error loading messages:", error.message);
    }
}



async function sendMessage() {
    const messageText = messageInput.value.trim();

    if (!messageText) {
        const warningSound = new Audio("/sounds/SuperMarioWarning.mp3");

        // Attempt to play the sound
        try {
            await warningSound.play();
        } catch (error) {
            console.error("Failed to play warning sound:", error.message);
        }

        warningMessage.style.display = "block"; // Show the warning message

        // Clear any existing timeout to avoid race conditions
        clearTimeout(warningTimeout);
        warningTimeout = setTimeout(() => {
            warningMessage.style.display = "none"; // Hide the warning after 3 seconds
        }, 3000);

        return;
    }

    // Instantly add the message to the UI before waiting for API response
    let lastMessageGroup = document.querySelector(`.message-group[data-user="${currentUser}"]:last-of-type`);
    let messageGroup;

    // Check if the last message was from the current user
    if (lastMessageGroup) {
        messageGroup = lastMessageGroup;
    } else {
        // Create a new group if the last message was from another user
        messageGroup = document.createElement("div");
        messageGroup.classList.add("message-group", "sent");
        messageGroup.setAttribute("data-user", currentUser);

        // Add Profile Picture only if it's the first message from this user in the group
        const pfp = document.createElement("img");
        pfp.classList.add("pfp");

        // Only add profile picture if it doesn't exist in the group
        if (!messageGroup.querySelector(".pfp")) {
            pfp.src = userProfiles[currentUser];
            messageGroup.appendChild(pfp);
        }

        // Create content container
        const contentContainer = document.createElement("div");
        messageGroup.appendChild(contentContainer);

        // Username
        const username = document.createElement("div");
        username.classList.add("username");
        username.textContent = currentUser;
        contentContainer.appendChild(username);

        // Append new group to message container
        messageContainer.appendChild(messageGroup);
    }

    // Create message box
    const messageElement = document.createElement("div");
    messageElement.classList.add("message-box");
    messageElement.textContent = messageText;

    // Append message to the existing or new message group
    messageGroup.lastElementChild.appendChild(messageElement);

    // Auto-scroll to the latest message
    messageContainer.scrollTop = messageContainer.scrollHeight;

    // Send message to the server (API call)
    try {
        const response = await fetch("https://cloud24chat.azurewebsites.net/api/message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: messageText, sender: currentUser }),
        });

        if (!response.ok) throw new Error("Failed to send message");

        console.log("Message sent successfully:", messageText);
        messageInput.value = ""; // Clear the input field
    } catch (error) {
        console.error("Error sending message:", error.message);
    }

    // Trigger simulated response
    simulateResponse();
}

function simulateResponse() {
    const simulatedUser = "Peach"; // The hardcoded responder
    const receiveSound = new Audio("/sounds/SuperMarioMessageRecieved.mp3"); // Path to your sound file

    console.log("Simulated response triggered"); // Log when the function starts

    // Simulated delay for the response (e.g., 2 seconds)
    setTimeout(() => {
        console.log("Simulated response delay completed"); // Log when the delay finishes

        // Play the sound when the message is received
        try {
            receiveSound.play();
            console.log("Receive sound played successfully");
        } catch (error) {
            console.error("Failed to play receive sound:", error.message);
        }

        // Create a new message from the simulated user
        const messageGroup = document.createElement("div");
        messageGroup.classList.add("message-group");
        messageGroup.setAttribute("data-user", simulatedUser);

        console.log("Created message group for:", simulatedUser); // Log message group creation

        // Add the simulated user's profile picture
        const pfp = document.createElement("img");
        pfp.classList.add("pfp");
        pfp.src = userProfiles[simulatedUser] || "https://e7.pngegg.com/pngimages/299/182/png-clipart-super-princess-peach-luigi-mario-yoshi-luigi-super-mario-bros-text-thumbnail.png"; // Default PFP
        messageGroup.appendChild(pfp);
        console.log("Profile picture added for:", simulatedUser); // Log profile picture addition

        // Create the message content container
        const contentContainer = document.createElement("div");
        messageGroup.appendChild(contentContainer);

        // Add the simulated user's name
        const username = document.createElement("div");
        username.classList.add("username");
        username.textContent = simulatedUser;
        contentContainer.appendChild(username);
        console.log("Username added:", simulatedUser); // Log username addition

        // Add the simulated message
        const messageElement = document.createElement("div");
        messageElement.classList.add("message-box");
        messageElement.textContent = "This is an automated response!"; // Simulated message
        contentContainer.appendChild(messageElement);
        console.log("Message added: This is an automated response!"); // Log message content

        // Append the message group to the container
        messageContainer.appendChild(messageGroup);
        console.log("Message group appended to message container"); // Log appending to container

        // Auto-scroll to the latest message
        messageContainer.scrollTop = messageContainer.scrollHeight;
        console.log("Auto-scrolled to latest message"); // Log auto-scroll
    }, 2000); // Simulated delay of 2 seconds
}




sendMessageButton.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        sendMessage();
    }
});

// When the input field is focused, remove the placeholder
messageInput.addEventListener("focus", function () {
    this.removeAttribute("placeholder");
});

// When the input field loses focus, restore the placeholder if the field is empty
messageInput.addEventListener("blur", function () {
    if (this.value === "") {
        this.setAttribute("placeholder", "Type a message...");
    }
});

warningMessage.addEventListener('animationend', function() {
    warningMessage.style.display = 'none';  // Ensure it's hidden after animation ends
});


messageInput.addEventListener("input", function () {
    console.log("User is typing..."); // Debug log
    typingIndicator.style.display = "flex";

    clearTimeout(typingTimeout);

    typingTimeout = setTimeout(() => {
        console.log("User stopped typing."); // Debug log
        typingIndicator.style.display = "none";
    }, 500);
});


loadMessages();

