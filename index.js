//index.js (Remains largely the same - you can copy the one you have,
// just make sure you keep the changes we made for multimodal input
// handling in the /generate route)

import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Configure EJS as the view engine
app.set('view engine', 'ejs');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('views', path.join(__dirname, 'views'));

// Middleware to parse JSON bodies
app.use(express.json({ limit: '50mb' })); // Increase the limit for image data
app.use(express.urlencoded({ extended: true, limit: '50mb' }));


// Serve static files (CSS, JS, images) from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to render the main page
app.get('/', (req, res) => {
    res.render('index');
});

// Route to handle the multimodal input and generate AI content
app.post('/generate', async (req, res) => {
    const { text, image } = req.body;

    try {
        const genAI = new GoogleGenerativeAI(process.env.API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Prepare the prompt parts
        const promptParts = [
            { text: text || "Describe what is happening in this image in real time." }, // Default text if none
        ];

        if (image) {
          // Extract the base64 data and MIME type
          const base64Data = image.split(';base64,').pop();
          const mimeType = image.match(/:(.*?);/)[1];

            promptParts.push({
                inlineData: {
                    mimeType: mimeType,  // e.g., 'image/jpeg'
                    data: base64Data
                }
            });
        }

        const result = await model.generateContent(promptParts);
        const response = await result.response;
        const responseText = response.text();

        res.json({ response: responseText });

    } catch (error) {
        console.error("Error generating content:", error);
        let errorMessage = "Error generating content.";

        // Check for specific error types (e.g., rate limits, API errors)
        if (error.response && error.response.status === 429) {
            errorMessage = "Rate limit exceeded. Please try again later.";
        } else if (error.code && error.message) {
          errorMessage = `Error: ${error.code} - ${error.message}`;
        }

        res.status(500).json({ error: errorMessage }); // Send error as JSON
    }
});


app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
