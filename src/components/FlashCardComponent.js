import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import '../styles/FlashCardComponent.css';

const FlashCardComponent = ({ question, answer }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="flashcard-wrapper">
      <motion.div
        className="flashcard"
        onClick={handleFlip}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <motion.div
          className="flashcard-inner"
          initial={false}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 200, damping: 20 }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Front Side (Question) */}
          <div className="flashcard-side flashcard-front">
            <div className="card-header">
              <span className="card-label">Question</span>
              <RotateCcw size={16} className="flip-icon" />
            </div>
            <div className="card-content">
              <p>{question}</p>
            </div>
            <div className="card-footer">
              <span className="flip-hint">Click to reveal answer</span>
            </div>
          </div>

          {/* Back Side (Answer) */}
          <div className="flashcard-side flashcard-back">
            <div className="card-header">
              <span className="card-label">Answer</span>
              <RotateCcw size={16} className="flip-icon" />
            </div>
            <div className="card-content">
              <p>{answer}</p>
            </div>
            <div className="card-footer">
              <span className="flip-hint">Click to see question</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default FlashCardComponent;
