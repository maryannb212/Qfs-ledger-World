document.addEventListener('DOMContentLoaded', () => {
  const chatWidgets = document.querySelectorAll('.chat-widget');
  const chatWindow = document.getElementById('chat-window');
  const chatClose = document.getElementById('chat-close');
  const chatSend = document.getElementById('chat-send');
  const chatInput = document.getElementById('chat-input');
  const chatBody = document.getElementById('chat-body');

  if (chatWidgets.length > 0 && chatWindow) {
    chatWidgets.forEach(widget => {
      // Remove any existing click handlers by replacing the element
      const newWidget = widget.cloneNode(true);
      widget.parentNode.replaceChild(newWidget, widget);
      
      newWidget.addEventListener('click', () => {
        chatWindow.style.display = 'flex';
        newWidget.style.display = 'none';
        // Hide all widgets just in case
        document.querySelectorAll('.chat-widget').forEach(w => w.style.display = 'none');
      });
    });
  }

  if (chatClose) {
    chatClose.addEventListener('click', () => {
      chatWindow.style.display = 'none';
      document.querySelectorAll('.chat-widget').forEach(w => w.style.display = 'flex');
    });
  }

  function appendMessage(text, sender) {
    if (!chatBody || !text.trim()) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${sender}`;
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.textContent = text;
    msgDiv.appendChild(bubble);
    chatBody.appendChild(msgDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  if (chatSend && chatInput) {
    chatSend.addEventListener('click', () => {
      const text = chatInput.value;
      if (text.trim()) {
        appendMessage(text, 'user');
        chatInput.value = '';
        
        // Disable input while "bot is typing"
        chatInput.disabled = true;
        chatSend.disabled = true;

        // Auto-reply
        setTimeout(() => {
          appendMessage('Thanks for reaching out! Our team is currently reviewing your message and will get back to you shortly.', 'bot');
          chatInput.disabled = false;
          chatSend.disabled = false;
          chatInput.focus();
        }, 1200);
      }
    });

    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        chatSend.click();
      }
    });
  }
});
