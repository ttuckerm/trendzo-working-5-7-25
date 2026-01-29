<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Viral Sound Cards - Premium Design</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-font-smoothing: antialiased;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #000;
            color: #fff;
            padding: 40px 20px;
            min-height: 100vh;
        }

        /* Container */
        .sound-trends-container {
            max-width: 1400px;
            margin: 0 auto;
        }

        .section-header {
            margin-bottom: 40px;
            text-align: center;
        }

        .section-title {
            font-size: 48px;
            font-weight: 700;
            background: linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 16px;
        }

        .section-subtitle {
            font-size: 20px;
            color: rgba(255, 255, 255, 0.6);
        }

        /* Sound cards grid */
        .sound-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 30px;
            margin-bottom: 60px;
        }

        /* Individual sound card */
        .sound-card {
            position: relative;
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            overflow: hidden;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
        }

        .sound-card:hover {
            transform: translateY(-8px) scale(1.02);
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(123, 97, 255, 0.5);
            box-shadow: 
                0 20px 60px rgba(123, 97, 255, 0.3),
                0 0 100px rgba(123, 97, 255, 0.1);
        }

        /* Platform badge */
        .platform-badge {
            position: absolute;
            top: 20px;
            left: 20px;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 16px;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            border-radius: 100px;
            z-index: 10;
        }

        .platform-icon {
            width: 24px;
            height: 24px;
            background: #ff0050;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
        }

        .platform-name {
            font-size: 16px;
            font-weight: 600;
        }

        /* Viral indicator */
        .viral-indicator {
            position: absolute;
            top: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            animation: viral-pulse 2s ease-in-out infinite;
            z-index: 10;
        }

        @keyframes viral-pulse {
            0%, 100% {
                transform: scale(1);
                box-shadow: 0 0 0 0 rgba(123, 97, 255, 0.4);
            }
            50% {
                transform: scale(1.1);
                box-shadow: 0 0 0 20px rgba(123, 97, 255, 0);
            }
        }

        /* Content section */
        .card-content {
            padding: 20px;
        }

        .sound-description {
            margin: 60px 0 20px;
            font-size: 16px;
            line-height: 1.5;
            color: rgba(255, 255, 255, 0.8);
        }

        /* Preview window */
        .preview-window {
            position: relative;
            width: 100%;
            height: 200px;
            background: #0a0a0a;
            border-radius: 16px;
            overflow: hidden;
            margin: 20px 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .preview-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            opacity: 0.7;
        }

        /* Waveform visualization */
        .waveform-container {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 80px;
            background: linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent);
            display: flex;
            align-items: flex-end;
            justify-content: center;
            padding: 10px;
            gap: 3px;
        }

        .waveform-bar {
            width: 3px;
            background: linear-gradient(to top, #7b61ff, #ff61a6);
            border-radius: 2px;
            animation: wave-dance 1s ease-in-out infinite;
        }

        @keyframes wave-dance {
            0%, 100% { height: 10px; }
            50% { height: 40px; }
        }

        .waveform-bar:nth-child(1) { animation-delay: 0s; }
        .waveform-bar:nth-child(2) { animation-delay: 0.1s; }
        .waveform-bar:nth-child(3) { animation-delay: 0.2s; }
        .waveform-bar:nth-child(4) { animation-delay: 0.3s; }
        .waveform-bar:nth-child(5) { animation-delay: 0.4s; }
        .waveform-bar:nth-child(6) { animation-delay: 0.5s; }
        .waveform-bar:nth-child(7) { animation-delay: 0.6s; }
        .waveform-bar:nth-child(8) { animation-delay: 0.7s; }
        .waveform-bar:nth-child(9) { animation-delay: 0.8s; }
        .waveform-bar:nth-child(10) { animation-delay: 0.9s; }
        .waveform-bar:nth-child(11) { animation-delay: 1s; }
        .waveform-bar:nth-child(12) { animation-delay: 1.1s; }
        .waveform-bar:nth-child(13) { animation-delay: 1.2s; }
        .waveform-bar:nth-child(14) { animation-delay: 1.3s; }
        .waveform-bar:nth-child(15) { animation-delay: 1.4s; }

        /* Sound info */
        .sound-info {
            display: flex;
            align-items: center;
            gap: 12px;
            margin: 20px 0;
        }

        .sound-icon {
            width: 40px;
            height: 40px;
            background: rgba(123, 97, 255, 0.2);
            border: 1px solid rgba(123, 97, 255, 0.5);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
        }

        .sound-name {
            flex: 1;
            font-size: 18px;
            font-weight: 600;
        }

        /* Metrics */
        .sound-metrics {
            display: flex;
            gap: 20px;
            margin: 20px 0;
            padding: 20px 0;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .metric-item {
            flex: 1;
            text-align: center;
        }

        .metric-value {
            font-size: 24px;
            font-weight: 700;
            background: linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            display: block;
            margin-bottom: 4px;
        }

        .metric-label {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.5);
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        /* Action buttons */
        .card-actions {
            display: flex;
            gap: 12px;
            margin-top: 20px;
        }

        .action-btn {
            flex: 1;
            padding: 14px 24px;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            position: relative;
            overflow: hidden;
        }

        .action-btn.primary {
            background: linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%);
            color: #fff;
        }

        .action-btn.secondary {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            color: #fff;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .action-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(123, 97, 255, 0.3);
        }

        .action-btn::after {
            content: '';
            position: absolute;
            inset: 0;
            background: rgba(255, 255, 255, 0.2);
            transform: translateX(-100%);
            transition: transform 0.3s;
        }

        .action-btn:hover::after {
            transform: translateX(0);
        }

        /* Player controls */
        .player-controls {
            position: absolute;
            bottom: 20px;
            left: 20px;
            right: 20px;
            display: flex;
            align-items: center;
            gap: 16px;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            padding: 12px 16px;
            border-radius: 12px;
        }

        .play-btn {
            width: 48px;
            height: 48px;
            background: rgba(255, 255, 255, 0.1);
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s;
        }

        .play-btn:hover {
            background: rgba(123, 97, 255, 0.2);
            border-color: rgba(123, 97, 255, 0.5);
            transform: scale(1.1);
        }

        .volume-control {
            width: 32px;
            height: 32px;
            background: transparent;
            border: none;
            color: #fff;
            cursor: pointer;
            font-size: 20px;
            opacity: 0.7;
            transition: opacity 0.3s;
        }

        .volume-control:hover {
            opacity: 1;
        }

        .progress-bar {
            flex: 1;
            height: 4px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
            overflow: hidden;
            cursor: pointer;
        }

        .progress-fill {
            height: 100%;
            width: 35%;
            background: linear-gradient(90deg, #7b61ff 0%, #ff61a6 100%);
            border-radius: 2px;
            transition: width 0.3s;
        }

        .time-display {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
            min-width: 80px;
            text-align: right;
        }

        /* Trending badge */
        .trending-badge {
            position: absolute;
            top: -10px;
            right: -10px;
            padding: 6px 12px;
            background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
            border-radius: 100px;
            font-size: 12px;
            font-weight: 600;
            animation: badge-float 3s ease-in-out infinite;
            box-shadow: 0 5px 20px rgba(255, 107, 107, 0.4);
        }

        @keyframes badge-float {
            0%, 100% { transform: translateY(0) rotate(5deg); }
            50% { transform: translateY(-5px) rotate(-5deg); }
        }

        /* Growth chart mini */
        .growth-chart {
            position: relative;
            height: 60px;
            margin: 16px 0;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 8px;
            overflow: hidden;
            padding: 10px;
        }

        .chart-line {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 40px;
            background: url("data:image/svg+xml,%3Csvg width='300' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0,30 Q50,20 100,25 T200,15 T300,5' stroke='url(%23gradient)' stroke-width='2' fill='none'/%3E%3Cdefs%3E%3ClinearGradient id='gradient'%3E%3Cstop offset='0%25' stop-color='%237b61ff'/%3E%3Cstop offset='100%25' stop-color='%23ff61a6'/%3E%3C/linearGradient%3E%3C/defs%3E%3C/svg%3E") no-repeat center;
            background-size: cover;
            opacity: 0.8;
        }

        .growth-indicator {
            position: absolute;
            top: 10px;
            right: 10px;
            font-size: 14px;
            font-weight: 600;
            color: #4ecdc4;
        }

        /* Category tabs */
        .category-tabs {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-bottom: 40px;
        }

        .tab {
            padding: 12px 32px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 100px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }

        .tab:hover {
            background: rgba(123, 97, 255, 0.1);
            border-color: rgba(123, 97, 255, 0.5);
            transform: translateY(-2px);
        }

        .tab.active {
            background: linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%);
            border-color: transparent;
            box-shadow: 0 10px 30px rgba(123, 97, 255, 0.3);
        }

        /* Loading skeleton */
        .skeleton {
            background: linear-gradient(90deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 100%);
            background-size: 200% 100%;
            animation: skeleton-wave 1.5s ease-in-out infinite;
        }

        @keyframes skeleton-wave {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }

        /* Responsive */
        @media (max-width: 768px) {
            .sound-grid {
                grid-template-columns: 1fr;
                gap: 20px;
            }
            
            .section-title {
                font-size: 32px;
            }
        }
    </style>
</head>
<body>
    <div class="sound-trends-container">
        <!-- Header -->
        <div class="section-header">
            <h1 class="section-title">Trending Sounds</h1>
            <p class="section-subtitle">Discover viral audio that's dominating the algorithm</p>
        </div>

        <!-- Category tabs -->
        <div class="category-tabs">
            <div class="tab active">🔥 Trending Now</div>
            <div class="tab">⚡ Emerging</div>
            <div class="tab">📈 Rising Fast</div>
            <div class="tab">🎵 All Sounds</div>
        </div>

        <!-- Sound cards grid -->
        <div class="sound-grid">
            <!-- Sound Card 1 - Top Trending -->
            <div class="sound-card">
                <div class="trending-badge">🔥 #1 Trending</div>
                <div class="platform-badge">
                    <div class="platform-icon">T</div>
                    <span class="platform-name">TikTok</span>
                </div>
                <div class="viral-indicator">🚀</div>
                
                <div class="card-content">
                    <p class="sound-description">
                        The perfect sound for transformation reveals and before/after content. Creators are seeing 10x engagement with this track.
                    </p>
                    
                    <div class="preview-window">
                        <img class="preview-image" src="data:image/svg+xml,%3Csvg width='400' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Crect fill='%23222' width='400' height='200'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%23666' font-size='20'%3EVideo Preview%3C/text%3E%3C/svg%3E" alt="Preview">
                        <div class="waveform-container">
                            <div class="waveform-bar"></div>
                            <div class="waveform-bar"></div>
                            <div class="waveform-bar"></div>
                            <div class="waveform-bar"></div>
                            <div class="waveform-bar"></div>
                            <div class="waveform-bar"></div>
                            <div class="waveform-bar"></div>
                            <div class="waveform-bar"></div>
                            <div class="waveform-bar"></div>
                            <div class="waveform-bar"></div>
                            <div class="waveform-bar"></div>
                            <div class="waveform-bar"></div>
                            <div class="waveform-bar"></div>
                            <div class="waveform-bar"></div>
                            <div class="waveform-bar"></div>
                        </div>
                    </div>
                    
                    <div class="sound-info">
                        <div class="sound-icon">🎵</div>
                        <div class="sound-name">Epic Transformation Beat</div>
                    </div>
                    
                    <div class="growth-chart">
                        <div class="chart-line"></div>
                        <div class="growth-indicator">↑ 284%</div>
                    </div>
                    
                    <div class="sound-metrics">
                        <div class="metric-item">
                            <span class="metric-value">2.4M</span>
                            <span class="metric-label">Uses</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-value">89%</span>
                            <span class="metric-label">Viral Rate</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-value">15s</span>
                            <span class="metric-label">Duration</span>
                        </div>
                    </div>
                    
                    <div class="card-actions">
                        <button class="action-btn primary">Use This Sound</button>
                        <button class="action-btn secondary">Preview</button>
                    </div>
                </div>
                
                <div class="player-controls">
                    <div class="play-btn">▶</div>
                    <button class="volume-control">🔊</button>
                    <div class="progress-bar">
                        <div class="progress-fill"></div>
                    </div>
                    <div class="time-display">0:05 / 0:15</div>
                </div>
            </div>

            <!-- Sound Card 2 - Rising Fast -->
            <div class="sound-card">
                <div class="platform-badge">
                    <div class="platform-icon">T</div>
                    <span class="platform-name">TikTok</span>
                </div>
                <div class="viral-indicator">📈</div>
                
                <div class="card-content">
                    <p class="sound-description">
                        Emotional storytelling sound that's perfect for personal journeys and inspirational content. Hook viewers instantly.
                    </p>
                    
                    <div class="preview-window">
                        <img class="preview-image" src="data:image/svg+xml,%3Csvg width='400' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Crect fill='%23333' width='400' height='200'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%23777' font-size='20'%3EVideo Preview%3C/text%3E%3C/svg%3E" alt="Preview">
                        <div class="waveform-container">
                            <div class="waveform-bar"></div>
                            <div class="waveform-bar"></div>
                            <div class="waveform-bar"></div>
                            <div class="waveform-bar"></div>
                            <div class="waveform-bar"></div>
                            <div class="waveform-bar"></div>
                            <div class="waveform-bar"></div>
                            <div class="waveform-bar"></div>
                            <div class="waveform-bar"></div>
                            <div class="waveform-bar"></div>
                            <div class="waveform-bar"></div>
                            <div class="waveform-bar"></div>
                            <div class="waveform-bar"></div>
                            <div class="waveform-bar"></div>
                            <div class="waveform-bar"></div>
                        </div>
                    </div>
                    
                    <div class="sound-info">
                        <div class="sound-icon">🎵</div>
                        <div class="sound-name">Emotional Journey</div>
                    </div>
                    
                    <div class="growth-chart">
                        <div class="chart-line"></div>
                        <div class="growth-indicator">↑ 156%</div>
                    </div>
                    
                    <div class="sound-metrics">
                        <div class="metric-item">
                            <span class="metric-value">892K</span>
                            <span class="metric-label">Uses</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-value">76%</span>
                            <span class="metric-label">Viral Rate</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-value">30s</span>
                            <span class="metric-label">Duration</span>
                        </div>
                    </div>
                    
                    <div class="card-actions">
                        <button class="action-btn primary">Use This Sound</button>
                        <button class="action-btn secondary">Preview</button>
                    </div>
                </div>
                
                <div class="player-controls">
                    <div class="play-btn">▶</div>
                    <button class="volume-control">🔊</button>
                    <div class="progress-bar">
                        <div class="progress-fill"></div>
                    </div>
                    <div class="time-display">0:10 / 0:30</div>
                </div>
            </div>

            <!-- Sound Card 3 - Comedy/Entertainment -->
            <div class="sound-card">
                <div class="platform-badge">
                    <div class="platform-icon">T</div>
                    <span class="platform-name">TikTok</span>
                </div>
                <div class="viral-indicator">😂</div>
                
                <div class="card-content">
                    <p class="sound-description">
                        Comedy gold! This sound is crushing it for reaction videos and funny moments. Perfect timing for maximum laughs.
                    </p>
                    
                    <div class="preview-window">
                        <img class="preview-image" src="data:image/svg+xml,%3Csvg width='400' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Crect fill='%23444' width='400' height='200'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%23888' font-size='20'%3EVideo Preview%3C/text%3E%3C/svg%3E" alt="Preview">
                        <div class="waveform-container">
                            <div class="waveform-bar"></div>
                            <div class="waveform-bar"></div>
                            <div class="waveform-bar"></div>
                            <div class="waveform-bar"></div>
                            <div class="waveform-bar"></div>
                            <div class="waveform-bar"></div>
                            <div class="waveform-bar"></div>
                            <div class="waveform-bar"></div>
                            <div class="waveform-bar"></div>
                            <div class="waveform-bar"></div>
                            <div class="waveform-bar"></div>
                            <div class="waveform-bar"></div>
                            <div class="waveform-bar"></div>
                            <div class="waveform-bar"></div>
                            <div class="waveform-bar"></div>
                        </div>
                    </div>
                    
                    <div class="sound-info">
                        <div class="sound-icon">🎵</div>
                        <div class="sound-name">Perfect Timing Meme</div>
                    </div>
                    
                    <div class="growth-chart">
                        <div class="chart-line"></div>
                        <div class="growth-indicator">↑ 420%</div>
                    </div>
                    
                    <div class="sound-metrics">
                        <div class="metric-item">
                            <span class="metric-value">1.8M</span>
                            <span class="metric-label">Uses</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-value">93%</span>
                            <span class="metric-label">Viral Rate</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-value">8s</span>
                            <span class="metric-label">Duration</span>
                        </div>
                    </div>
                    
                    <div class="card-actions">
                        <button class="action-btn primary">Use This Sound</button>
                        <button class="action-btn secondary">Preview</button>
                    </div>
                </div>
                
                <div class="player-controls">
                    <div class="play-btn">▶</div>
                    <button class="volume-control">🔊</button>
                    <div class="progress-bar">
                        <div class="progress-fill"></div>
                    </div>
                    <div class="time-display">0:03 / 0:08</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Play button functionality
        document.querySelectorAll('.play-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const isPlaying = this.textContent === '⏸';
                this.textContent = isPlaying ? '▶' : '⏸';
                
                // Animate waveform based on play state
                const card = this.closest('.sound-card');
                const bars = card.querySelectorAll('.waveform-bar');
                bars.forEach(bar => {
                    bar.style.animationPlayState = isPlaying ? 'paused' : 'running';
                });
            });
        });

        // Volume control
        document.querySelectorAll('.volume-control').forEach(btn => {
            btn.addEventListener('click', function() {
                const isMuted = this.textContent === '🔇';
                this.textContent = isMuted ? '🔊' : '🔇';
            });
        });

        // Progress bar interaction
        document.querySelectorAll('.progress-bar').forEach(bar => {
            bar.addEventListener('click', function(e) {
                const rect = this.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const width = rect.width;
                const percentage = (x / width) * 100;
                
                const fill = this.querySelector('.progress-fill');
                fill.style.width = percentage + '%';
            });
        });

        // Card hover effects
        document.querySelectorAll('.sound-card').forEach(card => {
            card.addEventListener('mouseenter', function() {
                // Create particle effect
                for (let i = 0; i < 5; i++) {
                    createParticle(this);
                }
            });
        });

        function createParticle(card) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: ${Math.random() > 0.5 ? '#7b61ff' : '#ff61a6'};
                border-radius: 50%;
                pointer-events: none;
                z-index: 1;
                animation: float-up 2s ease-out forwards;
            `;
            
            const x = Math.random() * card.offsetWidth;
            const y = card.offsetHeight;
            
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            
            card.appendChild(particle);
            
            setTimeout(() => particle.remove(), 2000);
        }

        // Add float animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes float-up {
                to {
                    transform: translateY(-100px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);

        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', function() {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                
                // Simulate loading new content
                const grid = document.querySelector('.sound-grid');
                grid.style.opacity = '0.5';
                setTimeout(() => {
                    grid.style.opacity = '1';
                }, 300);
            });
        });

        // Action button clicks
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                
                if (this.classList.contains('primary')) {
                    // Create ripple effect
                    const ripple = document.createElement('div');
                    ripple.style.cssText = `
                        position: absolute;
                        width: 20px;
                        height: 20px;
                        background: rgba(255, 255, 255, 0.6);
                        border-radius: 50%;
                        transform: translate(-50%, -50%);
                        pointer-events: none;
                        animation: ripple-expand 0.6s ease-out;
                    `;
                    
                    const rect = this.getBoundingClientRect();
                    ripple.style.left = (e.clientX - rect.left) + 'px';
                    ripple.style.top = (e.clientY - rect.top) + 'px';
                    
                    this.appendChild(ripple);
                    setTimeout(() => ripple.remove(), 600);
                }
            });
        });

        // Add ripple animation
        const rippleStyle = document.createElement('style');
        rippleStyle.textContent = `
            @keyframes ripple-expand {
                to {
                    width: 300px;
                    height: 300px;
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(rippleStyle);
    </script>
</body>
</html>