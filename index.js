const express = require('express');
const cors = require('cors');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Get API key from environment variables
const API_KEY = process.env.GEMINI_API_KEY || 'default-key-for-development';

// Log environment info (but not sensitive data)
console.log(`Server starting in ${process.env.NODE_ENV || 'development'} mode`);
console.log(`API key configured: ${API_KEY ? 'Yes' : 'No'}`);

// Middleware
app.use(express.json());
app.use(cors());

// Serve static HTML
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Meta Title Generator</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; }
        input, button { padding: 8px; width: 100%; }
        button { background-color: #4CAF50; color: white; border: none; cursor: pointer; margin-top: 10px; }
        #result { margin-top: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 4px; white-space: pre-wrap; }
      </style>
    </head>
    <body>
      <h1>Meta Title Generator</h1>
      
      <div class="form-group">
        <label for="url">Website URL:</label>
        <input type="text" id="url" placeholder="https://example.com" value="https://example.com">
      </div>
      
      <div class="form-group">
        <label for="keywords">Keywords:</label>
        <input type="text" id="keywords" placeholder="seo, meta tags" value="test, example">
      </div>
      
      <button onclick="generateMeta()">Generate Meta Content</button>
      
      <div id="result">Results will appear here...</div>
      
      <script>
        async function generateMeta() {
          const url = document.getElementById('url').value;
          const keywords = document.getElementById('keywords').value;
          const resultDiv = document.getElementById('result');
          
          resultDiv.textContent = 'Generating...';
          
          try {
            const response = await fetch('/generate-meta', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url, keywords, variantCount: 1 })
            });
            
            const data = await response.json();
            resultDiv.textContent = JSON.stringify(data, null, 2);
          } catch (error) {
            resultDiv.textContent = 'Error: ' + error.message;
          }
        }
      </script>
    </body>
    </html>
  `);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    environment: process.env.NODE_ENV || 'development',
    apiConfigured: !!API_KEY
  });
});

// Meta generation endpoint
app.post('/generate-meta', (req, res) => {
  try {
    console.log('Received request:', req.body);
    const { url, keywords, variantCount } = req.body;
    
    if (!url || !keywords) {
      return res.status(400).json({ error: 'URL and keywords are required' });
    }
    
    // Generate a simple response
    const metaContent = [
      {
        title: `${keywords} - Example Title`,
        description: `This is a sample description for ${url} with keywords: ${keywords}`
      }
    ];
    
    res.json({ 
      metaContent, 
      url, 
      keywords, 
      variantCount,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
