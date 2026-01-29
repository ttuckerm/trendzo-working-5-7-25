#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class FirecrawlProcessor {
    constructor() {
        this.baseDir = __dirname;
        this.outputDir = path.join(this.baseDir, 'processed');
        this.createDirectories();
    }

    createDirectories() {
        const dirs = ['processed', 'processed/assets', 'processed/images'];
        dirs.forEach(dir => {
            const dirPath = path.join(this.baseDir, dir);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
        });
    }

    loadFirecrawlData() {
        const mainFile = path.join(this.baseDir, 'lumalabs.ai_dream-machine.json');
        const pricingFile = path.join(this.baseDir, 'lumalabs.ai_dream-machine_pricing.json');
        const markdownFile = path.join(this.baseDir, 'lumalabs.ai_dream-machine.md');

        let data = {};
        
        try {
            if (fs.existsSync(mainFile)) {
                data.main = JSON.parse(fs.readFileSync(mainFile, 'utf8'));
            }
            if (fs.existsSync(pricingFile)) {
                data.pricing = JSON.parse(fs.readFileSync(pricingFile, 'utf8'));
            }
            if (fs.existsSync(markdownFile)) {
                data.markdown = fs.readFileSync(markdownFile, 'utf8');
            }
        } catch (error) {
            console.error('Error loading Firecrawl data:', error);
        }

        return data;
    }

    convertMarkdownToHTML() {
        const data = this.loadFirecrawlData();
        if (!data.markdown) {
            console.error('No markdown data found');
            return null;
        }

        // Extract metadata
        const metadataMatch = data.markdown.match(/^---\n([\s\S]*?)\n---\n/);
        let metadata = {};
        let content = data.markdown;
        
        if (metadataMatch) {
            const metadataStr = metadataMatch[1];
            metadataStr.split('\n').forEach(line => {
                const [key, ...valueParts] = line.split(':');
                if (key && valueParts.length) {
                    metadata[key.trim()] = valueParts.join(':').trim().replace(/"/g, '');
                }
            });
            content = data.markdown.replace(metadataMatch[0], '');
        }

        // Convert markdown to HTML
        let html = content
            // Headers
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            // Links
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
            // Images
            .replace(/!\[\]\(([^)]+)\)/g, '<img src="$1" alt="Luma Dream Machine" loading="lazy">')
            .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
            // Line breaks
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');

        // Wrap in paragraphs
        html = '<p>' + html + '</p>';
        
        // Clean up empty paragraphs
        html = html.replace(/<p><\/p>/g, '').replace(/<p><br><\/p>/g, '');

        return { html, metadata };
    }

    createWorkingHTML() {
        const processedData = this.convertMarkdownToHTML();
        if (!processedData) return;

        const { html, metadata } = processedData;

        const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${metadata.title || 'Luma Dream Machine - Local Clone'}</title>
    <meta name="description" content="Local clone of Luma Labs Dream Machine - AI-powered image and video creation platform">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #000;
            color: #fff;
            overflow-x: hidden;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }
        
        .hero {
            text-align: center;
            padding: 60px 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .hero h1 {
            font-size: 3.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
            background: linear-gradient(45deg, #fff, #f0f0f0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .hero p {
            font-size: 1.2rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }
        
        .cta-button {
            display: inline-block;
            padding: 15px 30px;
            background: #ff6b6b;
            color: white;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 600;
            transition: all 0.3s ease;
            margin: 10px;
        }
        
        .cta-button:hover {
            background: #ff5252;
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(255, 107, 107, 0.3);
        }
        
        .content {
            padding: 40px 0;
        }
        
        .content h1, .content h2, .content h3 {
            margin: 2rem 0 1rem 0;
            color: #fff;
        }
        
        .content h1 {
            font-size: 2.5rem;
            text-align: center;
            background: linear-gradient(45deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .content h2 {
            font-size: 2rem;
            border-bottom: 2px solid #667eea;
            padding-bottom: 0.5rem;
        }
        
        .content p {
            margin: 1rem 0;
            line-height: 1.8;
        }
        
        .content img {
            max-width: 100%;
            height: auto;
            border-radius: 10px;
            margin: 10px 5px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }
        
        .image-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 2rem 0;
        }
        
        .feature-section {
            background: rgba(255,255,255,0.05);
            padding: 2rem;
            border-radius: 15px;
            margin: 2rem 0;
            backdrop-filter: blur(10px);
        }
        
        .footer {
            background: #111;
            padding: 40px 0;
            text-align: center;
            margin-top: 4rem;
        }
        
        .footer p {
            color: #888;
        }
        
        .notice {
            background: #ff6b6b;
            color: white;
            padding: 1rem;
            text-align: center;
            font-weight: 600;
        }
        
        .scroll-indicator {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 3px;
            background: linear-gradient(90deg, #667eea, #764ba2);
            z-index: 1000;
            transform-origin: left;
        }
        
        @media (max-width: 768px) {
            .hero h1 {
                font-size: 2.5rem;
            }
            
            .container {
                padding: 0 15px;
            }
            
            .content img {
                width: 100%;
                margin: 10px 0;
            }
        }
        
        /* Image error handling */
        img {
            background: #333;
            border: 1px solid #555;
        }
        
        img[src*="next/image"] {
            background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150"><rect width="200" height="150" fill="%23333"/><text x="100" y="75" text-anchor="middle" fill="%23999" font-family="Arial">Image Not Available</text></svg>');
            background-size: cover;
            min-height: 150px;
        }
    </style>
    <script>
        // Add some interactivity
        document.addEventListener('DOMContentLoaded', function() {
            // Scroll indicator
            const scrollIndicator = document.createElement('div');
            scrollIndicator.className = 'scroll-indicator';
            document.body.appendChild(scrollIndicator);
            
            window.addEventListener('scroll', function() {
                const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
                scrollIndicator.style.transform = \`scaleX(\${scrolled / 100})\`;
            });
            
            // Smooth scrolling for anchor links
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function (e) {
                    e.preventDefault();
                    const target = document.querySelector(this.getAttribute('href'));
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            });
            
            // Image lazy loading error handling
            document.querySelectorAll('img').forEach(img => {
                img.addEventListener('error', function() {
                    this.style.display = 'none';
                });
            });
        });
    </script>
</head>
<body>
    <div class="notice">
        🎬 This is a local clone of Luma Labs Dream Machine created with Firecrawl. 
        <a href="${metadata.url || 'https://lumalabs.ai/dream-machine'}" target="_blank" style="color: white; text-decoration: underline;">Visit Original Site</a>
    </div>
    
    <div class="hero">
        <div class="container">
            <h1>🌟 Dream Machine</h1>
            <p>New Freedoms of Imagination - AI-Powered Video & Image Creation</p>
            <a href="#content" class="cta-button">Explore Content</a>
            <a href="${metadata.url || 'https://lumalabs.ai/dream-machine'}" target="_blank" class="cta-button">Visit Original</a>
        </div>
    </div>
    
    <div id="content" class="content">
        <div class="container">
            ${html}
        </div>
    </div>
    
    <div class="footer">
        <div class="container">
            <p>🚀 Local Clone Created: ${new Date().toLocaleDateString()}</p>
            <p>📡 Source: <a href="${metadata.url || 'https://lumalabs.ai/dream-machine'}" target="_blank" style="color: #667eea;">${metadata.url || 'https://lumalabs.ai/dream-machine'}</a></p>
            <p>🛠️ Powered by Firecrawl + Custom Processing</p>
        </div>
    </div>
</body>
</html>`;

        // Save the working HTML
        const outputFile = path.join(this.outputDir, 'dream-machine-working.html');
        fs.writeFileSync(outputFile, fullHTML);
        
        console.log('✅ Created working HTML file:', outputFile);
        return outputFile;
    }

    createMobileVersion() {
        const processedData = this.convertMarkdownToHTML();
        if (!processedData) return;

        const { html, metadata } = processedData;

        const mobileHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${metadata.title || 'Luma Dream Machine - Mobile'}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #000; 
            color: #fff; 
            line-height: 1.6;
        }
        .header {
            text-align: center;
            padding: 20px 0;
            background: linear-gradient(45deg, #667eea, #764ba2);
            margin: -20px -20px 20px -20px;
        }
        h1, h2, h3 { color: #667eea; margin: 1.5rem 0 0.5rem 0; }
        img { 
            max-width: 100%; 
            height: auto; 
            margin: 10px 0; 
            border-radius: 8px;
            display: none; /* Hide images on mobile for performance */
        }
        .show-images img { display: block; }
        p { margin: 1rem 0; }
        .toggle-btn {
            background: #667eea;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 25px;
            margin: 10px 0;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📱 Dream Machine Mobile</h1>
        <button class="toggle-btn" onclick="toggleImages()">Show Images</button>
    </div>
    
    <div id="content">
        ${html}
    </div>
    
    <script>
        function toggleImages() {
            const content = document.getElementById('content');
            const btn = document.querySelector('.toggle-btn');
            if (content.classList.contains('show-images')) {
                content.classList.remove('show-images');
                btn.textContent = 'Show Images';
            } else {
                content.classList.add('show-images');
                btn.textContent = 'Hide Images';
            }
        }
    </script>
</body>
</html>`;

        const mobileFile = path.join(this.outputDir, 'dream-machine-mobile.html');
        fs.writeFileSync(mobileFile, mobileHTML);
        
        console.log('✅ Created mobile version:', mobileFile);
        return mobileFile;
    }

    createIndexPage() {
        const data = this.loadFirecrawlData();
        
        const indexHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎬 Luma Dream Machine - Clone Index</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: white;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: rgba(255,255,255,0.1);
            padding: 40px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        h1 {
            text-align: center;
            font-size: 3rem;
            margin-bottom: 2rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .versions {
            display: grid;
            gap: 20px;
            margin: 2rem 0;
        }
        .version-card {
            background: rgba(255,255,255,0.2);
            padding: 20px;
            border-radius: 15px;
            transition: transform 0.3s ease;
        }
        .version-card:hover {
            transform: translateY(-5px);
        }
        .version-title {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }
        .version-desc {
            opacity: 0.9;
            margin-bottom: 1rem;
        }
        .btn {
            display: inline-block;
            padding: 10px 20px;
            background: #ff6b6b;
            color: white;
            text-decoration: none;
            border-radius: 25px;
            margin: 5px 10px 5px 0;
            transition: all 0.3s ease;
        }
        .btn:hover {
            background: #ff5252;
            transform: translateY(-2px);
        }
        .stats {
            background: rgba(0,0,0,0.2);
            padding: 20px;
            border-radius: 10px;
            margin: 2rem 0;
        }
        .original-link {
            text-align: center;
            margin: 2rem 0;
        }
        .original-link a {
            color: #fff;
            text-decoration: none;
            font-size: 1.1rem;
            border: 2px solid #fff;
            padding: 15px 30px;
            border-radius: 30px;
            transition: all 0.3s ease;
        }
        .original-link a:hover {
            background: #fff;
            color: #667eea;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎬 Luma Dream Machine Clone</h1>
        
        <div class="stats">
            <h3>📊 Clone Statistics</h3>
            <p><strong>Created:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Source:</strong> Firecrawl API scrape</p>
            <p><strong>Content:</strong> Full Dream Machine landing page</p>
            <p><strong>Status:</strong> ✅ Successfully processed</p>
        </div>
        
        <div class="versions">
            <div class="version-card">
                <div class="version-title">🖥️ Desktop Version</div>
                <div class="version-desc">Full-featured desktop experience with complete styling and interactions</div>
                <a href="dream-machine-working.html" class="btn">Open Desktop</a>
            </div>
            
            <div class="version-card">
                <div class="version-title">📱 Mobile Version</div>
                <div class="version-desc">Optimized for mobile devices with optional image loading</div>
                <a href="dream-machine-mobile.html" class="btn">Open Mobile</a>
            </div>
            
            <div class="version-card">
                <div class="version-title">📄 Raw Data</div>
                <div class="version-desc">Access the original Firecrawl JSON and Markdown data</div>
                <a href="../lumalabs.ai_dream-machine.json" class="btn">JSON Data</a>
                <a href="../lumalabs.ai_dream-machine.md" class="btn">Markdown</a>
            </div>
        </div>
        
        <div class="original-link">
            <a href="https://lumalabs.ai/dream-machine" target="_blank">
                🌐 Visit Original Site
            </a>
        </div>
    </div>
</body>
</html>`;

        const indexFile = path.join(this.outputDir, 'index.html');
        fs.writeFileSync(indexFile, indexHTML);
        
        console.log('✅ Created index page:', indexFile);
        return indexFile;
    }

    run() {
        console.log('🎬 Processing Firecrawl data for Luma Dream Machine...');
        
        const workingFile = this.createWorkingHTML();
        const mobileFile = this.createMobileVersion();
        const indexFile = this.createIndexPage();
        
        console.log('\n✅ Processing complete!');
        console.log('📁 Files created in:', this.outputDir);
        console.log('🌐 Open index.html to start browsing');
        console.log('🚀 All versions are fully functional local clones');
    }
}

if (require.main === module) {
    const processor = new FirecrawlProcessor();
    processor.run();
}

module.exports = FirecrawlProcessor;

