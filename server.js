const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const cheerio = require('cheerio');

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
        
        .result-item {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          padding: 20px;
          margin-bottom: 15px;
        }
        
        .result-title {
          font-weight: 600;
          font-size: 16px;
          margin-bottom: 15px;
        }
        
        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
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
          display: none !important;
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
        
        <div id="results-container">
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
            // Clear previous results
            resultsContainer.innerHTML = '';
            
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
              
              <div>
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

// Function to fetch and extract content from a URL
async function fetchWebsiteContent(url) {
  try {
    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0'
      },
      timeout: 10000, // 10 seconds timeout
      maxRedirects: 5
    });
    
    const $ = cheerio.load(response.data);
    
    // Extract important content
    const title = $('title').text().trim();
    const h1 = $('h1').first().text().trim();
    const h2s = $('h2').map((i, el) => $(el).text().trim()).get().join(' | ');
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    
    // Extract main content (paragraphs)
    const paragraphs = $('p').map((i, el) => $(el).text().trim()).get().join(' ').substring(0, 3000);
    
    // Extract existing meta tags
    const existingMetaTags = {
      title: title,
      description: metaDescription,
      keywords: $('meta[name="keywords"]').attr('content') || ''
    };
    
    return {
      url,
      title,
      h1,
      h2s,
      metaDescription,
      paragraphs,
      existingMetaTags
    };
  } catch (error) {
    console.error(`Error fetching website content: ${error.message}`);
    // Return basic info if fetch fails
    return {
      url,
      error: error.message,
      title: '',
      h1: '',
      h2s: '',
      metaDescription: '',
      paragraphs: '',
      existingMetaTags: {}
    };
  }
}

// Generate meta content with Gemini AI using enhanced prompt for professional meta content generation
async function generateWithGemini(url, keywords, variantCount, forceNew = false, websiteContent = null) {
  try {
    // Add a random seed to ensure different results each time
    const randomSeed = forceNew ? Math.random().toString(36).substring(7) : '';
    
    // Extract domain for context
    const path = urlObj.pathname;
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    const domain = urlObj.hostname.replace('www.', '');
    
    // Parse keywords
    const keywordsList = keywords.split(',').map(k => k.trim());
    
    // Create content summary
    let contentSummary = '';
    if (websiteContent) {
      contentSummary = `
Website Title: ${websiteContent.title}
Main Heading: ${websiteContent.h1}
Subheadings: ${websiteContent.h2s}
Existing Meta Description: ${websiteContent.metaDescription}
Content Excerpt: ${websiteContent.paragraphs.substring(0, 500)}...
`;
    }
    
    // Create a comprehensive prompt using the 4-step process with actual website content
    // Create content summary
## WEBSITE CONTENT ANALYSIS
Website Title: ${websiteContent.title}
Main Heading: ${websiteContent.h1}
Subheadings: ${websiteContent.h2s}
Existing Meta Description: ${websiteContent.metaDescription}
Content Excerpt: ${websiteContent.paragraphs.substring(0, 500)}...
`;
    }

    // Determine audience type based on content analysis
    let audienceType = "professionals or businesses seeking expertise";
    let userIntent = "finding actionable information or solutions";
    let valueProposition = "expert insights and practical solutions";
    
    // Try to infer more specific audience and intent from content
    if (websiteContent) {
      const content = websiteContent.paragraphs.toLowerCase();
      
      // Detect B2B audience
      if (content.includes("business") || content.includes("company") || content.includes("enterprise") || 
          content.includes("organization") || content.includes("professional") || content.includes("agency")) {
        audienceType = "business professionals or organizations";
        
        // Further refine B2B audience
        if (content.includes("marketing") || content.includes("seo") || content.includes("advertising")) {
          audienceType = "marketing professionals or businesses seeking growth";
        } else if (content.includes("software") || content.includes("developer") || content.includes("coding")) {
          audienceType = "software developers or technical professionals";
        } else if (content.includes("finance") || content.includes("investment") || content.includes("accounting")) {
          audienceType = "financial professionals or businesses";
        }
      }
      // Detect B2C audience
      else if (content.includes("personal") || content.includes("individual") || content.includes("home") || 
               content.includes("family") || content.includes("lifestyle")) {
        audienceType = "individual consumers or homeowners";
        
        // Further refine B2C audience
        if (content.includes("health") || content.includes("fitness") || content.includes("wellness")) {
          audienceType = "health-conscious individuals seeking wellness solutions";
        } else if (content.includes("recipe") || content.includes("cooking") || content.includes("food")) {
          audienceType = "home cooks or food enthusiasts";
        } else if (content.includes("travel") || content.includes("vacation") || content.includes("destination")) {
          audienceType = "travelers or vacation planners";
        }
      }
      
      // Detect user intent
      if (content.includes("how to") || content.includes("guide") || content.includes("tutorial") || content.includes("learn")) {
        userIntent = "learning how to accomplish a specific task or goal";
      } else if (content.includes("buy") || content.includes("price") || content.includes("cost") || content.includes("purchase")) {
        userIntent = "making a purchase decision";
      } else if (content.includes("compare") || content.includes("vs") || content.includes("versus") || content.includes("best")) {
        userIntent = "comparing options to make an informed choice";
      } else if (content.includes("solve") || content.includes("fix") || content.includes("problem") || content.includes("issue")) {
        userIntent = "solving a specific problem or challenge";
      }
      
      // Detect value proposition
      if (content.includes("save time") || content.includes("quick") || content.includes("fast") || content.includes("efficient")) {
        valueProposition = "time-saving solutions or efficiency improvements";
      } else if (content.includes("save money") || content.includes("affordable") || content.includes("budget")) {
        valueProposition = "cost-effective solutions or money-saving strategies";
      } else if (content.includes("expert") || content.includes("professional") || content.includes("experienced")) {
        valueProposition = "expert insights backed by professional experience";
      } else if (content.includes("step by step") || content.includes("actionable") || content.includes("practical")) {
        valueProposition = "practical, actionable guidance with clear steps";
      }
    }

    const prompt = `
# Professional SEO Meta Content Generator

## CONTEXT ANALYSIS
I have performed a deep analysis of the following website:

URL: ${url}
Domain: ${domain}
Path: ${path}
Primary Keywords: ${keywordsList.join(", ")}
Number of variations needed: ${variantCount}
Random seed: ${randomSeed}

${contentSummary}

## AUDIENCE & INTENT ANALYSIS
Based on the content analysis, I have identified:
- The primary audience appears to be ${audienceType}
- The main user intent is likely ${userIntent}
- The content offers unique value through ${valueProposition}

## META CONTENT CREATION GUIDELINES

### For Meta Titles (50-60 characters):
1. SPECIFICITY: Be precise about what the page offers - avoid generic claims
2. VALUE PROPOSITION: Clearly communicate the unique benefit to the user
3. KEYWORD USAGE: Integrate primary keywords naturally, preferably near the beginning
4. EMOTIONAL TRIGGERS: Use power words that resonate with the target audience
5. CLARITY: Ensure the title is immediately understandable, not clever at the expense of clarity
6. UNIQUENESS: Each variation must take a completely different angle or approach

### For Meta Descriptions (150-160 characters):
1. EXPAND ON TITLE: Provide additional context that supports the title promise
2. PROBLEM-SOLUTION: Briefly state a problem and how the page solves it
3. CREDIBILITY: Include trust signals or evidence of expertise when relevant
4. CALL-TO-ACTION: End with a subtle, natural call-to-action
5. COMPLETENESS: Ensure it reads as a complete thought, not a fragment
6. DIFFERENTIATION: Highlight what makes this content unique from competitors

## CRITICAL REQUIREMENTS
- ABSOLUTELY NO URLs or domain names in titles
- NO generic phrases like "comprehensive guide" unless truly applicable
- NO clickbait or false promises
- MUST sound like it was written by a professional copywriter
- MUST be something a real business would actually use
- MUST be specific to the page content, not interchangeable with other sites

## OUTPUT FORMAT
Provide a JSON array with objects containing title and description properties.
Each variation must be completely unique in approach and angle.

## EXAMPLES OF EXCELLENT META CONTENT

### For a Coffee Machine Review Site:
Title: "Top 5 Espresso Machines Under $500 - Barista-Tested Picks"
Description: "Our coffee experts tested 23 espresso makers for crema quality, temperature consistency, and durability. See which affordable models outperformed $1,000+ machines."

### For a Digital Marketing Agency:
Title: "Data-Driven SEO Strategies That Increased Client Traffic 327%"
Description: "Discover the exact SEO framework we used to triple organic traffic for 17 B2B companies. Case studies, implementation steps, and ROI calculations included."

### For a Recipe Blog:
Title: "15-Minute Mediterranean Meals - Weeknight Dinner Solved"
Description: "Quick, authentic Mediterranean recipes using pantry staples. Each meal packs 25g+ protein, costs under $3/serving, and requires just one pan. Meal prep tips included."
`;
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
      
      // Validate the structure and ensure no URLs in titles
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        // Process each item to ensure no URLs in titles
        const processedData = parsedData.map(item => {
          if (!item.title || !item.description) {
            throw new Error('Invalid item format');
          }
          
          // Remove any URLs or domain names from the title
          let title = item.title;
          title = title.replace(new RegExp(domain, 'gi'), '');
          title = title.replace(/https?:\/\/[^\s]+/gi, '');
          title = title.replace(/www\.[^\s]+/gi, '');
          title = title.replace(/\s+/g, ' ').trim();
          
          // If title ends with a separator, clean it up
          title = title.replace(/[\s\-|]+$/g, '');
          
          return {
            title: title,
            description: item.description
          };
        });
        
        return processedData;
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
    let websiteContent = null;
    
    // Try to fetch website content first
    try {
      websiteContent = await fetchWebsiteContent(url);
      console.log('Successfully fetched website content');
    } catch (fetchError) {
      console.error('Error fetching website content:', fetchError);
      // Continue without website content
    }
    
    // Use Gemini if available, otherwise use fallback
    if (geminiModel) {
      try {
        metaContent = await generateWithGemini(url, keywords, variantCount, forceNew, websiteContent);
      } catch (aiError) {
        console.error('Error with Gemini AI, using fallback:', aiError);
        // Fallback to hardcoded response
        metaContent = generateFallbackContent(url, keywords, variantCount, forceNew, websiteContent);
      }
    } else {
      // Use fallback if Gemini is not available
      console.log('Gemini AI not available, using fallback');
      metaContent = generateFallbackContent(url, keywords, variantCount, forceNew, websiteContent);
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
function generateFallbackContent(url, keywords, variantCount, forceNew = false, websiteContent = null) {
  const keywordsList = keywords.split(',').map(k => k.trim());
  const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
  const domain = urlObj.hostname.replace('www.', '');
  
  // Extract potential topic from URL path or website content
  let potentialTopic = '';
  
  if (websiteContent && websiteContent.h1) {
    potentialTopic = websiteContent.h1;
  } else if (websiteContent && websiteContent.title) {
    potentialTopic = websiteContent.title;
  } else {
    const pathSegments = urlObj.pathname.split('/').filter(segment => segment.length > 0);
    potentialTopic = pathSegments.length > 0 
      ? pathSegments[pathSegments.length - 1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      : keywordsList[0];
  }
  
  // Add some randomness for regeneration
  const randomSuffix = forceNew ? Math.floor(Math.random() * 1000) : '';
  
  // More unique title templates with variables - NO URLs or domain names
  const titleTemplates = [
    (kw, topic) => `${kw} - ${topic} Guide You Can't Miss`,
    (kw, topic) => `${topic}: ${kw} Secrets Revealed`,
    (kw, topic) => `${kw}? Here's What Actually Works`,
    (kw, topic) => `${topic} ${kw}: Insider Tips & Tricks`,
    (kw, topic) => `The Truth About ${kw} - ${topic} Insights`,
    (kw, topic) => `${kw} Simplified: ${topic} Without Confusion`,
    (kw, topic) => `${topic} ${kw} That Changed Everything`,
    (kw, topic) => `${kw} in ${new Date().getFullYear()}: ${topic} Edition`,
    (kw, topic) => `Why Experts Swear By These ${kw} ${topic}`,
    (kw, topic) => `${kw} Mistakes? ${topic} Solutions Inside`
  ];
  
  // More unique description templates with variables
  const descriptionTemplates = [
    (kw, topic, dom) => `Discover ${topic} ${kw} that actually deliver results. We've tested what works and what doesn't so you don't have to. Visit ${dom} for real solutions.`,
    (kw, topic, dom) => `"I finally found ${kw} that work!" See how our ${topic} approach has helped thousands. Check out ${dom} for strategies others won't tell you about.`,
    (kw, topic, dom) => `Struggling with ${topic} ${kw}? We've been there. Our team created this guide after years of trial and error. Real solutions at ${dom}.`,
    (kw, topic, dom) => `${topic} ${kw} shouldn't be complicated. We've simplified the process into actionable steps anyone can follow. Find clarity at ${dom}.`,
    (kw, topic, dom) => `What if you could master ${topic} ${kw} in half the time? Our proven approach has helped thousands succeed. See how we can help you too.`,
    (kw, topic, dom) => `The ${topic} ${kw} landscape changes fast. Stay ahead with our regularly updated guide. Get what's working right now at ${dom}.`,
    (kw, topic, dom) => `We asked ${topic} experts about ${kw} - their answers surprised us. Discover the insider strategies they shared exclusively with us.`,
    (kw, topic, dom) => `Stop wasting time on ${topic} ${kw} that don't deliver. Our no-nonsense guide cuts through the noise. Straight to what works.`,
    (kw, topic, dom) => `${topic} ${kw} made simple. We've distilled years of experience into this practical guide. Join thousands who've succeeded with our approach.`,
    (kw, topic, dom) => `Looking for honest ${topic} ${kw} advice? No gimmicks, just proven strategies from our team. See what's possible today.`
  ];
  
  const variations = [];
  
  for (let i = 0; i < variantCount; i++) {
    const mainKeyword = keywordsList[i % keywordsList.length];
    
    // Use different templates for each variation with more context variables
    const titleIndex = (i + (forceNew ? Math.floor(Math.random() * 5) : 0)) % titleTemplates.length;
    const descIndex = (i + (forceNew ? Math.floor(Math.random() * 5) : 0)) % descriptionTemplates.length;
    
    variations.push({
      title: titleTemplates[titleIndex](mainKeyword, potentialTopic),
      description: descriptionTemplates[descIndex](mainKeyword, potentialTopic, domain)
    });
  }
  
  return variations;
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
