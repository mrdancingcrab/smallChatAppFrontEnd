const messageContainer = document.getElementById("messageContainer");
const messageInput = document.getElementById("messageInput");
const sendMessageButton = document.getElementById("sendMessageButton");
const typingIndicator = document.getElementById("typingIndicator");

// Example user ID (Replace with actual user authentication)
const currentUser = "me";
let typingTimeout;

// Dummy profile pictures (Replace with actual user data)
const userProfiles = {
    "me": "https://w7.pngwing.com/pngs/106/506/png-transparent-super-mario-bros-super-nintendo-entertainment-system-super-mario-world-mario-bros.png", // Your profile pic
    "user1": "https://e7.pngegg.com/pngimages/299/182/png-clipart-super-princess-peach-luigi-mario-yoshi-luigi-super-mario-bros-text-thumbnail.png", // Another user
    "user2": "https://pbs.twimg.com/media/EEdcOOEUcAAwxra.png"  // Another user
};

// Load chat messages from API
async function loadMessages() {
    try {
        const response = await fetch("https://cloud24chat.azurewebsites.net/api/messages");
        if (!response.ok) throw new Error("Failed to fetch messages");

        const messages = await response.json();
        messageContainer.innerHTML = ""; // Clear existing messages

        let lastSender = null; // Track the last sender to group messages correctly

        messages.forEach((msg) => {
            const isCurrentUser = msg.sender === currentUser;
            const isSameUser = msg.sender === lastSender;

            let messageGroup;

            // Check if the last message was from the same user
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
            lastSender = msg.sender; // Update last sender
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
        alert("Please enter a message");
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

    // Auto-scroll to latest message
    messageContainer.scrollTop = messageContainer.scrollHeight;

    // Send message to the server (API call)
    try {
        const response = await fetch("https://cloud24chat.azurewebsites.net/api/message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: messageText, sender: currentUser })
        });

        if (!response.ok) throw new Error("Failed to send message");

        console.log("Message sent successfully:", messageText);
        messageInput.value = ""; // Clear input field

    } catch (error) {
        console.error("Error sending message:", error.message);
    }
}

function simulateOtherUserTyping(user) {
    typingIndicator.textContent = `${user} is typing...`;
    typingIndicator.style.display = "inline-block";
    setTimeout(() => {
        typingIndicator.style.display = "none";
    }, 2000); // Hide the indicator after 2 seconds
}





// Event listeners
sendMessageButton.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        sendMessage();
    }
});

// Event listener for the input field (to show typing indicator while typing)
messageInput.addEventListener("input", function () {
    // Show the typing indicator when the user starts typing
    typingIndicator.style.display = "inline-block";

    // Reset the height to shrink it if the user deletes text
    this.style.height = "auto";
    
    // Set the height to match the scrollHeight, which is the total content height
    this.style.height = (this.scrollHeight) + "px";

    // Clear any existing timeout to reset the timer
    clearTimeout(typingTimeout);

    // If the input field is not empty, keep the indicator visible
    if (this.value.trim() !== "") {
        // Start a timeout to hide the typing indicator if the user stops typing
        typingTimeout = setTimeout(() => {
            typingIndicator.style.display = "none";
        }, 1000); // Adjust the delay (2000ms = 2 seconds of inactivity)
    }
    else {
        // Hide the indicator if the input field is cleared
        typingIndicator.style.display = "none";
    }
});



// Initial message load
loadMessages();

// Auto-refresh chat every 5 seconds
//setInterval(loadMessages, 5000);
