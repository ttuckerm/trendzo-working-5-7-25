<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Viral DNA Dive - Complete Unicorn Experience</title>
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
            overflow: hidden;
            height: 100vh;
            position: relative;
        }

        /* Animated starfield background */
        .starfield {
            position: fixed;
            inset: 0;
            z-index: 1;
        }

        .star {
            position: absolute;
            width: 2px;
            height: 2px;
            background: white;
            border-radius: 50%;
            animation: twinkle 3s infinite;
        }

        @keyframes twinkle {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
        }

        /* Rotating background effect */
        .rotating-bg {
            position: fixed;
            inset: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle at 30% 50%, rgba(123, 97, 255, 0.1) 0%, transparent 50%),
                        radial-gradient(circle at 70% 50%, rgba(255, 97, 166, 0.1) 0%, transparent 50%);
            animation: rotate-bg 30s linear infinite;
            z-index: 2;
        }

        @keyframes rotate-bg {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        /* Feed container */
        .feed-container {
            position: relative;
            height: 100vh;
            width: 100%;
            overflow: hidden;
            z-index: 10;
            transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .feed-container.diving {
            filter: blur(20px);
            transform: scale(0.8);
            opacity: 0;
        }

        /* Template slides */
        .template-slide {
            position: absolute;
            width: 100%;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .template-slide.prev {
            transform: translateY(-100%);
        }

        .template-slide.next {
            transform: translateY(100%);
        }

        /* Viral DNA visualization */
        .viral-dna-viz {
            position: absolute;
            top: 50%;
            left: -150px;
            transform: translateY(-50%);
            width: 300px;
            height: 300px;
            opacity: 0.3;
            animation: dna-rotate 20s linear infinite;
            z-index: 5;
        }

        @keyframes dna-rotate {
            from { transform: translateY(-50%) rotate(0deg); }
            to { transform: translateY(-50%) rotate(360deg); }
        }

        .dna-strand {
            position: absolute;
            width: 100%;
            height: 100%;
        }

        .dna-node {
            position: absolute;
            width: 60px;
            height: 60px;
            background: radial-gradient(circle, rgba(123, 97, 255, 0.8) 0%, transparent 70%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 600;
            animation: node-pulse 3s ease-in-out infinite;
        }

        @keyframes node-pulse {
            0%, 100% { transform: scale(1); opacity: 0.6; }
            50% { transform: scale(1.2); opacity: 1; }
        }

        .dna-node:nth-child(1) { top: 0; left: 50%; transform: translateX(-50%); }
        .dna-node:nth-child(2) { top: 50%; right: 0; transform: translateY(-50%); animation-delay: 0.75s; }
        .dna-node:nth-child(3) { bottom: 0; left: 50%; transform: translateX(-50%); animation-delay: 1.5s; }
        .dna-node:nth-child(4) { top: 50%; left: 0; transform: translateY(-50%); animation-delay: 2.25s; }

        /* Phone mockup */
        .phone-container {
            position: relative;
            width: 375px;
            height: 812px;
            max-height: 85vh;
            background: #1a1a1a;
            border-radius: 40px;
            box-shadow: 
                0 0 0 12px #222,
                0 0 0 14px #333,
                0 20px 100px rgba(0, 0, 0, 0.5),
                0 0 200px rgba(123, 97, 255, 0.2);
            overflow: hidden;
            animation: phone-float 6s ease-in-out infinite;
            transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .phone-container.zooming {
            animation: none;
            transform: scale(3) translateZ(100px);
            opacity: 0;
        }

        @keyframes phone-float {
            0%, 100% { transform: translateY(0) rotateY(-5deg) rotateX(2deg); }
            50% { transform: translateY(-20px) rotateY(5deg) rotateX(-2deg); }
        }

        /* Lighting effect */
        .lighting-effect {
            position: absolute;
            inset: 0;
            background: linear-gradient(90deg, 
                transparent 0%, 
                rgba(255, 255, 255, 0.05) 20%,
                rgba(255, 255, 255, 0.1) 40%,
                rgba(255, 255, 255, 0.05) 60%,
                transparent 100%);
            animation: light-sweep 8s ease-in-out infinite;
            pointer-events: none;
        }

        @keyframes light-sweep {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }

        /* Video area */
        .video-container {
            position: relative;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
            overflow: hidden;
        }

        .video-preview {
            width: 100%;
            height: 100%;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .video-icon {
            font-size: 120px;
            opacity: 0.3;
            animation: icon-pulse 2s ease-in-out infinite;
        }

        @keyframes icon-pulse {
            0%, 100% { transform: scale(1); opacity: 0.3; }
            50% { transform: scale(1.1); opacity: 0.5; }
        }

        /* Template overlay */
        .template-overlay {
            position: absolute;
            inset: 0;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            padding: 20px;
            background: linear-gradient(
                180deg,
                transparent 0%,
                transparent 60%,
                rgba(0, 0, 0, 0.9) 100%
            );
        }

        .viral-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 20px;
            background: linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%);
            border-radius: 100px;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 12px;
            animation: badge-3d-pulse 2s ease-in-out infinite;
            box-shadow: 
                0 4px 15px rgba(123, 97, 255, 0.4),
                0 8px 25px rgba(255, 97, 166, 0.3);
            transform-style: preserve-3d;
        }

        @keyframes badge-3d-pulse {
            0%, 100% { 
                transform: scale(1) translateZ(0);
                box-shadow: 
                    0 4px 15px rgba(123, 97, 255, 0.4),
                    0 8px 25px rgba(255, 97, 166, 0.3);
            }
            50% { 
                transform: scale(1.05) translateZ(10px);
                box-shadow: 
                    0 6px 20px rgba(123, 97, 255, 0.6),
                    0 12px 35px rgba(255, 97, 166, 0.5);
            }
        }

        .template-name {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
        }

        .template-description {
            font-size: 16px;
            color: rgba(255, 255, 255, 0.9);
            line-height: 1.4;
            text-shadow: 0 1px 5px rgba(0, 0, 0, 0.5);
        }

        /* Metrics */
        .template-metrics {
            display: flex;
            gap: 24px;
            margin: 20px 0;
        }

        .metric {
            text-align: center;
        }

        .metric-value {
            font-size: 24px;
            font-weight: 700;
            display: block;
            background: linear-gradient(135deg, #fff 0%, #7b61ff 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .metric-label {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        /* Action buttons */
        .template-actions {
            display: flex;
            gap: 16px;
            margin-top: 24px;
        }

        .action-btn {
            flex: 1;
            padding: 16px 24px;
            border: none;
            border-radius: 16px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }

        .action-btn.primary {
            background: linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%);
            color: #fff;
            box-shadow: 0 4px 20px rgba(123, 97, 255, 0.4);
        }

        .action-btn.secondary {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            color: #fff;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .action-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(123, 97, 255, 0.5);
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

        /* Side actions */
        .side-actions {
            position: absolute;
            right: 20px;
            bottom: 100px;
            display: flex;
            flex-direction: column;
            gap: 20px;
            align-items: center;
        }

        .side-action {
            width: 48px;
            height: 48px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            cursor: pointer;
            transition: all 0.3s;
            position: relative;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }

        .side-action:hover {
            transform: scale(1.1);
            background: rgba(123, 97, 255, 0.2);
            border-color: rgba(123, 97, 255, 0.5);
            box-shadow: 0 6px 20px rgba(123, 97, 255, 0.4);
        }

        /* Navigation hints */
        .nav-hint {
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            font-size: 14px;
            color: rgba(255, 255, 255, 0.6);
            display: flex;
            align-items: center;
            gap: 8px;
            animation: hint-bounce 2s ease-in-out infinite;
            z-index: 20;
        }

        .nav-hint.top {
            top: 40px;
        }

        .nav-hint.bottom {
            bottom: 40px;
        }

        @keyframes hint-bounce {
            0%, 100% { transform: translateX(-50%) translateY(0); }
            50% { transform: translateX(-50%) translateY(-10px); }
        }

        .swipe-icon {
            font-size: 20px;
            animation: swipe-motion 2s ease-in-out infinite;
        }

        @keyframes swipe-motion {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
        }

        /* DNA Tunnel */
        .dna-tunnel {
            position: fixed;
            inset: 0;
            background: #000;
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            perspective: 1000px;
        }

        .dna-tunnel.active {
            display: flex;
        }

        .tunnel-container {
            position: relative;
            width: 100%;
            height: 100%;
            transform-style: preserve-3d;
            animation: tunnel-spin 4s linear infinite;
        }

        @keyframes tunnel-spin {
            from { transform: rotateZ(0deg); }
            to { transform: rotateZ(360deg); }
        }

        .tunnel-ring {
            position: absolute;
            width: 150%;
            height: 150%;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            border: 2px solid;
            border-radius: 50%;
            opacity: 0;
            animation: tunnel-expand 2s ease-out infinite;
        }

        @keyframes tunnel-expand {
            0% {
                transform: translate(-50%, -50%) scale(0.1) translateZ(0);
                opacity: 1;
                border-color: #7b61ff;
            }
            50% {
                border-color: #ff61a6;
            }
            100% {
                transform: translate(-50%, -50%) scale(3) translateZ(-500px);
                opacity: 0;
                border-color: #7b61ff;
            }
        }

        .tunnel-element {
            position: absolute;
            padding: 12px 24px;
            background: rgba(123, 97, 255, 0.2);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(123, 97, 255, 0.5);
            border-radius: 100px;
            font-size: 18px;
            font-weight: 600;
            animation: element-fly 3s ease-in-out infinite;
            box-shadow: 0 0 30px rgba(123, 97, 255, 0.5);
        }

        @keyframes element-fly {
            0% {
                transform: translateZ(-1000px) scale(0);
                opacity: 0;
            }
            50% {
                opacity: 1;
            }
            100% {
                transform: translateZ(1000px) scale(5);
                opacity: 0;
            }
        }

        /* DNA Analysis View - 3D Immersive Space */
        .dna-analysis-view {
            position: fixed;
            inset: 0;
            background: #000;
            display: none;
            z-index: 2000;
            overflow: hidden;
            perspective: 1000px;
        }

        .dna-analysis-view.active {
            display: block;
        }

        /* 3D Environment */
        .immersive-space {
            position: absolute;
            inset: 0;
            transform-style: preserve-3d;
            animation: space-breathe 10s ease-in-out infinite;
        }

        @keyframes space-breathe {
            0%, 100% { transform: scale(1) rotateX(0deg) rotateY(0deg); }
            50% { transform: scale(1.05) rotateX(2deg) rotateY(-2deg); }
        }

        /* Central video floating in space */
        .central-video {
            position: absolute;
            left: 50%;
            top: 50%;
            width: 300px;
            height: 533px;
            transform: translate(-50%, -50%) translateZ(0);
            background: linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%);
            border-radius: 30px;
            box-shadow: 
                0 0 100px rgba(123, 97, 255, 0.5),
                0 0 200px rgba(255, 97, 166, 0.3);
            animation: video-float 6s ease-in-out infinite;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 80px;
            z-index: 10;
        }

        @keyframes video-float {
            0%, 100% { transform: translate(-50%, -50%) translateZ(0) rotateY(0deg); }
            25% { transform: translate(-50%, -50%) translateZ(20px) rotateY(5deg); }
            75% { transform: translate(-50%, -50%) translateZ(-20px) rotateY(-5deg); }
        }

        /* Floating DNA components */
        .floating-component {
            position: absolute;
            width: 200px;
            padding: 20px;
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.3s;
            animation: component-orbit 20s linear infinite;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        }

        @keyframes component-orbit {
            from { transform: rotateY(0deg) translateZ(300px); }
            to { transform: rotateY(360deg) translateZ(300px); }
        }

        .floating-component:hover {
            transform: scale(1.1) translateZ(350px);
            background: rgba(123, 97, 255, 0.2);
            border-color: rgba(123, 97, 255, 0.5);
            box-shadow: 0 15px 50px rgba(123, 97, 255, 0.4);
        }

        .floating-component.hook {
            left: 20%;
            top: 20%;
            animation-delay: 0s;
        }

        .floating-component.psychology {
            right: 20%;
            top: 20%;
            animation-delay: -5s;
        }

        .floating-component.timing {
            right: 20%;
            bottom: 20%;
            animation-delay: -10s;
        }

        .floating-component.audio {
            left: 20%;
            bottom: 20%;
            animation-delay: -15s;
        }

        .component-icon {
            font-size: 40px;
            margin-bottom: 10px;
        }

        .component-name {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .component-desc {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.7);
        }

        /* Connection lines */
        .connection-line {
            position: absolute;
            height: 2px;
            background: linear-gradient(90deg, transparent, #7b61ff, transparent);
            transform-origin: left center;
            animation: pulse-line 2s ease-in-out infinite;
            pointer-events: none;
        }

        @keyframes pulse-line {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
        }

        /* Floating AI insights */
        .ai-insight {
            position: absolute;
            padding: 16px 24px;
            background: rgba(123, 97, 255, 0.1);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(123, 97, 255, 0.3);
            border-radius: 16px;
            animation: insight-float 15s ease-in-out infinite;
            cursor: pointer;
            transition: all 0.3s;
        }

        @keyframes insight-float {
            0%, 100% { transform: translateY(0) translateX(0); }
            33% { transform: translateY(-20px) translateX(10px); }
            66% { transform: translateY(10px) translateX(-10px); }
        }

        .ai-insight:hover {
            transform: scale(1.05);
            background: rgba(123, 97, 255, 0.2);
            box-shadow: 0 10px 30px rgba(123, 97, 255, 0.4);
        }

        .ai-insight.insight-1 {
            left: 10%;
            top: 30%;
            animation-delay: 0s;
        }

        .ai-insight.insight-2 {
            right: 10%;
            top: 40%;
            animation-delay: -5s;
        }

        .ai-insight.insight-3 {
            left: 15%;
            bottom: 30%;
            animation-delay: -10s;
        }

        /* Viral score meter floating */
        .floating-score {
            position: absolute;
            right: 50px;
            top: 50px;
            width: 150px;
            height: 150px;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(20px);
            border: 2px solid rgba(123, 97, 255, 0.5);
            border-radius: 50%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            animation: score-float 8s ease-in-out infinite;
            box-shadow: 0 0 50px rgba(123, 97, 255, 0.3);
        }

        @keyframes score-float {
            0%, 100% { transform: translateY(0) rotateZ(0deg); }
            50% { transform: translateY(-20px) rotateZ(5deg); }
        }

        .score-value {
            font-size: 48px;
            font-weight: 700;
            background: linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .score-label {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.6);
            text-transform: uppercase;
        }

        /* Sound wave visualization */
        .sound-waves {
            position: absolute;
            bottom: 50px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 5px;
            align-items: center;
            height: 60px;
        }

        .wave-bar {
            width: 4px;
            background: linear-gradient(to top, #7b61ff 0%, #ff61a6 100%);
            border-radius: 2px;
            animation: wave-dance 1s ease-in-out infinite;
        }

        @keyframes wave-dance {
            0%, 100% { height: 20px; }
            50% { height: 60px; }
        }

        .wave-bar:nth-child(1) { animation-delay: 0s; }
        .wave-bar:nth-child(2) { animation-delay: 0.1s; }
        .wave-bar:nth-child(3) { animation-delay: 0.2s; }
        .wave-bar:nth-child(4) { animation-delay: 0.3s; }
        .wave-bar:nth-child(5) { animation-delay: 0.4s; }
        .wave-bar:nth-child(6) { animation-delay: 0.5s; }
        .wave-bar:nth-child(7) { animation-delay: 0.6s; }
        .wave-bar:nth-child(8) { animation-delay: 0.7s; }
        .wave-bar:nth-child(9) { animation-delay: 0.8s; }
        .wave-bar:nth-child(10) { animation-delay: 0.9s; }
        .wave-bar:nth-child(11) { animation-delay: 1s; }
        .wave-bar:nth-child(12) { animation-delay: 1.1s; }
        .wave-bar:nth-child(13) { animation-delay: 1.2s; }
        .wave-bar:nth-child(14) { animation-delay: 1.3s; }
        .wave-bar:nth-child(15) { animation-delay: 1.4s; }

        /* Engagement metrics stream */
        .metrics-stream {
            position: absolute;
            left: 50px;
            top: 50%;
            transform: translateY(-50%);
        }

        .metric-particle {
            position: absolute;
            padding: 8px 16px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 20px;
            font-size: 14px;
            animation: metric-flow 5s linear infinite;
            white-space: nowrap;
        }

        @keyframes metric-flow {
            from {
                transform: translateX(-100px);
                opacity: 0;
            }
            10% {
                opacity: 1;
            }
            90% {
                opacity: 1;
            }
            to {
                transform: translateX(calc(100vw + 100px));
                opacity: 0;
            }
        }

        .metric-particle:nth-child(1) { top: 0; animation-delay: 0s; }
        .metric-particle:nth-child(2) { top: 40px; animation-delay: 1s; }
        .metric-particle:nth-child(3) { top: 80px; animation-delay: 2s; }
        .metric-particle:nth-child(4) { top: 120px; animation-delay: 3s; }

        /* Exit portal */
        .exit-portal {
            position: absolute;
            left: 50px;
            top: 50px;
            width: 60px;
            height: 60px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            cursor: pointer;
            transition: all 0.3s;
            z-index: 100;
        }

        .exit-portal:hover {
            transform: scale(1.1);
            background: rgba(255, 255, 255, 0.2);
            box-shadow: 0 0 30px rgba(255, 255, 255, 0.4);
        }

        /* Create button in 3D space */
        .create-3d-btn {
            position: absolute;
            bottom: 50px;
            left: 50%;
            transform: translateX(-50%);
            padding: 20px 60px;
            background: linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%);
            color: #fff;
            border: none;
            border-radius: 60px;
            font-size: 20px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 
                0 10px 40px rgba(123, 97, 255, 0.4),
                0 20px 60px rgba(255, 97, 166, 0.3);
            z-index: 100;
        }

        .create-3d-btn:hover {
            transform: translateX(-50%) translateY(-5px);
            box-shadow: 
                0 15px 50px rgba(123, 97, 255, 0.5),
                0 25px 70px rgba(255, 97, 166, 0.4);
        }

        /* Particle background for 3D space */
        .space-particles {
            position: absolute;
            inset: 0;
            pointer-events: none;
        }

        .space-particle {
            position: absolute;
            width: 2px;
            height: 2px;
            background: #fff;
            border-radius: 50%;
            animation: space-drift 20s linear infinite;
        }

        @keyframes space-drift {
            from {
                transform: translateZ(-500px) translateY(100vh);
                opacity: 0;
            }
            10% {
                opacity: 1;
            }
            90% {
                opacity: 1;
            }
            to {
                transform: translateZ(500px) translateY(-100vh);
                opacity: 0;
            }
        }

        /* Build Progress */
        .build-progress {
            position: absolute;
            top: 30px;
            left: 50%;
            transform: translateX(-50%);
            width: 600px;
            z-index: 100;
        }

        .progress-title {
            text-align: center;
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 20px;
            background: linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .progress-bar {
            height: 8px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 20px;
        }

        .progress-fill {
            height: 100%;
            width: 0%;
            background: linear-gradient(90deg, #7b61ff 0%, #ff61a6 100%);
            transition: width 0.5s ease-out;
        }

        .progress-steps {
            display: flex;
            justify-content: space-between;
        }

        .step {
            padding: 8px 16px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            font-size: 14px;
            opacity: 0.5;
            transition: all 0.3s;
        }

        .step.active {
            opacity: 1;
            background: rgba(123, 97, 255, 0.2);
            border: 1px solid rgba(123, 97, 255, 0.5);
        }

        .step.completed {
            opacity: 1;
            background: rgba(123, 97, 255, 0.3);
            border: 1px solid rgba(123, 97, 255, 0.7);
        }

        /* Build Phone Canvas - FULL SIZE as centerpiece */
        .build-phone {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            z-index: 50;
        }

        .phone-frame {
            width: 375px;
            height: 812px;
            background: #1a1a1a;
            border-radius: 40px;
            box-shadow: 
                0 0 0 12px #222,
                0 0 0 14px #333,
                0 20px 100px rgba(0, 0, 0, 0.5),
                0 0 200px rgba(123, 97, 255, 0.3);
            overflow: hidden;
            position: relative;
        }

        .build-canvas {
            width: 100%;
            height: 100%;
            background: #0a0a0a;
            position: relative;
            overflow-y: auto;
            overflow-x: hidden;
        }

        /* Timeline Slots */
        .timeline-slot {
            position: relative;
            min-height: 150px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: stretch;
            transition: all 0.3s;
        }

        .timeline-slot.accepting {
            background: rgba(123, 97, 255, 0.15);
            border: 2px dashed rgba(123, 97, 255, 0.6);
            box-shadow: inset 0 0 30px rgba(123, 97, 255, 0.2);
        }

        .timeline-slot.filled {
            background: rgba(123, 97, 255, 0.05);
        }

        .slot-time {
            position: absolute;
            left: 10px;
            top: 10px;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.5);
            font-weight: 600;
        }

        .slot-label {
            position: absolute;
            right: 10px;
            top: 10px;
            font-size: 14px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.7);
        }

        .slot-content {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .empty-state {
            text-align: center;
            opacity: 0.5;
        }

        .empty-icon {
            font-size: 40px;
            display: block;
            margin-bottom: 10px;
        }

        .empty-text {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.6);
        }

        .slot-content.filled {
            background: linear-gradient(135deg, rgba(123, 97, 255, 0.15) 0%, rgba(255, 97, 166, 0.15) 100%);
            border-radius: 12px;
            margin: 10px;
            animation: snap-in 0.5s ease-out;
        }

        @keyframes snap-in {
            0% {
                transform: scale(1.2);
                opacity: 0;
            }
            50% {
                transform: scale(0.95);
            }
            100% {
                transform: scale(1);
                opacity: 1;
            }
        }

        /* Audio Overlay */
        .audio-overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 80px;
            background: rgba(0, 0, 0, 0.9);
            border-top: 2px solid rgba(123, 97, 255, 0.5);
            padding: 10px;
            z-index: 10;
        }

        .audio-label {
            font-size: 14px;
            margin-bottom: 5px;
        }

        .audio-waveform {
            height: 40px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
        }

        .audio-waveform.filled {
            background: linear-gradient(90deg, rgba(123, 97, 255, 0.2) 0%, rgba(255, 97, 166, 0.2) 100%);
        }

        /* Component Groups - Smaller and strategically placed */
        .component-group {
            position: absolute;
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding: 15px;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .component-group.hooks {
            left: 20px;
            top: 50%;
            transform: translateY(-50%);
            max-width: 200px;
        }

        .component-group.structure {
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            max-width: 200px;
        }

        .component-group.audio-group {
            left: 20px;
            bottom: 40px;
            max-width: 200px;
        }

        .group-label {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.5);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 6px;
        }

        /* Draggable Components - Smaller */
        .floating-component.draggable {
            cursor: grab;
            width: 170px;
            padding: 12px;
            animation: none;
            position: relative;
            transition: all 0.3s;
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
        }

        .floating-component.draggable:hover {
            transform: scale(1.05) translateX(5px);
            background: rgba(123, 97, 255, 0.1);
            border-color: rgba(123, 97, 255, 0.5);
            box-shadow: 0 8px 25px rgba(123, 97, 255, 0.3);
        }

        .floating-component.dragging {
            cursor: grabbing;
            opacity: 0.8;
            z-index: 1000;
            position: fixed !important;
        }

        .drag-indicator {
            position: absolute;
            right: -20px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 10px;
            color: rgba(255, 255, 255, 0.3);
            opacity: 0;
            transition: all 0.3s;
        }

        .floating-component:hover .drag-indicator {
            opacity: 1;
            right: -25px;
        }

        .component-icon {
            font-size: 28px;
            margin-bottom: 6px;
            display: block;
        }

        .component-name {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 4px;
        }

        .component-desc {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.6);
        }

        /* AI Guide - With NEON GREEN pulsating border */
        .ai-guide {
            position: absolute;
            bottom: 40px;
            right: 40px;
            width: 280px;
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(20px);
            border: 2px solid #00ff00;
            border-radius: 20px;
            padding: 18px;
            z-index: 100;
            box-shadow: 0 0 0 0 rgba(0, 255, 0, 0.8);
            animation: guide-pulse-green 2s ease-in-out infinite;
        }

        @keyframes guide-pulse-green {
            0% {
                box-shadow: 0 0 0 0 rgba(0, 255, 0, 0.8);
                border-color: #00ff00;
            }
            50% {
                box-shadow: 0 0 0 20px rgba(0, 255, 0, 0);
                border-color: #00ff00;
            }
            100% {
                box-shadow: 0 0 0 0 rgba(0, 255, 0, 0.8);
                border-color: #00ff00;
            }
        }

        .guide-avatar {
            font-size: 36px;
            text-align: center;
            margin-bottom: 12px;
            animation: ai-float 3s ease-in-out infinite;
        }

        @keyframes ai-float {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-8px) scale(1.05); }
        }

        .guide-message {
            font-size: 14px;
            line-height: 1.5;
            margin-bottom: 12px;
        }

        .guide-tips {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .tip {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
            display: flex;
            align-items: center;
            gap: 6px;
        }

        /* Build Actions - Bottom center */
        .build-actions {
            position: absolute;
            bottom: 40px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 16px;
            z-index: 100;
        }

        .build-btn {
            padding: 12px 24px;
            border: none;
            border-radius: 50px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }

        .preview-btn {
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .complete-btn {
            background: linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%);
            color: #fff;
            box-shadow: 0 8px 25px rgba(123, 97, 255, 0.3);
        }

        .build-btn:disabled {
            opacity: 0.3;
            cursor: not-allowed;
        }

        .build-btn:not(:disabled):hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 35px rgba(123, 97, 255, 0.4);
        }

        /* Success Overlay */
        .success-overlay {
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(20px);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }

        .success-overlay.active {
            display: flex;
        }

        .success-content {
            text-align: center;
            animation: success-appear 0.6s ease-out;
        }

        @keyframes success-appear {
            from {
                transform: scale(0.8);
                opacity: 0;
            }
            to {
                transform: scale(1);
                opacity: 1;
            }
        }

        .success-icon {
            font-size: 80px;
            margin-bottom: 20px;
            animation: success-bounce 1s ease-out;
        }

        @keyframes success-bounce {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.2); }
        }

        .final-score {
            margin: 30px 0;
        }

        .final-score-value {
            font-size: 72px;
            font-weight: 700;
            background: linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .proceed-btn {
            padding: 20px 60px;
            background: linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%);
            color: #fff;
            border: none;
            border-radius: 60px;
            font-size: 18px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s;
            margin-top: 20px;
        }

        .proceed-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 20px 40px rgba(123, 97, 255, 0.4);
        }

        /* Auth Modal Styles */
        .auth-modal {
            position: fixed;
            inset: 0;
            z-index: 3000;
            display: none;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(20px);
        }

        .auth-modal.active {
            display: flex;
        }

        .auth-overlay {
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0.8);
            animation: fade-in 0.3s ease-out;
        }

        .auth-container {
            position: relative;
            width: 480px;
            max-width: 90vw;
            max-height: 90vh;
            background: rgba(0, 0, 0, 0.95);
            backdrop-filter: blur(30px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            box-shadow: 
                0 20px 60px rgba(0, 0, 0, 0.5),
                0 0 200px rgba(123, 97, 255, 0.2);
            animation: modal-appear 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            overflow: hidden;
        }

        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes modal-appear {
            from {
                opacity: 0;
                transform: scale(0.9) translateY(20px);
            }
            to {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }

        .auth-form {
            padding: 40px;
            display: none;
        }

        .auth-form.active {
            display: block;
        }

        .auth-header {
            text-align: center;
            margin-bottom: 32px;
        }

        .auth-header h2 {
            font-size: 28px;
            font-weight: 700;
            background: linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 8px;
        }

        .auth-header p {
            color: rgba(255, 255, 255, 0.7);
            font-size: 16px;
        }

        .social-auth {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 24px;
        }

        .social-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            padding: 16px 24px;
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            color: #fff;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s;
        }

        .social-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.2);
            transform: translateY(-1px);
        }

        .social-btn.google:hover {
            border-color: rgba(255, 87, 51, 0.5);
            box-shadow: 0 0 20px rgba(255, 87, 51, 0.2);
        }

        .social-btn.tiktok:hover {
            border-color: rgba(255, 0, 80, 0.5);
            box-shadow: 0 0 20px rgba(255, 0, 80, 0.2);
        }

        .divider {
            position: relative;
            text-align: center;
            margin: 24px 0;
            color: rgba(255, 255, 255, 0.5);
            font-size: 14px;
        }

        .divider::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        }

        .divider span {
            background: rgba(0, 0, 0, 0.95);
            padding: 0 16px;
            position: relative;
            z-index: 1;
        }

        .auth-fields {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .auth-fields input[type="email"],
        .auth-fields input[type="password"] {
            padding: 16px 20px;
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            color: #fff;
            font-size: 16px;
            transition: all 0.3s;
        }

        .auth-fields input::placeholder {
            color: rgba(255, 255, 255, 0.5);
        }

        .auth-fields input:focus {
            outline: none;
            border-color: rgba(123, 97, 255, 0.5);
            box-shadow: 0 0 20px rgba(123, 97, 255, 0.2);
        }

        .checkbox-container {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            font-size: 14px;
            color: rgba(255, 255, 255, 0.7);
            cursor: pointer;
            line-height: 1.4;
        }

        .checkbox-container input[type="checkbox"] {
            display: none;
        }

        .checkmark {
            width: 20px;
            height: 20px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
            flex-shrink: 0;
            margin-top: 2px;
        }

        .checkbox-container input[type="checkbox"]:checked + .checkmark {
            background: linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%);
            border-color: transparent;
        }

        .checkbox-container input[type="checkbox"]:checked + .checkmark::after {
            content: '✓';
            color: #fff;
            font-size: 12px;
            font-weight: 600;
        }

        .checkbox-container a {
            color: #7b61ff;
            text-decoration: none;
        }

        .checkbox-container a:hover {
            text-decoration: underline;
        }

        .form-extras {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 12px;
        }

        .forgot-link {
            color: #7b61ff;
            text-decoration: none;
            font-size: 14px;
        }

        .forgot-link:hover {
            text-decoration: underline;
        }

        .auth-submit {
            padding: 18px 24px;
            background: linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%);
            border: none;
            border-radius: 12px;
            color: #fff;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            margin-top: 8px;
            box-shadow: 0 4px 20px rgba(123, 97, 255, 0.4);
        }

        .auth-submit:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 30px rgba(123, 97, 255, 0.5);
        }

        .auth-switch {
            text-align: center;
            margin-top: 24px;
            color: rgba(255, 255, 255, 0.7);
            font-size: 14px;
        }

        .auth-switch button {
            background: none;
            border: none;
            color: #7b61ff;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            text-decoration: underline;
        }

        .auth-switch button:hover {
            color: #ff61a6;
        }

        .auth-close {
            position: absolute;
            top: 20px;
            right: 20px;
            width: 40px;
            height: 40px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            color: #fff;
            font-size: 20px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
        }

        .auth-close:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: scale(1.05);
        }

        /* Hide scrollbar */
        ::-webkit-scrollbar {
            display: none;
        }

        .hidden {
            display: none !important;
        }
    </style>
</head>
<body>
    <!-- Animated starfield background -->
    <div class="starfield" id="starfield"></div>
    
    <!-- Rotating background effect -->
    <div class="rotating-bg"></div>

    <!-- Original Feed Container -->
    <div class="feed-container" id="feedContainer">
        <!-- DNA Visualization on left -->
        <div class="viral-dna-viz">
            <div class="dna-strand">
                <div class="dna-node">HOOK</div>
                <div class="dna-node">STORY</div>
                <div class="dna-node">EMOTION</div>
                <div class="dna-node">CTA</div>
            </div>
        </div>

        <!-- Template slides -->
        <div class="template-slide active" data-index="0">
            <!-- Phone mockup with lighting effect -->
            <div class="phone-container" id="phoneContainer">
                <div class="lighting-effect"></div>
                <div class="video-container">
                    <!-- Video preview -->
                    <div class="video-preview" id="videoPreview" style="background: linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%);">
                        <div class="video-icon">🎬</div>
                    </div>

                    <!-- Template overlay -->
                    <div class="template-overlay">
                        <div class="template-header">
                            <div class="viral-badge">
                                <span>🔥</span>
                                <span>Trending Now</span>
                            </div>
                            <h2 class="template-name">Transformation Reveal</h2>
                            <p class="template-description">The before/after format that's generating millions of views with perfect psychological triggers</p>
                        </div>

                        <div class="template-metrics">
                            <div class="metric">
                                <span class="metric-value">12.4M</span>
                                <span class="metric-label">Views</span>
                            </div>
                            <div class="metric">
                                <span class="metric-value">2.1M</span>
                                <span class="metric-label">Likes</span>
                            </div>
                            <div class="metric">
                                <span class="metric-value">94%</span>
                                <span class="metric-label">Viral Score</span>
                            </div>
                        </div>

                        <div class="template-actions">
                            <button class="action-btn primary" id="signUpBtn">
                                <span>Sign Up ✨</span>
                            </button>
                            <button class="action-btn secondary" id="signInBtn">
                                <span>Sign In</span>
                            </button>
                        </div>
                    </div>

                    <!-- Side actions -->
                    <div class="side-actions">
                        <div class="side-action">
                            <span>❤️</span>
                        </div>
                        <div class="side-action">
                            <span>🎵</span>
                        </div>
                        <div class="side-action">
                            <span>📊</span>
                        </div>
                        <div class="side-action">
                            <span>🔗</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

            <!-- Login/Signup Modal -->
            <div class="auth-modal" id="authModal">
                <div class="auth-overlay" id="authOverlay"></div>
                <div class="auth-container" id="authContainer">
                    <div class="auth-form signup-form active" id="signupForm">
                        <div class="auth-header">
                            <h2>Join the Viral Revolution</h2>
                            <p>Create videos that break the internet</p>
                        </div>
                        
                        <div class="social-auth">
                            <button class="social-btn google">
                                <span>🔍</span>
                                <span>Continue with Google</span>
                            </button>
                            <button class="social-btn tiktok">
                                <span>🎵</span>
                                <span>Continue with TikTok</span>
                            </button>
                        </div>
                        
                        <div class="divider">
                            <span>or</span>
                        </div>
                        
                        <form class="auth-fields">
                            <input type="email" placeholder="Email address" required>
                            <input type="password" placeholder="Create password" required>
                            <input type="password" placeholder="Confirm password" required>
                            
                            <label class="checkbox-container">
                                <input type="checkbox" required>
                                <span class="checkmark"></span>
                                I agree to the <a href="#">Terms</a> and <a href="#">Privacy Policy</a>
                            </label>
                            
                            <button type="submit" class="auth-submit">
                                <span>Create Account ✨</span>
                            </button>
                        </form>
                        
                        <div class="auth-switch">
                            Already have an account? 
                            <button type="button" id="switchToSignIn">Sign In</button>
                        </div>
                    </div>
                    
                    <div class="auth-form signin-form" id="signinForm">
                        <div class="auth-header">
                            <h2>Welcome Back</h2>
                            <p>Continue creating viral content</p>
                        </div>
                        
                        <div class="social-auth">
                            <button class="social-btn google">
                                <span>🔍</span>
                                <span>Continue with Google</span>
                            </button>
                            <button class="social-btn tiktok">
                                <span>🎵</span>
                                <span>Continue with TikTok</span>
                            </button>
                        </div>
                        
                        <div class="divider">
                            <span>or</span>
                        </div>
                        
                        <form class="auth-fields">
                            <input type="email" placeholder="Email address" required>
                            <input type="password" placeholder="Password" required>
                            
                            <div class="form-extras">
                                <label class="checkbox-container">
                                    <input type="checkbox">
                                    <span class="checkmark"></span>
                                    Remember me
                                </label>
                                <a href="#" class="forgot-link">Forgot password?</a>
                            </div>
                            
                            <button type="submit" class="auth-submit">
                                <span>Sign In</span>
                            </button>
                        </form>
                        
                        <div class="auth-switch">
                            Don't have an account? 
                            <button type="button" id="switchToSignUp">Sign Up</button>
                        </div>
                    </div>
                    
                    <button class="auth-close" id="authClose">×</button>
                </div>
            </div>
        <div class="nav-hint top">
            <span class="swipe-icon">👆</span>
            <span>Swipe up for next</span>
        </div>
        <div class="nav-hint bottom">
            <span class="swipe-icon">👇</span>
            <span>Swipe down for previous</span>
        </div>
    </div>

    <!-- DNA Tunnel -->
    <div class="dna-tunnel" id="dnaTunnel">
        <div class="tunnel-container">
            <!-- Tunnel rings -->
            <div class="tunnel-ring" style="animation-delay: 0s;"></div>
            <div class="tunnel-ring" style="animation-delay: 0.4s;"></div>
            <div class="tunnel-ring" style="animation-delay: 0.8s;"></div>
            <div class="tunnel-ring" style="animation-delay: 1.2s;"></div>
            <div class="tunnel-ring" style="animation-delay: 1.6s;"></div>
            
            <!-- Flying elements -->
            <div class="tunnel-element" style="left: 20%; top: 30%; animation-delay: 0.5s;">Perfect Hook</div>
            <div class="tunnel-element" style="right: 25%; top: 40%; animation-delay: 1s;">Psychology</div>
            <div class="tunnel-element" style="left: 30%; bottom: 35%; animation-delay: 1.5s;">Viral DNA</div>
            <div class="tunnel-element" style="right: 20%; bottom: 40%; animation-delay: 2s;">Trending Audio</div>
            <div class="tunnel-element" style="left: 50%; top: 50%; animation-delay: 2.5s; transform: translate(-50%, -50%);">Creating Magic...</div>
        </div>
    </div>

    <!-- 3D Immersive DNA Analysis View - Assembly System -->
    <div class="dna-analysis-view" id="dnaAnalysisView">
        <div class="immersive-space">
            <!-- Space particles background -->
            <div class="space-particles" id="spaceParticles"></div>

            <!-- Build Progress Indicator -->
            <div class="build-progress">
                <div class="progress-title">Building Your Viral Video</div>
                <div class="progress-bar">
                    <div class="progress-fill" id="progressFill"></div>
                </div>
                <div class="progress-steps">
                    <div class="step active" data-step="hook">Hook</div>
                    <div class="step" data-step="problem">Problem</div>
                    <div class="step" data-step="value">Value</div>
                    <div class="step" data-step="cta">CTA</div>
                    <div class="step" data-step="audio">Audio</div>
                </div>
            </div>

            <!-- Central phone as build canvas -->
            <div class="build-phone">
                <div class="phone-frame">
                    <div class="build-canvas" id="buildCanvas">
                        <!-- Timeline slots -->
                        <div class="timeline-slot" data-slot="hook" data-duration="0-3s">
                            <div class="slot-time">0-3s</div>
                            <div class="slot-label">Hook</div>
                            <div class="slot-content empty">
                                <div class="empty-state">
                                    <span class="empty-icon">🎯</span>
                                    <span class="empty-text">Drag hook here</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="timeline-slot" data-slot="problem" data-duration="3-10s">
                            <div class="slot-time">3-10s</div>
                            <div class="slot-label">Problem/Setup</div>
                            <div class="slot-content empty">
                                <div class="empty-state">
                                    <span class="empty-icon">❓</span>
                                    <span class="empty-text">Add problem</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="timeline-slot" data-slot="value" data-duration="10-20s">
                            <div class="slot-time">10-20s</div>
                            <div class="slot-label">Value/Transform</div>
                            <div class="slot-content empty">
                                <div class="empty-state">
                                    <span class="empty-icon">✨</span>
                                    <span class="empty-text">Add value</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="timeline-slot" data-slot="cta" data-duration="20-30s">
                            <div class="slot-time">20-30s</div>
                            <div class="slot-label">Call to Action</div>
                            <div class="slot-content empty">
                                <div class="empty-state">
                                    <span class="empty-icon">👆</span>
                                    <span class="empty-text">Add CTA</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Audio overlay -->
                        <div class="audio-overlay" data-slot="audio">
                            <div class="audio-label">🎵 Audio Track</div>
                            <div class="audio-waveform empty">
                                <span class="empty-text">Add trending audio</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Floating DNA components - Now draggable -->
            <div class="component-group hooks">
                <div class="group-label">Hook Options</div>
                <div class="floating-component draggable" data-component="hook" data-type="visual">
                    <div class="component-icon">👁️</div>
                    <div class="component-name">Visual Hook</div>
                    <div class="component-desc">Instant eye-catch</div>
                    <div class="drag-indicator">Drag to timeline →</div>
                </div>
                <div class="floating-component draggable" data-component="hook" data-type="verbal">
                    <div class="component-icon">🗣️</div>
                    <div class="component-name">Verbal Hook</div>
                    <div class="component-desc">Compelling opening</div>
                    <div class="drag-indicator">Drag to timeline →</div>
                </div>
                <div class="floating-component draggable" data-component="hook" data-type="text">
                    <div class="component-icon">📝</div>
                    <div class="component-name">Text Hook</div>
                    <div class="component-desc">Bold statement</div>
                    <div class="drag-indicator">Drag to timeline →</div>
                </div>
            </div>

            <div class="component-group structure">
                <div class="group-label">Structure Elements</div>
                <div class="floating-component draggable" data-component="problem" data-type="relatable">
                    <div class="component-icon">😫</div>
                    <div class="component-name">Relatable Problem</div>
                    <div class="component-desc">Pain point setup</div>
                    <div class="drag-indicator">Drag to timeline →</div>
                </div>
                <div class="floating-component draggable" data-component="value" data-type="transformation">
                    <div class="component-icon">🦋</div>
                    <div class="component-name">Transformation</div>
                    <div class="component-desc">Before → After</div>
                    <div class="drag-indicator">Drag to timeline →</div>
                </div>
                <div class="floating-component draggable" data-component="cta" data-type="follow">
                    <div class="component-icon">➕</div>
                    <div class="component-name">Follow CTA</div>
                    <div class="component-desc">Build audience</div>
                    <div class="drag-indicator">Drag to timeline →</div>
                </div>
            </div>

            <div class="component-group audio-group">
                <div class="group-label">Trending Audio</div>
                <div class="floating-component draggable" data-component="audio" data-type="trending1">
                    <div class="component-icon">🎵</div>
                    <div class="component-name">Trending Beat #1</div>
                    <div class="component-desc">2.4M uses this week</div>
                    <div class="drag-indicator">Drag to overlay →</div>
                </div>
            </div>

            <!-- AI Assistant Guide -->
            <div class="ai-guide expanded" id="aiGuide">
                <div class="guide-avatar">🤖</div>
                <div class="guide-content">
                    <div class="guide-message" id="guideMessage">
                        Start by selecting a hook - this is the most important part! Drag one of the hook options to the first slot.
                    </div>
                    <div class="guide-tips">
                        <div class="tip">💡 Triple hooks work best</div>
                        <div class="tip">⚡ 0.5s to grab attention</div>
                    </div>
                </div>
            </div>

            <!-- Real-time viral score -->
            <div class="floating-score building hidden" id="floatingScore">
                <div class="score-value" id="buildScore">0%</div>
                <div class="score-label">Viral Score</div>
            </div>

            <!-- Exit portal -->
            <div class="exit-portal" id="exitPortal">←</div>

            <!-- Action buttons -->
            <div class="build-actions">
                <button class="build-btn preview-btn" id="previewBtn" disabled>
                    <span>Preview</span>
                </button>
                <button class="build-btn complete-btn" id="completeBtn" disabled>
                    <span>Complete Build ✨</span>
                </button>
            </div>

            <!-- Success overlay -->
            <div class="success-overlay" id="successOverlay">
                <div class="success-content">
                    <div class="success-icon">🎉</div>
                    <h2>Video Structure Complete!</h2>
                    <p>Your viral video is ready to create</p>
                    <div class="final-score">
                        <div class="final-score-value">94%</div>
                        <div class="final-score-label">Viral Potential</div>
                    </div>
                    <button class="proceed-btn">Proceed to Creation Studio →</button>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Template data
        const templates = [
            {
                name: 'Transformation Reveal',
                description: 'The before/after format that\'s generating millions of views with perfect psychological triggers',
                views: '12.4M',
                likes: '2.1M',
                score: '94%',
                gradient: 'linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%)',
                icon: '🎬'
            },
            {
                name: '5 Things List',
                description: 'Countdown format with progressive reveals that keeps viewers hooked until the end',
                views: '8.7M',
                likes: '1.4M',
                score: '89%',
                gradient: 'linear-gradient(135deg, #ff61a6 0%, #7b61ff 100%)',
                icon: '📝'
            },
            {
                name: 'POV Experience',
                description: 'First-person storytelling that creates instant emotional connection with viewers',
                views: '15.2M',
                likes: '3.7M',
                score: '97%',
                gradient: 'linear-gradient(135deg, #ffd93d 0%, #ff6bcb 100%)',
                icon: '👁️'
            }
        ];

        let currentIndex = 0;
        let isTransitioning = false;

        // Create starfield
        function createStarfield() {
            const starfield = document.getElementById('starfield');
            for (let i = 0; i < 100; i++) {
                const star = document.createElement('div');
                star.className = 'star';
                star.style.left = Math.random() * 100 + '%';
                star.style.top = Math.random() * 100 + '%';
                star.style.animationDelay = Math.random() * 3 + 's';
                starfield.appendChild(star);
            }
        }

        // Create space particles for 3D view
        function createSpaceParticles() {
            const container = document.getElementById('spaceParticles');
            for (let i = 0; i < 50; i++) {
                const particle = document.createElement('div');
                particle.className = 'space-particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.animationDelay = Math.random() * 20 + 's';
                container.appendChild(particle);
            }
        }

        // Swipe handling
        let startY = 0;
        let currentY = 0;
        let isDragging = false;

        const container = document.querySelector('.feed-container');
        
        container.addEventListener('mousedown', handleStart);
        container.addEventListener('touchstart', handleStart);
        container.addEventListener('mousemove', handleMove);
        container.addEventListener('touchmove', handleMove);
        container.addEventListener('mouseup', handleEnd);
        container.addEventListener('touchend', handleEnd);
        container.addEventListener('mouseleave', handleEnd);

        function handleStart(e) {
            if (isTransitioning) return;
            isDragging = true;
            startY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
        }

        function handleMove(e) {
            if (!isDragging || isTransitioning) return;
            
            currentY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
            const diff = startY - currentY;
            const activeSlide = document.querySelector('.template-slide.active');
            
            if (Math.abs(diff) > 10) {
                activeSlide.style.transform = `translateY(${-diff * 0.3}px)`;
                activeSlide.style.opacity = 1 - Math.abs(diff) / 500;
            }
        }

        function handleEnd(e) {
            if (!isDragging || isTransitioning) return;
            isDragging = false;
            
            const diff = startY - currentY;
            const activeSlide = document.querySelector('.template-slide.active');
            
            activeSlide.style.transform = '';
            activeSlide.style.opacity = '';
            
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    navigateTemplate(1);
                } else {
                    navigateTemplate(-1);
                }
            }
            
            currentY = 0;
        }

        // Navigation
        function navigateTemplate(direction) {
            isTransitioning = true;
            
            currentIndex = (currentIndex + direction + templates.length) % templates.length;
            const template = templates[currentIndex];
            
            // Update template content
            updateTemplateContent(template);
            
            setTimeout(() => {
                isTransitioning = false;
            }, 500);
        }

        function updateTemplateContent(template) {
            const videoPreview = document.getElementById('videoPreview');
            videoPreview.style.background = template.gradient;
            videoPreview.querySelector('.video-icon').textContent = template.icon;
            
            document.querySelector('.template-name').textContent = template.name;
            document.querySelector('.template-description').textContent = template.description;
            
            const metrics = document.querySelectorAll('.metric-value');
            metrics[0].textContent = template.views;
            metrics[1].textContent = template.likes;
            metrics[2].textContent = template.score;
        }

        // Portal dive animation
        function initiatePortalDive() {
            const phoneContainer = document.getElementById('phoneContainer');
            const feedContainer = document.getElementById('feedContainer');
            const dnaTunnel = document.getElementById('dnaTunnel');
            const dnaAnalysisView = document.getElementById('dnaAnalysisView');

            const phoneRect = phoneContainer.getBoundingClientRect();
            const phoneCenterX = phoneRect.left + phoneRect.width / 2;
            const phoneCenterY = phoneRect.top + phoneRect.height / 2;

            // Create expanding portal
            const portal = document.createElement('div');
            portal.style.cssText = `
                position: fixed;
                width: 10px;
                height: 10px;
                background: radial-gradient(circle, rgba(123, 97, 255, 0.8) 0%, transparent 70%);
                border-radius: 50%;
                left: ${phoneCenterX}px;
                top: ${phoneCenterY}px;
                transform: translate(-50%, -50%);
                z-index: 999;
                pointer-events: none;
            `;
            document.body.appendChild(portal);

            requestAnimationFrame(() => {
                portal.style.transition = 'all 1s cubic-bezier(0.4, 0, 0.2, 1)';
                portal.style.width = '3000px';
                portal.style.height = '3000px';
                portal.style.opacity = '0';
            });

            setTimeout(() => {
                feedContainer.classList.add('diving');
                phoneContainer.classList.add('zooming');
            }, 100);

            setTimeout(() => {
                dnaTunnel.classList.add('active');
                createParticleExplosion(phoneCenterX, phoneCenterY);
            }, 600);

            setTimeout(() => {
                dnaTunnel.classList.remove('active');
                dnaAnalysisView.classList.add('active');
                feedContainer.style.display = 'none';
                portal.remove();
                initializeAssemblySystem();
            }, 4000);
        }

        // Particle explosion
        function createParticleExplosion(x, y) {
            for (let i = 0; i < 30; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                
                const angle = (Math.PI * 2 * i) / 30;
                const velocity = 100 + Math.random() * 200;
                const offsetX = Math.cos(angle) * velocity;
                const offsetY = Math.sin(angle) * velocity;
                
                particle.style.cssText = `
                    position: fixed;
                    left: ${x}px;
                    top: ${y}px;
                    width: ${4 + Math.random() * 8}px;
                    height: ${4 + Math.random() * 8}px;
                    background: ${Math.random() > 0.5 ? '#7b61ff' : '#ff61a6'};
                    border-radius: 50%;
                    animation: particle-float 4s ease-out forwards;
                    --x: ${offsetX}px;
                    --y: ${offsetY}px;
                    pointer-events: none;
                    z-index: 1001;
                `;
                
                document.body.appendChild(particle);
                setTimeout(() => particle.remove(), 4000);
            }
        }

        // Initialize Assembly System
        function initializeAssemblySystem() {
            const draggables = document.querySelectorAll('.draggable');
            const slots = document.querySelectorAll('.timeline-slot');
            const audioOverlay = document.querySelector('.audio-overlay');
            const progressFill = document.getElementById('progressFill');
            const buildScore = document.getElementById('buildScore');
            const guideMessage = document.getElementById('guideMessage');
            const floatingScore = document.getElementById('floatingScore');
            
            // Show score panel
            floatingScore.classList.remove('hidden');
            
            let filledSlots = {
                hook: false,
                problem: false,
                value: false,
                cta: false,
                audio: false
            };
            
            let currentScore = 0;
            
            // Make components draggable
            draggables.forEach(draggable => {
                draggable.addEventListener('mousedown', handleDragStart);
                draggable.addEventListener('touchstart', handleDragStart);
            });
            
            function handleDragStart(e) {
                const component = e.currentTarget;
                const componentType = component.dataset.component;
                
                // Clone for dragging
                const dragClone = component.cloneNode(true);
                dragClone.classList.add('dragging');
                document.body.appendChild(dragClone);
                
                // Position at cursor
                const moveAt = (pageX, pageY) => {
                    dragClone.style.left = pageX - dragClone.offsetWidth / 2 + 'px';
                    dragClone.style.top = pageY - dragClone.offsetHeight / 2 + 'px';
                };
                
                const initialX = e.type.includes('touch') ? e.touches[0].pageX : e.pageX;
                const initialY = e.type.includes('touch') ? e.touches[0].pageY : e.pageY;
                moveAt(initialX, initialY);
                
                // Highlight valid slots
                if (componentType === 'audio') {
                    audioOverlay.classList.add('accepting');
                } else {
                    slots.forEach(slot => {
                        if (slot.dataset.slot === componentType) {
                            slot.classList.add('accepting');
                        }
                    });
                }
                
                function handleDragMove(e) {
                    const pageX = e.type.includes('touch') ? e.touches[0].pageX : e.pageX;
                    const pageY = e.type.includes('touch') ? e.touches[0].pageY : e.pageY;
                    moveAt(pageX, pageY);
                }
                
                function handleDragEnd(e) {
                    const pageX = e.type.includes('touch') ? e.changedTouches[0].pageX : e.pageX;
                    const pageY = e.type.includes('touch') ? e.changedTouches[0].pageY : e.pageY;
                    
                    dragClone.style.pointerEvents = 'none';
                    const elementBelow = document.elementFromPoint(pageX, pageY);
                    
                    if (elementBelow) {
                        const slot = elementBelow.closest('.timeline-slot');
                        const audio = elementBelow.closest('.audio-overlay');
                        
                        if (slot && slot.dataset.slot === componentType && !filledSlots[componentType]) {
                            // Snap component into slot
                            fillSlot(slot, component, componentType);
                        } else if (audio && componentType === 'audio' && !filledSlots.audio) {
                            // Fill audio slot
                            fillAudioSlot(component);
                        }
                    }
                    
                    // Clean up
                    dragClone.remove();
                    slots.forEach(s => {
                        s.classList.remove('accepting');
                        s.style.transform = '';
                    });
                    audioOverlay.classList.remove('accepting');
                    audioOverlay.style.transform = '';
                    
                    document.removeEventListener('mousemove', handleDragMove);
                    document.removeEventListener('touchmove', handleDragMove);
                    document.removeEventListener('mouseup', handleDragEnd);
                    document.removeEventListener('touchend', handleDragEnd);
                }
                
                document.addEventListener('mousemove', handleDragMove);
                document.addEventListener('touchmove', handleDragMove);
                document.addEventListener('mouseup', handleDragEnd);
                document.addEventListener('touchend', handleDragEnd);
            }
            
            function fillSlot(slot, component, type) {
                const slotContent = slot.querySelector('.slot-content');
                slotContent.classList.remove('empty');
                slotContent.classList.add('filled');
                
                // Add component info to slot
                slotContent.innerHTML = `
                    <div style="text-align: center;">
                        <div style="font-size: 40px; margin-bottom: 10px;">${component.querySelector('.component-icon').textContent}</div>
                        <div style="font-size: 16px; font-weight: 600;">${component.querySelector('.component-name').textContent}</div>
                        <div style="font-size: 14px; color: rgba(255, 255, 255, 0.6); margin-top: 5px;">${component.querySelector('.component-desc').textContent}</div>
                    </div>
                `;
                
                slot.classList.add('filled');
                filledSlots[type] = true;
                
                // Disable the used component
                component.style.opacity = '0.3';
                component.style.pointerEvents = 'none';
                
                updateProgress();
                updateScore(type);
                updateGuide();
            }
            
            function fillAudioSlot(component) {
                const waveform = document.querySelector('.audio-waveform');
                waveform.classList.remove('empty');
                waveform.classList.add('filled');
                waveform.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 24px;">🎵</span>
                        <span>${component.querySelector('.component-name').textContent}</span>
                    </div>
                `;
                
                filledSlots.audio = true;
                component.style.opacity = '0.3';
                component.style.pointerEvents = 'none';
                
                updateProgress();
                updateScore('audio');
                updateGuide();
            }
            
            function updateProgress() {
                const filled = Object.values(filledSlots).filter(v => v).length;
                const total = Object.keys(filledSlots).length;
                const percentage = (filled / total) * 100;
                
                progressFill.style.width = percentage + '%';
                
                // Update step indicators
                document.querySelectorAll('.step').forEach(step => {
                    const stepType = step.dataset.step;
                    if (filledSlots[stepType]) {
                        step.classList.add('completed');
                        step.classList.remove('active');
                    }
                });
                
                // Enable complete button when all filled
                if (filled === total) {
                    document.getElementById('completeBtn').disabled = false;
                    document.getElementById('previewBtn').disabled = false;
                }
            }
            
            function updateScore(type) {
                const scoreMap = {
                    hook: 30,
                    problem: 15,
                    value: 20,
                    cta: 15,
                    audio: 20
                };
                
                currentScore += scoreMap[type];
                
                // Animate score update
                const scoreElement = buildScore;
                const targetScore = currentScore;
                let displayScore = parseInt(scoreElement.textContent) || 0;
                
                const scoreInterval = setInterval(() => {
                    if (displayScore < targetScore) {
                        displayScore += 2;
                        if (displayScore > targetScore) displayScore = targetScore;
                        scoreElement.textContent = displayScore + '%';
                    } else {
                        clearInterval(scoreInterval);
                    }
                }, 20);
            }
            
            function updateGuide() {
                const messages = {
                    hook: "Great hook! Now add the problem or setup to create tension.",
                    problem: "Perfect! Add the value proposition or transformation next.",
                    value: "Excellent! Now add a clear call-to-action.",
                    cta: "Almost there! Add trending audio to maximize reach.",
                    audio: "🎉 Fantastic! Your viral structure is complete!"
                };
                
                // Find next empty slot
                const nextEmpty = Object.keys(filledSlots).find(key => !filledSlots[key]);
                if (nextEmpty && messages[nextEmpty]) {
                    guideMessage.textContent = messages[nextEmpty];
                } else if (!nextEmpty) {
                    guideMessage.textContent = messages.audio;
                }
            }
            
            // Complete button handler
            const completeBtn = document.getElementById('completeBtn');
            if (completeBtn) {
                completeBtn.addEventListener('click', () => {
                    const successOverlay = document.getElementById('successOverlay');
                    if (successOverlay) {
                        successOverlay.classList.add('active');
                    }
                    
                    // Celebration particles
                    createCelebrationParticles();
                });
            }
            
            function createCelebrationParticles() {
                for (let i = 0; i < 50; i++) {
                    const particle = document.createElement('div');
                    particle.style.cssText = `
                        position: fixed;
                        width: 10px;
                        height: 10px;
                        background: ${Math.random() > 0.5 ? '#7b61ff' : '#ff61a6'};
                        border-radius: 50%;
                        left: 50%;
                        top: 50%;
                        pointer-events: none;
                        z-index: 2000;
                    `;
                    
                    const angle = (Math.PI * 2 * i) / 50;
                    const velocity = 200 + Math.random() * 300;
                    const vx = Math.cos(angle) * velocity;
                    const vy = Math.sin(angle) * velocity;
                    
                    document.body.appendChild(particle);
                    
                    let x = 0, y = 0;
                    const animateParticle = () => {
                        x += vx * 0.02;
                        y += vy * 0.02;
                        y += 2; // gravity
                        
                        particle.style.transform = `translate(${x}px, ${y}px)`;
                        particle.style.opacity = 1 - (Math.abs(x) + Math.abs(y)) / 500;
                        
                        if (Math.abs(x) < 500 && Math.abs(y) < 500) {
                            requestAnimationFrame(animateParticle);
                        } else {
                            particle.remove();
                        }
                    };
                    
                    requestAnimationFrame(animateParticle);
                }
            }
        }

        // Return to feed
        function returnToFeed() {
            const dnaAnalysisView = document.getElementById('dnaAnalysisView');
            const feedContainer = document.getElementById('feedContainer');
            const phoneContainer = document.getElementById('phoneContainer');

            dnaAnalysisView.classList.remove('active');
            
            setTimeout(() => {
                feedContainer.style.display = 'flex';
                feedContainer.classList.remove('diving');
                phoneContainer.classList.remove('zooming');
            }, 100);
        }

        // Event listeners
        const signUpBtn = document.getElementById('signUpBtn');
        const signInBtn = document.getElementById('signInBtn');
        const authModal = document.getElementById('authModal');
        const authOverlay = document.getElementById('authOverlay');
        const authClose = document.getElementById('authClose');
        const switchToSignIn = document.getElementById('switchToSignIn');
        const switchToSignUp = document.getElementById('switchToSignUp');
        const signupForm = document.getElementById('signupForm');
        const signinForm = document.getElementById('signinForm');
        const exitPortal = document.getElementById('exitPortal');
        
        // Show signup modal
        if (signUpBtn) {
            signUpBtn.addEventListener('click', () => {
                showAuthModal('signup');
            });
        }
        
        // Show signin modal
        if (signInBtn) {
            signInBtn.addEventListener('click', () => {
                showAuthModal('signin');
            });
        }
        
        // Close modal handlers
        if (authClose) {
            authClose.addEventListener('click', closeAuthModal);
        }
        
        if (authOverlay) {
            authOverlay.addEventListener('click', closeAuthModal);
        }
        
        // Form switching
        if (switchToSignIn) {
            switchToSignIn.addEventListener('click', () => {
                switchAuthForm('signin');
            });
        }
        
        if (switchToSignUp) {
            switchToSignUp.addEventListener('click', () => {
                switchAuthForm('signup');
            });
        }
        
        // Form submissions
        document.querySelectorAll('.auth-fields').forEach(form => {
            form.addEventListener('submit', handleAuthSubmit);
        });
        
        function showAuthModal(type = 'signup') {
            authModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            switchAuthForm(type);
        }
        
        function closeAuthModal() {
            authModal.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        function switchAuthForm(type) {
            if (type === 'signup') {
                signupForm.classList.add('active');
                signinForm.classList.remove('active');
            } else {
                signinForm.classList.add('active');
                signupForm.classList.remove('active');
            }
        }
        
        function handleAuthSubmit(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(e.target);
            const email = formData.get('email') || e.target.querySelector('input[type="email"]').value;
            const password = e.target.querySelector('input[type="password"]').value;
            
            // Simulate authentication
            const submitBtn = e.target.querySelector('.auth-submit');
            const originalText = submitBtn.textContent;
            
            submitBtn.textContent = 'Processing...';
            submitBtn.disabled = true;
            
            setTimeout(() => {
                // Close modal and trigger portal dive to app
                closeAuthModal();
                initiateAppEntrance();
            }, 2000);
        }
        
        function initiateAppEntrance() {
            // Use the existing portal dive animation but redirect to app
            const phoneContainer = document.getElementById('phoneContainer');
            const feedContainer = document.getElementById('feedContainer');
            const dnaTunnel = document.getElementById('dnaTunnel');

            const phoneRect = phoneContainer.getBoundingClientRect();
            const phoneCenterX = phoneRect.left + phoneRect.width / 2;
            const phoneCenterY = phoneRect.top + phoneRect.height / 2;

            // Create expanding portal
            const portal = document.createElement('div');
            portal.style.cssText = `
                position: fixed;
                width: 10px;
                height: 10px;
                background: radial-gradient(circle, rgba(123, 97, 255, 0.8) 0%, transparent 70%);
                border-radius: 50%;
                left: ${phoneCenterX}px;
                top: ${phoneCenterY}px;
                transform: translate(-50%, -50%);
                z-index: 999;
                pointer-events: none;
            `;
            document.body.appendChild(portal);

            requestAnimationFrame(() => {
                portal.style.transition = 'all 1s cubic-bezier(0.4, 0, 0.2, 1)';
                portal.style.width = '3000px';
                portal.style.height = '3000px';
                portal.style.opacity = '0';
            });

            setTimeout(() => {
                feedContainer.classList.add('diving');
                phoneContainer.classList.add('zooming');
            }, 100);

            setTimeout(() => {
                dnaTunnel.classList.add('active');
                createParticleExplosion(phoneCenterX, phoneCenterY);
            }, 600);

            setTimeout(() => {
                // Here you would redirect to your template editor
                // window.location.href = '/template-editor';
                
                // For demo purposes, show success message
                showWelcomeMessage();
                portal.remove();
            }, 4000);
        }
        
        function showWelcomeMessage() {
            const welcomeDiv = document.createElement('div');
            welcomeDiv.style.cssText = `
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.95);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 4000;
                animation: fade-in 0.5s ease-out;
            `;
            
            welcomeDiv.innerHTML = `
                <div style="text-align: center; animation: modal-appear 0.6s ease-out;">
                    <div style="font-size: 80px; margin-bottom: 20px;">🎉</div>
                    <h2 style="font-size: 36px; font-weight: 700; background: linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 16px;">Welcome to Viral DNA!</h2>
                    <p style="font-size: 18px; color: rgba(255, 255, 255, 0.7); margin-bottom: 40px;">Redirecting to your template editor...</p>
                    <div style="width: 200px; height: 4px; background: rgba(255, 255, 255, 0.1); border-radius: 2px; margin: 0 auto; overflow: hidden;">
                        <div style="width: 100%; height: 100%; background: linear-gradient(90deg, #7b61ff 0%, #ff61a6 100%); animation: loading-bar 3s ease-out;"></div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(welcomeDiv);
            
            // Add loading animation
            const loadingStyle = document.createElement('style');
            loadingStyle.textContent = `
                @keyframes loading-bar {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(0); }
                }
            `;
            document.head.appendChild(loadingStyle);
            
            setTimeout(() => {
                welcomeDiv.remove();
                loadingStyle.remove();
                // Reset the landing page
                resetLandingPage();
            }, 3500);
        }
        
        function resetLandingPage() {
            const feedContainer = document.getElementById('feedContainer');
            const phoneContainer = document.getElementById('phoneContainer');
            const dnaTunnel = document.getElementById('dnaTunnel');
            
            dnaTunnel.classList.remove('active');
            feedContainer.style.display = 'flex';
            feedContainer.classList.remove('diving');
            phoneContainer.classList.remove('zooming');
        }
        
        // Keep existing exit portal functionality for demo purposes
        if (exitPortal) {
            exitPortal.addEventListener('click', returnToFeed);
        }
        
        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && authModal.classList.contains('active')) {
                closeAuthModal();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (isTransitioning) return;
            
            if (e.key === 'ArrowUp') {
                navigateTemplate(-1);
            } else if (e.key === 'ArrowDown') {
                navigateTemplate(1);
            }
        });

        // Mouse wheel support
        let wheelTimeout;
        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            if (isTransitioning) return;
            
            clearTimeout(wheelTimeout);
            wheelTimeout = setTimeout(() => {
                if (e.deltaY > 50) {
                    navigateTemplate(1);
                } else if (e.deltaY < -50) {
                    navigateTemplate(-1);
                }
            }, 50);
        });

        // Initialize
        createStarfield();
        createSpaceParticles();

        // Add particle float animation style
        const style = document.createElement('style');
        style.textContent = `
            @keyframes particle-float {
                0% {
                    opacity: 1;
                    transform: translate(0, 0) scale(0);
                }
                100% {
                    opacity: 0;
                    transform: translate(var(--x), var(--y)) scale(1);
                }
            }
        `;
        document.head.appendChild(style);
    </script>
</body>
</html>