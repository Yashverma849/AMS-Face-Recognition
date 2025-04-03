import { useState, useEffect } from 'react';
import { testApiConnection } from '@/lib/face-recognition-api';
import { ApiResponse } from '@/types/api';
import Head from 'next/head';

export default function TestApiPage() {
  const [testResult, setTestResult] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runTest() {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await testApiConnection();
      setTestResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setTestResult(null);
    } finally {
      setIsLoading(false);
    }
  }

  // Auto-run the test on page load
  useEffect(() => {
    runTest();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <Head>
        <title>API Connection Test</title>
      </Head>
      
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-sky-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-gray-900">Face Recognition API Test</h1>
              <p className="mt-2 text-gray-600">
                Testing connection to: {process.env.NEXT_PUBLIC_FACE_API_URL}
              </p>
            </div>
            
            <div className="mt-8">
              {isLoading ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                </div>
              ) : error ? (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
                  <p className="font-bold">Error</p>
                  <p>{error}</p>
                </div>
              ) : testResult ? (
                <div className={`rounded-md p-4 ${testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      {testResult.success ? (
                        <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium">
                        {testResult.success ? 'Connection Successful' : 'Connection Failed'}
                      </h3>
                      <div className="mt-2 text-sm">
                        <p>{testResult.message}</p>
                        {testResult.data && (
                          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                            {JSON.stringify(testResult.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
              
              <div className="mt-6">
                <button
                  onClick={runTest}
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isLoading ? 'Testing...' : 'Test Connection Again'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 