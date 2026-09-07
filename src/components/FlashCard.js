import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import FileUpload from './FileUpload';
import FlashCardDeck from './FlashCardDeck';
import LoadingSpinner from './LoadingSpinner';
import '../styles/FlashCard.css';

const FlashCard = () => {
  const [flashcards, setFlashcards] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [originalFilename, setOriginalFilename] = useState('');

  const handleFlashcardsGenerated = (cards, filename) => {
    // Ensure cards is always an array
    const validCards = Array.isArray(cards) ? cards : [];
    setFlashcards(validCards);
    setOriginalFilename(filename || '');
  };

  const handleReset = () => {
    setFlashcards([]);
    setOriginalFilename('');
  };

  return (
    <div className="page-content">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      
      <div className="flashcard-container">
        <div className="flashcard-header">
          <h1>FlashCard Generator</h1>
          <p>Transform your slides into beautiful flashcards with AI</p>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : Array.isArray(flashcards) && flashcards.length > 0 ? (
          <FlashCardDeck 
            flashcards={flashcards} 
            originalFilename={originalFilename}
            onReset={handleReset}
          />
        ) : (
          <FileUpload 
            onFlashcardsGenerated={handleFlashcardsGenerated}
            setIsLoading={setIsLoading}
          />
        )}
      </div>
    </div>
  );
};

export default FlashCard;


