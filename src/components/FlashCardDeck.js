import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, ChevronLeft, ChevronRight, FileText, Home } from 'lucide-react';
import FlashCardComponent from './FlashCardComponent';
import '../styles/FlashCardDeck.css';

const FlashCardDeck = ({ flashcards, originalFilename, onReset }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  // Add safety check for flashcards
  if (!flashcards || !Array.isArray(flashcards) || flashcards.length === 0) {
    return (
      <div className="flashcard-deck">
        <div className="no-cards-message">
          <p>No flashcards available</p>
          <button onClick={onReset} className="reset-button">
            <Home className="icon" />
            Back to Upload
          </button>
        </div>
      </div>
    );
  }

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset, velocity) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection) => {
    if (newDirection === 1 && currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setDirection(newDirection);
    } else if (newDirection === -1 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setDirection(newDirection);
    }
  };

  const goToCard = (index) => {
    const newDirection = index > currentIndex ? 1 : -1;
    setDirection(newDirection);
    setCurrentIndex(index);
  };

  return (
    <div className="flashcard-deck">
      {/* Header */}
      <div className="deck-header">
        <div className="deck-info">
          <div className="file-info">
            <FileText size={20} />
            <span>{originalFilename}</span>
          </div>
          <div className="progress-info">
            <span>{currentIndex + 1} of {flashcards.length} cards</span>
          </div>
        </div>
        
        <button 
          className="reset-button"
          onClick={onReset}
          title="Upload new file"
        >
          <Home size={20} />
          New File
        </button>
      </div>

      {/* Progress Bar */}
      <div className="progress-bar">
        <motion.div 
          className="progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Card Navigation Dots */}
      <div className="card-dots">
        {flashcards.map((_, index) => (
          <button
            key={index}
            className={`dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => goToCard(index)}
            aria-label={`Go to card ${index + 1}`}
          />
        ))}
      </div>

      {/* Main Card Area */}
      <div className="card-container">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);

              if (swipe < -swipeConfidenceThreshold) {
                paginate(1);
              } else if (swipe > swipeConfidenceThreshold) {
                paginate(-1);
              }
            }}
            className="card-motion-wrapper"
          >
            <FlashCardComponent 
              question={flashcards[currentIndex].question}
              answer={flashcards[currentIndex].answer}
            />
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <button
          className={`nav-button nav-button--prev ${currentIndex === 0 ? 'disabled' : ''}`}
          onClick={() => paginate(-1)}
          disabled={currentIndex === 0}
          aria-label="Previous card"
        >
          <ChevronLeft size={24} />
        </button>

        <button
          className={`nav-button nav-button--next ${currentIndex === flashcards.length - 1 ? 'disabled' : ''}`}
          onClick={() => paginate(1)}
          disabled={currentIndex === flashcards.length - 1}
          aria-label="Next card"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Footer Actions */}
      <div className="deck-footer">
        <div className="navigation-info">
          <p>
            <strong>Navigation:</strong> Click cards to flip • Use arrow keys • Swipe on mobile
          </p>
        </div>
        
        <div className="deck-actions">
          <button 
            className="action-button secondary"
            onClick={() => setCurrentIndex(0)}
            disabled={currentIndex === 0}
          >
            <RotateCcw size={18} />
            Restart
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlashCardDeck;
