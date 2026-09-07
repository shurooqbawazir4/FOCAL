import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Image, FileX, Youtube, Link } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import '../styles/FileUpload.css';

/**
 * FileUpload Component
 * 
 * A component that handles both file uploads and YouTube URL processing
 * for generating flashcards. Features a tabbed interface to switch between
 * the two input methods.
 * 
 * @param {Function} onFlashcardsGenerated - Callback when flashcards are generated
 * @param {Function} setIsLoading - Function to set loading state
 */
const FileUpload = ({ onFlashcardsGenerated, setIsLoading }) => {
  const [activeTab, setActiveTab] = useState('file'); // 'file' or 'youtube'
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const { api } = useAuth();

  // File upload configuration
  const dropzoneConfig = {
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: false
  };

  /**
   * Handle file upload processing
   */
  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(({ file, errors }) => {
        errors.forEach(error => {
          if (error.code === 'file-too-large') {
            toast.error(`File ${file.name} is too large. Maximum size is 50MB.`);
          } else if (error.code === 'file-invalid-type') {
            toast.error(`File ${file.name} is not a supported format.`);
          } else {
            toast.error(`Error with file ${file.name}: ${error.message}`);
          }
        });
      });
      return;
    }

    if (acceptedFiles.length === 0) {
      return;
    }

    const file = acceptedFiles[0];
    
    try {
      setIsLoading(true);
      toast.loading('Processing your file...', { id: 'upload' });

      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minutes timeout
      });

      toast.success('Flashcards generated successfully!', { id: 'upload' });
      onFlashcardsGenerated(response.data.data.flashcards, response.data.data.originalFilename);

    } catch (error) {
      console.error('Upload error:', error);
      
      let errorMessage = 'Failed to process file';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please try with a smaller file.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { id: 'upload' });
    } finally {
      setIsLoading(false);
    }
  }, [onFlashcardsGenerated, setIsLoading]);

  /**
   * Validate YouTube URL format
   */
  const validateYouTubeUrl = (url) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return youtubeRegex.test(url);
  };

  /**
   * Handle YouTube URL submission
   */
  const handleYoutubeSubmit = async (e) => {
    e.preventDefault();
    
    if (!youtubeUrl.trim()) {
      toast.error('Please enter a YouTube URL');
      return;
    }

    if (!validateYouTubeUrl(youtubeUrl)) {
      toast.error('Please enter a valid YouTube URL');
      return;
    }

    try {
      setIsLoading(true);
      toast.loading('Processing YouTube video...', { id: 'youtube' });

      const response = await api.post('/youtube', {
        url: youtubeUrl
      }, {
        timeout: 180000, // 3 minutes timeout for YouTube processing
      });

      toast.success('Flashcards generated successfully!', { id: 'youtube' });
      onFlashcardsGenerated(response.data.data.flashcards, response.data.data.originalUrl);

    } catch (error) {
      console.error('YouTube processing error:', error);
      
      let errorMessage = 'Failed to process YouTube video';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { id: 'youtube' });
    } finally {
      setIsLoading(false);
    }
  };

  // Dropzone hook
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject
  } = useDropzone({
    onDrop,
    ...dropzoneConfig
  });

  /**
   * Get CSS class names for dropzone based on state
   */
  const getDropzoneClassName = () => {
    let className = 'dropzone';
    if (isDragActive) className += ' dropzone--active';
    if (isDragAccept) className += ' dropzone--accept';
    if (isDragReject) className += ' dropzone--reject';
    return className;
  };

  return (
    <div className="file-upload">
      {/* Tab Navigation */}
      <div className="upload-tabs">
        <button 
          className={`tab-button ${activeTab === 'file' ? 'active' : ''}`}
          onClick={() => setActiveTab('file')}
          type="button"
        >
          <FileText size={20} />
          <span>Upload File</span>
        </button>
        <button 
          className={`tab-button ${activeTab === 'youtube' ? 'active' : ''}`}
          onClick={() => setActiveTab('youtube')}
          type="button"
        >
          <Youtube size={20} />
          <span>YouTube Link</span>
        </button>
      </div>

      {/* File Upload Tab */}
      {activeTab === 'file' && (
        <>
          <div {...getRootProps()} className={getDropzoneClassName()}>
            <input {...getInputProps()} />
            
            <div className="dropzone-content">
              <div className="dropzone-icon">
                {isDragReject ? (
                  <FileX size={64} />
                ) : (
                  <Upload size={64} />
                )}
              </div>
              
              <div className="dropzone-text">
                {isDragActive ? (
                  isDragReject ? (
                    <p>This file type is not supported</p>
                  ) : (
                    <p>Drop your file here...</p>
                  )
                ) : (
                  <>
                    <h3>Upload Your Slides</h3>
                    <p>Drag & drop your presentation files here, or click to browse</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="supported-formats">
            <h4>Supported Formats:</h4>
            <div className="format-list">
              <div className="format-item">
                <FileText size={20} />
                <span>PDF Documents</span>
              </div>
              <div className="format-item">
                <FileText size={20} />
                <span>PowerPoint (.ppt, .pptx)</span>
              </div>
              <div className="format-item">
                <Image size={20} />
                <span>Images (.png, .jpg, .gif)</span>
              </div>
            </div>
            <p className="format-note">
              Maximum file size: 50MB
            </p>
          </div>
        </>
      )}

      {/* YouTube Link Tab */}
      {activeTab === 'youtube' && (
        <div className="youtube-upload">
          <div className="youtube-content">
            <div className="youtube-icon">
              <Youtube size={64} />
            </div>
            
            <div className="youtube-text">
              <h3>YouTube Video to Flashcards</h3>
              <p>Paste a YouTube URL to generate flashcards from the video content</p>
            </div>

            <form onSubmit={handleYoutubeSubmit} className="youtube-form">
              <div className="input-group">
                <Link size={20} className="input-icon" />
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="youtube-input"
                  required
                  aria-label="YouTube URL"
                />
              </div>
              <button type="submit" className="youtube-submit">
                Generate Flashcards
              </button>
            </form>
          </div>

          <div className="youtube-info">
            <h4>How it works:</h4>
            <div className="youtube-steps">
              <div className="step">
                <span className="step-number">1</span>
                <span>Paste YouTube URL</span>
              </div>
              <div className="step">
                <span className="step-number">2</span>
                <span>Extract audio & transcribe</span>
              </div>
              <div className="step">
                <span className="step-number">3</span>
                <span>Generate flashcards</span>
              </div>
            </div>
            <p className="youtube-note">
              Processing time may vary based on video length
            </p>
          </div>
        </div>
      )}

      <div className="how-it-works">
        <h4>How it works:</h4>
        <div className="steps">
          <div className="step">
            <span className="step-number">1</span>
            <span>Upload your content</span>
          </div>
          <div className="step">
            <span className="step-number">2</span>
            <span>AI extracts content</span>
          </div>
          <div className="step">
            <span className="step-number">3</span>
            <span>Generate flashcards</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
