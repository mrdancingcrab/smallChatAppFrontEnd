const messageContainer = document.getElementById("messageContainer");
const messageInput = document.getElementById("messageInput");
const sendMessageButton = document.getElementById("sendMessageButton");


async function loadMessages(){
       try {
           
           const response = await fetch("https://cloud24chat.azurewebsites.net/api/messages");
           const messages = await response.json();
       
           messageContainer.innerHTML = "";
       
           messages.forEach((msg) => {
               const messageElement = document.createElement("div");
               messageElement.textContent = `${msg.text}`;
               messageContainer.appendChild(messageElement);
           });

       } catch (error) {
           console.log(error.message)
       }
}

async function sendMessage(){
    const text = messageInput.value.trim();

    if(!text){
        alert("Please enter a message");
        return;
    }

    try {
        
        await fetch("https://cloud24chat.azurewebsites.net/api/message", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({text})
        });

        messageInput.value = "";
        loadMessages();

    } catch (error) {
        
    }
}
sendMessageButton.addEventListener("click", sendMessage)
loadMessages();