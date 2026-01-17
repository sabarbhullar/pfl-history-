'use client';

import * as React from 'react';

interface CSVUploaderProps {
  onUploadComplete?: () => void;
}

export function CSVUploader({ onUploadComplete }: CSVUploaderProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [result, setResult] = React.useState<{
    success: boolean;
    message: string;
    errors?: string[];
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setResult(null);
    } else {
      setResult({ success: false, message: 'Please select a valid CSV file' });
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-csv', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message || 'CSV uploaded and processed successfully!',
        });
        setFile(null);
        onUploadComplete?.();
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to upload CSV',
          errors: data.errors,
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'An error occurred while uploading the file',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-lg border border-bg-tertiary bg-bg-secondary p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-4">
        Upload Historical Data (CSV)
      </h3>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="csv-file"
            className="block text-sm font-medium text-text-secondary mb-2"
          >
            Select CSV File
          </label>
          <input
            id="csv-file"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-text-secondary
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-accent-primary file:text-bg-primary
              hover:file:bg-accent-primary/90
              file:cursor-pointer cursor-pointer"
          />
          <p className="mt-2 text-xs text-text-muted">
            CSV should include: Year, OwnerName, TeamName, Rank, Wins, Losses, Ties (optional),
            PointsFor, PointsAgainst, Champion (Yes/No), RunnerUp (Yes/No), MadePlayoffs (Yes/No)
          </p>
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full px-4 py-2 bg-accent-primary text-bg-primary font-semibold rounded-md
            hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors"
        >
          {uploading ? 'Uploading...' : 'Upload and Process CSV'}
        </button>

        {result && (
          <div
            className={`p-4 rounded-md ${
              result.success
                ? 'bg-green-500/10 border border-green-500/30'
                : 'bg-red-500/10 border border-red-500/30'
            }`}
          >
            <p
              className={`text-sm font-medium ${
                result.success ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {result.message}
            </p>
            {result.errors && result.errors.length > 0 && (
              <ul className="mt-2 text-xs text-red-300 list-disc list-inside space-y-1">
                {result.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
