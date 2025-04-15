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
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      <style>
        .bg-primary-600 { background-color: #4F46E5; }
        .bg-primary-700 { background-color: #4338CA; }
        .bg-primary-800 { background-color: #3730A3; }
        .bg-primary-50 { background-color: #EEF2FF; }
        .bg-primary-100 { background-color: #E0E7FF; }
        .text-primary-600 { color: #4F46E5; }
        .text-primary-700 { color: #4338CA; }
        .text-primary-800 { color: #3730A3; }
        .border-primary-300 { border-color: #A5B4FC; }
        .border-primary-500 { border-color: #6366F1; }
        .focus\\:ring-primary-500:focus { --tw-ring-color: #6366F1; }
        .focus\\:border-primary-500:focus { border-color: #6366F1; }
        .hover\\:bg-primary-700:hover { background-color: #4338CA; }
        .hover\\:bg-gray-50:hover { background-color: #F9FAFB; }
        .hover\\:text-primary-800:hover { color: #3730A3; }
        .bg-gradient-to-r { background-image: linear-gradient(to right, var(--tw-gradient-stops)); }
        .from-primary-600 { --tw-gradient-from: #4F46E5; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(79, 70, 229, 0)); }
        .to-primary-800 { --tw-gradient-to: #3730A3; }
        .bg-clip-text { -webkit-background-clip: text; background-clip: text; }
        .text-transparent { color: transparent; }
        .shadow-custom { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      </style>
    </head>
    <body class="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl mx-auto">
        <!-- Header -->
        <div class="text-center mb-10">
          <h1 class="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            <span class="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-800">
              Meta Title & Description Generator
            </span>
          </h1>
          <p class="text-xl text-gray-600 max-w-2xl mx-auto">
            Generate SEO-optimized meta titles and descriptions for your website
          </p>
        </div>

        <!-- Main Card -->
        <div class="bg-white rounded-xl shadow-custom overflow-hidden">
          <!-- Form Section -->
          <div class="p-6 sm:p-8">
            <div class="space-y-6">
              <div>
                <label for="url" class="block text-sm font-medium text-gray-700 mb-1 text-left">
                  Website URL
                </label>
                <input
                  id="url"
                  type="text"
                  placeholder="https://example.com"
                  class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition duration-150"
                  required
                />
              </div>

              <div>
                <label for="keywords" class="block text-sm font-medium text-gray-700 mb-1 text-left">
                  Keywords (comma separated)
                </label>
                <input
                  id="keywords"
                  type="text"
                  placeholder="seo, meta tags, website optimization"
                  class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition duration-150"
                  required
                />
              </div>

              <div>
                <label for="variantCount" class="block text-sm font-medium text-gray-700 mb-1 text-left">
                  Number of Variations
                </label>
                <input
                  id="variantCount"
                  type="number"
                  placeholder="1-5"
                  value="1"
                  min="1"
                  max="5"
                  class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition duration-150"
                />
              </div>

              <!-- Error message -->
              <div id="error" class="bg-red-50 border-l-4 border-red-500 p-4 rounded hidden">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <p class="text-sm text-red-700" id="error-text"></p>
                  </div>
                </div>
              </div>

              <div class="flex flex-col sm:flex-row gap-4 pt-2">
                <button
                  id="generate-btn"
                  class="flex-1 px-6 py-3 text-base font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 transition duration-150 flex justify-center items-center"
                >
                  Generate Meta Content
                </button>
                <button
                  id="regenerate-btn"
                  class="flex-1 px-6 py-3 text-base font-medium rounded-lg shadow-sm bg-white text-primary-700 border border-primary-300 hover:bg-gray-50 transition duration-150 hidden"
                >
                  Regenerate
                </button>
              </div>
            </div>
          </div>

          <!-- Results Section -->
          <div id="results-section" class="border-t border-gray-200 bg-gray-50 p-6 sm:p-8 hidden">
            <h3 class="text-lg font-semibold text-gray-900 mb-6">Generated Meta Content:</h3>
            <div id="results-container" class="space-y-6">
              <!-- Results will be inserted here -->
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="mt-8 text-center text-gray-500 text-sm">
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
        const errorDiv = document.getElementById('error');
        const errorText = document.getElementById('error-text');
        const resultsSection = document.getElementById('results-section');
        const resultsContainer = document.getElementById('results-container');
        
        // Store last request data for regeneration
        let lastRequestData = null;
        let copiedText = null;

        // Generate meta content
        async function generateMeta(isRegenerate = false) {
          // Hide error
          errorDiv.classList.add('hidden');
          
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
          if (isRegenerate && lastRequestData) {
            requestData = lastRequestData;
          } else {
            requestData = { url, keywords, variantCount };
            lastRequestData = requestData;
          }
          
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
            resultsSection.classList.add('hidden');
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
            resultItem.className = 'bg-white p-5 rounded-lg border border-gray-200 shadow-sm';
            
            resultItem.innerHTML = \`
              <div class="flex items-center justify-between mb-3">
                <h4 class="font-medium text-gray-900">Variation \${index + 1}</h4>
                <div class="flex items-center space-x-2">
                  <button
                    onclick="copyToClipboard('all-\${index}', \`Title: \${variant.title}\\n\\nDescription: \${variant.description}\`)"
                    class="text-xs flex items-center text-primary-600 hover:text-primary-800 transition-colors bg-primary-50 px-2 py-1 rounded-md"
                  >
                    <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"></path>
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"></path>
                    </svg>
                    \${copiedText === \`all-\${index}\` ? 'Copied All' : 'Copy All'}
                  </button>
                  <span class="text-xs font-medium px-2.5 py-0.5 rounded-full bg-primary-100 text-primary-800">
                    \${variant.title.length} chars
                  </span>
                </div>
              </div>
              
              <div class="mb-4">
                <div class="flex justify-between items-center mb-1">
                  <p class="text-sm font-medium text-gray-500">Title:</p>
                  <button
                    onclick="copyToClipboard('title-\${index}', '\${variant.title}')"
                    class="text-xs flex items-center text-primary-600 hover:text-primary-800 transition-colors"
                  >
                    <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"></path>
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"></path>
                    </svg>
                    \${copiedText === \`title-\${index}\` ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div class="group relative">
                  <p class="text-base text-gray-900 border-l-4 border-primary-500 pl-3 py-1 pr-2">
                    \${variant.title}
                  </p>
                </div>
              </div>
              
              <div>
                <div class="flex justify-between items-center mb-1">
                  <p class="text-sm font-medium text-gray-500">Description:</p>
                  <button
                    onclick="copyToClipboard('desc-\${index}', '\${variant.description}')"
                    class="text-xs flex items-center text-primary-600 hover:text-primary-800 transition-colors"
                  >
                    <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"></path>
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"></path>
                    </svg>
                    \${copiedText === \`desc-\${index}\` ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div class="group relative">
                  <p class="text-base text-gray-900 border-l-4 border-gray-300 pl-3 py-1 pr-2">
                    \${variant.description}
                  </p>
                </div>
                <div class="mt-2 text-right">
                  <span class="text-xs text-gray-500">\${variant.description.length} characters</span>
                </div>
              </div>
            \`;
            
            resultsContainer.appendChild(resultItem);
          });
          
          // Show results section
          resultsSection.classList.remove('hidden');
        }
        
        // Copy to clipboard
        function copyToClipboard(id, text) {
          navigator.clipboard.writeText(text)
            .then(() => {
              // Store the copied text ID
              copiedText = id;
              
              // Force re-render of results
              displayResults(JSON.parse(JSON.stringify(lastResults)));
              
              // Reset after 2 seconds
              setTimeout(() => {
                copiedText = null;
                displayResults(JSON.parse(JSON.stringify(lastResults)));
              }, 2000);
            })
            .catch(err => {
              console.error('Failed to copy: ', err);
              showError('Failed to copy to clipboard');
            });
        }
        
        // Show error message
        function showError(message) {
          errorText.textContent = message;
          errorDiv.classList.remove('hidden');
        }
        
        // Set loading state
        function setLoadingState(isLoading) {
          if (isLoading) {
            generateBtn.disabled = true;
            regenerateBtn.disabled = true;
            generateBtn.innerHTML = \`
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            \`;
            regenerateBtn.textContent = 'Regenerating...';
          } else {
            generateBtn.disabled = false;
            regenerateBtn.disabled = false;
            generateBtn.textContent = 'Generate Meta Content';
            regenerateBtn.textContent = 'Regenerate';
          }
        }
        
        // Store last results for re-rendering
        let lastResults = [];
        
        // Override the displayResults function to store results
        const originalDisplayResults = displayResults;
        displayResults = function(metaContent) {
          lastResults = metaContent;
          originalDisplayResults(metaContent);
        };
        
        // Event listeners
        document.addEventListener('DOMContentLoaded', function() {
          generateBtn.addEventListener('click', function() {
            generateMeta(false);
          });
          
          regenerateBtn.addEventListener('click', function() {
            generateMeta(true);
          });
          
          // Make sure the copy function is globally available
          window.copyToClipboard = copyToClipboard;
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
async function generateWithGemini(url, keywords, variantCount) {
  try {
    // Prepare prompt for Gemini
    const prompt = `Generate ${variantCount} SEO-optimized meta title and description variations for a website.
    
    Website URL: ${url}
    Keywords: ${keywords}
    
    For each variation, provide:
    1. A compelling meta title (50-60 characters)
    2. A descriptive meta description (150-160 characters)
    
    The meta title should include the main keywords naturally and be engaging.
    The meta description should summarize the page content and include a call to action.
    
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
    const { url, keywords, variantCount = 1 } = req.body;
    
    if (!url || !keywords) {
      return res.status(400).json({ error: 'URL and keywords are required' });
    }
    
    let metaContent;
    
    // Use Gemini if available, otherwise use fallback
    if (geminiModel) {
      try {
        metaContent = await generateWithGemini(url, keywords, variantCount);
      } catch (aiError) {
        console.error('Error with Gemini AI, using fallback:', aiError);
        // Fallback to hardcoded response
        metaContent = generateFallbackContent(url, keywords, variantCount);
      }
    } else {
      // Use fallback if Gemini is not available
      console.log('Gemini AI not available, using fallback');
      metaContent = generateFallbackContent(url, keywords, variantCount);
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
function generateFallbackContent(url, keywords, variantCount) {
  const keywordsList = keywords.split(',').map(k => k.trim());
  const domain = new URL(url).hostname.replace('www.', '');
  
  const variations = [];
  
  for (let i = 0; i < variantCount; i++) {
    const mainKeyword = keywordsList[i % keywordsList.length];
    const secondaryKeyword = keywordsList[(i + 1) % keywordsList.length];
    
    variations.push({
      title: `${mainKeyword} - Top ${secondaryKeyword} Resources | ${domain}`,
      description: `Discover the best ${mainKeyword} resources and learn about ${secondaryKeyword}. Visit ${domain} for expert insights, tips, and comprehensive guides.`
    });
  }
  
  return variations;
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
