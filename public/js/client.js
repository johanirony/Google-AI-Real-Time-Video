document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');
    const videoElement = document.getElementById('videoElement'); // Add a video element
    const promptText = document.getElementById('promptText');
    const textInput = document.getElementById('textInput');
    const responseDiv = document.getElementById('response');
    const loadingIndicator = document.getElementById('loading');
    const errorMessage = document.getElementById('errorMessage');
    const submitTextButton = document.getElementById('submitTextButton');

    let mediaStream;
    let intervalId;
    const frameRate = 5; // Send a frame every 5 frames (adjust as needed)
    let frameCount = 0;

    // --- Helper Functions ---
    // (showError, hideError, startLoading, stopLoading - same as before)

    const showError = (message) => {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    loadingIndicator.style.display = 'none';
    };

    const hideError = () => {
        errorMessage.style.display = 'none';
    };

    const startLoading = () => {
        loadingIndicator.style.display = 'block';
        responseDiv.innerHTML = '';
        hideError();
    };

    const stopLoading = () => {
        loadingIndicator.style.display = 'none';
    };


    // --- Camera Access ---

    const startCamera = async () => {
        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' }, // Use front-facing camera by default
                audio: false // We don't need audio for this
            });

            videoElement.srcObject = mediaStream;
            videoElement.play();
            startButton.disabled = true;
            stopButton.disabled = false;
            startAnalyzing(); // Start sending frames
        } catch (error) {
            console.error('Error accessing camera:', error);
            showError('Could not access the camera. Please check your permissions.');
        }
    };

    const stopCamera = () => {
        if (mediaStream) {
            const tracks = mediaStream.getTracks();
            tracks.forEach(track => track.stop());
            videoElement.srcObject = null;
            startButton.disabled = false;
            stopButton.disabled = true;
            stopAnalyzing(); // Stop sending frames
        }
    };

    // --- Frame Analysis ---

    const startAnalyzing = () => {
        intervalId = setInterval(async () => {
          frameCount++;
          if(frameCount % frameRate === 0){
            sendFrame();
          }

        }, 1000 / 30); // Capture at ~30 FPS, but only send every frameRate frames
    };

    const stopAnalyzing = () => {
        clearInterval(intervalId);
    };

    const sendFrame = async () => {
        if (!videoElement.srcObject) return; // Don't send if video isn't active

        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const imageDataBase64 = canvas.toDataURL('image/jpeg', 0.8); // Convert to JPEG, quality 0.8

        sendDataToServer("", imageDataBase64); // Send only the image data (no text)
    };

    // --- Send Data to Server (Same as before, but we'll call it with only image data) ---
      const submitData = async () => {
        startLoading();
        let text = textInput.value; // Get text from text input
        let imageDataBase64 = null;
        sendDataToServer(text, imageDataBase64);
      }
      const sendDataToServer = async (text, image) => {


        try {
            const response = await fetch('/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text, image }), // Send both text and image
            });

            if (!response.ok) {
                const errorData = await response.json();  //get error message as JSON
                throw new Error(errorData.error || `HTTP error: ${response.status}`); //use server's error
            }

            const data = await response.json();
            responseDiv.innerHTML = `<p>${data.response}</p>`;


            promptText.textContent = ''; //Clear

        } catch (error) {
            console.error('Error sending data to server:', error);
            showError(error.message);  // Show the error message from the server
        }
        finally {
            stopLoading(); // Always stop loading, even on error
        }
    };

    // --- Event Listeners ---

    startButton.addEventListener('click', startCamera);
    stopButton.addEventListener('click', stopCamera);
     submitTextButton.addEventListener('click', submitData);

    // --- Browser Detection (Optional - for Safari or other compatibility issues) ---

});