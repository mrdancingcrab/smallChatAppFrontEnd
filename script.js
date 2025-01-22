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

loadMessages();