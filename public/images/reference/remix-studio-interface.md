<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Template Remix - Dual Path Version</title>
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
            position: relative;
            min-height: 100vh;
        }

        /* Premium Badge */
        .premium-badge {
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #7b61ff, #ff61a6);
            padding: 8px 20px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 600;
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        /* Progress Bar */
        .progress-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 80px;
            background: rgba(0, 0, 0, 0.95);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            z-index: 999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 20px;
        }

        /* Manual Progress Steps */
        .progress-steps {
            display: flex;
            align-items: center;
            gap: 40px;
        }

        .progress-steps.hidden {
            display: none;
        }

        .progress-step {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            opacity: 0.3;
        }

        .progress-step.active {
            opacity: 1;
        }

        .progress-step.completed {
            opacity: 0.7;
        }

        .step-icon {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #7b61ff, #ff61a6);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            transition: all 0.3s ease;
        }

        .progress-step.active .step-icon {
            transform: scale(1.1);
            box-shadow: 0 0 20px rgba(123, 97, 255, 0.6);
        }

        .progress-step.completed .step-icon {
            background: linear-gradient(135deg, #00ff00, #00cc00);
        }

        .step-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
        }

        /* AI Progress Steps */
        .ai-progress-steps {
            display: none;
            align-items: center;
            gap: 30px;
        }

        .ai-progress-steps.active {
            display: flex;
        }

        /* Main Container */
        .main-container {
            padding-top: 100px;
            min-height: 100vh;
            position: relative;
        }

        /* Sections */
        .content-section {
            min-height: 100vh;
            padding: 40px 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.1;
            transform: translateY(50px);
            transition: all 0.8s ease;
            position: relative;
            pointer-events: none;
        }

        .content-section.visible {
            opacity: 1;
            transform: translateY(0);
            pointer-events: all;
        }

        .content-section.hidden {
            opacity: 0.05;
            transform: scale(0.98);
            filter: blur(10px);
        }

        /* Section Inner Container */
        .section-inner {
            max-width: 1200px;
            width: 100%;
            margin: 0 auto;
        }

        /* Welcome Section */
        .welcome-content {
            text-align: center;
            max-width: 800px;
            margin: 0 auto;
        }

        .main-title {
            font-size: 72px;
            font-weight: 800;
            background: linear-gradient(135deg, #7b61ff, #ff61a6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 20px;
            letter-spacing: -2px;
        }

        .subtitle {
            font-size: 24px;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 60px;
            line-height: 1.5;
        }

        .how-it-works {
            margin: 80px 0;
        }

        .how-title {
            font-size: 48px;
            font-weight: 700;
            background: linear-gradient(135deg, #7b61ff, #ff61a6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 60px;
        }

        .steps-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 40px;
            margin-bottom: 80px;
        }

        .step-card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 40px 30px;
            text-align: center;
            transition: all 0.3s ease;
        }

        .step-card:hover {
            transform: translateY(-5px);
            border-color: rgba(123, 97, 255, 0.5);
        }

        .step-number {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #7b61ff, #ff61a6);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 36px;
            font-weight: 700;
            margin: 0 auto 20px;
        }

        .step-title {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 15px;
        }

        .step-description {
            color: rgba(255, 255, 255, 0.7);
            line-height: 1.6;
        }

        /* Template Grid */
        .templates-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 30px;
            margin-top: 60px;
        }

        .template-card {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            padding: 30px;
            cursor: pointer;
            transition: all 0.4s ease;
            position: relative;
            overflow: hidden;
        }

        .template-card:hover {
            transform: translateY(-5px);
            border-color: rgba(123, 97, 255, 0.5);
            box-shadow: 0 20px 40px rgba(123, 97, 255, 0.2);
        }

        .template-category {
            background: rgba(123, 97, 255, 0.3);
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            display: inline-block;
            margin-bottom: 20px;
        }

        .template-name {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 15px;
        }

        .template-desc {
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 25px;
            line-height: 1.6;
        }

        .ai-suggestions {
            background: rgba(0, 255, 0, 0.1);
            border: 1px solid rgba(0, 255, 0, 0.3);
            border-radius: 12px;
            padding: 12px 20px;
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 25px;
            font-size: 14px;
        }

        .remix-btn {
            width: 100%;
            padding: 18px;
            background: linear-gradient(135deg, #7b61ff, #ff61a6);
            border: none;
            border-radius: 12px;
            color: white;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }

        .remix-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(123, 97, 255, 0.4);
        }

        /* Path Selection Section */
        .path-selection {
            text-align: center;
            max-width: 800px;
            margin: 0 auto;
        }

        .path-title {
            font-size: 56px;
            font-weight: 700;
            background: linear-gradient(135deg, #7b61ff, #ff61a6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 20px;
        }

        .path-subtitle {
            font-size: 20px;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 60px;
        }

        .path-options {
            display: flex;
            gap: 40px;
            justify-content: center;
            align-items: center;
        }

        .path-card {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            padding: 40px;
            cursor: pointer;
            transition: all 0.4s ease;
            position: relative;
            overflow: hidden;
            min-width: 320px;
            text-align: left;
        }

        .path-card.customize {
            animation: pathWobble 3s ease-in-out infinite;
        }

        .path-card.ai-generate {
            animation: pathPulsate 3s ease-in-out infinite;
        }

        .path-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 20px 60px rgba(123, 97, 255, 0.4);
        }

        .path-card.customize:hover {
            background: rgba(123, 97, 255, 0.1);
            border-color: rgba(123, 97, 255, 0.5);
        }

        .path-card.ai-generate:hover {
            background: rgba(0, 255, 0, 0.1);
            border-color: rgba(0, 255, 0, 0.5);
        }

        @keyframes pathWobble {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-8px); }
            75% { transform: translateX(8px); }
        }

        @keyframes pathPulsate {
            0%, 100% { 
                transform: scale(1);
                box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
            }
            50% { 
                transform: scale(1.02);
                box-shadow: 0 0 40px rgba(0, 255, 0, 0.6);
            }
        }

        .path-icon {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
            margin-bottom: 30px;
        }

        .path-card.customize .path-icon {
            background: linear-gradient(135deg, #7b61ff, #ff61a6);
        }

        .path-card.ai-generate .path-icon {
            background: linear-gradient(135deg, #00ff00, #00cc00);
        }

        .path-card-title {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 15px;
        }

        .path-card-desc {
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 25px;
            line-height: 1.6;
        }

        .path-features {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }

        .path-feature {
            background: rgba(255, 255, 255, 0.1);
            padding: 6px 12px;
            border-radius: 16px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .path-card.ai-generate .path-feature {
            background: rgba(0, 255, 0, 0.2);
            color: #00ff00;
        }

        .premium-label {
            position: absolute;
            top: 15px;
            right: 15px;
            background: linear-gradient(135deg, #ff6b6b, #f06292);
            padding: 6px 12px;
            border-radius: 16px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        /* Mobile responsive for path cards */
        @media (max-width: 768px) {
            .path-options {
                flex-direction: column;
                gap: 30px;
            }
            
            .path-card {
                min-width: 280px;
            }
        }

        /* Context Section */
        .context-header {
            text-align: center;
            margin-bottom: 60px;
        }

        .context-title {
            font-size: 56px;
            font-weight: 700;
            background: linear-gradient(135deg, #7b61ff, #ff61a6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 20px;
        }

        .context-subtitle {
            font-size: 20px;
            color: rgba(255, 255, 255, 0.7);
        }

        .context-form {
            max-width: 600px;
            margin: 0 auto;
        }

        .input-group {
            margin-bottom: 30px;
            position: relative;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.5s ease;
        }

        .input-group.active {
            opacity: 1;
            transform: translateY(0);
        }

        .input-label {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
            font-size: 18px;
            font-weight: 600;
        }

        .label-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #7b61ff, #ff61a6);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
        }

        .input-field {
            width: 100%;
            padding: 20px;
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            color: white;
            font-size: 16px;
            transition: all 0.3s ease;
            position: relative;
        }

        .input-field:focus {
            outline: none;
            border-color: #7b61ff;
            background: rgba(255, 255, 255, 0.08);
        }

        .input-field.completed {
            border-color: #00ff00;
            padding-right: 60px;
        }

        .check-icon {
            position: absolute;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            width: 30px;
            height: 30px;
            background: #00ff00;
            border-radius: 50%;
            display: none;
            align-items: center;
            justify-content: center;
            animation: checkPop 0.5s ease;
        }

        .input-group.completed .check-icon {
            display: flex;
        }

        @keyframes checkPop {
            from { transform: translateY(-50%) scale(0) rotate(-180deg); }
            to { transform: translateY(-50%) scale(1) rotate(0deg); }
        }

        .goal-dropdown {
            position: relative;
        }

        .dropdown-options {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            margin-top: 5px;
            overflow: hidden;
            opacity: 0;
            transform: translateY(-10px);
            pointer-events: none;
            transition: all 0.3s ease;
            z-index: 10;
        }

        .dropdown-options.open {
            opacity: 1;
            transform: translateY(0);
            pointer-events: all;
        }

        .dropdown-option {
            padding: 15px 20px;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .dropdown-option:hover {
            background: rgba(123, 97, 255, 0.2);
        }

        .dropdown-option.selected {
            background: rgba(123, 97, 255, 0.3);
        }

        .generate-btn {
            width: 100%;
            padding: 24px;
            background: linear-gradient(135deg, #00ff00, #00cc00);
            border: none;
            border-radius: 16px;
            color: #000;
            font-size: 20px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-top: 40px;
            opacity: 0;
            transform: translateY(20px);
        }

        .generate-btn.show {
            opacity: 1;
            transform: translateY(0);
        }

        .generate-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 15px 40px rgba(0, 255, 0, 0.4);
        }

        /* AI Context Section */
        .ai-context {
            text-align: center;
            max-width: 800px;
            margin: 0 auto;
        }

        .ai-context-title {
            font-size: 56px;
            font-weight: 700;
            background: linear-gradient(135deg, #00ff00, #00cc00);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 20px;
        }

        .ai-context-subtitle {
            font-size: 20px;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 60px;
        }

        .ai-detection-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 30px;
            margin-bottom: 60px;
        }

        .detection-item {
            background: rgba(0, 255, 0, 0.1);
            border: 2px solid rgba(0, 255, 0, 0.3);
            border-radius: 20px;
            padding: 30px 20px;
            text-align: center;
            transition: all 0.3s ease;
        }

        .detection-item.active {
            border-color: #00ff00;
            background: rgba(0, 255, 0, 0.2);
            animation: checkmarkPop 0.5s ease;
        }

        @keyframes checkmarkPop {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }

        .detection-icon {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #00ff00, #00cc00);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            margin: 0 auto 15px;
        }

        .detection-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 10px;
        }

        .detection-value {
            font-size: 16px;
            color: rgba(255, 255, 255, 0.7);
        }

        .ai-generate-btn {
            width: 100%;
            max-width: 400px;
            padding: 24px;
            background: linear-gradient(135deg, #00ff00, #00cc00);
            border: none;
            border-radius: 16px;
            color: #000;
            font-size: 20px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 2px;
            opacity: 0;
            transform: translateY(20px);
        }

        .ai-generate-btn.show {
            opacity: 1;
            transform: translateY(0);
        }

        .ai-generate-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 15px 40px rgba(0, 255, 0, 0.4);
        }

        /* AI Draft Section Styles */
        .ai-draft-container {
            display: flex;
            flex-direction: column;
            gap: 30px;
            margin-bottom: 60px;
        }

        .ai-draft-card {
            background: rgba(0, 255, 0, 0.1);
            border: 2px solid rgba(0, 255, 0, 0.3);
            border-radius: 20px;
            padding: 30px;
        }

        .draft-header {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 20px;
        }

        .draft-icon {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #00ff00, #00cc00);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
        }

        .draft-title {
            font-size: 20px;
            font-weight: 600;
            flex: 1;
        }

        .draft-status {
            background: rgba(0, 255, 0, 0.2);
            padding: 6px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            color: #00ff00;
        }

        .draft-content {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            line-height: 1.6;
        }

        .draft-content p {
            margin-bottom: 10px;
        }

        .draft-actions {
            display: flex;
            gap: 12px;
        }

        .draft-action-btn {
            padding: 10px 16px;
            background: rgba(0, 255, 0, 0.2);
            border: 1px solid rgba(0, 255, 0, 0.3);
            border-radius: 8px;
            color: white;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .draft-action-btn:hover {
            background: rgba(0, 255, 0, 0.3);
            transform: translateY(-1px);
        }

        .broll-suggestions {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
        }

        .broll-item {
            background: rgba(255, 255, 255, 0.05);
            padding: 12px;
            border-radius: 8px;
            text-align: center;
            font-size: 14px;
        }

        /* AI Tune Section Styles */
        .ai-tune-container {
            display: flex;
            flex-direction: column;
            gap: 40px;
            margin-bottom: 60px;
        }

        .tune-section {
            background: rgba(0, 255, 0, 0.1);
            border: 2px solid rgba(0, 255, 0, 0.3);
            border-radius: 20px;
            padding: 30px;
        }

        .tune-header {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 25px;
        }

        .tune-icon {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #00ff00, #00cc00);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
        }

        .tune-title {
            font-size: 20px;
            font-weight: 600;
            flex: 1;
        }

        .confidence-score {
            background: rgba(0, 255, 0, 0.2);
            padding: 6px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            color: #00ff00;
        }

        .hook-option {
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 15px;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .hook-option:hover {
            border-color: rgba(0, 255, 0, 0.3);
        }

        .hook-option.selected {
            border-color: #00ff00;
            background: rgba(0, 255, 0, 0.1);
        }

        .hook-text {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 10px;
        }

        .hook-metrics {
            display: flex;
            gap: 15px;
        }

        .metric {
            background: rgba(0, 255, 0, 0.2);
            padding: 4px 8px;
            border-radius: 8px;
            font-size: 12px;
            color: #00ff00;
        }

        .cta-preview-box {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
        }

        .cta-text {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 10px;
        }

        .cta-timing {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.7);
        }

        /* AI Preview Section Styles */
        .ai-variations-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 30px;
            margin-bottom: 60px;
        }

        .ai-variation-card {
            background: rgba(0, 255, 0, 0.1);
            border: 2px solid rgba(0, 255, 0, 0.3);
            border-radius: 20px;
            padding: 25px;
            cursor: pointer;
            transition: all 0.4s ease;
        }

        .ai-variation-card:hover {
            transform: translateY(-5px);
            border-color: #00ff00;
        }

        .ai-variation-card.selected {
            border-color: #00ff00;
            background: rgba(0, 255, 0, 0.2);
        }

        .variation-badge {
            background: linear-gradient(135deg, #00ff00, #00cc00);
            color: #000;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            display: inline-block;
            margin-bottom: 20px;
        }

        .ai-preview-window {
            width: 100%;
            height: 180px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .play-button {
            width: 50px;
            height: 50px;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            color: #000;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .play-button:hover {
            transform: scale(1.1);
            background: white;
        }

        .ai-metrics-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 12px;
            margin-bottom: 20px;
        }

        .ai-metric {
            text-align: center;
        }

        .ai-metric-value {
            font-size: 20px;
            font-weight: 700;
            color: #00ff00;
        }

        .ai-metric-label {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
            text-transform: uppercase;
        }

        .ai-select-btn {
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #00ff00, #00cc00);
            border: none;
            border-radius: 12px;
            color: #000;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .ai-select-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 255, 0, 0.4);
        }

        /* AI Publish Section Styles */
        .ai-final-preview {
            text-align: center;
            margin-bottom: 60px;
        }

        .final-preview-window {
            width: 100%;
            max-width: 400px;
            height: 300px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 24px;
            margin: 0 auto 40px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .play-button-large {
            width: 80px;
            height: 80px;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 30px;
            color: #000;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .play-button-large:hover {
            transform: scale(1.1);
            background: white;
            box-shadow: 0 0 30px rgba(255, 255, 255, 0.5);
        }

        .final-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 30px;
            margin-bottom: 40px;
        }

        .final-stat {
            background: rgba(0, 255, 0, 0.1);
            border: 2px solid rgba(0, 255, 0, 0.3);
            border-radius: 16px;
            padding: 25px;
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .stat-icon {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #00ff00, #00cc00);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
        }

        .stat-title {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 5px;
        }

        .stat-value {
            font-size: 16px;
            font-weight: 600;
            color: #00ff00;
        }

        .ai-publish-actions {
            display: flex;
            gap: 20px;
            justify-content: center;
        }

        .ai-publish-btn, .ai-download-btn {
            padding: 20px 40px;
            border: none;
            border-radius: 16px;
            font-size: 18px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .ai-publish-btn {
            background: linear-gradient(135deg, #00ff00, #00cc00);
            color: #000;
        }

        .ai-download-btn {
            background: linear-gradient(135deg, #7b61ff, #ff61a6);
            color: white;
        }

        .ai-publish-btn:hover, .ai-download-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 30px rgba(0, 255, 0, 0.4);
        }

        .ai-download-btn:hover {
            box-shadow: 0 10px 30px rgba(123, 97, 255, 0.4);
        }

        /* Building Score */
        .building-score {
            position: fixed;
            top: 100px;
            right: 20px;
            text-align: right;
            z-index: 100;
        }

        .score-value {
            font-size: 48px;
            font-weight: 700;
            background: linear-gradient(135deg, #7b61ff, #ff61a6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .score-label {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.5);
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        /* AI Assistant */
        .ai-assistant {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid #00ff00;
            border-radius: 20px;
            box-shadow: 0 0 40px rgba(0, 255, 0, 0.3);
            transition: all 0.5s ease;
            z-index: 100;
            cursor: pointer;
        }

        .ai-assistant.collapsed {
            width: 60px;
            height: 60px;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .ai-assistant.expanded {
            width: 320px;
            padding: 20px;
        }

        .ai-assistant.visible {
            opacity: 1;
            transform: translateY(0) scale(1);
        }

        .ai-collapsed-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #00ff00, #00cc00);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            animation: aiPulse 2s infinite;
        }

        @keyframes aiPulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(0, 255, 0, 0.4); }
            50% { box-shadow: 0 0 0 15px rgba(0, 255, 0, 0); }
        }

        .ai-expanded-content {
            display: none;
        }

        .ai-assistant.expanded .ai-expanded-content {
            display: block;
        }

        .ai-assistant.expanded .ai-collapsed-icon {
            display: none;
        }

        .ai-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 15px;
        }

        .ai-header-left {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .ai-icon {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #00ff00, #00cc00);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
        }

        .ai-name {
            font-size: 14px;
            font-weight: 600;
            color: #00ff00;
        }

        .ai-close {
            width: 24px;
            height: 24px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .ai-close:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .ai-message {
            color: rgba(255, 255, 255, 0.9);
            font-size: 13px;
            line-height: 1.6;
        }

        /* Remix Studio Section (FROM FILE 1) */
        .remix-studio {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
        }

        .studio-left, .studio-right {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            padding: 30px;
        }

        .studio-title {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 30px;
            display: flex;
            align-items: center;
            gap: 12px;
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
        }

        .play-button {
            width: 80px;
            height: 80px;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 30px;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .play-button:hover {
            transform: scale(1.1);
            background: white;
        }

        /* Remix Sections - Collapsible */
        .remix-section {
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding: 20px 0;
            transition: all 0.3s ease;
        }

        .remix-section:last-child {
            border-bottom: none;
        }

        .remix-section.collapsed .section-content {
            display: none;
        }

        .section-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            cursor: pointer;
            padding: 10px;
            margin: -10px;
            border-radius: 12px;
            transition: all 0.2s ease;
        }

        .section-header:hover {
            background: rgba(255, 255, 255, 0.05);
        }

        .section-header-left {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .section-icon {
            font-size: 20px;
        }

        .section-title {
            font-size: 18px;
            font-weight: 600;
        }

        .section-arrow {
            font-size: 16px;
            transition: transform 0.3s ease;
        }

        .remix-section.collapsed .section-arrow {
            transform: rotate(-90deg);
        }

        .section-content {
            margin-top: 20px;
            padding-left: 32px;
            animation: sectionExpand 0.3s ease;
        }

        @keyframes sectionExpand {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* Generate Variations Button */
        .generate-variations-btn {
            width: 100%;
            padding: 24px;
            background: linear-gradient(135deg, #00ff00, #00cc00);
            border: none;
            border-radius: 16px;
            color: #000;
            font-size: 18px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 30px;
            text-transform: uppercase;
            letter-spacing: 1px;
            position: relative;
            overflow: hidden;
        }

        .generate-variations-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 15px 40px rgba(0, 255, 0, 0.4);
        }

        /* Loading Overlay */
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
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

        .loading-content {
            text-align: center;
        }

        .loading-orb {
            width: 120px;
            height: 120px;
            margin: 0 auto 30px;
            position: relative;
        }

        .orb {
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: linear-gradient(135deg, #7b61ff, #ff61a6);
            animation: orbPulse 2s ease-in-out infinite;
        }

        @keyframes orbPulse {
            0% {
                transform: scale(1);
                opacity: 0.8;
            }
            50% {
                transform: scale(1.1);
                opacity: 1;
            }
            100% {
                transform: scale(1);
                opacity: 0.8;
            }
        }

        .loading-text {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 10px;
        }

        .loading-subtext {
            font-size: 16px;
            color: rgba(255, 255, 255, 0.7);
        }

        /* Music & Audio Section */
        .track-carousel {
            display: flex;
            gap: 15px;
            overflow-x: auto;
            padding: 15px 0;
            scrollbar-width: thin;
            scrollbar-color: rgba(123, 97, 255, 0.3) transparent;
        }

        .track-carousel::-webkit-scrollbar {
            height: 6px;
        }

        .track-carousel::-webkit-scrollbar-thumb {
            background: rgba(123, 97, 255, 0.3);
            border-radius: 3px;
        }

        .track-option {
            min-width: 180px;
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 15px;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
        }

        .track-option:hover {
            border-color: #7b61ff;
            transform: translateY(-2px);
        }

        .track-option.selected {
            border-color: #00ff00;
            background: rgba(0, 255, 0, 0.1);
        }

        .track-name {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 5px;
        }

        .track-genre {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
        }

        .trending-chip {
            position: absolute;
            top: 10px;
            right: 10px;
            background: linear-gradient(135deg, #ff6b6b, #f06292);
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            animation: chipGlow 2s ease-in-out infinite;
        }

        @keyframes chipGlow {
            0%, 100% { box-shadow: 0 0 5px rgba(255, 107, 107, 0.5); }
            50% { box-shadow: 0 0 15px rgba(255, 107, 107, 0.8); }
        }

        .beat-sync-slider {
            margin: 20px 0;
        }

        .slider-label {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
        }

        .slider-track {
            height: 6px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
            position: relative;
            cursor: pointer;
        }

        .slider-fill {
            height: 100%;
            background: linear-gradient(135deg, #7b61ff, #ff61a6);
            border-radius: 3px;
            width: 50%;
            transition: width 0.3s ease;
        }

        .slider-handle {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 20px;
            height: 20px;
            background: white;
            border-radius: 50%;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
            cursor: grab;
        }

        .slider-handle:active {
            cursor: grabbing;
            transform: translate(-50%, -50%) scale(1.1);
        }

        .stem-toggles {
            display: flex;
            gap: 10px;
            margin-top: 15px;
        }

        .stem-toggle {
            padding: 8px 16px;
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .stem-toggle:hover {
            border-color: #7b61ff;
        }

        .stem-toggle.active {
            background: rgba(123, 97, 255, 0.2);
            border-color: #7b61ff;
        }

        /* Visual Style Section */
        .mood-presets {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-bottom: 20px;
        }

        .mood-preset {
            aspect-ratio: 16/9;
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            position: relative;
            overflow: hidden;
        }

        .mood-preset::before {
            content: '';
            position: absolute;
            inset: 0;
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        .mood-preset.cinematic::before {
            background: linear-gradient(135deg, #1a237e, #000);
            opacity: 0.3;
        }

        .mood-preset.vibrant::before {
            background: linear-gradient(135deg, #ff006e, #8338ec);
            opacity: 0.3;
        }

        .mood-preset.minimal::before {
            background: linear-gradient(135deg, #fff, #f0f0f0);
            opacity: 0.1;
        }

        .mood-preset:hover {
            transform: scale(1.05);
            border-color: #7b61ff;
        }

        .mood-preset.selected {
            border-color: #00ff00;
            box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
        }

        .intensity-dial {
            margin-top: 20px;
            text-align: center;
        }

        .dial-container {
            width: 120px;
            height: 120px;
            margin: 0 auto 15px;
            position: relative;
        }

        .dial-track {
            width: 100%;
            height: 100%;
            border: 8px solid rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            position: relative;
        }

        .dial-fill {
            position: absolute;
            inset: -8px;
            border: 8px solid transparent;
            border-top-color: #7b61ff;
            border-right-color: #7b61ff;
            border-radius: 50%;
            transform: rotate(45deg);
            transition: transform 0.3s ease;
        }

        .dial-center {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80px;
            height: 80px;
            background: rgba(0, 0, 0, 0.8);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: 700;
        }

        /* Hook Boosters Section */
        .overlay-selector {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: 20px;
        }

        .overlay-option {
            padding: 15px;
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: center;
        }

        .overlay-option:hover {
            border-color: #7b61ff;
            transform: translateY(-2px);
        }

        .overlay-option.selected {
            border-color: #00ff00;
            background: rgba(0, 255, 0, 0.1);
        }

        .text-hook-editor {
            width: 100%;
            padding: 15px;
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            color: white;
            font-size: 14px;
            resize: vertical;
            min-height: 80px;
            margin-bottom: 15px;
            transition: all 0.3s ease;
        }

        .text-hook-editor:focus {
            outline: none;
            border-color: #7b61ff;
            background: rgba(255, 255, 255, 0.08);
        }

        .vo-prompt-field {
            width: 100%;
            padding: 12px;
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            color: white;
            font-size: 14px;
            transition: all 0.3s ease;
        }

        /* Value Content Builder Section */
        .format-dropdown {
            width: 100%;
            padding: 12px;
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            color: white;
            font-size: 14px;
            cursor: pointer;
            margin-bottom: 20px;
        }

        .ai-content-buttons {
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
        }

        .ai-button {
            flex: 1;
            padding: 10px;
            background: rgba(123, 97, 255, 0.2);
            border: 2px solid #7b61ff;
            border-radius: 12px;
            color: white;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .ai-button:hover {
            background: rgba(123, 97, 255, 0.3);
            transform: translateY(-2px);
        }

        .ai-button.expand {
            border-color: #00ff00;
            background: rgba(0, 255, 0, 0.2);
        }

        .ai-button.shorten {
            border-color: #ff6b6b;
            background: rgba(255, 107, 107, 0.2);
        }

        .ai-button.clarify {
            border-color: #00bcd4;
            background: rgba(0, 188, 212, 0.2);
        }

        .script-box {
            width: 100%;
            padding: 15px;
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            color: white;
            font-size: 14px;
            resize: vertical;
            min-height: 120px;
            margin-bottom: 15px;
        }

        .broll-manager {
            background: rgba(255, 255, 255, 0.03);
            border-radius: 12px;
            padding: 15px;
        }

        .broll-label {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .broll-clips {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }

        .broll-clip {
            width: 80px;
            height: 60px;
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
        }

        .broll-clip:hover {
            border-color: #7b61ff;
            transform: scale(1.05);
        }

        .broll-clip.add-new {
            border-style: dashed;
            color: rgba(255, 255, 255, 0.5);
        }

        /* Format & Pace Section */
        .cut-frequency-slider {
            margin-bottom: 20px;
        }

        .ramp-presets {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: 20px;
        }

        .ramp-preset {
            padding: 12px;
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: center;
            font-size: 14px;
        }

        .ramp-preset:hover {
            border-color: #7b61ff;
            transform: translateY(-2px);
        }

        .ramp-preset.selected {
            border-color: #00ff00;
            background: rgba(0, 255, 0, 0.1);
        }

        .aspect-toggle {
            display: flex;
            gap: 10px;
        }

        .aspect-option {
            flex: 1;
            padding: 12px;
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .aspect-option:hover {
            border-color: #7b61ff;
        }

        .aspect-option.selected {
            border-color: #00ff00;
            background: rgba(0, 255, 0, 0.1);
        }

        /* Authority Gap Section */
        .authority-chips {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 20px;
        }

        .authority-chip {
            padding: 8px 16px;
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
        }

        .authority-chip:hover {
            border-color: #7b61ff;
            transform: translateY(-2px);
        }

        .authority-chip.selected {
            border-color: #00ff00;
            background: rgba(0, 255, 0, 0.1);
        }

        .authority-chip.auto-suggested {
            border-color: #ff61a6;
        }

        .authority-chip.auto-suggested::after {
            content: '✨';
            position: absolute;
            top: -5px;
            right: -5px;
            font-size: 12px;
        }

        .position-slider {
            margin-top: 20px;
        }

        /* CTA Overlay Section */
        .cta-templates {
            display: grid;
            grid-template-columns: 1fr;
            gap: 12px;
            margin-bottom: 20px;
        }

        .cta-template {
            padding: 15px;
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .cta-template:hover {
            border-color: #7b61ff;
            transform: translateY(-2px);
        }

        .cta-template.selected {
            border-color: #00ff00;
            background: rgba(0, 255, 0, 0.1);
        }

        .cta-preview {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 5px;
        }

        .cta-description {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
        }

        .animation-styles {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }

        .animation-style {
            padding: 8px 16px;
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .animation-style:hover {
            border-color: #7b61ff;
        }

        .animation-style.selected {
            border-color: #00ff00;
            background: rgba(0, 255, 0, 0.1);
        }

        /* SEO & Hashtags Section */
        .keyword-suggester {
            margin-bottom: 20px;
        }

        .keyword-input {
            width: 100%;
            padding: 12px;
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            color: white;
            font-size: 14px;
            margin-bottom: 10px;
        }

        .suggested-keywords {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }

        .keyword-tag {
            padding: 6px 12px;
            background: rgba(123, 97, 255, 0.2);
            border: 1px solid #7b61ff;
            border-radius: 16px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .keyword-tag:hover {
            background: rgba(123, 97, 255, 0.3);
            transform: translateY(-1px);
        }

        .hashtag-packs {
            display: grid;
            gap: 12px;
        }

        .hashtag-pack {
            padding: 15px;
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .hashtag-pack:hover {
            border-color: #7b61ff;
            transform: translateY(-2px);
        }

        .hashtag-pack.selected {
            border-color: #00ff00;
            background: rgba(0, 255, 0, 0.1);
        }

        .pack-name {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .pack-tags {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
        }

        /* Variations Section */
        .variations-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 30px;
        }

        .variation-card {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            padding: 25px;
            cursor: pointer;
            transition: all 0.4s ease;
            position: relative;
        }

        .variation-card:hover {
            transform: translateY(-5px);
            border-color: #7b61ff;
        }

        .variation-card.selected {
            border-color: #00ff00;
            background: rgba(0, 255, 0, 0.05);
        }

        .variation-type {
            background: linear-gradient(135deg, #7b61ff, #ff61a6);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            display: inline-block;
            margin-bottom: 20px;
        }

        .variation-preview {
            width: 100%;
            height: 200px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin: 20px 0;
        }

        .metric {
            text-align: center;
        }

        .metric-value {
            font-size: 24px;
            font-weight: 700;
            color: #00ff00;
        }

        .metric-label {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
            text-transform: uppercase;
        }

        .select-btn {
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #7b61ff, #ff61a6);
            border: none;
            border-radius: 12px;
            color: white;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .select-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(123, 97, 255, 0.4);
        }

        /* Variation Details Section */
        .variation-details {
            text-align: center;
            max-width: 800px;
            margin: 0 auto;
        }

        .video-preview-large {
            width: 100%;
            height: 500px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 40px;
            position: relative;
        }

        .play-button-large {
            width: 100px;
            height: 100px;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .play-button-large:hover {
            transform: scale(1.1);
            background: white;
            box-shadow: 0 0 40px rgba(255, 255, 255, 0.5);
        }

        .finalize-btn {
            width: 100%;
            max-width: 600px;
            padding: 24px;
            background: linear-gradient(135deg, #00ff00, #00cc00);
            border: none;
            border-radius: 16px;
            color: #000;
            font-size: 20px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .finalize-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 15px 40px rgba(0, 255, 0, 0.4);
        }

        /* Success Content Additions */
        .success-content {
            text-align: center;
            max-width: 600px;
            margin: 0 auto;
        }

        .success-icon {
            width: 120px;
            height: 120px;
            background: linear-gradient(135deg, #00ff00, #00cc00);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 60px;
            margin: 0 auto 40px;
            animation: successPulse 2s ease-in-out infinite;
        }

        @keyframes successPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }

        .success-buttons {
            display: flex;
            flex-direction: column;
            gap: 20px;
            max-width: 600px;
            margin: 40px auto 0;
        }

        .download-btn {
            padding: 24px;
            background: linear-gradient(135deg, #00ff00, #00cc00);
            border: none;
            border-radius: 16px;
            color: #000;
            font-size: 18px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .download-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 15px 40px rgba(0, 255, 0, 0.4);
        }

        .insights-btn {
            padding: 24px;
            background: linear-gradient(135deg, #7b61ff, #ff61a6);
            border: none;
            border-radius: 16px;
            color: white;
            font-size: 18px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .insights-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 15px 40px rgba(123, 97, 255, 0.4);
        }

        /* Confetti */
        .confetti {
            position: fixed;
            width: 10px;
            height: 10px;
            z-index: 9999;
            animation: confetti-fall 3s linear forwards;
        }

        @keyframes confetti-fall {
            to {
                transform: translateY(100vh) rotate(360deg);
                opacity: 0;
            }
        }

        /* Celebration Text */
        .celebration {
            position: fixed;
            font-size: 24px;
            font-weight: 700;
            color: #00ff00;
            z-index: 9999;
            animation: celebrationFloat 3s ease forwards;
            pointer-events: none;
        }

        @keyframes celebrationFloat {
            0% {
                transform: translate(-50%, -50%) scale(0);
                opacity: 0;
            }
            50% {
                transform: translate(-50%, -80px) scale(1);
                opacity: 1;
            }
            100% {
                transform: translate(-50%, -150px) scale(1);
                opacity: 0;
            }
        }

        @keyframes scoreGlow {
            0% { 
                transform: scale(1);
                text-shadow: 0 0 10px rgba(123, 97, 255, 0.5);
            }
            50% { 
                transform: scale(1.1);
                text-shadow: 0 0 30px rgba(123, 97, 255, 0.8);
            }
            100% { 
                transform: scale(1);
                text-shadow: 0 0 10px rgba(123, 97, 255, 0.5);
            }
        }
        @media (max-width: 1024px) {
            .templates-grid {
                grid-template-columns: 1fr;
            }
            
            .remix-studio {
                grid-template-columns: 1fr;
            }
            
            .ai-variations-grid {
                grid-template-columns: 1fr;
            }
            
            .final-stats {
                grid-template-columns: 1fr;
            }
        }

        @media (max-width: 768px) {
            .progress-steps {
                gap: 20px;
            }
            
            .step-label {
                display: none;
            }
            
            .steps-grid {
                grid-template-columns: 1fr;
            }
            
            .main-title {
                font-size: 48px;
            }

            .ai-detection-grid {
                grid-template-columns: 1fr;
                gap: 20px;
            }

            .broll-suggestions {
                grid-template-columns: 1fr;
            }
            
            .ai-publish-actions {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
    <!-- Premium Badge -->
    <div class="premium-badge">
        ⭐ Premium Feature
    </div>

    <!-- Progress Header -->
    <div class="progress-header">
        <!-- Manual Progress Steps -->
        <div class="progress-steps" id="manualProgressSteps">
            <div class="progress-step active" data-step="discover">
                <div class="step-icon">✓</div>
                <div class="step-label">DISCOVER</div>
            </div>
            <div class="progress-step" data-step="path">
                <div class="step-icon">🔀</div>
                <div class="step-label">PATH</div>
            </div>
            <div class="progress-step" data-step="context">
                <div class="step-icon">✍️</div>
                <div class="step-label">CONTEXT</div>
            </div>
            <div class="progress-step" data-step="remix">
                <div class="step-icon">🎨</div>
                <div class="step-label">REMIX</div>
            </div>
            <div class="progress-step" data-step="preview">
                <div class="step-icon">👁️</div>
                <div class="step-label">PREVIEW</div>
            </div>
            <div class="progress-step" data-step="select">
                <div class="step-icon">✨</div>
                <div class="step-label">SELECT</div>
            </div>
            <div class="progress-step" data-step="success">
                <div class="step-icon">🎉</div>
                <div class="step-label">SUCCESS</div>
            </div>
        </div>

        <!-- AI Progress Steps -->
        <div class="progress-steps ai-progress-steps" id="aiProgressSteps">
            <div class="progress-step active" data-step="context">
                <div class="step-icon">🎯</div>
                <div class="step-label">CONTEXT</div>
            </div>
            <div class="progress-step" data-step="generate">
                <div class="step-icon">⚡</div>
                <div class="step-label">GENERATE</div>
            </div>
            <div class="progress-step" data-step="draft">
                <div class="step-icon">📝</div>
                <div class="step-label">DRAFT</div>
            </div>
            <div class="progress-step" data-step="tune">
                <div class="step-icon">✨</div>
                <div class="step-label">TUNE</div>
            </div>
            <div class="progress-step" data-step="preview">
                <div class="step-icon">👀</div>
                <div class="step-label">PREVIEW</div>
            </div>
            <div class="progress-step" data-step="publish">
                <div class="step-icon">🚀</div>
                <div class="step-label">PUBLISH</div>
            </div>
        </div>
    </div>

    <!-- Building Score -->
    <div class="building-score" id="buildingScore" style="display: none;">
        <div class="score-value" id="scoreValue">0%</div>
        <div class="score-label">BUILDING SCORE</div>
    </div>

    <!-- Main Container -->
    <div class="main-container">
        
        <!-- Template Selection Section -->
        <section class="content-section visible" id="discoverSection">
            <div class="section-inner">
                <div class="welcome-content">
                    <h1 class="main-title">Template Remix</h1>
                    <p class="subtitle">Remix and customize templates with AI assistance to optimize for engagement, conversion, and brand consistency.</p>
                    
                    <div class="how-it-works">
                        <h2 class="how-title">How AI Remix Works</h2>
                        <div class="steps-grid">
                            <div class="step-card">
                                <div class="step-number">1</div>
                                <h3 class="step-title">Select a Template</h3>
                                <p class="step-description">Choose any template from our collection as your starting point</p>
                            </div>
                            <div class="step-card">
                                <div class="step-number">2</div>
                                <h3 class="step-title">Set Your Goals</h3>
                                <p class="step-description">Specify what you want to optimize for (engagement, conversion, etc.)</p>
                            </div>
                            <div class="step-card">
                                <div class="step-number">3</div>
                                <h3 class="step-title">Apply AI Suggestions</h3>
                                <p class="step-description">Review and apply AI-generated variations with a single click</p>
                            </div>
                        </div>
                    </div>

                    <h2 class="how-title">Popular Templates for Remixing</h2>
                    <div class="templates-grid">
                        <div class="template-card" onclick="selectTemplate('product-showcase')">
                            <span class="template-category">E-COMMERCE</span>
                            <h3 class="template-name">Product Showcase</h3>
                            <p class="template-desc">A clean, modern template for showcasing your products with style</p>
                            <div class="ai-suggestions">
                                <span>🤖</span>
                                <span>24 AI suggestions available</span>
                            </div>
                            <button class="remix-btn">
                                Remix Template →
                            </button>
                        </div>
                        
                        <div class="template-card" onclick="selectTemplate('tutorial')">
                            <span class="template-category">EDUCATION</span>
                            <h3 class="template-name">Trending Tutorial</h3>
                            <p class="template-desc">Step-by-step instructional template with optimal pacing</p>
                            <div class="ai-suggestions">
                                <span>🤖</span>
                                <span>18 AI suggestions available</span>
                            </div>
                            <button class="remix-btn">
                                Remix Template →
                            </button>
                        </div>
                        
                        <div class="template-card" onclick="selectTemplate('viral-story')">
                            <span class="template-category">ENTERTAINMENT</span>
                            <h3 class="template-name">Viral Story</h3>
                            <p class="template-desc">Narrative-driven emotional template with proven engagement</p>
                            <div class="ai-suggestions">
                                <span>🤖</span>
                                <span>12 AI suggestions available</span>
                            </div>
                            <button class="remix-btn">
                                Remix Template →
                            </button>
                        </div>
                        
                        <div class="template-card" onclick="selectTemplate('brand-intro')">
                            <span class="template-category">BRANDING</span>
                            <h3 class="template-name">Brand Intro</h3>
                            <p class="template-desc">Perfect for introducing your brand with impact</p>
                            <div class="ai-suggestions">
                                <span>🤖</span>
                                <span>16 AI suggestions available</span>
                            </div>
                            <button class="remix-btn">
                                Remix Template →
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Path Selection Section -->
        <section class="content-section" id="pathSection">
            <div class="section-inner">
                <div class="path-selection">
                    <h2 class="path-title">Choose Your Path</h2>
                    <p class="path-subtitle">How would you like to customize your template?</p>
                    
                    <div class="path-options">
                        <div class="path-card customize" onclick="selectPath('manual')">
                            <div class="path-icon">✍️</div>
                            <h3 class="path-card-title">You Customize</h3>
                            <p class="path-card-desc">Take full control with our advanced editor. Perfect for creators who want hands-on customization.</p>
                            <div class="path-features">
                                <span class="path-feature">Full Control</span>
                                <span class="path-feature">Advanced Editor</span>
                                <span class="path-feature">Custom Branding</span>
                            </div>
                        </div>
                        
                        <div class="path-card ai-generate" onclick="selectPath('ai')">
                            <div class="premium-label">PREMIUM</div>
                            <div class="path-icon">🤖</div>
                            <h3 class="path-card-title">AI Generated</h3>
                            <p class="path-card-desc">Let our AI analyze your brand and automatically create optimized variations. Just provide context and get results.</p>
                            <div class="path-features">
                                <span class="path-feature">Smart Analysis</span>
                                <span class="path-feature">Auto-Optimization</span>
                                <span class="path-feature">Multiple Variations</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Manual Context Section -->
        <section class="content-section" id="contextSection">
            <div class="section-inner">
                <div class="context-header">
                    <h2 class="context-title">Your Context</h2>
                    <p class="context-subtitle">Let's customize this viral formula for your brand</p>
                </div>
                
                <div class="context-form">
                    <div class="input-group active" id="nicheGroup">
                        <label class="input-label">
                            <span class="label-icon">🎯</span>
                            What's your niche?
                        </label>
                        <div style="position: relative;">
                            <input type="text" class="input-field" id="nicheInput" 
                                   placeholder="e.g., Fitness, Beauty, Tech Reviews, Cooking..."
                                   oninput="handleInput('niche')">
                            <div class="check-icon">✓</div>
                        </div>
                    </div>

                    <div class="input-group" id="audienceGroup">
                        <label class="input-label">
                            <span class="label-icon">👥</span>
                            Who's your target audience?
                        </label>
                        <div style="position: relative;">
                            <input type="text" class="input-field" id="audienceInput" 
                                   placeholder="e.g., Young professionals, Parents, Gamers..."
                                   oninput="handleInput('audience')">
                            <div class="check-icon">✓</div>
                        </div>
                    </div>

                    <div class="input-group" id="productGroup">
                        <label class="input-label">
                            <span class="label-icon">📦</span>
                            What are you promoting?
                        </label>
                        <div style="position: relative;">
                            <input type="text" class="input-field" id="productInput" 
                                   placeholder="e.g., Online course, Physical product, Service..."
                                   oninput="handleInput('product')">
                            <div class="check-icon">✓</div>
                        </div>
                    </div>

                    <div class="input-group" id="goalGroup">
                        <label class="input-label">
                            <span class="label-icon">🎯</span>
                            What's your main goal?
                        </label>
                        <div class="goal-dropdown">
                            <input type="text" class="input-field" id="goalInput" 
                                   placeholder="Select your goal"
                                   readonly
                                   onclick="toggleDropdown()">
                            <div class="check-icon">✓</div>
                            <div class="dropdown-options" id="goalDropdown">
                                <div class="dropdown-option" onclick="selectGoal('Drive Sales')">Drive Sales</div>
                                <div class="dropdown-option" onclick="selectGoal('Build Brand Awareness')">Build Brand Awareness</div>
                                <div class="dropdown-option" onclick="selectGoal('Grow Followers')">Grow Followers</div>
                                <div class="dropdown-option" onclick="selectGoal('Generate Leads')">Generate Leads</div>
                                <div class="dropdown-option" onclick="selectGoal('Educate Audience')">Educate Audience</div>
                            </div>
                        </div>
                    </div>

                    <button class="generate-btn" id="generateBtn" onclick="moveToRemixStudio()">
                        GENERATE MY REMIX
                    </button>
                </div>
            </div>
        </section>

        <!-- Manual Remix Studio Section (FROM FILE 1) -->
        <section class="content-section" id="remixSection">
            <div class="section-inner">
                <div class="remix-studio">
                    <div class="studio-left">
                        <h3 class="studio-title">
                            <span>🎬</span>
                            Live Preview
                        </h3>
                        <div class="preview-window">
                            <div class="play-button">▶</div>
                        </div>
                    </div>
                    
                    <div class="studio-right">
                        <h3 class="studio-title">
                            <span>🎛️</span>
                            Remix Controls
                        </h3>
                        
                        <!-- Music & Audio -->
                        <div class="remix-section" id="musicSection">
                            <div class="section-header" onclick="toggleSection('musicSection')">
                                <div class="section-header-left">
                                    <span class="section-icon">🎵</span>
                                    <span class="section-title">Music & Audio</span>
                                </div>
                                <span class="section-arrow">▼</span>
                            </div>
                            <div class="section-content">
                                <div class="track-carousel">
                                    <div class="track-option selected" onclick="selectTrack(this)">
                                        <div class="track-name">Upbeat Pop</div>
                                        <div class="track-genre">Energetic • 128 BPM</div>
                                        <span class="trending-chip">TRENDING</span>
                                    </div>
                                    <div class="track-option" onclick="selectTrack(this)">
                                        <div class="track-name">Chill Vibes</div>
                                        <div class="track-genre">Relaxed • 90 BPM</div>
                                    </div>
                                    <div class="track-option" onclick="selectTrack(this)">
                                        <div class="track-name">Epic Orchestral</div>
                                        <div class="track-genre">Dramatic • 140 BPM</div>
                                    </div>
                                    <div class="track-option" onclick="selectTrack(this)">
                                        <div class="track-name">Trap Beat</div>
                                        <div class="track-genre">Urban • 145 BPM</div>
                                        <span class="trending-chip">HOT</span>
                                    </div>
                                </div>
                                
                                <div class="beat-sync-slider">
                                    <div class="slider-label">
                                        <span>Beat Sync Intensity</span>
                                        <span>50%</span>
                                    </div>
                                    <div class="slider-track">
                                        <div class="slider-fill"></div>
                                        <div class="slider-handle"></div>
                                    </div>
                                </div>
                                
                                <div class="stem-toggles">
                                    <div class="stem-toggle active">Vocals</div>
                                    <div class="stem-toggle active">Drums</div>
                                    <div class="stem-toggle">Bass</div>
                                    <div class="stem-toggle">Melody</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Visual Style -->
                        <div class="remix-section collapsed" id="visualSection">
                            <div class="section-header" onclick="toggleSection('visualSection')">
                                <div class="section-header-left">
                                    <span class="section-icon">🎨</span>
                                    <span class="section-title">Visual Style</span>
                                </div>
                                <span class="section-arrow">▼</span>
                            </div>
                            <div class="section-content">
                                <div class="mood-presets">
                                    <div class="mood-preset cinematic selected" onclick="selectMood(this)">CINEMATIC</div>
                                    <div class="mood-preset vibrant" onclick="selectMood(this)">VIBRANT</div>
                                    <div class="mood-preset minimal" onclick="selectMood(this)">MINIMAL</div>
                                    <div class="mood-preset retro" onclick="selectMood(this)">RETRO</div>
                                    <div class="mood-preset neon" onclick="selectMood(this)">NEON</div>
                                    <div class="mood-preset organic" onclick="selectMood(this)">ORGANIC</div>
                                </div>
                                
                                <div class="intensity-dial">
                                    <div class="dial-container">
                                        <div class="dial-track">
                                            <div class="dial-fill"></div>
                                        </div>
                                        <div class="dial-center">75%</div>
                                    </div>
                                    <div class="slider-label">Style Intensity</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Hook Boosters -->
                        <div class="remix-section collapsed" id="hookSection">
                            <div class="section-header" onclick="toggleSection('hookSection')">
                                <div class="section-header-left">
                                    <span class="section-icon">🪝</span>
                                    <span class="section-title">Hook Boosters</span>
                                </div>
                                <span class="section-arrow">▼</span>
                            </div>
                            <div class="section-content">
                                <div class="overlay-selector">
                                    <div class="overlay-option selected" onclick="selectOverlay(this)">Question Hook</div>
                                    <div class="overlay-option" onclick="selectOverlay(this)">Number Hook</div>
                                    <div class="overlay-option" onclick="selectOverlay(this)">Statement Hook</div>
                                    <div class="overlay-option" onclick="selectOverlay(this)">Challenge Hook</div>
                                </div>
                                
                                <textarea class="text-hook-editor" placeholder="Did you know that 90% of people..."></textarea>
                                
                                <input type="text" class="vo-prompt-field" placeholder="Excited, energetic tone">
                            </div>
                        </div>
                        
                        <!-- Value Content Builder -->
                        <div class="remix-section collapsed" id="valueSection">
                            <div class="section-header" onclick="toggleSection('valueSection')">
                                <div class="section-header-left">
                                    <span class="section-icon">💎</span>
                                    <span class="section-title">Value Content Builder</span>
                                </div>
                                <span class="section-arrow">▼</span>
                            </div>
                            <div class="section-content">
                                <select class="format-dropdown">
                                    <option>Tips Format (3-5 points)</option>
                                    <option>Tutorial Format (Step-by-step)</option>
                                    <option>Transformation Format (Before/After)</option>
                                    <option>List Format (Top X)</option>
                                </select>
                                
                                <div class="ai-content-buttons">
                                    <button class="ai-button expand">Expand ➕</button>
                                    <button class="ai-button shorten">Shorten ➖</button>
                                    <button class="ai-button clarify">Clarify 💡</button>
                                </div>
                                
                                <textarea class="script-box" placeholder="Your main content points..."></textarea>
                                
                                <div class="broll-manager">
                                    <div class="broll-label">
                                        <span>📹</span>
                                        B-Roll Suggestions
                                    </div>
                                    <div class="broll-clips">
                                        <div class="broll-clip">Product Shot</div>
                                        <div class="broll-clip">Demo</div>
                                        <div class="broll-clip">Results</div>
                                        <div class="broll-clip add-new">+ Add</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Format & Pace -->
                        <div class="remix-section collapsed" id="formatSection">
                            <div class="section-header" onclick="toggleSection('formatSection')">
                                <div class="section-header-left">
                                    <span class="section-icon">⚡</span>
                                    <span class="section-title">Format & Pace</span>
                                </div>
                                <span class="section-arrow">▼</span>
                            </div>
                            <div class="section-content">
                                <div class="cut-frequency-slider">
                                    <div class="slider-label">
                                        <span>Cut Frequency</span>
                                        <span>Every 2.5s</span>
                                    </div>
                                    <div class="slider-track">
                                        <div class="slider-fill" style="width: 60%;"></div>
                                        <div class="slider-handle" style="left: 60%;"></div>
                                    </div>
                                </div>
                                
                                <div class="ramp-presets">
                                    <div class="ramp-preset selected" onclick="selectRamp(this)">Fast Start</div>
                                    <div class="ramp-preset" onclick="selectRamp(this)">Slow Build</div>
                                    <div class="ramp-preset" onclick="selectRamp(this)">Consistent</div>
                                    <div class="ramp-preset" onclick="selectRamp(this)">Climax End</div>
                                </div>
                                
                                <div class="aspect-toggle">
                                    <div class="aspect-option selected" onclick="selectAspect(this)">9:16 (Vertical)</div>
                                    <div class="aspect-option" onclick="selectAspect(this)">1:1 (Square)</div>
                                    <div class="aspect-option" onclick="selectAspect(this)">16:9 (Wide)</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Authority Gap Insert -->
                        <div class="remix-section collapsed" id="authoritySection">
                            <div class="section-header" onclick="toggleSection('authoritySection')">
                                <div class="section-header-left">
                                    <span class="section-icon">👤</span>
                                    <span class="section-title">Authority Gap Insert</span>
                                </div>
                                <span class="section-arrow">▼</span>
                            </div>
                            <div class="section-content">
                                <div class="authority-chips">
                                    <div class="authority-chip auto-suggested" onclick="selectAuthority(this)">Industry Expert</div>
                                    <div class="authority-chip" onclick="selectAuthority(this)">Years Experience</div>
                                    <div class="authority-chip" onclick="selectAuthority(this)">Success Story</div>
                                    <div class="authority-chip" onclick="selectAuthority(this)">Social Proof</div>
                                    <div class="authority-chip auto-suggested" onclick="selectAuthority(this)">Certifications</div>
                                    <div class="authority-chip" onclick="selectAuthority(this)">Client Results</div>
                                </div>
                                
                                <div class="position-slider">
                                    <div class="slider-label">
                                        <span>Position in Video</span>
                                        <span>30%</span>
                                    </div>
                                    <div class="slider-track">
                                        <div class="slider-fill" style="width: 30%;"></div>
                                        <div class="slider-handle" style="left: 30%;"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- CTA Overlay -->
                        <div class="remix-section collapsed" id="ctaSection">
                            <div class="section-header" onclick="toggleSection('ctaSection')">
                                <div class="section-header-left">
                                    <span class="section-icon">🎯</span>
                                    <span class="section-title">CTA Overlay</span>
                                </div>
                                <span class="section-arrow">▼</span>
                            </div>
                            <div class="section-content">
                                <div class="cta-templates">
                                    <div class="cta-template selected" onclick="selectCTA(this)">
                                        <div class="cta-preview">Link in Bio →</div>
                                        <div class="cta-description">Simple and direct</div>
                                    </div>
                                    <div class="cta-template" onclick="selectCTA(this)">
                                        <div class="cta-preview">Swipe Up Now!</div>
                                        <div class="cta-description">Urgency-driven</div>
                                    </div>
                                    <div class="cta-template" onclick="selectCTA(this)">
                                        <div class="cta-preview">Get 50% OFF</div>
                                        <div class="cta-description">Offer-focused</div>
                                    </div>
                                </div>
                                
                                <div class="animation-styles">
                                    <div class="animation-style selected" onclick="selectAnimation(this)">Pulse</div>
                                    <div class="animation-style" onclick="selectAnimation(this)">Slide In</div>
                                    <div class="animation-style" onclick="selectAnimation(this)">Bounce</div>
                                    <div class="animation-style" onclick="selectAnimation(this)">Fade</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- SEO & Hashtags -->
                        <div class="remix-section collapsed" id="seoSection">
                            <div class="section-header" onclick="toggleSection('seoSection')">
                                <div class="section-header-left">
                                    <span class="section-icon">#️⃣</span>
                                    <span class="section-title">SEO & Hashtags</span>
                                </div>
                                <span class="section-arrow">▼</span>
                            </div>
                            <div class="section-content">
                                <div class="keyword-suggester">
                                    <input type="text" class="keyword-input" placeholder="Enter main keywords...">
                                    <div class="suggested-keywords">
                                        <span class="keyword-tag">productivity</span>
                                        <span class="keyword-tag">tips</span>
                                        <span class="keyword-tag">tutorial</span>
                                        <span class="keyword-tag">howto</span>
                                    </div>
                                </div>
                                
                                <div class="hashtag-packs">
                                    <div class="hashtag-pack selected" onclick="selectHashtagPack(this)">
                                        <div class="pack-name">Trending Mix</div>
                                        <div class="pack-tags">#fyp #viral #trending2024 #foryou</div>
                                    </div>
                                    <div class="hashtag-pack" onclick="selectHashtagPack(this)">
                                        <div class="pack-name">Niche Specific</div>
                                        <div class="pack-tags">#productivitytips #lifehacks #success</div>
                                    </div>
                                    <div class="hashtag-pack" onclick="selectHashtagPack(this)">
                                        <div class="pack-name">Engagement Boost</div>
                                        <div class="pack-tags">#duet #stitch #challenge #react</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <button class="generate-variations-btn" onclick="generateVariations()">
                            GENERATE VARIATIONS
                        </button>
                    </div>
                </div>
            </div>
        </section>

        <!-- Variations Section -->
        <section class="content-section" id="previewSection">
            <div class="section-inner">
                <div class="context-header">
                    <h2 class="context-title">AI-Generated Variations</h2>
                    <p class="context-subtitle">Choose the version that best fits your goals</p>
                </div>
                
                <div class="variations-grid">
                    <div class="variation-card" onclick="selectVariation(this)">
                        <span class="variation-type">MAXIMUM ENGAGEMENT</span>
                        <div class="variation-preview">
                            <span>▶</span>
                        </div>
                        <div class="metrics-grid">
                            <div class="metric">
                                <div class="metric-value">2.3M</div>
                                <div class="metric-label">Est. Views</div>
                            </div>
                            <div class="metric">
                                <div class="metric-value">12%</div>
                                <div class="metric-label">Engagement</div>
                            </div>
                            <div class="metric">
                                <div class="metric-value">45K</div>
                                <div class="metric-label">Shares</div>
                            </div>
                            <div class="metric">
                                <div class="metric-value">92%</div>
                                <div class="metric-label">Match Score</div>
                            </div>
                        </div>
                        <button class="select-btn" onclick="confirmSelection('engagement')">
                            Select This Version
                        </button>
                    </div>
                    
                    <div class="variation-card" onclick="selectVariation(this)">
                        <span class="variation-type">VIRAL POTENTIAL</span>
                        <div class="variation-preview">
                            <span>▶</span>
                        </div>
                        <div class="metrics-grid">
                            <div class="metric">
                                <div class="metric-value">5.1M</div>
                                <div class="metric-label">Est. Views</div>
                            </div>
                            <div class="metric">
                                <div class="metric-value">18%</div>
                                <div class="metric-label">Engagement</div>
                            </div>
                            <div class="metric">
                                <div class="metric-value">120K</div>
                                <div class="metric-label">Shares</div>
                            </div>
                            <div class="metric">
                                <div class="metric-value">88%</div>
                                <div class="metric-label">Match Score</div>
                            </div>
                        </div>
                        <button class="select-btn" onclick="confirmSelection('viral')">
                            Select This Version
                        </button>
                    </div>
                    
                    <div class="variation-card" onclick="selectVariation(this)">
                        <span class="variation-type">BRAND AUTHENTIC</span>
                        <div class="variation-preview">
                            <span>▶</span>
                        </div>
                        <div class="metrics-grid">
                            <div class="metric">
                                <div class="metric-value">1.2M</div>
                                <div class="metric-label">Est. Views</div>
                            </div>
                            <div class="metric">
                                <div class="metric-value">8%</div>
                                <div class="metric-label">Engagement</div>
                            </div>
                            <div class="metric">
                                <div class="metric-value">15K</div>
                                <div class="metric-label">Shares</div>
                            </div>
                            <div class="metric">
                                <div class="metric-value">98%</div>
                                <div class="metric-label">Match Score</div>
                            </div>
                        </div>
                        <button class="select-btn" onclick="confirmSelection('brand')">
                            Select This Version
                        </button>
                    </div>
                </div>
            </div>
        </section>

        <!-- Select/Variation Details Section -->
        <section class="content-section" id="selectSection">
            <div class="section-inner">
                <div class="context-header">
                    <h2 class="context-title">Variation Details</h2>
                    <p class="context-subtitle">Review and finalize your selection</p>
                </div>
                
                <div class="variation-details">
                    <div class="video-preview-large">
                        <div class="play-button-large">▶</div>
                    </div>
                    
                    <button class="finalize-btn" onclick="finalizeRemix()">
                        FINALIZE REMIX
                    </button>
                </div>
            </div>
        </section>

        <!-- Success Section -->
        <section class="content-section" id="successSection">
            <div class="section-inner">
                <div class="success-content">
                    <div class="success-icon">✓</div>
                    <h2 class="context-title">Remix Complete!</h2>
                    <p class="context-subtitle">Your custom template is ready to use</p>
                    
                    <div class="success-buttons">
                        <button class="download-btn" onclick="downloadTemplate()">
                            DOWNLOAD TEMPLATE
                        </button>
                        <button class="insights-btn" onclick="viewInsights()">
                            VIEW PERFORMANCE INSIGHTS
                        </button>
                    </div>
                </div>
            </div>
        </section>

        <!-- AI Context Section -->
        <section class="content-section" id="aiContextSection">
            <div class="section-inner">
                <div class="ai-context">
                    <h2 class="ai-context-title">AI Context Detection</h2>
                    <p class="ai-context-subtitle">Our AI is analyzing your brand and optimizing your template</p>
                    
                    <div class="ai-detection-grid">
                        <div class="detection-item" id="brandDetection">
                            <div class="detection-icon">🎨</div>
                            <div class="detection-title">Brand Colors</div>
                            <div class="detection-value">Detecting...</div>
                        </div>
                        
                        <div class="detection-item" id="metricsDetection">
                            <div class="detection-icon">📊</div>
                            <div class="detection-title">Last Post Metrics</div>
                            <div class="detection-value">Analyzing...</div>
                        </div>
                        
                        <div class="detection-item" id="nicheDetection">
                            <div class="detection-icon">🎯</div>
                            <div class="detection-title">Niche Tags</div>
                            <div class="detection-value">Processing...</div>
                        </div>
                    </div>
                    
                    <button class="ai-generate-btn" id="aiGenerateBtn" onclick="startAIGeneration()">
                        CONTINUE AI GENERATION
                    </button>
                </div>
            </div>
        </section>

        <!-- AI Draft Section -->
        <section class="content-section" id="aiDraftSection">
            <div class="section-inner">
                <div class="ai-context">
                    <h2 class="ai-context-title">AI Content Draft</h2>
                    <p class="ai-context-subtitle">AI has generated your value content and script</p>
                    
                    <div class="ai-draft-container">
                        <div class="ai-draft-card">
                            <div class="draft-header">
                                <div class="draft-icon">📝</div>
                                <div class="draft-title">Generated Script</div>
                                <div class="draft-status">Ready</div>
                            </div>
                            <div class="draft-content">
                                <p>"Did you know that 90% of productivity tips don't work? Here are the 3 that actually do...</p>
                                <p>1. Time-blocking your calendar</p>
                                <p>2. The 2-minute rule</p>
                                <p>3. Batch processing similar tasks"</p>
                            </div>
                            <div class="draft-actions">
                                <button class="draft-action-btn">✏️ Edit</button>
                                <button class="draft-action-btn">🔄 Regenerate</button>
                                <button class="draft-action-btn">📏 Shorten</button>
                            </div>
                        </div>

                        <div class="ai-draft-card">
                            <div class="draft-header">
                                <div class="draft-icon">🎬</div>
                                <div class="draft-title">B-Roll Suggestions</div>
                                <div class="draft-status">Auto-matched</div>
                            </div>
                            <div class="broll-suggestions">
                                <div class="broll-item">Calendar app demo</div>
                                <div class="broll-item">Timer visualization</div>
                                <div class="broll-item">Task completion</div>
                                <div class="broll-item">Workspace shots</div>
                            </div>
                        </div>
                    </div>
                    
                    <button class="ai-generate-btn show" onclick="proceedToTune()">
                        PROCEED TO OPTIMIZATION
                    </button>
                </div>
            </div>
        </section>

        <!-- AI Tune Section -->
        <section class="content-section" id="aiTuneSection">
            <div class="section-inner">
                <div class="ai-context">
                    <h2 class="ai-context-title">AI Hook & CTA Optimization</h2>
                    <p class="ai-context-subtitle">Fine-tuning for maximum engagement</p>
                    
                    <div class="ai-tune-container">
                        <div class="tune-section">
                            <div class="tune-header">
                                <div class="tune-icon">🪝</div>
                                <div class="tune-title">Optimized Hook</div>
                                <div class="confidence-score">94% confidence</div>
                            </div>
                            <div class="tune-content">
                                <div class="hook-option selected">
                                    <div class="hook-text">"Stop wasting 3 hours daily on fake productivity"</div>
                                    <div class="hook-metrics">
                                        <span class="metric">+67% retention</span>
                                        <span class="metric">High urgency</span>
                                    </div>
                                </div>
                                <div class="hook-option">
                                    <div class="hook-text">"The productivity secret nobody talks about"</div>
                                    <div class="hook-metrics">
                                        <span class="metric">+43% retention</span>
                                        <span class="metric">Curiosity-driven</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="tune-section">
                            <div class="tune-header">
                                <div class="tune-icon">🎯</div>
                                <div class="tune-title">Call-to-Action</div>
                                <div class="confidence-score">89% confidence</div>
                            </div>
                            <div class="tune-content">
                                <div class="cta-preview-box">
                                    <div class="cta-text">"Save this for later productivity boost! 📚"</div>
                                    <div class="cta-timing">Appears at 80% of video</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <button class="ai-generate-btn show" onclick="proceedToPreview()">
                        GENERATE PREVIEW
                    </button>
                </div>
            </div>
        </section>

        <!-- AI Preview Section -->
        <section class="content-section" id="aiPreviewSection">
            <div class="section-inner">
                <div class="ai-context">
                    <h2 class="ai-context-title">AI-Generated Variations</h2>
                    <p class="ai-context-subtitle">Choose your preferred optimization</p>
                    
                    <div class="ai-variations-grid">
                        <div class="ai-variation-card" onclick="selectAIVariation(this)">
                            <div class="variation-badge">VIRAL OPTIMIZED</div>
                            <div class="ai-preview-window">
                                <div class="play-button">▶</div>
                            </div>
                            <div class="ai-metrics-grid">
                                <div class="ai-metric">
                                    <div class="ai-metric-value">8.2M</div>
                                    <div class="ai-metric-label">Projected Views</div>
                                </div>
                                <div class="ai-metric">
                                    <div class="ai-metric-value">94%</div>
                                    <div class="ai-metric-label">Hook Score</div>
                                </div>
                                <div class="ai-metric">
                                    <div class="ai-metric-value">23%</div>
                                    <div class="ai-metric-label">Est. Engagement</div>
                                </div>
                            </div>
                            <button class="ai-select-btn">Select This Version</button>
                        </div>

                        <div class="ai-variation-card" onclick="selectAIVariation(this)">
                            <div class="variation-badge">BRAND SAFE</div>
                            <div class="ai-preview-window">
                                <div class="play-button">▶</div>
                            </div>
                            <div class="ai-metrics-grid">
                                <div class="ai-metric">
                                    <div class="ai-metric-value">3.1M</div>
                                    <div class="ai-metric-label">Projected Views</div>
                                </div>
                                <div class="ai-metric">
                                    <div class="ai-metric-value">87%</div>
                                    <div class="ai-metric-label">Hook Score</div>
                                </div>
                                <div class="ai-metric">
                                    <div class="ai-metric-value">16%</div>
                                    <div class="ai-metric-label">Est. Engagement</div>
                                </div>
                            </div>
                            <button class="ai-select-btn">Select This Version</button>
                        </div>

                        <div class="ai-variation-card" onclick="selectAIVariation(this)">
                            <div class="variation-badge">CONVERSION FOCUSED</div>
                            <div class="ai-preview-window">
                                <div class="play-button">▶</div>
                            </div>
                            <div class="ai-metrics-grid">
                                <div class="ai-metric">
                                    <div class="ai-metric-value">1.8M</div>
                                    <div class="ai-metric-label">Projected Views</div>
                                </div>
                                <div class="ai-metric">
                                    <div class="ai-metric-value">82%</div>
                                    <div class="ai-metric-label">Hook Score</div>
                                </div>
                                <div class="ai-metric">
                                    <div class="ai-metric-value">31%</div>
                                    <div class="ai-metric-label">Click-through</div>
                                </div>
                            </div>
                            <button class="ai-select-btn">Select This Version</button>
                        </div>
                    </div>
                    
                    <button class="ai-generate-btn show" onclick="proceedToPublish()">
                        FINALIZE SELECTION
                    </button>
                </div>
            </div>
        </section>

        <!-- AI Publish Section -->
        <section class="content-section" id="aiPublishSection">
            <div class="section-inner">
                <div class="ai-context">
                    <h2 class="ai-context-title">Ready to Publish</h2>
                    <p class="ai-context-subtitle">Your AI-optimized remix is complete</p>
                    
                    <div class="ai-final-preview">
                        <div class="final-preview-window">
                            <div class="play-button-large">▶</div>
                        </div>
                        
                        <div class="final-stats">
                            <div class="final-stat">
                                <div class="stat-icon">🚀</div>
                                <div class="stat-info">
                                    <div class="stat-title">Viral Potential</div>
                                    <div class="stat-value">8.2M projected views</div>
                                </div>
                            </div>
                            <div class="final-stat">
                                <div class="stat-icon">🎯</div>
                                <div class="stat-info">
                                    <div class="stat-title">Hook Effectiveness</div>
                                    <div class="stat-value">94% retention score</div>
                                </div>
                            </div>
                            <div class="final-stat">
                                <div class="stat-icon">💡</div>
                                <div class="stat-info">
                                    <div class="stat-title">AI Optimizations</div>
                                    <div class="stat-value">12 improvements applied</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="ai-publish-actions">
                        <button class="ai-publish-btn" onclick="publishAIRemix()">
                            🚀 PUBLISH NOW
                        </button>
                        <button class="ai-download-btn" onclick="downloadAIRemix()">
                            📥 DOWNLOAD TEMPLATE
                        </button>
                    </div>
                </div>
            </div>
        </section>

    </div>

    <!-- AI Assistant -->
    <div class="ai-assistant collapsed" id="aiAssistant" onclick="toggleAIAssistant(event)">
        <div class="ai-collapsed-icon">🤖</div>
        <div class="ai-expanded-content">
            <div class="ai-header">
                <div class="ai-header-left">
                    <div class="ai-icon">🤖</div>
                    <div class="ai-name">AI Assistant</div>
                </div>
                <div class="ai-close" onclick="toggleAIAssistant(event)">×</div>
            </div>
            <div class="ai-message" id="aiMessage">
                I'm here to help you create the perfect remix! Start by selecting a template.
            </div>
        </div>
    </div>

    <!-- Loading Overlay -->
    <div class="loading-overlay" id="loadingOverlay">
        <div class="loading-content">
            <div class="loading-orb">
                <div class="orb"></div>
            </div>
            <div class="loading-text" id="loadingText">Processing...</div>
            <div class="loading-subtext" id="loadingSubtext">Please wait</div>
        </div>
    </div>

    <script>
        // Global Variables
        let selectedTemplate = null;
        let selectedPath = null;
        let currentSection = 'discover';
        let contextData = {
            niche: '',
            audience: '',
            product: '',
            goal: ''
        };
        let buildingScore = 0;
        let remixSelections = {
            music: null,
            visual: null,
            hook: null,
            value: null,
            format: null,
            authority: null,
            cta: null,
            seo: null
        };

        // Template Selection Function
        function selectTemplate(templateId) {
            selectedTemplate = templateId;
            showLoading('Analyzing template...', 'Preparing path selection');
            
            setTimeout(() => {
                hideLoading();
                moveToSection('path');
                showAIAssistant();
                updateAIMessage('Great choice! Now choose how you\'d like to create your remix.');
            }, 1500);
        }

        // Path Selection Function
        function selectPath(pathType) {
            selectedPath = pathType;
            showLoading('Initializing ' + (pathType === 'ai' ? 'AI' : 'manual') + ' workflow...', 'Setting up your experience');
            
            setTimeout(() => {
                hideLoading();
                
                if (pathType === 'ai') {
                    // Switch to AI progress bar
                    switchToAIProgress();
                    moveToSection('aiContext');
                    updateAIMessage('AI mode activated! I\'ll automatically detect your context and generate variations.');
                    startAIContextDetection();
                } else {
                    // Continue with manual flow
                    moveToSection('context');
                    updateAIMessage('Manual mode selected! Let\'s gather your context for customization.');
                }
            }, 1000);
        }

        // Switch Progress Bars
        function switchToAIProgress() {
            const manualSteps = document.getElementById('manualProgressSteps');
            const aiSteps = document.getElementById('aiProgressSteps');
            
            manualSteps.classList.add('hidden');
            aiSteps.classList.add('active');
        }

        // AI Context Detection
        function startAIContextDetection() {
            const detectionItems = ['brandDetection', 'metricsDetection', 'nicheDetection'];
            const detectionData = [
                { value: 'Purple & Pink detected', delay: 1000 },
                { value: '2.3M avg views', delay: 2000 },
                { value: 'Tech & Productivity', delay: 3000 }
            ];
            
            detectionItems.forEach((itemId, index) => {
                setTimeout(() => {
                    const item = document.getElementById(itemId);
                    item.classList.add('active');
                    item.querySelector('.detection-value').textContent = detectionData[index].value;
                    
                    if (index === detectionItems.length - 1) {
                        setTimeout(() => {
                            document.getElementById('aiGenerateBtn').classList.add('show');
                        }, 500);
                    }
                }, detectionData[index].delay);
            });
        }

        // Start AI Generation
        function startAIGeneration() {
            showLoading('AI generating variations...', 'This will take about 45 seconds');
            
            setTimeout(() => {
                hideLoading();
                updateAIProgressStep('generate');
                moveToSection('aiDraft');
                updateAIMessage('AI has generated your content! Review and make adjustments if needed.');
            }, 4000);
        }

        // Update AI Progress Steps
        function updateAIProgressStep(stepName) {
            const steps = document.querySelectorAll('#aiProgressSteps .progress-step');
            const stepOrder = ['context', 'generate', 'draft', 'tune', 'preview', 'publish'];
            const currentIndex = stepOrder.indexOf(stepName);
            
            steps.forEach((step, index) => {
                step.classList.remove('active', 'completed');
                
                if (index < currentIndex) {
                    step.classList.add('completed');
                } else if (index === currentIndex) {
                    step.classList.add('active');
                }
            });
        }

        // AI Draft Functions
        function proceedToTune() {
            showLoading('Optimizing hooks and CTAs...', 'AI is fine-tuning your content');
            
            setTimeout(() => {
                hideLoading();
                updateAIProgressStep('tune');
                moveToSection('aiTune');
                updateAIMessage('Content optimized! AI has enhanced your hooks and calls-to-action.');
            }, 2000);
        }

        // AI Tune Functions
        function proceedToPreview() {
            showLoading('Generating preview variations...', 'Creating your final options');
            
            setTimeout(() => {
                hideLoading();
                updateAIProgressStep('preview');
                moveToSection('aiPreview');
                updateAIMessage('Here are your AI-optimized variations! Choose your favorite.');
            }, 2500);
        }

        // AI Preview Functions
        function selectAIVariation(element) {
            document.querySelectorAll('.ai-variation-card').forEach(el => el.classList.remove('selected'));
            element.classList.add('selected');
        }

        function proceedToPublish() {
            showLoading('Preparing final remix...', 'Almost ready!');
            
            setTimeout(() => {
                hideLoading();
                updateAIProgressStep('publish');
                moveToSection('aiPublish');
                updateAIMessage('Your AI-generated remix is ready! Publish or download now.');
            }, 1500);
        }

        // AI Publish Functions
        function publishAIRemix() {
            showLoading('Publishing your remix...', 'Sharing with the world');
            
            setTimeout(() => {
                hideLoading();
                updateAIMessage('Congratulations! Your AI remix has been published successfully.');
            }, 2000);
        }

        function downloadAIRemix() {
            updateAIMessage('Downloading your AI-generated template...');
        }

        // Manual Context Functions (FROM FILE 1)
        function handleInput(field) {
            const input = document.getElementById(field + 'Input');
            const group = document.getElementById(field + 'Group');
            
            if (input.value.trim()) {
                contextData[field] = input.value.trim();
                input.classList.add('completed');
                group.classList.add('completed');
                createCelebration(input);
                activateNextField(field);
                checkContextCompletion();
            } else {
                input.classList.remove('completed');
                group.classList.remove('completed');
            }
        }

        function toggleDropdown() {
            const dropdown = document.getElementById('goalDropdown');
            dropdown.classList.toggle('open');
        }

        function selectGoal(goal) {
            contextData.goal = goal;
            document.getElementById('goalInput').value = goal;
            document.getElementById('goalInput').classList.add('completed');
            document.getElementById('goalGroup').classList.add('completed');
            document.getElementById('goalDropdown').classList.remove('open');
            createCelebration(document.getElementById('goalInput'));
            checkContextCompletion();
        }

        function activateNextField(currentField) {
            const fields = ['niche', 'audience', 'product', 'goal'];
            const currentIndex = fields.indexOf(currentField);
            
            if (currentIndex < fields.length - 1) {
                const nextField = fields[currentIndex + 1];
                const nextGroup = document.getElementById(nextField + 'Group');
                nextGroup.classList.add('active');
            }
        }

        function checkContextCompletion() {
            const allFieldsComplete = Object.values(contextData).every(value => value !== '');
            
            if (allFieldsComplete) {
                const generateBtn = document.getElementById('generateBtn');
                generateBtn.classList.add('show');
                updateAIMessage('Perfect! All set. Click "GENERATE MY REMIX" to continue.');
            }
        }

        function moveToRemixStudio() {
            showLoading('Generating your remix studio...', 'Analyzing your inputs');
            
            setTimeout(() => {
                hideLoading();
                moveToSection('remix');
                document.getElementById('buildingScore').style.display = 'block';
                updateBuildingScore();
                updateAIMessage('Welcome to the Remix Studio! Customize each element to create your perfect video.');
            }, 2000);
        }

        function generateVariations() {
            const loadingMessages = [
                { text: 'Analyzing your selections...', subtext: 'Understanding your preferences' },
                { text: 'Applying AI optimizations...', subtext: 'Enhancing for maximum impact' },
                { text: 'Generating variations...', subtext: 'Creating unique versions' },
                { text: 'Calculating viral potential...', subtext: 'Almost ready!' }
            ];
            
            let messageIndex = 0;
            showLoading(loadingMessages[0].text, loadingMessages[0].subtext);
            
            const messageInterval = setInterval(() => {
                messageIndex++;
                if (messageIndex < loadingMessages.length) {
                    updateLoadingMessage(loadingMessages[messageIndex].text, loadingMessages[messageIndex].subtext);
                }
            }, 1500);
            
            setTimeout(() => {
                clearInterval(messageInterval);
                hideLoading();
                moveToSection('preview');
                updateAIMessage('Here are your AI-generated variations! Each is optimized for different goals.');
            }, 6000);
        }

        function updateBuildingScore() {
            const totalSelections = Object.keys(remixSelections).length;
            const madeSelections = Object.values(remixSelections).filter(v => v !== null && v !== false).length;
            const score = Math.round((madeSelections / totalSelections) * 100);
            
            buildingScore = score;
            const scoreElement = document.getElementById('scoreValue');
            scoreElement.textContent = score + '%';
            
            if (score === 100) {
                updateAIMessage('Excellent! Your remix is fully customized. Generate variations when ready!');
            } else if (score >= 75) {
                updateAIMessage('Almost there! Just a few more tweaks to perfect your remix.');
            } else if (score >= 50) {
                updateAIMessage('Great progress! Keep customizing to unlock the full potential.');
            }
        }

        function createCelebration(element) {
            const rect = element.getBoundingClientRect();
            const celebration = document.createElement('div');
            celebration.className = 'celebration';
            celebration.textContent = '+25 points!';
            celebration.style.left = rect.left + rect.width / 2 + 'px';
            celebration.style.top = rect.top + 'px';
            document.body.appendChild(celebration);
            
            setTimeout(() => celebration.remove(), 3000);
        }

        // Section Navigation
        function moveToSection(sectionName) {
            // Hide all sections first
            const allSections = document.querySelectorAll('.content-section');
            allSections.forEach(section => {
                section.classList.remove('visible');
                section.classList.add('hidden');
            });
            
            // Show target section
            const targetSection = document.getElementById(sectionName + 'Section');
            targetSection.classList.remove('hidden');
            targetSection.classList.add('visible');
            
            currentSection = sectionName;
            
            // Update progress bar
            updateProgressBar();
            
            // Auto-scroll to section
            setTimeout(() => {
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }

        function updateProgressBar() {
            if (selectedPath === 'ai') {
                return; // AI progress is handled separately
            }
            
            const steps = document.querySelectorAll('#manualProgressSteps .progress-step');
            const sectionOrder = ['discover', 'path', 'context', 'remix', 'preview', 'select', 'success'];
            const currentIndex = sectionOrder.indexOf(currentSection);
            
            steps.forEach((step, index) => {
                step.classList.remove('active', 'completed');
                
                if (index < currentIndex) {
                    step.classList.add('completed');
                } else if (index === currentIndex) {
                    step.classList.add('active');
                }
            });
        }

        // AI Assistant Functions
        function showAIAssistant() {
            const assistant = document.getElementById('aiAssistant');
            assistant.classList.add('visible');
        }

        function toggleAIAssistant(event) {
            event.stopPropagation();
            const assistant = document.getElementById('aiAssistant');
            
            if (assistant.classList.contains('collapsed')) {
                assistant.classList.remove('collapsed');
                assistant.classList.add('expanded');
            } else {
                assistant.classList.remove('expanded');
                assistant.classList.add('collapsed');
            }
        }

        function updateAIMessage(message) {
            document.getElementById('aiMessage').textContent = message;
        }

        // Loading Functions
        function showLoading(text, subtext) {
            const overlay = document.getElementById('loadingOverlay');
            document.getElementById('loadingText').textContent = text;
            document.getElementById('loadingSubtext').textContent = subtext;
            overlay.classList.add('active');
        }

        function hideLoading() {
            document.getElementById('loadingOverlay').classList.remove('active');
        }

        function updateLoadingMessage(text, subtext) {
            document.getElementById('loadingText').textContent = text;
            document.getElementById('loadingSubtext').textContent = subtext;
        }

        // Manual Remix Studio Functions (FROM FILE 1)
        function toggleSection(sectionId) {
            const section = document.getElementById(sectionId);
            section.classList.toggle('collapsed');
            updateBuildingScore();
        }

        function initializeRemixSections() {
            const sections = document.querySelectorAll('.remix-section');
            sections.forEach((section, index) => {
                if (index > 0) {
                    section.classList.add('collapsed');
                }
            });
        }

        function selectTrack(element) {
            document.querySelectorAll('.track-option').forEach(el => el.classList.remove('selected'));
            element.classList.add('selected');
            remixSelections.music = element.querySelector('.track-name').textContent;
            updateBuildingScore();
        }

        function selectMood(element) {
            document.querySelectorAll('.mood-preset').forEach(el => el.classList.remove('selected'));
            element.classList.add('selected');
            remixSelections.visual = element.textContent;
            updateBuildingScore();
        }

        function selectOverlay(element) {
            document.querySelectorAll('.overlay-option').forEach(el => el.classList.remove('selected'));
            element.classList.add('selected');
            remixSelections.hook = element.textContent;
            updateBuildingScore();
        }

        function selectRamp(element) {
            document.querySelectorAll('.ramp-preset').forEach(el => el.classList.remove('selected'));
            element.classList.add('selected');
            remixSelections.format = element.textContent;
            updateBuildingScore();
        }

        function selectAspect(element) {
            document.querySelectorAll('.aspect-option').forEach(el => el.classList.remove('selected'));
            element.classList.add('selected');
            updateBuildingScore();
        }

        function selectAuthority(element) {
            element.classList.toggle('selected');
            remixSelections.authority = document.querySelectorAll('.authority-chip.selected').length > 0;
            updateBuildingScore();
        }

        function selectCTA(element) {
            document.querySelectorAll('.cta-template').forEach(el => el.classList.remove('selected'));
            element.classList.add('selected');
            remixSelections.cta = element.querySelector('.cta-preview').textContent;
            updateBuildingScore();
        }

        function selectAnimation(element) {
            document.querySelectorAll('.animation-style').forEach(el => el.classList.remove('selected'));
            element.classList.add('selected');
            updateBuildingScore();
        }

        function selectHashtagPack(element) {
            document.querySelectorAll('.hashtag-pack').forEach(el => el.classList.remove('selected'));
            element.classList.add('selected');
            remixSelections.seo = element.querySelector('.pack-name').textContent;
            updateBuildingScore();
        }

        function selectVariation(element) {
            document.querySelectorAll('.variation-card').forEach(el => el.classList.remove('selected'));
            element.classList.add('selected');
        }

        function confirmSelection(type) {
            showLoading('Preparing your remix...', 'Finalizing details');
            
            setTimeout(() => {
                hideLoading();
                moveToSection('select');
                updateAIMessage('Review your remixed video and finalize when ready.');
            }, 2000);
        }

        function finalizeRemix() {
            showLoading('Saving your remix...', 'Almost done!');
            
            setTimeout(() => {
                hideLoading();
                moveToSection('success');
                createConfetti();
                updateAIMessage('Congratulations! Your remix is complete. Download or view insights.');
            }, 2000);
        }

        function downloadTemplate() {
            updateAIMessage('Downloading your template...');
        }

        function viewInsights() {
            updateAIMessage('Opening performance insights...');
        }

        function createConfetti() {
            const colors = ['#7b61ff', '#ff61a6', '#00ff00', '#00bcd4', '#ff6b6b'];
            
            for (let i = 0; i < 100; i++) {
                setTimeout(() => {
                    const confetti = document.createElement('div');
                    confetti.className = 'confetti';
                    confetti.style.left = Math.random() * window.innerWidth + 'px';
                    confetti.style.top = -10 + 'px';
                    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                    confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
                    document.body.appendChild(confetti);
                    
                    setTimeout(() => confetti.remove(), 3000);
                }, i * 30);
            }
        }

        // Initialize when DOM is loaded
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize with discover section visible
            document.getElementById('discoverSection').classList.add('visible');
            initializeRemixSections();
        });
    </script>
</body>
</html> 