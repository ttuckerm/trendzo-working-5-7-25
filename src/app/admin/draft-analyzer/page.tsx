'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DraftAnalyzerPage() {
  const { user, isAdmin } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        setUploadedFile(file);
        // TODO: Process the video file
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('video/')) {
        setUploadedFile(file);
        // TODO: Process the video file
      }
    }
  };

  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="mx-auto max-w-md p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center mb-4">Admin Access Required</h1>
          <p className="text-gray-600 mb-6 text-center">
            You need to be logged in as an admin to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-red-500 to-red-300 bg-clip-text text-transparent">
            My Drafts Analyzer
          </h1>
          <p className="text-gray-400 text-lg">
            Upload and analyze your draft content for viral potential
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Upload Zone - 45% */}
          <div className="lg:col-span-5">
            <Card className="bg-gray-900 border-gray-800 h-full">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <span className="text-2xl">📁</span>
                  Upload Draft
                </CardTitle>
              </CardHeader>
              <CardContent className="h-full">
                <div
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors h-96 flex flex-col items-center justify-center ${
                    dragActive
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileInput}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  
                  {uploadedFile ? (
                    <div className="text-center">
                      <div className="text-6xl mb-4">🎬</div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {uploadedFile.name}
                      </h3>
                      <p className="text-gray-400 mb-4">
                        {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                      <Button
                        onClick={() => setUploadedFile(null)}
                        variant="outline"
                        size="sm"
                        className="border-gray-600 text-gray-300 hover:border-red-500 hover:text-white"
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-6xl mb-4">☁️</div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Drag & drop your video
                      </h3>
                      <p className="text-gray-400 mb-4">
                        or click to browse files
                      </p>
                      <div className="text-sm text-gray-500">
                        Supported: MP4, MOV, AVI, WEBM
                      </div>
                    </div>
                  )}
                </div>

                {uploadedFile && (
                  <div className="mt-6">
                    <Button
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                      disabled
                    >
                      <span className="mr-2">🔍</span>
                      Analyze Draft
                      <span className="ml-2 text-xs">(Coming Soon)</span>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Analysis Results - 55% */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 gap-6 h-full">
              {/* Probability */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <span className="text-2xl">🎯</span>
                    Viral Probability
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="text-4xl mb-4">📊</div>
                    <h3 className="text-lg font-semibold text-gray-400 mb-2">
                      Upload a video to see probability analysis
                    </h3>
                    <p className="text-gray-500 text-sm">
                      AI-powered prediction of viral potential based on content analysis
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Template Match */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <span className="text-2xl">🔗</span>
                    Template Match
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="text-4xl mb-4">🧩</div>
                    <h3 className="text-lg font-semibold text-gray-400 mb-2">
                      No template matches found
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Similar viral templates and content patterns will be shown here
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Fix List */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <span className="text-2xl">🔧</span>
                    Fix List
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="text-4xl mb-4">📝</div>
                    <h3 className="text-lg font-semibold text-gray-400 mb-2">
                      No optimization suggestions yet
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Actionable improvements and viral optimization tips will appear here
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Feature Preview */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6">Coming Soon</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gray-900 border-gray-800 opacity-60">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <span>🎨</span>
                  Visual Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 text-sm">
                  Frame-by-frame analysis of visual elements, composition, and aesthetics
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800 opacity-60">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <span>🎵</span>
                  Audio Optimization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 text-sm">
                  Sound quality, music matching, and audio engagement analysis
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800 opacity-60">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <span>📱</span>
                  Platform Optimization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 text-sm">
                  Platform-specific recommendations for TikTok, Instagram, YouTube
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}