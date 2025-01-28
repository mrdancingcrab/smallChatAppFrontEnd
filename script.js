const messageContainer = document.getElementById("messageContainer");
const messageInput = document.getElementById("messageInput");
const sendMessageButton = document.getElementById("sendMessageButton");
const typingIndicator = document.getElementById("typingIndicator");
const warningMessage = document.getElementById("warningMessage");
// Example user ID (Replace with actual user authentication)
const currentUser = "me";

let isMuted = false; // Tracks mute state
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
let isInitialLoad = true; // Flag to detect the first load of messages

async function loadMessages() {
    try {
        typingIndicator.style.display = "none";

        const response = await fetch("https://cloud24chat.azurewebsites.net/api/messages");
        if (!response.ok) throw new Error("Failed to fetch messages");

        const messages = await response.json();
        messageContainer.innerHTML = ""; // Clear the container

        let lastSender = null;

        messages.reverse().forEach((msg, index) => {
            console.log("Message Timestamp:", msg.timestamp); // Debug

            const isCurrentUser = msg.sender === currentUser;
            const isSameUser = msg.sender === lastSender;

            let messageGroup;

            if (isSameUser) {
                messageGroup = document.querySelector(`.message-group[data-user="${msg.sender}"]:last-of-type`);
            } else {
                // Create a new message group for a new sender
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

            // Create message box
            const messageElement = document.createElement("div");
            messageElement.classList.add("message-box");
            messageElement.textContent = msg.text;

            // Append message to the group
            messageGroup.lastElementChild.appendChild(messageElement);

            // Add a timestamp for the last message in the group
            const isLastMessageInGroup =
                index === messages.length - 1 || messages[index + 1]?.sender !== msg.sender;

            if (isLastMessageInGroup) {
                const timestamp = msg.timestamp
                    ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : "Unknown Time"; // Fallback if timestamp is missing

                const timestampElement = document.createElement("div");
                timestampElement.classList.add("group-timestamp");
                timestampElement.textContent = `Sent: ${timestamp}`;

                // Append timestamp after the last message in the group
                messageElement.after(timestampElement);

                console.log("Timestamp Element Added:", timestampElement); // Debug
            }

            lastSender = msg.sender;
        });

        // Makes the scroll to go all the way down
        setTimeout(() => {
            messageContainer.scrollTop = messageContainer.scrollHeight;
        }, 2);
        
        messageContainer.scrollTop = messageContainer.scrollHeight;
    } catch (error) {
        console.error("Error loading messages:", error.message);
    }
}


async function sendMessage() {
    const messageText = messageInput.value.trim();

    if (!messageText) {
        const warningSound = new Audio("/sounds/SuperMarioWarning.mp3");

        try {
            await warningSound.play();
        } catch (error) {
            console.error("Failed to play warning sound:", error.message);
        }

        warningMessage.style.display = "block"; // Show the warning message

        clearTimeout(warningTimeout);
        warningTimeout = setTimeout(() => {
            warningMessage.style.display = "none"; // Hide the warning after 3 seconds
        }, 3000);

        return;
    }

    let lastMessageGroup = document.querySelector(`.message-group[data-user="${currentUser}"]:last-of-type`);
    let messageGroup;

    if (lastMessageGroup) {
        messageGroup = lastMessageGroup;
    } else {
        messageGroup = document.createElement("div");
        messageGroup.classList.add("message-group", "sent");
        messageGroup.setAttribute("data-user", currentUser);

        // Add Profile Picture
        const pfp = document.createElement("img");
        pfp.classList.add("pfp");
        pfp.src = userProfiles[currentUser];
        messageGroup.appendChild(pfp);

        // Add Content Container
        const contentContainer = document.createElement("div");
        messageGroup.appendChild(contentContainer);

        // Add Username
        const username = document.createElement("div");
        username.classList.add("username");
        username.textContent = currentUser;
        contentContainer.appendChild(username);

        // Append messageGroup to the messageContainer
        messageContainer.appendChild(messageGroup);
    }

    // Create message box
    const messageElement = document.createElement("div");
    messageElement.classList.add("message-box");
    messageElement.textContent = messageText;

    // Append the message to the content container
    messageGroup.lastElementChild.appendChild(messageElement);

    // Remove existing timestamp if present
    const existingTimestamp = messageGroup.querySelector(".group-timestamp");
    if (existingTimestamp) existingTimestamp.remove();

    // Add a timestamp underneath the last message
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const timestampElement = document.createElement("div");
    timestampElement.classList.add("group-timestamp");
    timestampElement.textContent = `Sent: ${timestamp}`;

    // Append the timestamp **after the last message**
    messageElement.after(timestampElement);

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
    //simulateResponse();
}



/*

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
*/


document.getElementById("muteButton").addEventListener("click", () => {
    isMuted = !isMuted; // Toggle mute state
    const button = document.getElementById("muteButton");

    if (isMuted) {
        // Mute sounds
        button.textContent = "Unmute"; // Update button text
        Audio.prototype.play = function () {}; // Override play function to disable sounds
    } else {
        // Unmute sounds
        button.textContent = "Mute"; // Update button text
        delete Audio.prototype.play; // Restore play functionality
    }
});


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
