"use client"

import React, { useState } from "react";
import { 
  Save, 
  Undo, 
  Redo, 
  Play, 
  Pause, 
  Copy, 
  Trash2, 
  LayoutGrid, 
  Plus, 
  Settings, 
  Share2, 
  Download, 
  Eye as EyeIcon,
  Edit,
  Image,
  Type,
  Video,
  Music,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

// Define types
type SectionType = "intro" | "body" | "callToAction";

interface Section {
  id: string;
  name: string;
  duration: number;
  type: SectionType;
}

interface TextElement {
  id: string;
  type: "text";
  content: string;
}

interface ImageElement {
  id: string;
  type: "image";
  src: string;
}

type Element = TextElement | ImageElement;

export default function EditorDemoPage() {
  // Demo state
  const [activeElement, setActiveElement] = useState<string | null>(null);
  const [showProperty, setShowProperty] = useState(true);
  const [selectedSection, setSelectedSection] = useState("section1");
  
  // Mock sections
  const sections: Section[] = [
    { id: "section1", name: "Introduction", duration: 5, type: "intro" },
    { id: "section2", name: "Main Content", duration: 10, type: "body" },
    { id: "section3", name: "Call to Action", duration: 3, type: "callToAction" }
  ];
  
  // Mock elements
  const elements: Element[] = [
    { id: "elem1", type: "text", content: "Welcome to our brand!" },
    { id: "elem2", type: "image", src: "https://via.placeholder.com/300" },
    { id: "elem3", type: "text", content: "Learn more about our products" }
  ];
  
  // Color mapping for section types
  const sectionColors: Record<SectionType, string> = {
    intro: "bg-blue-500",
    body: "bg-green-500",
    callToAction: "bg-red-500"
  };
  
  return (
    <div className="h-screen w-full flex flex-col">
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between h-16">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold">Template Editor Demo</h1>
        </div>
        <div className="flex items-center space-x-4">
          <a href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
            Return to Dashboard
          </a>
        </div>
      </header>
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="h-14 border-b bg-white flex items-center justify-between px-4">
          <div className="flex items-center space-x-1">
            <button className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100">
              <EyeIcon size={18} />
            </button>
            <div className="h-6 border-l mx-2"></div>
            <button className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100" disabled>
              <Undo size={18} />
            </button>
            <button className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100" disabled>
              <Redo size={18} />
            </button>
            <div className="h-6 border-l mx-2"></div>
            <button className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100">
              <Plus size={18} />
            </button>
          </div>
          
          <div>
            <h2 className="text-base font-medium">Demo Template</h2>
          </div>
          
          <div className="flex items-center space-x-1">
            <button className="p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
              <Save size={18} />
            </button>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1 flex">
          {/* Canvas */}
          <div 
            className="flex-1 bg-gray-200 flex items-center justify-center"
            onClick={() => setActiveElement(null)}
          >
            <div className="bg-white w-[320px] h-[570px] rounded-lg shadow-lg relative">
              <div className="p-4">
                {elements.map(element => (
                  <div 
                    key={element.id}
                    className={`my-2 p-2 border-2 rounded cursor-pointer hover:bg-blue-50 ${activeElement === element.id ? 'border-blue-500' : 'border-transparent'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveElement(element.id);
                    }}
                  >
                    {element.type === "text" && (
                      <p>{element.content}</p>
                    )}
                    {element.type === "image" && (
                      <img src={element.src} alt="Element" className="max-w-full" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Property editor */}
          {showProperty && (
            <div className="w-80 border-l bg-white overflow-y-auto">
              <div className="flex items-center justify-between border-b px-4 py-2 h-14">
                <div className="flex space-x-1">
                  <button className="p-2 rounded-md text-sm font-medium bg-blue-50 text-blue-600">
                    <LayoutGrid size={16} className="mr-1" />
                    Elements
                  </button>
                  
                  <button className="p-2 rounded-md text-sm font-medium text-gray-500 hover:bg-gray-100">
                    <Settings size={16} className="mr-1" />
                    Properties
                  </button>
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-medium text-base mb-3">Add Elements</h3>
                
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { type: "text", name: "Text", icon: <Type size={20} /> },
                    { type: "image", name: "Image", icon: <Image size={20} /> },
                    { type: "video", name: "Video", icon: <Video size={20} /> },
                    { type: "audio", name: "Audio", icon: <Music size={20} /> }
                  ].map(category => (
                    <button
                      key={category.type}
                      className="flex flex-col items-center justify-center p-3 bg-white border rounded-md hover:bg-gray-50"
                    >
                      <div className="w-10 h-10 flex items-center justify-center text-gray-600 mb-2">
                        {category.icon}
                      </div>
                      <span className="text-sm">{category.name}</span>
                    </button>
                  ))}
                </div>
                
                <div className="mt-6">
                  <h3 className="font-medium text-base mb-3">Section Elements</h3>
                  
                  <div className="space-y-2">
                    {elements.map(element => (
                      <div 
                        key={element.id}
                        className={`p-3 border rounded-md cursor-pointer hover:bg-gray-50 ${activeElement === element.id ? 'border-blue-500 bg-blue-50' : ''}`}
                        onClick={() => setActiveElement(element.id)}
                      >
                        <div className="flex items-center">
                          {element.type === "text" && <Type size={16} className="mr-2 text-gray-500" />}
                          {element.type === "image" && <Image size={16} className="mr-2 text-gray-500" />}
                          
                          <span className="text-sm truncate flex-1">
                            {element.type === "text" 
                              ? (element as TextElement).content.substring(0, 20) + ((element as TextElement).content.length > 20 ? '...' : '') 
                              : `${element.type.charAt(0).toUpperCase() + element.type.slice(1)} Element`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Timeline */}
        <div className="h-20 border-t bg-white flex flex-col">
          {/* Section tabs */}
          <div className="flex items-center px-4 h-8 border-b border-gray-100">
            {sections.map((section) => (
              <button
                key={section.id}
                className={`flex items-center px-3 h-7 text-xs rounded-t-md mr-1 ${selectedSection === section.id ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'}`}
                onClick={() => setSelectedSection(section.id)}
              >
                <span className={`w-2 h-2 rounded-full ${sectionColors[section.type]} mr-2`}></span>
                <span>
                  {section.name}
                </span>
                <span className="ml-2 text-gray-400 flex items-center">
                  {section.duration}s
                </span>
              </button>
            ))}
            
            <button className="flex items-center px-2 h-7 text-xs text-gray-600 hover:bg-gray-50 rounded-md">
              <Plus size={14} className="mr-1" />
              Add Section
            </button>
          </div>
          
          {/* Timeline visualization */}
          <div className="flex-1 flex items-center px-4">
            <button className="p-1 rounded-full hover:bg-gray-100 mr-2">
              <ChevronLeft size={18} />
            </button>
            
            <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden relative">
              {/* Timeline sections */}
              <div className="flex h-full">
                {sections.map((section) => {
                  const width = (section.duration / sections.reduce((sum, s) => sum + s.duration, 0)) * 100;
                  return (
                    <div
                      key={section.id}
                      className={`h-full relative ${sectionColors[section.type]} ${selectedSection === section.id ? 'opacity-100' : 'opacity-80'}`}
                      style={{ width: `${width}%` }}
                      onClick={() => setSelectedSection(section.id)}
                    >
                      <div className="absolute right-0 top-0 bottom-0 w-px bg-white"></div>
                      
                      {width > 10 && (
                        <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium">
                          {section.duration}s
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Playhead */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-md"
                style={{ left: '30%' }}
              />
            </div>
            
            <button className="p-1 rounded-full hover:bg-gray-100 ml-2">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
} 