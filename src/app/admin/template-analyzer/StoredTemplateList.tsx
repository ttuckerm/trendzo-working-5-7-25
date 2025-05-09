'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { TrendingTemplate } from '@/lib/types/trendingTemplate';

export default function StoredTemplateList() {
  const [templates, setTemplates] = useState<TrendingTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Fetch templates from Firebase
  useEffect(() => {
    async function fetchTemplates() {
      try {
        setLoading(true);
        const templatesRef = collection(db, 'templates');
        const q = query(templatesRef, orderBy('createdAt', 'desc'), limit(10));
        const querySnapshot = await getDocs(q);
        
        const templatesData: TrendingTemplate[] = [];
        querySnapshot.forEach((doc) => {
          templatesData.push({ id: doc.id, ...doc.data() } as TrendingTemplate);
        });
        
        setTemplates(templatesData);
        setError(null);
      } catch (err) {
        console.error('Error fetching templates:', err);
        setError('Failed to load stored templates. Check console for details.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchTemplates();
  }, []);

  // Delete a template from Firebase
  const deleteTemplate = async (templateId: string) => {
    if (!templateId) return;
    
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }
    
    try {
      setIsDeleting(templateId);
      const templateRef = doc(db, 'templates', templateId);
      await deleteDoc(templateRef);
      
      // Update local state
      setTemplates(templates.filter(t => t.id !== templateId));
      console.log(`Template ${templateId} deleted successfully`);
    } catch (err) {
      console.error(`Error deleting template ${templateId}:`, err);
      setError(`Failed to delete template ${templateId}`);
    } finally {
      setIsDeleting(null);
    }
  };

  // Format date string
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="text-lg font-medium">Stored Templates</h3>
        <div className="mt-4 flex items-center">
          <div className="animate-spin h-5 w-5 mr-3 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
          <p>Loading stored templates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="text-lg font-medium">Stored Templates</h3>
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h3 className="text-lg font-medium">Stored Templates</h3>
      
      {templates.length === 0 ? (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
          <p className="text-gray-700">No templates stored yet. Analyze a video to create a template.</p>
        </div>
      ) : (
        <div className="mt-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Template ID
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stats
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {templates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {template.id}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {template.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {template.title}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(template.createdAt)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-500">
                      <div className="flex flex-col items-end space-y-1">
                        <span>{template.stats.views.toLocaleString()} views</span>
                        <span>{template.stats.likes.toLocaleString()} likes</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                      <button
                        className="text-red-600 hover:text-red-900 mr-2"
                        onClick={() => deleteTemplate(template.id)}
                        disabled={isDeleting === template.id}
                      >
                        {isDeleting === template.id ? (
                          <span className="inline-flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Deleting...
                          </span>
                        ) : (
                          "Delete"
                        )}
                      </button>
                      <a 
                        href={`/admin/template-analyzer/template/${template.id}`} 
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 