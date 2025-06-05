<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Viral DNA Editor - Glassmorphic</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #0a0a0a;
            color: #fff;
            overflow: hidden;
            height: 100vh;
            position: relative;
        }

        /* Space Particles Background Layer */
        .space-particles {
            position: absolute;
            inset: 0;
            pointer-events: none;
            z-index: 0;
        }

        .space-particle {
            position: absolute;
            width: 2px;
            height: 2px;
            background: #fff;
            border-radius: 50%;
            animation: space-drift 20s linear infinite;
            opacity: 0.6;
        }

        .space-particle.authority { background: #7b61ff; }
        .space-particle.storytelling { background: #ff61a6; }
        .space-particle.education { background: #00ff00; }

        @keyframes space-drift {
            from {
                transform: translateZ(-500px) translateY(100vh);
                opacity: 0;
            }
            10% { opacity: 0.6; }
            90% { opacity: 0.6; }
            to {
                transform: translateZ(500px) translateY(-100vh);
                opacity: 0;
            }
        }

        /* Main Layout Container */
        .main-layout {
            position: relative;
            z-index: 1;
            width: 100vw;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 40px 60px 100px 60px;
        }

        /* Left Section - Circular Previews + TikTok Post */
        .left-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 32px;
        }

        /* Circular Video Previews */
        .video-previews {
            display: flex;
            gap: 20px;
            align-items: center;
        }

        .video-circle {
            width: 72px;
            height: 72px;
            border-radius: 50%;
            position: relative;
            cursor: pointer;
            transition: transform 0.3s ease;
        }

        .video-circle:hover {
            transform: scale(1.1);
        }

        .video-ring {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            padding: 3px;
            background: linear-gradient(45deg, #833ab4, #e1306c, #fcaf45);
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .video-circle:first-child .video-ring {
            background: linear-gradient(45deg, #e1306c, #ff8a65);
        }

        .video-circle:nth-child(2) .video-ring {
            background: linear-gradient(45deg, #7c4dff, #b388ff);
        }

        .video-circle:nth-child(3) .video-ring {
            background: linear-gradient(45deg, #448aff, #82b1ff);
        }

        .video-circle:nth-child(4) .video-ring {
            background: linear-gradient(45deg, #00e676, #69f0ae);
        }

        .video-circle:nth-child(5) .video-ring {
            background: linear-gradient(45deg, #ff6e40, #ffab40);
        }

        .video-content {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: #1a1a1a;
            overflow: hidden;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .video-preview-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .video-label {
            position: absolute;
            font-size: 12px;
            font-weight: 600;
            color: white;
            text-transform: capitalize;
        }

        /* TikTok Post Card */
        .tiktok-post {
            width: 450px;
            background: rgba(22, 22, 22, 0.95);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 
                0 12px 40px 0 rgba(0, 0, 0, 0.8),
                inset 0 0 0 1px rgba(255, 255, 255, 0.05);
        }

        /* Post Header */
        .post-header {
            padding: 16px 20px;
            display: flex;
            align-items: center;
            gap: 12px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .user-avatar {
            width: 42px;
            height: 42px;
            border-radius: 50%;
            background: linear-gradient(135deg, #e1306c, #833ab4);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
        }

        .user-info {
            flex: 1;
        }

        .username {
            font-size: 16px;
            font-weight: 600;
        }

        .post-time {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.5);
            margin-top: 2px;
        }

        .more-btn {
            font-size: 22px;
            color: rgba(255, 255, 255, 0.6);
            cursor: pointer;
            padding: 4px;
        }

        /* TikTok Video Area */
        .video-container {
            width: 100%;
            aspect-ratio: 9/16;
            max-height: 440px;
            background: #000;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .video-content-display {
            text-align: center;
            padding: 40px;
        }

        .template-icon {
            font-size: 80px;
            margin-bottom: 20px;
        }

        .template-name {
            font-size: 28px;
            font-weight: 600;
            color: #e1306c;
            margin-bottom: 12px;
        }

        .template-status {
            font-size: 16px;
            color: rgba(255, 255, 255, 0.6);
        }

        /* TikTok UI Overlay */
        .tiktok-sidebar {
            position: absolute;
            right: 16px;
            bottom: 24px;
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        .tiktok-action {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
        }

        .action-icon {
            width: 48px;
            height: 48px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .action-icon:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: scale(1.1);
        }

        .action-count {
            font-size: 14px;
            font-weight: 600;
        }

        /* Post Footer */
        .post-footer {
            padding: 16px 20px;
            display: flex;
            gap: 16px;
            align-items: center;
            font-size: 15px;
            color: rgba(255, 255, 255, 0.9);
            border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .footer-stats {
            display: flex;
            gap: 12px;
            align-items: center;
        }

        /* Right Panel */
        .right-panel {
            display: flex;
            flex-direction: column;
            gap: 20px;
            width: 380px;
        }

        /* Glass Cards */
        .glass-card {
            background: rgba(28, 28, 28, 0.85);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 24px;
            padding: 28px;
            box-shadow: 
                0 12px 40px 0 rgba(0, 0, 0, 0.6),
                inset 0 0 0 1px rgba(255, 255, 255, 0.05);
        }

        .card-title {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .card-subtitle {
            font-size: 15px;
            color: rgba(255, 255, 255, 0.6);
            margin-bottom: 24px;
        }

        /* Hook Options */
        .hook-option {
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 16px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .hook-option:hover {
            background: rgba(255, 255, 255, 0.06);
            transform: translateX(4px);
        }

        .hook-option.enhanced {
            border: 2px solid #22c55e;
            background: rgba(34, 197, 94, 0.08);
        }

        .hook-icon {
            width: 56px;
            height: 56px;
            background: linear-gradient(135deg, #e1306c, #fcaf45);
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            flex-shrink: 0;
        }

        .hook-content {
            flex: 1;
        }

        .hook-label {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 4px;
        }

        .hook-text {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 6px;
            line-height: 1.4;
        }

        .hook-score {
            font-size: 15px;
            font-weight: 600;
        }

        .score-low { color: #ef4444; }
        .score-high { color: #22c55e; }

        /* Why It Works */
        .feature-item {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 14px 0;
        }

        .feature-check {
            width: 36px;
            height: 36px;
            background: #22c55e;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            flex-shrink: 0;
        }

        .feature-text {
            font-size: 15px;
            color: rgba(255, 255, 255, 0.9);
            line-height: 1.4;
        }

        /* Bottom Breadcrumb Navigation */
        .breadcrumb-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(12, 12, 12, 0.98);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            padding: 20px;
            z-index: 100;
        }

        .breadcrumb-items {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
        }

        .breadcrumb-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 24px;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid transparent;
            border-radius: 28px;
            font-size: 15px;
            color: rgba(255, 255, 255, 0.5);
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .breadcrumb-item.active {
            background: rgba(123, 97, 255, 0.15);
            color: #fff;
            border-color: rgba(123, 97, 255, 0.4);
            box-shadow: 0 0 20px rgba(123, 97, 255, 0.3);
        }

        .breadcrumb-item.completed {
            background: rgba(34, 197, 94, 0.12);
            color: #22c55e;
            border-color: rgba(34, 197, 94, 0.3);
        }

        .breadcrumb-item:hover:not(.active) {
            background: rgba(255, 255, 255, 0.06);
            color: rgba(255, 255, 255, 0.8);
        }

        .breadcrumb-icon {
            font-size: 20px;
        }

        .breadcrumb-sep {
            color: rgba(255, 255, 255, 0.3);
            font-size: 18px;
            margin: 0 4px;
        }

        /* AI Assistant */
        .ai-assistant {
            position: fixed;
            bottom: 110px;
            right: 60px;
            z-index: 90;
        }

        .ai-bubble {
            width: 64px;
            height: 64px;
            background: linear-gradient(135deg, #e1306c, #833ab4);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 8px 32px rgba(225, 48, 108, 0.4);
            transition: all 0.3s ease;
            position: relative;
        }

        .ai-bubble:hover {
            transform: scale(1.1);
            box-shadow: 0 12px 40px rgba(225, 48, 108, 0.6);
        }

        .ai-icon {
            font-size: 34px;
        }

        .ai-tooltip {
            position: absolute;
            bottom: 74px;
            right: 0;
            background: rgba(20, 20, 20, 0.98);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 20px;
            padding: 20px;
            width: 320px;
            opacity: 0;
            pointer-events: none;
            transform: translateY(10px);
            transition: all 0.3s ease;
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.8);
        }

        .ai-bubble:hover .ai-tooltip {
            opacity: 1;
            pointer-events: all;
            transform: translateY(0);
        }

        .ai-persona {
            font-size: 14px;
            color: #e1306c;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .ai-message {
            font-size: 15px;
            color: rgba(255, 255, 255, 0.9);
            line-height: 1.5;
        }
    </style>
</head>
<body>
    <!-- Background Particles -->
    <div class="space-particles" id="spaceParticles"></div>

    <!-- Main Layout -->
    <div class="main-layout">
        <!-- Left Section -->
        <div class="left-section">
            <!-- Circular Video Previews -->
            <div class="video-previews">
                <div class="video-circle">
                    <div class="video-ring">
                        <div class="video-content">
                            <span class="video-label">Trending</span>
                        </div>
                    </div>
                </div>
                <div class="video-circle">
                    <div class="video-ring">
                        <div class="video-content">
                            <span class="video-label">Viral</span>
                        </div>
                    </div>
                </div>
                <div class="video-circle">
                    <div class="video-ring">
                        <div class="video-content">
                            <span class="video-label">Top</span>
                        </div>
                    </div>
                </div>
                <div class="video-circle">
                    <div class="video-ring">
                        <div class="video-content">
                            <span class="video-label">New</span>
                        </div>
                    </div>
                </div>
                <div class="video-circle">
                    <div class="video-ring">
                        <div class="video-content">
                            <span class="video-label">Hot</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- TikTok Post -->
            <div class="tiktok-post">
                <div class="post-header">
                    <div class="user-avatar">🎬</div>
                    <div class="user-info">
                        <div class="username">viralcreator</div>
                        <div class="post-time">2h</div>
                    </div>
                    <div class="more-btn">•••</div>
                </div>
                <div class="video-container">
                    <div class="video-content-display">
                        <div class="template-icon">📖</div>
                        <div class="template-name">Storytelling Template</div>
                        <div class="template-status">Building your viral framework...</div>
                    </div>
                    <div class="tiktok-sidebar">
                        <div class="tiktok-action">
                            <div class="action-icon">❤️</div>
                            <div class="action-count">12.5K</div>
                        </div>
                        <div class="tiktok-action">
                            <div class="action-icon">💬</div>
                            <div class="action-count">482</div>
                        </div>
                        <div class="tiktok-action">
                            <div class="action-icon">↗️</div>
                            <div class="action-count">1.2K</div>
                        </div>
                    </div>
                </div>
                <div class="post-footer">
                    <div class="footer-stats">
                        <span>12.5k likes</span>
                        <span>•</span>
                        <span>sunugu 374 745</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Right Panel -->
        <div class="right-panel">
            <!-- Hook Development Card -->
            <div class="glass-card">
                <h3 class="card-title">Hook Development</h3>
                <p class="card-subtitle">Score and optimize your opening</p>
                
                <div class="hook-option">
                    <div class="hook-icon">😴</div>
                    <div class="hook-content">
                        <div class="hook-label">Current Hook</div>
                        <div class="hook-text">"3 tips for better sleep"</div>
                        <div class="hook-score score-low">Score: 3/10</div>
                    </div>
                </div>
                
                <div class="hook-option enhanced">
                    <div class="hook-icon">🔥</div>
                    <div class="hook-content">
                        <div class="hook-label">Enhanced Hook</div>
                        <div class="hook-text">"I went from 2 to 8 hours of sleep using this weird trick"</div>
                        <div class="hook-score score-high">Score: 9/10</div>
                    </div>
                </div>
            </div>

            <!-- Why It Works Card -->
            <div class="glass-card">
                <h3 class="card-title">Why It Works</h3>
                
                <div class="feature-item">
                    <div class="feature-check">✓</div>
                    <div class="feature-text">Personal transformation story</div>
                </div>
                
                <div class="feature-item">
                    <div class="feature-check">✓</div>
                    <div class="feature-text">Specific numbers (2 to 8 hours)</div>
                </div>
                
                <div class="feature-item">
                    <div class="feature-check">✓</div>
                    <div class="feature-text">Curiosity gap ("weird trick")</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Bottom Breadcrumb Navigation -->
    <nav class="breadcrumb-nav">
        <div class="breadcrumb-items">
            <div class="breadcrumb-item completed" data-step="template">
                <span class="breadcrumb-icon">🎬</span>
                <span>Template</span>
            </div>
            <span class="breadcrumb-sep">›</span>
            <div class="breadcrumb-item active" data-step="hook">
                <span class="breadcrumb-icon">🪝</span>
                <span>Hook</span>
            </div>
            <span class="breadcrumb-sep">›</span>
            <div class="breadcrumb-item" data-step="structure">
                <span class="breadcrumb-icon">🧩</span>
                <span>Structure</span>
            </div>
            <span class="breadcrumb-sep">›</span>
            <div class="breadcrumb-item" data-step="format">
                <span class="breadcrumb-icon">🎨</span>
                <span>Format</span>
            </div>
            <span class="breadcrumb-sep">›</span>
            <div class="breadcrumb-item" data-step="predict">
                <span class="breadcrumb-icon">🔮</span>
                <span>Predict</span>
            </div>
            <span class="breadcrumb-sep">›</span>
            <div class="breadcrumb-item" data-step="preview">
                <span class="breadcrumb-icon">👀</span>
                <span>Preview</span>
            </div>
            <span class="breadcrumb-sep">›</span>
            <div class="breadcrumb-item" data-step="publish">
                <span class="breadcrumb-icon">🚀</span>
                <span>Publish</span>
            </div>
        </div>
    </nav>

    <!-- AI Assistant -->
    <div class="ai-assistant">
        <div class="ai-bubble">
            <span class="ai-icon">🤖</span>
            <div class="ai-tooltip">
                <div class="ai-persona">Copy Chief</div>
                <div class="ai-message">
                    Let's optimize your hook for maximum engagement. I'll show you exactly why certain hooks work better.
                </div>
            </div>
        </div>
    </div>

    <script>
        // Initialize Space Particles
        function createSpaceParticles() {
            const container = document.getElementById('spaceParticles');
            const particleCount = 50;
            
            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                particle.className = 'space-particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.animationDelay = Math.random() * 20 + 's';
                particle.style.animationDuration = (15 + Math.random() * 10) + 's';
                
                // Random particle types
                if (i % 3 === 0) particle.classList.add('authority');
                else if (i % 3 === 1) particle.classList.add('storytelling');
                else particle.classList.add('education');
                
                container.appendChild(particle);
            }
        }

        // Initialize
        createSpaceParticles();

        // Event listeners
        document.querySelectorAll('.video-circle').forEach(circle => {
            circle.addEventListener('click', () => {
                console.log('Video preview clicked');
            });
        });

        document.querySelectorAll('.hook-option').forEach(option => {
            option.addEventListener('click', () => {
                if (option.classList.contains('enhanced')) {
                    console.log('Enhanced hook selected');
                }
            });
        });

        document.querySelectorAll('.breadcrumb-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const step = e.currentTarget.dataset.step;
                console.log('Navigate to:', step);
            });
        });
    </script>
</body>
</html>