#!/usr/bin/env python3
"""
YouTube Video Processor for FlashCard Generation

This script downloads audio from YouTube videos, transcribes the content,
and generates flashcards using OpenAI's GPT models.

Requirements:
- yt-dlp: pip install yt-dlp
- openai: pip install openai
- ffmpeg: system dependency for audio processing

Author: FOCAL Team
Version: 1.0.0
"""

import os
import sys
import json
import tempfile
import subprocess
import logging
from pathlib import Path
from typing import Tuple, List, Dict, Optional
import openai

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class YouTubeProcessor:
    """
    A class to process YouTube videos for flashcard generation.
    
    This class handles downloading audio from YouTube videos, transcribing
    the audio content, and generating educational flashcards from the transcription.
    """
    
    def __init__(self, openai_api_key: str):
        """
        Initialize the YouTube processor with OpenAI API key.
        
        Args:
            openai_api_key (str): Valid OpenAI API key
            
        Raises:
            ValueError: If API key is not provided or invalid
        """
        if not openai_api_key or openai_api_key == 'your_openai_api_key_here':
            raise ValueError("Valid OpenAI API key is required")
        
        self.openai_api_key = openai_api_key
        self.openai_client = openai.OpenAI(api_key=openai_api_key)
        
        # Validate OpenAI client
        try:
            # Test the API key with a simple request
            self.openai_client.models.list()
            logger.info("OpenAI API key validated successfully")
        except Exception as e:
            raise ValueError(f"Invalid OpenAI API key: {e}")
    
    def download_audio_from_youtube(self, url: str) -> Tuple[str, str]:
        """
        Download audio from YouTube video using yt-dlp.
        
        Args:
            url (str): YouTube video URL
            
        Returns:
            Tuple[str, str]: (audio_file_path, video_title)
            
        Raises:
            Exception: If download fails or file not found
        """
        try:
            # Validate YouTube URL
            if not self._is_valid_youtube_url(url):
                raise ValueError("Invalid YouTube URL provided")
            
            # Create temporary directory and base filename
            temp_dir = tempfile.gettempdir()
            import time
            base_filename = f"youtube_audio_{os.getpid()}_{int(time.time())}"
            output_base = os.path.join(temp_dir, base_filename)
            
            # Download audio using yt-dlp with optimized settings
            command = [
                "yt-dlp",
                "--extract-audio",  # extract audio
                "--audio-format", "mp3",  # convert to mp3 (more compatible)
                "--audio-quality", "5",  # lower quality for faster processing
                "--write-info-json",  # get video metadata
                "--output", output_base,  # output base name
                "--no-playlist",  # don't download playlists
                "--no-warnings",  # reduce output
                url
            ]
            
            logger.info(f"Downloading audio from YouTube: {url}")
            logger.info(f"Running command: {' '.join(command)}")
            result = subprocess.run(command, capture_output=True, text=True, check=False, timeout=120)
            logger.info(f"yt-dlp stdout: {result.stdout}")
            logger.info(f"yt-dlp stderr: {result.stderr}")
            logger.info(f"yt-dlp return code: {result.returncode}")
            
            # Check if download was successful (exit code 0 or 101 for max downloads)
            if result.returncode not in [0, 101]:
                raise subprocess.CalledProcessError(result.returncode, command, result.stdout, result.stderr)
            
            # Find the actual downloaded file
            actual_audio_file = self._find_downloaded_audio_file(output_base, temp_dir, base_filename)
            
            # Get video title from info JSON
            video_title = self._extract_video_title(output_base)
            
            logger.info(f"Successfully downloaded audio: {actual_audio_file}")
            return actual_audio_file, video_title
            
        except subprocess.TimeoutExpired:
            logger.error("YouTube download timed out after 2 minutes")
            raise Exception("YouTube download timed out. The video might be too long or the connection is slow.")
        except subprocess.CalledProcessError as e:
            logger.error(f"yt-dlp error: {e.stderr}")
            logger.error(f"yt-dlp stdout: {e.stdout}")
            logger.error(f"yt-dlp return code: {e.returncode}")
            error_msg = e.stderr if e.stderr else e.stdout if e.stdout else f"yt-dlp failed with return code {e.returncode}"
            raise Exception(f"Failed to download YouTube video: {error_msg}")
        except Exception as e:
            logger.error(f"Download error: {e}")
            raise Exception(f"Failed to download YouTube video: {str(e)}")
    
    def _is_valid_youtube_url(self, url: str) -> bool:
        """Validate if the URL is a valid YouTube URL."""
        import re
        youtube_patterns = [
            r'(?:https?://)?(?:www\.)?youtube\.com/watch\?v=[\w-]+',
            r'(?:https?://)?(?:www\.)?youtu\.be/[\w-]+',
            r'(?:https?://)?(?:www\.)?youtube\.com/embed/[\w-]+',
            r'(?:https?://)?(?:www\.)?youtube\.com/shorts/[\w-]+',
            r'(?:https?://)?(?:www\.)?youtube\.com/live/[\w-]+'
        ]
        return any(re.search(pattern, url) for pattern in youtube_patterns)
    
    def _find_downloaded_audio_file(self, output_base: str, temp_dir: str, base_filename: str) -> str:
        """Find the actual downloaded audio file."""
        # Check for the expected .mp3 file first
        actual_audio_file = output_base + ".mp3"
        if os.path.exists(actual_audio_file):
            return actual_audio_file
        
        # Search for any audio file with the base filename (try different formats)
        audio_extensions = ['.mp3', '.wav', '.m4a', '.webm', '.ogg']
        for file in os.listdir(temp_dir):
            if file.startswith(base_filename):
                for ext in audio_extensions:
                    if file.endswith(ext):
                        actual_audio_file = os.path.join(temp_dir, file)
                        logger.info(f"Found audio file: {actual_audio_file}")
                        return actual_audio_file
        
        raise Exception("Could not find downloaded audio file")
    
    def _extract_video_title(self, output_base: str) -> str:
        """Extract video title from info JSON file."""
        info_file = output_base + ".info.json"
        video_title = "YouTube Video"
        
        if os.path.exists(info_file):
            try:
                with open(info_file, 'r', encoding='utf-8') as f:
                    info = json.load(f)
                    video_title = info.get('title', 'YouTube Video')
                os.remove(info_file)  # Clean up info file
            except Exception as e:
                logger.warning(f"Could not read video info: {e}")
        
        return video_title
    
    def transcribe_audio(self, audio_file: str) -> str:
        """
        Transcribe audio file using OpenAI Whisper API.
        
        Args:
            audio_file (str): Path to audio file
            
        Returns:
            str: Transcribed text
            
        Raises:
            Exception: If transcription fails
        """
        try:
            if not os.path.exists(audio_file):
                raise FileNotFoundError(f"Audio file not found: {audio_file}")
            
            # Check file size and limit if too large
            file_size = os.path.getsize(audio_file)
            max_size = 25 * 1024 * 1024  # 25MB limit for OpenAI Whisper
            
            if file_size > max_size:
                logger.warning(f"Audio file too large ({file_size / 1024 / 1024:.1f}MB), truncating...")
                # For now, we'll try to process it anyway, but OpenAI might reject it
                # In a production system, you'd want to split the audio file
            
            logger.info(f"Transcribing audio file: {audio_file} ({file_size / 1024 / 1024:.1f}MB)")
            
            # Read the audio file and create a proper file object
            with open(audio_file, "rb") as f:
                audio_data = f.read()
            
            # Create a temporary file-like object for OpenAI
            import io
            audio_file_obj = io.BytesIO(audio_data)
            audio_file_obj.name = "audio.mp3"
            
            transcription = self.openai_client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file_obj,
                response_format="text",
                language="en"
            )
            
            logger.info(f"Transcription completed: {len(transcription)} characters")
            return transcription
            
        except Exception as e:
            logger.error(f"Transcription error: {e}")
            if "file too large" in str(e).lower():
                raise Exception("Video is too long. Please try with a shorter video (under 10 minutes).")
            raise Exception(f"Failed to transcribe audio: {e}")
    
    def generate_flashcards(self, text_content: str, num_cards: Optional[int] = None) -> List[Dict[str, str]]:
        """
        Generate flashcards from text content using OpenAI GPT.
        
        Args:
            text_content (str): Text content to generate flashcards from
            num_cards (int, optional): Number of flashcards to generate
            
        Returns:
            List[Dict[str, str]]: List of flashcard dictionaries with 'question' and 'answer' keys
            
        Raises:
            Exception: If flashcard generation fails
        """
        if not text_content.strip():
            raise ValueError("Text content is empty")
        
        # Determine number of cards based on content length
        if num_cards is None:
            content_length = len(text_content)
            if content_length < 500:
                num_cards = "3-5"
            elif content_length < 2000:
                num_cards = "5-8"
            elif content_length < 5000:
                num_cards = "8-12"
            else:
                num_cards = "10-15"
        
        prompt = f"""
You are an expert educational content analyzer. Create high-quality flashcards from the following transcribed video content.

CONTENT TO ANALYZE:
{text_content[:6000]}  # Limit to avoid token limits

INSTRUCTIONS:
1. Create {num_cards} flashcards that capture the most important concepts from the video
2. Focus on key facts, definitions, processes, and important details mentioned
3. Make questions specific and clear
4. Provide comprehensive but concise answers
5. Ensure questions test understanding, not just memorization
6. Use varied question types (what, why, how, when, etc.)
7. Consider the context of a video lecture or presentation

OUTPUT FORMAT:
Return ONLY a valid JSON array with objects containing "question" and "answer" fields.
Do not include any other text or explanations.

Example format:
[
  {{"question": "What is the main concept discussed in the video?", "answer": "The main concept is..."}},
  {{"question": "Why is this topic important?", "answer": "This topic is important because..."}}
]
"""

        try:
            logger.info("Generating flashcards with OpenAI...")
            
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an expert educational content analyzer. Always return valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=3000
            )
            
            content = response.choices[0].message.content.strip()
            
            # Parse JSON response with better error handling
            return self._parse_flashcard_response(content)
                
        except Exception as e:
            logger.error(f"Failed to generate flashcards: {e}")
            raise
    
    def _parse_flashcard_response(self, content: str) -> List[Dict[str, str]]:
        """Parse and validate flashcard response from OpenAI."""
        try:
            # Try to fix common JSON issues
            content = content.strip()
            
            # If the response is truncated, try to complete it
            if content.count('[') > content.count(']'):
                content += ']'
            elif content.count('{') > content.count('}'):
                content += '}'
            
            # Remove any trailing commas before closing brackets
            content = content.replace(',]', ']').replace(',}', '}')
            
            flashcards = json.loads(content)
            if not isinstance(flashcards, list):
                raise ValueError("Response is not a list")
            
            # Validate flashcard structure
            for card in flashcards:
                if not isinstance(card, dict) or 'question' not in card or 'answer' not in card:
                    raise ValueError("Invalid flashcard structure")
            
            logger.info(f"Generated {len(flashcards)} flashcards")
            return flashcards
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            logger.error(f"Response content: {content}")
            
            # Try to extract JSON from the response if it's partially valid
            try:
                start = content.find('[')
                end = content.rfind(']')
                if start != -1 and end != -1 and end > start:
                    json_content = content[start:end+1]
                    flashcards = json.loads(json_content)
                    if isinstance(flashcards, list):
                        logger.info(f"Successfully extracted {len(flashcards)} flashcards from partial response")
                        return flashcards
            except:
                pass
            
            raise Exception("Failed to parse flashcard response")
    
    def process_youtube_video(self, url: str) -> Dict:
        """
        Process YouTube video: download, transcribe, and generate flashcards.
        
        Args:
            url (str): YouTube video URL
            
        Returns:
            Dict: Processing results with success status and data
        """
        audio_file = None
        
        try:
            # Download audio from YouTube
            audio_file, video_title = self.download_audio_from_youtube(url)
            
            # Transcribe audio
            transcription = self.transcribe_audio(audio_file)
            
            # Generate flashcards
            flashcards = self.generate_flashcards(transcription)
            
            return {
                "success": True,
                "video_title": video_title,
                "transcription": transcription,
                "transcription_length": len(transcription),
                "flashcards": flashcards
            }
            
        except Exception as e:
            logger.error(f"Processing error: {e}")
            return {
                "success": False,
                "error": str(e)
            }
        finally:
            # Clean up audio file
            if audio_file and os.path.exists(audio_file):
                try:
                    os.remove(audio_file)
                    logger.info(f"Cleaned up audio file: {audio_file}")
                except Exception as e:
                    logger.warning(f"Could not delete audio file: {e}")


def main():
    """Main function for command-line usage."""
    if len(sys.argv) < 3:
        print("Usage: python3 youtube_processor.py <youtube_url> <openai_api_key>")
        sys.exit(1)
    
    url = sys.argv[1]
    openai_api_key = sys.argv[2]
    
    try:
        processor = YouTubeProcessor(openai_api_key)
        result = processor.process_youtube_video(url)
        
        # Output result as JSON
        print(json.dumps(result, indent=2))
        
        if not result["success"]:
            sys.exit(1)
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e)
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)


if __name__ == "__main__":
    main()
