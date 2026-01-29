'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from './ManualAnalysis.module.css';

export default function ManualAnalysis() {
  const router = useRouter();
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileUpload = (file: File) => {
    // Validate file type
    const validTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/avi'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid video file (MP4, WebM, MOV, AVI)');
      return;
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      alert('File size must be less than 100MB');
      return;
    }

    setUploadedFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleAnalyze = () => {
    if (!uploadedFile) return;
    
    setIsAnalyzing(true);
    
    // Simulate analysis delay
    setTimeout(() => {
      // Store analysis data and redirect to viral DNA analysis
      localStorage.setItem('uploadedVideoName', uploadedFile.name);
      localStorage.setItem('analysisType', 'manual');
      router.push('/sandbox/viral-lab-v2');
    }, 3000);
  };

  const handleBack = () => {
    router.push('/viral-lab-entry');
  };

  return (
    <div className={styles.analysisContainer}>
      {/* Background Effects */}
      <div className={styles.backgroundGradient}></div>
      
      {/* Header */}
      <div className={styles.analysisHeader}>
        <button 
          className={styles.backButton}
          onClick={handleBack}
          aria-label="Go back"
        >
          ← Back
        </button>
        
        <div className={styles.headerContent}>
          <h1 className={styles.analysisTitle}>Deep Dive Analysis</h1>
          <p className={styles.analysisSubtitle}>
            Upload YOUR video for comprehensive viral DNA breakdown and instant success predictions
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {!uploadedFile ? (
          /* Upload Interface */
          <div className={styles.uploadSection}>
            <div 
              className={`${styles.uploadArea} ${dragActive ? styles.dragActive : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className={styles.uploadIcon}>🧪</div>
              <h2 className={styles.uploadTitle}>Drop your video here</h2>
              <p className={styles.uploadDescription}>
                Or click to browse and select your video file
              </p>
              
              <input
                type="file"
                accept="video/*"
                onChange={handleFileInput}
                className={styles.fileInput}
                id="video-upload"
              />
              
              <label htmlFor="video-upload" className={styles.uploadButton}>
                Browse Files
              </label>
              
              <div className={styles.uploadSpecs}>
                <div className={styles.spec}>
                  <span className={styles.specIcon}>📱</span>
                  <span className={styles.specText}>MP4, WebM, MOV, AVI</span>
                </div>
                <div className={styles.spec}>
                  <span className={styles.specIcon}>⚡</span>
                  <span className={styles.specText}>Max 100MB</span>
                </div>
                <div className={styles.spec}>
                  <span className={styles.specIcon}>🎯</span>
                  <span className={styles.specText}>Any duration</span>
                </div>
              </div>
            </div>

            {/* Features Preview */}
            <div className={styles.featuresGrid}>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>🧬</div>
                <h3 className={styles.featureTitle}>Viral DNA Sequencing</h3>
                <p className={styles.featureDescription}>
                  Identify the exact elements that make content go viral
                </p>
              </div>
              
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>⚡</div>
                <h3 className={styles.featureTitle}>Hook Power Analysis</h3>
                <p className={styles.featureDescription}>
                  Analyze the first 3 seconds for maximum engagement
                </p>
              </div>
              
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>📊</div>
                <h3 className={styles.featureTitle}>Retention Optimization</h3>
                <p className={styles.featureDescription}>
                  Discover exactly where viewers drop off
                </p>
              </div>
              
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>👤</div>
                <h3 className={styles.featureTitle}>Creator Fingerprinting</h3>
                <p className={styles.featureDescription}>
                  Build YOUR unique success pattern profile
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Analysis Interface */
          <div className={styles.analysisSection}>
            {/* File Preview */}
            <div className={styles.filePreview}>
              <div className={styles.fileIcon}>🎬</div>
              <div className={styles.fileInfo}>
                <div className={styles.fileName}>{uploadedFile.name}</div>
                <div className={styles.fileSize}>
                  {(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB
                </div>
              </div>
              <button 
                className={styles.removeFile}
                onClick={() => setUploadedFile(null)}
                aria-label="Remove file"
              >
                ✕
              </button>
            </div>

            {!isAnalyzing ? (
              /* Ready to Analyze */
              <div className={styles.readySection}>
                <div className={styles.readyIcon}>🚀</div>
                <h2 className={styles.readyTitle}>Ready for Analysis</h2>
                <p className={styles.readyDescription}>
                  Our AI will analyze your video's viral potential and provide detailed insights
                </p>
                
                <div className={styles.analysisPreview}>
                  <div className={styles.previewItem}>
                    <span className={styles.previewIcon}>⏱</span>
                    <span className={styles.previewText}>Analysis Time: ~30 seconds</span>
                  </div>
                  <div className={styles.previewItem}>
                    <span className={styles.previewIcon}>🎯</span>
                    <span className={styles.previewText}>Viral Score: 0-100%</span>
                  </div>
                  <div className={styles.previewItem}>
                    <span className={styles.previewIcon}>📈</span>
                    <span className={styles.previewText}>Optimization Tips: Personalized</span>
                  </div>
                </div>

                <button 
                  className={styles.analyzeButton}
                  onClick={handleAnalyze}
                >
                  <span className={styles.buttonText}>Start Analysis</span>
                  <span className={styles.buttonArrow}>→</span>
                </button>
              </div>
            ) : (
              /* Analyzing State */
              <div className={styles.analyzingSection}>
                <div className={styles.analyzerLoader}>
                  <div className={styles.loaderCircle}></div>
                  <div className={styles.loaderIcon}>🧪</div>
                </div>
                
                <h2 className={styles.analyzingTitle}>Analyzing YOUR Video...</h2>
                <p className={styles.analyzingDescription}>
                  Our AI is examining viral patterns, hook effectiveness, and audience engagement triggers
                </p>
                
                <div className={styles.analysisSteps}>
                  <div className={styles.analysisStep}>
                    <span className={styles.stepIcon}>✓</span>
                    <span className={styles.stepText}>Processing video content</span>
                  </div>
                  <div className={styles.analysisStep}>
                    <span className={styles.stepIcon}>⚡</span>
                    <span className={styles.stepText}>Analyzing viral DNA patterns</span>
                  </div>
                  <div className={styles.analysisStep}>
                    <span className={styles.stepIcon}>🎯</span>
                    <span className={styles.stepText}>Calculating success probability</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}