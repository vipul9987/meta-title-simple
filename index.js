const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Get API key from environment variables
const API_KEY = process.env.GEMINI_API_KEY || 'default-key-for-development';

// Initialize Google Generative AI if API key is available
let genAI = null;
let geminiModel = null;

if (API_KEY && API_KEY !== 'default-key-for-development') {
  try {
    genAI = new GoogleGenerativeAI(API_KEY);
    geminiModel = genAI.getGenerativeModel({ model: "gemini-pro" });
    console.log("Gemini AI initialized successfully");
  } catch (error) {
    console.error("Error initializing Gemini AI:", error);
  }
}

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
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Meta Title Generator</title>
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        
        body {
          background-color: #f8f9fa;
          color: #333;
          line-height: 1.6;
        }
        
        .container {
          max-width: 700px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .header {
          text-align: center;
          margin-bottom: 20px;
        }
        
        .header h1 {
          color: #0275d8;
          margin-bottom: 5px;
          font-size: 28px;
        }
        
        .header p {
          color: #666;
          font-size: 16px;
        }
        
        .card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          padding: 30px;
          margin-bottom: 20px;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          font-size: 14px;
          color: #333;
        }
        
        input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        
        input:focus {
          outline: none;
          border-color: #0275d8;
        }
        
        .button-group {
          display: flex;
          gap: 10px;
        }
        
        button {
          padding: 10px 15px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: background-color 0.2s;
        }
        
        .primary-button {
          background-color: #0275d8;
          color: white;
          flex: 1;
        }
        
        .primary-button:hover {
          background-color: #0267bf;
        }
        
        .secondary-button {
          background-color: #f8f9fa;
          color: #333;
          border: 1px solid #ddd;
          flex: 1;
        }
        
        .secondary-button:hover {
          background-color: #e9ecef;
        }
        
        .results {
          margin-top: 20px;
        }
        
        .result-item {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          padding: 20px;
          margin-bottom: 15px;
        }
        
        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        
        .result-title {
          font-weight: 600;
          font-size: 16px;
        }
        
        .copy-button {
          background: none;
          border: none;
          color: #0275d8;
          cursor: pointer;
          font-size: 13px;
          padding: 5px 10px;
        }
        
        .copy-button:hover {
          text-decoration: underline;
        }
        
        .meta-title {
          padding: 10px;
          background-color: #f8f9fa;
          border-left: 3px solid #0275d8;
          margin-bottom: 15px;
          font-size: 14px;
        }
        
        .meta-description {
          padding: 10px;
          background-color: #f8f9fa;
          border-left: 3px solid #ddd;
          font-size: 14px;
        }
        
        .char-count {
          text-align: right;
          font-size: 12px;
          color: #666;
          margin-top: 5px;
        }
        
        .footer {
          text-align: center;
          margin-top: 20px;
          font-size: 12px;
          color: #666;
        }
        
        .loading {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255,255,255,.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
          margin-right: 10px;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .error {
          color: #dc3545;
          margin-top: 5px;
          font-size: 14px;
        }
        
        .hidden {
          display: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Meta Title & Description Generator</h1>
          <p>Generate SEO-optimized meta titles and descriptions for your website</p>
        </div>
        
        <div class="card">
          <div class="form-group">
            <label for="url">Website URL</label>
            <input type="text" id="url" placeholder="https://example.com">
          </div>
          
          <div class="form-group">
            <label for="keywords">Keywords (comma separated)</label>
            <input type="text" id="keywords" placeholder="seo, meta tags">
          </div>
          
          <div class="form-group">
            <label for="variantCount">Number of Variations</label>
            <input type="number" id="variantCount" value="1" min="1" max="5">
          </div>
          
          <div id="error-message" class="error hidden"></div>
          
          <div class="button-group">
            <button id="generate-btn" class="primary-button">Generate Meta Content</button>
            <button id="regenerate-btn" class="secondary-button hidden">Regenerate</button>
          </div>
        </div>
        
        <div id="results-container" class="results">
          <!-- Results will be inserted here -->
        </div>
        
        <div class="footer">
          Powered by Google Gemini AI
        </div>
      </div>
      
      <script>
        // DOM Elements
        const urlInput = document.getElementById('url');
        const keywordsInput = document.getElementById('keywords');
        const variantCountInput = document.getElementById('variantCount');
        const generateBtn = document.getElementById('generate-btn');
        const regenerateBtn = document.getElementById('regenerate-btn');
        const errorMessage = document.getElementById('error-message');
        const resultsContainer = document.getElementById('results-container');
        
        // Store last request data for regeneration
        let lastRequestData = null;
        
        // Add a timestamp to ensure different results on regeneration
        function addTimestamp(data) {
          return {
            ...data,
            timestamp: new Date().getTime()
          };
        }
        
        // Generate meta content
        async function generateMeta(isRegenerate = false) {
          // Hide error
          errorMessage.classList.add('hidden');
          
          // Get input values
          const url = urlInput.value.trim();
          const keywords = keywordsInput.value.trim();
          const variantCount = parseInt(variantCountInput.value) || 1;
          
          // Validate inputs
          if (!url) {
            showError('Please enter a website URL');
            return;
          }
          
          if (!keywords) {
            showError('Please enter at least one keyword');
            return;
          }
          
          // Prepare request data
          let requestData;
          if (isRegenerate) {
            // Add timestamp to force new results
            requestData = addTimestamp({
              url,
              keywords,
              variantCount,
              forceNew: true
            });
          } else {
            requestData = {
              url,
              keywords,
              variantCount
            };
          }
          
          // Store for future regeneration
          lastRequestData = requestData;
          
          // Show loading state
          setLoadingState(true);
          
          try {
            // Make API request
            const response = await fetch('/generate-meta', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestData)
            });
            
            // Check for errors
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Server error');
            }
            
            // Parse response
            const data = await response.json();
            
            // Display results
            displayResults(data.metaContent);
            
            // Show regenerate button
            regenerateBtn.classList.remove('hidden');
          } catch (error) {
            showError(error.message || 'An error occurred');
            resultsContainer.innerHTML = '';
          } finally {
            setLoadingState(false);
          }
        }
        
        // Display results
        function displayResults(metaContent) {
          // Clear previous results
          resultsContainer.innerHTML = '';
          
          // Create result items
          metaContent.forEach((variant, index) => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            
            resultItem.innerHTML = \`
              <div class="result-title">Variation \${index + 1}</div>
              
              <div style="margin-top: 10px;">
                <div class="result-header">
                  <label>Title:</label>
                  <button class="copy-button" onclick="copyToClipboard('\${variant.title}')">Copy</button>
                </div>
                <div class="meta-title">\${variant.title}</div>
              </div>
              
              <div style="margin-top: 15px;">
                <div class="result-header">
                  <label>Description:</label>
                  <button class="copy-button" onclick="copyToClipboard('\${variant.description}')">Copy</button>
                </div>
                <div class="meta-description">\${variant.description}</div>
                <div class="char-count">\${variant.description.length} characters</div>
              </div>
            \`;
            
            resultsContainer.appendChild(resultItem);
          });
        }
        
        // Copy to clipboard
        function copyToClipboard(text) {
          navigator.clipboard.writeText(text)
            .then(() => {
              // Show success message (optional)
              console.log('Copied to clipboard');
            })
            .catch(err => {
              console.error('Failed to copy: ', err);
              showError('Failed to copy to clipboard');
            });
        }
        
        // Show error message
        function showError(message) {
          errorMessage.textContent = message;
          errorMessage.classList.remove('hidden');
        }
        
        // Set loading state
        function setLoadingState(isLoading) {
          if (isLoading) {
            generateBtn.disabled = true;
            regenerateBtn.disabled = true;
            
            const originalText = generateBtn.textContent;
            generateBtn.innerHTML = '<span class="loading"></span> Generating...';
            generateBtn.dataset.originalText = originalText;
            
            regenerateBtn.textContent = 'Regenerating...';
          } else {
            generateBtn.disabled = false;
            regenerateBtn.disabled = false;
            
            generateBtn.textContent = generateBtn.dataset.originalText || 'Generate Meta Content';
            regenerateBtn.textContent = 'Regenerate';
          }
        }
        
        // Event listeners
        document.addEventListener('DOMContentLoaded', function() {
          // Generate button click
          generateBtn.addEventListener('click', function() {
            generateMeta(false);
          });
          
          // Regenerate button click
          regenerateBtn.addEventListener('click', function() {
            generateMeta(true);
          });
          
          // Make copyToClipboard available globally
          window.copyToClipboard = copyToClipboard;
          
          // Hide results container initially
          resultsContainer.classList.add('hidden');
        });
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

// Generate meta content with Gemini AI
async function generateWithGemini(url, keywords, variantCount, forceNew = false) {
  try {
    // Add a random seed to ensure different results each time
    const randomSeed = forceNew ? Math.random().toString(36).substring(7) : '';
    
    // Prepare prompt for Gemini
    const prompt = `Generate ${variantCount} DIFFERENT and UNIQUE SEO-optimized meta title and description variations for a website. Each variation must be completely different from the others.
    
    Website URL: ${url}
    Keywords: ${keywords}
    Random seed: ${randomSeed}
    
    For each variation, provide:
    1. A compelling meta title (50-60 characters)
    2. A descriptive meta description (150-160 characters)
    
    The meta title should include the main keywords naturally and be engaging.
    The meta description should summarize the page content and include a call to action.
    
    IMPORTANT: Each variation must be COMPLETELY DIFFERENT from the others. Do not repeat similar patterns or structures.
    
    Format the response as a JSON array with objects containing 'title' and 'description' properties.`;
    
    // Generate content with Gemini
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to parse JSON from the response
    try {
      // Extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || text.match(/\[\s*\{[\s\S]*\}\s*\]/);
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;
      
      // Parse the JSON
      const parsedData = JSON.parse(jsonStr);
      
      // Validate the structure
      if (Array.isArray(parsedData) && parsedData.length > 0 && parsedData[0].title && parsedData[0].description) {
        return parsedData;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      throw new Error('Failed to parse AI response');
    }
  } catch (error) {
    console.error('Error generating with Gemini:', error);
    throw error;
  }
}

// Meta generation endpoint
app.post('/generate-meta', async (req, res) => {
  try {
    console.log('Received request:', req.body);
    const { url, keywords, variantCount = 1, forceNew = false } = req.body;
    
    if (!url || !keywords) {
      return res.status(400).json({ error: 'URL and keywords are required' });
    }
    
    let metaContent;
    
    // Use Gemini if available, otherwise use fallback
    if (geminiModel) {
      try {
        metaContent = await generateWithGemini(url, keywords, variantCount, forceNew);
      } catch (aiError) {
        console.error('Error with Gemini AI, using fallback:', aiError);
        // Fallback to hardcoded response
        metaContent = generateFallbackContent(url, keywords, variantCount, forceNew);
      }
    } else {
      // Use fallback if Gemini is not available
      console.log('Gemini AI not available, using fallback');
      metaContent = generateFallbackContent(url, keywords, variantCount, forceNew);
    }
    
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

// Generate fallback content when Gemini is not available
function generateFallbackContent(url, keywords, variantCount, forceNew = false) {
  const keywordsList = keywords.split(',').map(k => k.trim());
  const domain = new URL(url).hostname.replace('www.', '');
  
  // Add some randomness for regeneration
  const randomSuffix = forceNew ? Math.floor(Math.random() * 1000) : '';
  
  const titleTemplates = [
    (kw) => `${kw} - Top Resources & Guides | ${domain}`,
    (kw) => `Best ${kw} Tips & Strategies | ${domain}`,
    (kw) => `${kw}: Expert Advice & Solutions | ${domain}`,
    (kw) => `Ultimate ${kw} Guide for Beginners | ${domain}`,
    (kw) => `${kw} Mastery: Professional Tips | ${domain}`
  ];
  
  const descriptionTemplates = [
    (kw) => `Discover the best ${kw} resources and learn expert strategies. Visit ${domain} for comprehensive guides, tips, and professional advice.`,
    (kw) => `Looking for ${kw} solutions? ${domain} offers expert advice, step-by-step tutorials, and professional resources to help you succeed.`,
    (kw) => `Explore our collection of ${kw} guides and tutorials. ${domain} provides actionable tips, best practices, and industry insights.`,
    (kw) => `Master ${kw} with our expert resources at ${domain}. Find detailed guides, practical examples, and professional strategies.`,
    (kw) => `${domain} is your ultimate resource for ${kw}. Access expert advice, proven strategies, and comprehensive tutorials today.`
  ];
  
  const variations = [];
  
  for (let i = 0; i < variantCount; i++) {
    const mainKeyword = keywordsList[i % keywordsList.length];
    
    // Use different templates for each variation
    const titleIndex = (i + (forceNew ? 2 : 0)) % titleTemplates.length;
    const descIndex = (i + (forceNew ? 3 : 0)) % descriptionTemplates.length;
    
    variations.push({
      title: titleTemplates[titleIndex](mainKeyword) + (randomSuffix ? ` #${randomSuffix}` : ''),
      description: descriptionTemplates[descIndex](mainKeyword)
    });
  }
  
  return variations;
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
