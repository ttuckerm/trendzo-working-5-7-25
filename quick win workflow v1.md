<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Viral Recipe Book™</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #000;
            color: #fff;
            overflow-x: hidden;
            cursor: none;
        }

        /* Custom cursor */
        .cursor {
            position: fixed;
            width: 20px;
            height: 20px;
            background: radial-gradient(circle, rgba(123, 97, 255, 0.8) 0%, transparent 70%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 10000;
            transform: translate(-50%, -50%);
            transition: transform 0.1s ease-out;
            mix-blend-mode: screen;
        }

        .cursor.hover {
            transform: translate(-50%, -50%) scale(2);
            background: radial-gradient(circle, rgba(255, 97, 166, 0.8) 0%, transparent 70%);
        }

        /* Background ambient */
        .ambient-bg {
            position: fixed;
            inset: 0;
            background: 
                radial-gradient(circle at 20% 50%, rgba(123, 97, 255, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 50%, rgba(255, 97, 166, 0.05) 0%, transparent 50%);
            animation: ambient-shift 20s ease-in-out infinite;
            z-index: -1;
        }

        @keyframes ambient-shift {
            0%, 100% { transform: scale(1) rotate(0deg); }
            50% { transform: scale(1.1) rotate(180deg); }
        }

        /* Main container */
        .main-container {
            min-height: 100vh;
            position: relative;
        }

        /* Gallery Section (Starting Page) */
        .gallery-section {
            min-height: 100vh;
            padding: 40px;
            opacity: 1;
            transform: translateY(0);
            transition: all 0.8s ease;
        }

        .gallery-section.hidden {
            opacity: 0;
            transform: translateY(-50px);
            pointer-events: none;
        }

        /* Header */
        .header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(180deg, #000 0%, transparent 100%);
            padding: 24px 40px 80px;
            z-index: 100;
            backdrop-filter: blur(20px);
        }

        .header-content {
            max-width: 1400px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 20px;
        }

        .logo {
            font-size: 28px;
            font-weight: 700;
            background: linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: logo-pulse 3s ease-in-out infinite;
        }

        @keyframes logo-pulse {
            0%, 100% { opacity: 0.8; }
            50% { opacity: 1; }
        }

        .trending-badge {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 20px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 100px;
            font-size: 14px;
            animation: badge-glow 2s ease-in-out infinite;
        }

        @keyframes badge-glow {
            0%, 100% { box-shadow: 0 0 20px rgba(123, 97, 255, 0.3); }
            50% { box-shadow: 0 0 30px rgba(255, 97, 166, 0.4); }
        }

        /* Template feed */
        .template-feed {
            padding: 200px 40px 40px;
            max-width: 1400px;
            margin: 0 auto;
        }

        .starter-pack-header {
            text-align: center;
            margin-bottom: 60px;
        }

        .starter-pack-title {
            font-size: 48px;
            font-weight: 700;
            background: linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 20px;
        }

        .starter-pack-subtitle {
            font-size: 18px;
            color: rgba(255, 255, 255, 0.7);
        }

        .feed-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 32px;
            animation: feed-load 0.8s ease-out;
        }

        @keyframes feed-load {
            from { opacity: 0; transform: translateY(40px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* Template card */
        .template-card {
            position: relative;
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 24px;
            overflow: hidden;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
            transform-style: preserve-3d;
            animation: card-appear 0.6s ease-out backwards;
        }

        .template-card:nth-child(1) { animation-delay: 0.1s; }
        .template-card:nth-child(2) { animation-delay: 0.2s; }
        .template-card:nth-child(3) { animation-delay: 0.3s; }

        @keyframes card-appear {
            from { opacity: 0; transform: translateY(30px) rotateX(-10deg); }
            to { opacity: 1; transform: translateY(0) rotateX(0); }
        }

        .template-card:hover {
            transform: translateY(-8px) scale(1.02);
            border-color: rgba(123, 97, 255, 0.3);
            box-shadow: 0 20px 40px rgba(123, 97, 255, 0.3);
        }

        /* Ribbon badges */
        .starter-pack-ribbon {
            position: absolute;
            top: 15px;
            left: -10px;
            background: linear-gradient(135deg, #ff6b6b, #f06292);
            color: white;
            padding: 6px 20px 6px 15px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            z-index: 10;
            border-radius: 0 8px 8px 0;
        }

        .recommended-pill {
            position: absolute;
            top: 15px;
            right: 15px;
            background: linear-gradient(135deg, #7b61ff, #ff61a6);
            color: white;
            padding: 6px 12px;
            border-radius: 100px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            z-index: 10;
        }

        /* Video preview */
        .video-preview {
            position: relative;
            width: 100%;
            height: 300px;
            overflow: hidden;
        }

        .video-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: 600;
            color: white;
            text-align: center;
            padding: 20px;
        }

        .play-button {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 60px;
            height: 60px;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            color: #000;
            transition: all 0.3s;
        }

        .template-card:hover .play-button {
            transform: translate(-50%, -50%) scale(1.1);
        }

        /* Template info */
        .template-info {
            padding: 24px;
        }

        .template-stats {
            display: flex;
            justify-content: space-between;
            margin-bottom: 16px;
        }

        .stat {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 14px;
            color: rgba(255, 255, 255, 0.8);
        }

        .stat-number {
            font-weight: 600;
            color: #00ff88;
        }

        .template-title {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .template-description {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.6);
            line-height: 1.5;
            margin-bottom: 20px;
        }

        .use-template-btn {
            width: 100%;
            padding: 16px;
            background: linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%);
            border: none;
            border-radius: 12px;
            color: #fff;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }

        .use-template-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(123, 97, 255, 0.4);
        }

        /* Script Intelligence Section */
        .script-section {
            min-height: 100vh;
            padding: 40px;
            opacity: 0;
            transform: translateY(50px);
            transition: all 0.8s ease;
            pointer-events: none;
            display: none;
        }

        .script-section.visible {
            opacity: 1;
            transform: translateY(0);
            pointer-events: all;
            display: block;
        }

        .script-container {
            max-width: 1400px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            padding-top: 100px;
        }

        .live-preview-panel {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            padding: 30px;
            position: sticky;
            top: 120px;
            height: fit-content;
        }

        .panel-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 30px;
            font-size: 20px;
            font-weight: 600;
        }

        .panel-icon {
            font-size: 24px;
        }

        .preview-window {
            width: 100%;
            height: 400px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
            margin-bottom: 20px;
        }

        .preview-content {
            position: absolute;
            inset: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
        }

        .preview-hook {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            padding: 15px;
            background: rgba(123, 97, 255, 0.2);
            border-radius: 12px;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.5s ease;
        }

        .preview-hook.visible {
            opacity: 1;
            transform: translateY(0);
        }

        .preview-audio {
            position: absolute;
            bottom: 20px;
            left: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            padding: 12px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 12px;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.5s ease;
        }

        .preview-audio.visible {
            opacity: 1;
            transform: translateY(0);
        }

        .audio-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #7b61ff, #ff61a6);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .audio-info {
            flex: 1;
        }

        .audio-title {
            font-size: 14px;
            font-weight: 600;
        }

        .audio-artist {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.7);
        }

        .script-controls-panel {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            padding: 30px;
        }

        /* Script sections */
        .script-step {
            margin-bottom: 40px;
            opacity: 0.5;
            transform: translateX(20px);
            transition: all 0.5s ease;
        }

        .script-step.active {
            opacity: 1;
            transform: translateX(0);
        }

        .step-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
        }

        .step-title {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 18px;
            font-weight: 600;
        }

        .step-status {
            padding: 4px 12px;
            background: rgba(123, 97, 255, 0.2);
            border-radius: 100px;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.8);
        }

        .step-status.completed {
            background: rgba(0, 255, 136, 0.2);
            color: #00ff88;
        }

        /* Hook Generation */
        .hook-options {
            display: grid;
            gap: 15px;
        }

        .hook-option {
            padding: 16px;
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
        }

        .hook-option:hover {
            border-color: rgba(123, 97, 255, 0.4);
            transform: translateY(-2px);
        }

        .hook-option.selected {
            border-color: #7b61ff;
            background: rgba(123, 97, 255, 0.1);
        }

        .hook-text {
            font-size: 16px;
            margin-bottom: 8px;
        }

        .hook-metrics {
            display: flex;
            gap: 12px;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
        }

        .generate-btn {
            width: 100%;
            padding: 16px;
            background: linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%);
            border: none;
            border-radius: 12px;
            color: #fff;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            margin-top: 15px;
        }

        .generate-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(123, 97, 255, 0.4);
        }

        /* Beat Timeline */
        .beat-timeline {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 20px;
        }

        .timeline-track {
            height: 60px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            position: relative;
            margin-bottom: 15px;
        }

        .beat-marker {
            position: absolute;
            top: 10px;
            bottom: 10px;
            width: 80px;
            background: linear-gradient(135deg, #7b61ff, #ff61a6);
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }

        .beat-marker:hover {
            transform: scale(1.05);
        }

        /* Audio Selection */
        .audio-carousel {
            display: flex;
            gap: 15px;
            overflow-x: auto;
            padding: 10px 0;
        }

        .audio-option {
            min-width: 200px;
            padding: 16px;
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .audio-option:hover {
            border-color: rgba(123, 97, 255, 0.4);
        }

        .audio-option.selected {
            border-color: #7b61ff;
            background: rgba(123, 97, 255, 0.1);
        }

        .audio-name {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 4px;
        }

        .audio-details {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
        }

        /* Output buttons */
        .output-buttons {
            display: flex;
            gap: 12px;
            margin-top: 30px;
        }

        .output-btn {
            flex: 1;
            padding: 12px;
            background: rgba(123, 97, 255, 0.2);
            border: 1px solid rgba(123, 97, 255, 0.4);
            border-radius: 8px;
            color: white;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }

        .output-btn:hover {
            background: rgba(123, 97, 255, 0.3);
            transform: translateY(-2px);
        }

        /* Continue button */
        .continue-btn {
            width: 100%;
            padding: 20px;
            background: linear-gradient(135deg, #00ff88 0%, #00cc70 100%);
            border: none;
            border-radius: 16px;
            color: #000;
            font-size: 18px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s;
            margin-top: 40px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .continue-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 15px 40px rgba(0, 255, 136, 0.4);
        }

        /* Analysis Section */
        .analysis-section {
            min-height: 100vh;
            padding: 40px;
            opacity: 0;
            transform: translateY(50px);
            transition: all 0.8s ease;
            pointer-events: none;
            display: none;
        }

        .analysis-section.visible {
            opacity: 1;
            transform: translateY(0);
            pointer-events: all;
            display: block;
        }

        .analysis-container {
            max-width: 800px;
            margin: 0 auto;
            padding-top: 100px;
        }

        .analysis-header {
            text-align: center;
            margin-bottom: 60px;
        }

        .analysis-title {
            font-size: 48px;
            font-weight: 700;
            background: linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 20px;
        }

        .viral-score {
            font-size: 72px;
            font-weight: 800;
            background: linear-gradient(135deg, #00ff88 0%, #00cc70 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin: 30px 0;
        }

        .fixes-container {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 40px;
        }

        .fix-item {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 15px;
            margin-bottom: 15px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
        }

        .fix-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #ff6b6b, #f06292);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .fix-content {
            flex: 1;
        }

        .fix-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 4px;
        }

        .fix-description {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.7);
        }

        .apply-fixes-btn {
            width: 100%;
            padding: 20px;
            background: linear-gradient(135deg, #ff6b6b 0%, #f06292 100%);
            border: none;
            border-radius: 16px;
            color: white;
            font-size: 18px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s;
            margin-bottom: 30px;
        }

        .apply-fixes-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 15px 40px rgba(255, 107, 107, 0.4);
        }

        .ready-badge {
            text-align: center;
            padding: 20px;
            background: rgba(0, 255, 136, 0.1);
            border: 2px solid rgba(0, 255, 136, 0.3);
            border-radius: 20px;
            font-size: 24px;
            font-weight: 700;
            color: #00ff88;
            margin-bottom: 40px;
        }

        /* Platform Section */
        .platform-section {
            min-height: 100vh;
            padding: 40px;
            opacity: 0;
            transform: translateY(50px);
            transition: all 0.8s ease;
            pointer-events: none;
            display: none;
        }

        .platform-section.visible {
            opacity: 1;
            transform: translateY(0);
            pointer-events: all;
            display: block;
        }

        .platform-container {
            max-width: 800px;
            margin: 0 auto;
            padding-top: 100px;
        }

        .platform-drawer {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 40px;
            margin-bottom: 40px;
        }

        .platform-schedule {
            display: grid;
            gap: 20px;
            margin-bottom: 30px;
        }

        .platform-item {
            display: flex;
            align-items: center;
            gap: 20px;
            padding: 20px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 16px;
        }

        .platform-icon {
            width: 60px;
            height: 60px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
        }

        .tiktok { background: linear-gradient(135deg, #ff0050, #000); }
        .instagram { background: linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045); }
        .youtube { background: linear-gradient(135deg, #ff0000, #cc0000); }

        .platform-info {
            flex: 1;
        }

        .platform-name {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 4px;
        }

        .platform-time {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.7);
        }

        .export-buttons {
            display: flex;
            gap: 15px;
        }

        .export-btn {
            padding: 12px 20px;
            background: rgba(123, 97, 255, 0.2);
            border: 1px solid rgba(123, 97, 255, 0.4);
            border-radius: 12px;
            color: white;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }

        .export-btn:hover {
            background: rgba(123, 97, 255, 0.3);
        }

        /* Success Section */
        .success-section {
            min-height: 100vh;
            padding: 40px;
            opacity: 0;
            transform: translateY(50px);
            transition: all 0.8s ease;
            pointer-events: none;
            display: none;
        }

        .success-section.visible {
            opacity: 1;
            transform: translateY(0);
            pointer-events: all;
            display: block;
        }

        .success-container {
            max-width: 600px;
            margin: 0 auto;
            text-align: center;
            padding-top: 100px;
        }

        .success-icon {
            width: 120px;
            height: 120px;
            background: linear-gradient(135deg, #00ff88, #00cc70);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 60px;
            margin: 0 auto 40px;
            animation: success-pulse 2s ease-in-out infinite;
        }

        @keyframes success-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }

        .prediction-toast {
            position: fixed;
            top: 100px;
            right: 40px;
            background: rgba(0, 255, 136, 0.1);
            border: 2px solid rgba(0, 255, 136, 0.3);
            border-radius: 16px;
            padding: 20px;
            max-width: 300px;
            opacity: 0;
            transform: translateX(100px);
            transition: all 0.5s ease;
        }

        .prediction-toast.visible {
            opacity: 1;
            transform: translateX(0);
        }

        .teleprompter-btn {
            width: 100%;
            padding: 24px;
            background: linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%);
            border: none;
            border-radius: 16px;
            color: white;
            font-size: 20px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s;
            margin-top: 40px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .teleprompter-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 15px 40px rgba(123, 97, 255, 0.4);
        }

        /* Coach bubble */
        .coach-bubble {
            position: fixed;
            bottom: 100px;
            right: 40px;
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #7b61ff;
            border-radius: 20px;
            padding: 20px;
            max-width: 300px;
            z-index: 1000;
            opacity: 0;
            transform: translateY(20px) scale(0.9);
            transition: all 0.5s ease;
            box-shadow: 0 20px 40px rgba(123, 97, 255, 0.3);
        }

        .coach-bubble.visible {
            opacity: 1;
            transform: translateY(0) scale(1);
        }

        .coach-bubble::before {
            content: '';
            position: absolute;
            bottom: -10px;
            right: 30px;
            width: 0;
            height: 0;
            border-left: 10px solid transparent;
            border-right: 10px solid transparent;
            border-top: 10px solid #7b61ff;
        }

        .coach-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 15px;
        }

        .coach-avatar {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #7b61ff, #ff61a6);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
        }

        .coach-name {
            font-size: 14px;
            font-weight: 600;
            color: #7b61ff;
        }

        .coach-message {
            font-size: 14px;
            line-height: 1.5;
            color: rgba(255, 255, 255, 0.9);
        }

        /* Loading states */
        .loading-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.95);
            backdrop-filter: blur(10px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }

        .loading-overlay.active {
            opacity: 1;
            pointer-events: all;
        }

        .loading-spinner {
            width: 80px;
            height: 80px;
            border: 4px solid rgba(123, 97, 255, 0.3);
            border-top-color: #7b61ff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        /* Floating elements */
        .floating-orb {
            position: fixed;
            width: 200px;
            height: 200px;
            background: radial-gradient(circle, rgba(123, 97, 255, 0.2) 0%, transparent 70%);
            border-radius: 50%;
            pointer-events: none;
            animation: float-orb 20s ease-in-out infinite;
        }

        .floating-orb:nth-child(2) {
            left: 80%;
            top: 60%;
            background: radial-gradient(circle, rgba(255, 97, 166, 0.2) 0%, transparent 70%);
            animation-duration: 25s;
            animation-delay: -5s;
        }

        @keyframes float-orb {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(50px, -50px) scale(1.2); }
            66% { transform: translate(-30px, 30px) scale(0.8); }
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
            .script-container {
                grid-template-columns: 1fr;
                gap: 30px;
            }
            
            .live-preview-panel {
                position: static;
                order: -1;
            }
            
            .header {
                padding: 16px 20px 60px;
            }
            
            .template-feed {
                padding: 160px 20px 20px;
            }
            
            .feed-grid {
                grid-template-columns: 1fr;
            }
            
            .coach-bubble {
                bottom: 20px;
                right: 20px;
                left: 20px;
                max-width: none;
            }
        }
    </style>
</head>
<body>
    <!-- Custom cursor -->
    <div class="cursor" id="cursor"></div>

    <!-- Ambient background -->
    <div class="ambient-bg"></div>

    <!-- Floating orbs -->
    <div class="floating-orb" style="left: 10%; top: 20%;"></div>
    <div class="floating-orb"></div>

    <!-- Main container -->
    <div class="main-container">
        
        <!-- Gallery Section (Starting Page) -->
        <section class="gallery-section" id="gallerySection">
            <!-- Header -->
            <header class="header">
                <div class="header-content">
                    <div class="logo">Viral Recipe Book™</div>
                    <div class="trending-badge">
                        <div style="width: 8px; height: 8px; background: #ff4458; border-radius: 50%; animation: live-pulse 1s ease-out infinite;"></div>
                        <span>247 Templates Trending Now</span>
                    </div>
                </div>
            </header>

            <!-- Template feed -->
            <main class="template-feed">
                <div class="starter-pack-header">
                    <h1 class="starter-pack-title">Starter Pack</h1>
                    <p class="starter-pack-subtitle">3 HOT templates curated for maximum viral potential</p>
                </div>
                
                <div class="feed-grid">
                    <!-- Template 1 - Recommended -->
                    <article class="template-card" onclick="selectTemplate('transformation')">
                        <div class="starter-pack-ribbon">STARTER PACK</div>
                        <div class="recommended-pill">RECOMMENDED</div>
                        
                        <div class="video-preview">
                            <div class="video-placeholder" style="background: linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%);">
                                Transformation Reveal
                            </div>
                            <div class="play-button">▶️</div>
                        </div>
                        
                        <div class="template-info">
                            <div class="template-stats">
                                <div class="stat">
                                    <span>Success:</span>
                                    <span class="stat-number">94%</span>
                                </div>
                                <div class="stat">
                                    <span>7-day Δ:</span>
                                    <span class="stat-number">+12%</span>
                                </div>
                            </div>
                            
                            <h3 class="template-title">Transformation Reveal</h3>
                            <p class="template-description">The viral before/after format that gets millions of views with powerful emotional hooks</p>
                            
                            <button class="use-template-btn">Use this template</button>
                        </div>
                    </article>

                    <!-- Template 2 -->
                    <article class="template-card" onclick="selectTemplate('list')">
                        <div class="starter-pack-ribbon">STARTER PACK</div>
                        
                        <div class="video-preview">
                            <div class="video-placeholder" style="background: linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%);">
                                5 Things List
                            </div>
                            <div class="play-button">▶️</div>
                        </div>
                        
                        <div class="template-info">
                            <div class="template-stats">
                                <div class="stat">
                                    <span>Success:</span>
                                    <span class="stat-number">89%</span>
                                </div>
                                <div class="stat">
                                    <span>7-day Δ:</span>
                                    <span class="stat-number">+8%</span>
                                </div>
                            </div>
                            
                            <h3 class="template-title">5 Things List</h3>
                            <p class="template-description">Countdown format with text overlays that hooks viewers from second one</p>
                            
                            <button class="use-template-btn">Use this template</button>
                        </div>
                    </article>

                    <!-- Template 3 -->
                    <article class="template-card" onclick="selectTemplate('pov')">
                        <div class="starter-pack-ribbon">STARTER PACK</div>
                        
                        <div class="video-preview">
                            <div class="video-placeholder" style="background: linear-gradient(135deg, #ffd93d 0%, #ff6bcb 100%);">
                                POV Experience
                            </div>
                            <div class="play-button">▶️</div>
                        </div>
                        
                        <div class="template-info">
                            <div class="template-stats">
                                <div class="stat">
                                    <span>Success:</span>
                                    <span class="stat-number">97%</span>
                                </div>
                                <div class="stat">
                                    <span>7-day Δ:</span>
                                    <span class="stat-number">+15%</span>
                                </div>
                            </div>
                            
                            <h3 class="template-title">POV Experience</h3>
                            <p class="template-description">First-person storytelling that creates instant connection and engagement</p>
                            
                            <button class="use-template-btn">Use this template</button>
                        </div>
                    </article>
                </div>
            </main>
        </section>

        <!-- Script Intelligence Section -->
        <section class="script-section" id="scriptSection">
            <div class="script-container">
                <!-- Live Preview Panel -->
                <div class="live-preview-panel">
                    <div class="panel-header">
                        <span class="panel-icon">🎬</span>
                        <span>Live Preview</span>
                    </div>
                    
                    <div class="preview-window">
                        <div class="preview-content">
                            <div class="preview-hook" id="previewHook">
                                Select a hook to see it here
                            </div>
                            <div class="play-button" style="position: static; transform: none;">▶️</div>
                        </div>
                        
                        <div class="preview-audio" id="previewAudio">
                            <div class="audio-icon">🎵</div>
                            <div class="audio-info">
                                <div class="audio-title" id="audioTitle">No audio selected</div>
                                <div class="audio-artist" id="audioArtist">Choose from trending sounds</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Script Controls Panel -->
                <div class="script-controls-panel">
                    <div class="panel-header">
                        <span class="panel-icon">🎛️</span>
                        <span>Script Intelligence</span>
                    </div>

                    <!-- Hook Generation Step -->
                    <div class="script-step active" id="hookStep">
                        <div class="step-header">
                            <div class="step-title">
                                <span>🪝</span>
                                <span>Generate 3 Hooks</span>
                            </div>
                            <div class="step-status">Active</div>
                        </div>
                        
                        <div class="hook-options" id="hookOptions">
                            <!-- Hooks will be generated here -->
                        </div>
                        
                        <button class="generate-btn" onclick="generateHooks()">Generate 3 Hooks</button>
                    </div>

                    <!-- Beat Timeline Step -->
                    <div class="script-step" id="beatStep">
                        <div class="step-header">
                            <div class="step-title">
                                <span>⏱️</span>
                                <span>Fill beats from template</span>
                            </div>
                            <div class="step-status">Pending</div>
                        </div>
                        
                        <div class="beat-timeline">
                            <div class="timeline-track">
                                <div class="beat-marker" style="left: 5%;">Hook</div>
                                <div class="beat-marker" style="left: 25%;">Problem</div>
                                <div class="beat-marker" style="left: 50%;">Solution</div>
                                <div class="beat-marker" style="left: 75%;">CTA</div>
                            </div>
                        </div>
                    </div>

                    <!-- Audio Selection Step -->
                    <div class="script-step" id="audioStep">
                        <div class="step-header">
                            <div class="step-title">
                                <span>🎵</span>
                                <span>Select trending audio</span>
                            </div>
                            <div class="step-status">Pending</div>
                        </div>
                        
                        <div class="audio-carousel">
                            <div class="audio-option" onclick="selectAudio('Aesthetic - Tollan Kim', 'Tollan Kim')">
                                <div class="audio-name">Aesthetic</div>
                                <div class="audio-details">Tollan Kim • Trending</div>
                            </div>
                            <div class="audio-option" onclick="selectAudio('Oh No - Capone Remix', 'Capone')">
                                <div class="audio-name">Oh No</div>
                                <div class="audio-details">Capone Remix • Viral</div>
                            </div>
                            <div class="audio-option" onclick="selectAudio('Running Up That Hill', 'Kate Bush')">
                                <div class="audio-name">Running Up That Hill</div>
                                <div class="audio-details">Kate Bush • Classic</div>
                            </div>
                        </div>
                    </div>

                    <!-- Shot List Step -->
                    <div class="script-step" id="shotStep">
                        <div class="step-header">
                            <div class="step-title">
                                <span>📋</span>
                                <span>Create shot list</span>
                            </div>
                            <div class="step-status">Pending</div>
                        </div>
                        
                        <div class="output-buttons">
                            <button class="output-btn">📱 Teleprompter</button>
                            <button class="output-btn">📄 SRT</button>
                            <button class="output-btn">📋 Shot list</button>
                        </div>
                    </div>

                    <button class="continue-btn" onclick="proceedToAnalysis()">Continue to Analysis</button>
                </div>
            </div>
        </section>

        <!-- Analysis Section -->
        <section class="analysis-section" id="analysisSection">
            <div class="analysis-container">
                <div class="analysis-header">
                    <h2 class="analysis-title">Instant Analysis</h2>
                    <div class="viral-score" id="viralScore">0%</div>
                    <p>Viral Score</p>
                </div>

                <div class="fixes-container" id="fixesContainer">
                    <h3 style="margin-bottom: 20px;">3 Prioritized Fixes</h3>
                    
                    <div class="fix-item">
                        <div class="fix-icon">⚡</div>
                        <div class="fix-content">
                            <div class="fix-title">Strengthen hook timing</div>
                            <div class="fix-description">Move main hook 2 seconds earlier for better retention</div>
                        </div>
                    </div>
                    
                    <div class="fix-item">
                        <div class="fix-icon">🎯</div>
                        <div class="fix-content">
                            <div class="fix-title">Optimize CTA placement</div>
                            <div class="fix-description">Add secondary CTA at 15-second mark</div>
                        </div>
                    </div>
                    
                    <div class="fix-item">
                        <div class="fix-icon">🔥</div>
                        <div class="fix-content">
                            <div class="fix-title">Enhance emotional trigger</div>
                            <div class="fix-description">Add urgency words to increase engagement</div>
                        </div>
                    </div>
                    
                    <button class="apply-fixes-btn" onclick="applyFixes()">Apply all fixes</button>
                </div>

                <div class="ready-badge" id="readyBadge" style="display: none;">
                    ✅ Ready to Post
                </div>

                <button class="continue-btn" onclick="proceedToPlatform()">Schedule Cross-Platform</button>
            </div>
        </section>

        <!-- Platform Section -->
        <section class="platform-section" id="platformSection">
            <div class="platform-container">
                <div class="analysis-header">
                    <h2 class="analysis-title">Cross-Platform Plan</h2>
                    <p>Optimized timing for maximum reach</p>
                </div>

                <div class="platform-drawer">
                    <div class="platform-schedule">
                        <div class="platform-item">
                            <div class="platform-icon tiktok">📱</div>
                            <div class="platform-info">
                                <div class="platform-name">TikTok</div>
                                <div class="platform-time">Today, 7:30 PM</div>
                            </div>
                        </div>
                        
                        <div class="platform-item">
                            <div class="platform-icon instagram">📷</div>
                            <div class="platform-info">
                                <div class="platform-name">Instagram Reels</div>
                                <div class="platform-time">Tomorrow, 12:00 PM</div>
                            </div>
                        </div>
                        
                        <div class="platform-item">
                            <div class="platform-icon youtube">📺</div>
                            <div class="platform-info">
                                <div class="platform-name">YouTube Shorts</div>
                                <div class="platform-time">Tomorrow, 6:00 PM</div>
                            </div>
                        </div>
                    </div>

                    <div class="export-buttons">
                        <button class="export-btn" onclick="addToCalendar()">📅 Add to calendar</button>
                        <button class="export-btn" onclick="exportCaptions()">📝 Export captions/hashtags</button>
                    </div>
                </div>

                <button class="continue-btn" onclick="showSuccess()">Finish & Get Prediction</button>
            </div>
        </section>

        <!-- Success Section -->
        <section class="success-section" id="successSection">
            <div class="success-container">
                <div class="success-icon">🎉</div>
                <h2 class="analysis-title">Ready to Create!</h2>
                <p style="font-size: 18px; color: rgba(255, 255, 255, 0.7); margin-bottom: 40px;">
                    Your viral recipe is complete and optimized
                </p>

                <button class="teleprompter-btn">Next: Record with Teleprompter</button>
            </div>
        </section>
    </div>

    <!-- Coach Bubble -->
    <div class="coach-bubble" id="coachBubble">
        <div class="coach-header">
            <div class="coach-avatar">🤖</div>
            <div class="coach-name">AI Coach</div>
        </div>
        <div class="coach-message" id="coachMessage">
            Welcome! Let's create your first viral video in 10 minutes.
        </div>
    </div>

    <!-- Prediction Toast -->
    <div class="prediction-toast" id="predictionToast">
        <h4 style="margin-bottom: 10px; color: #00ff88;">Prediction Saved ✅</h4>
        <p style="font-size: 14px; margin-bottom: 15px;">We'll verify your results in 48h</p>
        <button style="background: none; border: 1px solid #00ff88; color: #00ff88; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer;">
            See my Prediction Receipt
        </button>
    </div>

    <!-- Loading Overlay -->
    <div class="loading-overlay" id="loadingOverlay">
        <div class="loading-spinner"></div>
    </div>

    <script>
        // Global state
        let currentStep = 'gallery';
        let selectedTemplate = null;
        let selectedHook = null;
        let selectedAudio = null;
        let viralScore = 73;

        // Initialize cursor
        const cursor = document.getElementById('cursor');
        let mouseX = 0, mouseY = 0;
        let cursorX = 0, cursorY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        function animateCursor() {
            const dx = mouseX - cursorX;
            const dy = mouseY - cursorY;
            
            cursorX += dx * 0.1;
            cursorY += dy * 0.1;
            
            cursor.style.left = cursorX + 'px';
            cursor.style.top = cursorY + 'px';
            
            requestAnimationFrame(animateCursor);
        }
        animateCursor();

        // Cursor hover effects
        document.addEventListener('mouseover', (e) => {
            if (e.target.closest('button, .template-card, .hook-option, .audio-option')) {
                cursor.classList.add('hover');
            }
        });

        document.addEventListener('mouseout', (e) => {
            if (e.target.closest('button, .template-card, .hook-option, .audio-option')) {
                cursor.classList.remove('hover');
            }
        });

        // Template selection
        function selectTemplate(templateId) {
            selectedTemplate = templateId;
            showLoading();
            
            setTimeout(() => {
                hideLoading();
                showSection('script');
                showCoachMessage("Great choice! Now let's generate 3 hooks for your video. Click 'Generate 3 Hooks' to start.");
            }, 2000);
        }

        // Hook generation
        function generateHooks() {
            showLoading();
            
            const hooks = [
                {
                    text: "POV: You discover the secret that 99% of people ignore",
                    metrics: ["High curiosity", "92% retention"]
                },
                {
                    text: "This changed everything I thought I knew about success",
                    metrics: ["Emotional trigger", "87% retention"]
                },
                {
                    text: "The mistake I made for 5 years (don't repeat it)",
                    metrics: ["Pain point focus", "89% retention"]
                }
            ];
            
            setTimeout(() => {
                hideLoading();
                renderHooks(hooks);
                activateStep('beat');
                showCoachMessage("Perfect! Now select your favorite hook and fill in the beat timeline.");
            }, 1500);
        }

        function renderHooks(hooks) {
            const container = document.getElementById('hookOptions');
            container.innerHTML = hooks.map((hook, index) => `
                <div class="hook-option" onclick="selectHook('${hook.text}', ${index})">
                    <div class="hook-text">${hook.text}</div>
                    <div class="hook-metrics">
                        ${hook.metrics.map(metric => `<span>${metric}</span>`).join('')}
                    </div>
                </div>
            `).join('');
            
            completeStep('hook');
        }

        function selectHook(text, index) {
            selectedHook = text;
            
            // Update preview
            const previewHook = document.getElementById('previewHook');
            previewHook.textContent = text;
            previewHook.classList.add('visible');
            
            // Update selection
            document.querySelectorAll('.hook-option').forEach((el, i) => {
                el.classList.toggle('selected', i === index);
            });
            
            activateStep('audio');
            showCoachMessage("Great hook! Now select trending audio to boost your viral potential.");
        }

        function selectAudio(title, artist) {
            selectedAudio = { title, artist };
            
            // Update preview
            const previewAudio = document.getElementById('previewAudio');
            const audioTitle = document.getElementById('audioTitle');
            const audioArtist = document.getElementById('audioArtist');
            
            audioTitle.textContent = title;
            audioArtist.textContent = artist;
            previewAudio.classList.add('visible');
            
            // Update selection
            document.querySelectorAll('.audio-option').forEach(el => {
                el.classList.remove('selected');
            });
            event.target.closest('.audio-option').classList.add('selected');
            
            completeStep('audio');
            activateStep('shot');
            showCoachMessage("Excellent! Your script is coming together. Ready to move to analysis?");
        }

        function activateStep(stepName) {
            const step = document.getElementById(stepName + 'Step');
            if (step) {
                step.classList.add('active');
                step.querySelector('.step-status').textContent = 'Active';
            }
        }

        function completeStep(stepName) {
            const step = document.getElementById(stepName + 'Step');
            if (step) {
                step.classList.remove('active');
                const status = step.querySelector('.step-status');
                status.textContent = 'Completed';
                status.classList.add('completed');
            }
        }

        function proceedToAnalysis() {
            if (!selectedHook || !selectedAudio) {
                showCoachMessage("Please select a hook and audio before proceeding!");
                return;
            }
            
            showLoading();
            setTimeout(() => {
                hideLoading();
                showSection('analysis');
                runAnalysis();
            }, 2000);
        }

        function runAnalysis() {
            // Animate viral score
            let currentScore = 0;
            const targetScore = viralScore;
            const scoreElement = document.getElementById('viralScore');
            
            const interval = setInterval(() => {
                currentScore += 2;
                scoreElement.textContent = currentScore + '%';
                
                if (currentScore >= targetScore) {
                    clearInterval(interval);
                    showCoachMessage("Analysis complete! Apply the suggested fixes to boost your viral score to 94%.");
                }
            }, 50);
        }

        function applyFixes() {
            showLoading();
            
            setTimeout(() => {
                hideLoading();
                viralScore = 94;
                document.getElementById('viralScore').textContent = '94%';
                document.getElementById('readyBadge').style.display = 'block';
                document.getElementById('fixesContainer').style.opacity = '0.5';
                showCoachMessage("Perfect! Your video is now optimized and ready to post. Let's schedule it across platforms.");
            }, 2000);
        }

        function proceedToPlatform() {
            showSection('platform');
            showCoachMessage("Here's your optimized posting schedule. Add to calendar or export everything you need!");
        }

        function addToCalendar() {
            showCoachMessage("Calendar events created! You'll get reminders for each platform.");
        }

        function exportCaptions() {
            showCoachMessage("Captions and hashtags exported! Everything is ready for posting.");
        }

        function showSuccess() {
            showSection('success');
            showCoachMessage("");
            
            // Show prediction toast
            setTimeout(() => {
                document.getElementById('predictionToast').classList.add('visible');
                
                setTimeout(() => {
                    document.getElementById('predictionToast').classList.remove('visible');
                }, 5000);
            }, 1000);
        }

        // Section management
        function showSection(sectionName) {
            // Hide all sections
            document.querySelectorAll('.gallery-section, .script-section, .analysis-section, .platform-section, .success-section').forEach(section => {
                section.classList.remove('visible');
                if (!section.classList.contains('gallery-section')) {
                    section.style.display = 'none';
                }
            });
            
            // Show target section
            const targetSection = document.getElementById(sectionName + 'Section');
            targetSection.style.display = 'block';
            
            setTimeout(() => {
                targetSection.classList.add('visible');
            }, 100);
            
            currentStep = sectionName;
        }

        // Loading states
        function showLoading() {
            document.getElementById('loadingOverlay').classList.add('active');
        }

        function hideLoading() {
            document.getElementById('loadingOverlay').classList.remove('active');
        }

        // Coach bubble
        function showCoachMessage(message) {
            const bubble = document.getElementById('coachBubble');
            const messageEl = document.getElementById('coachMessage');
            
            if (message === "") {
                bubble.classList.remove('visible');
                return;
            }
            
            messageEl.textContent = message;
            bubble.classList.add('visible');
        }

        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            showCoachMessage("Welcome! Choose a template from the Starter Pack to begin your 10-minute viral video creation.");
        });

        // Live pulse animation for trending indicator
        const style = document.createElement('style');
        style.textContent = `
            @keyframes live-pulse {
                0% { transform: scale(1); opacity: 1; }
                100% { transform: scale(2); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    </script>
</body>
</html>