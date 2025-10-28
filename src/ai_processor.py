"""
AI Processing Module
Handles content rewriting using AI (OpenAI or Anthropic)
"""

import logging
from typing import Dict, Optional
import time
from retry import retry

logger = logging.getLogger(__name__)


class AIProcessor:
    """Processes press releases using AI to rewrite in journalistic style"""

    def __init__(
        self,
        provider: str = "anthropic",
        system_prompt: str = "",
        title_prompt: str = "",
        description_prompt: str = "",
        temperature: float = 0.3,
        max_tokens: int = 2000,
        **api_credentials
    ):
        """
        Initialize AI processor

        Args:
            provider: "openai" or "anthropic"
            system_prompt: Instructions for content rewriting
            title_prompt: Instructions for title generation
            description_prompt: Instructions for description generation
            temperature: AI temperature (0.0-1.0)
            max_tokens: Maximum tokens for response
            **api_credentials: API keys and model names
        """
        self.provider = provider.lower()
        self.system_prompt = system_prompt
        self.title_prompt = title_prompt
        self.description_prompt = description_prompt
        self.temperature = temperature
        self.max_tokens = max_tokens

        # Initialize the appropriate AI client
        if self.provider == "openai":
            self._init_openai(api_credentials)
        elif self.provider == "anthropic":
            self._init_anthropic(api_credentials)
        else:
            raise ValueError(f"Unsupported AI provider: {provider}")

        logger.info(f"Initialized AI processor with provider: {self.provider}")

    def _init_openai(self, credentials: Dict):
        """Initialize OpenAI client"""
        try:
            import openai
            self.client = openai.OpenAI(api_key=credentials.get('api_key'))
            self.model = credentials.get('model', 'gpt-4-turbo-preview')
            logger.info(f"OpenAI initialized with model: {self.model}")
        except ImportError:
            raise ImportError("openai package not installed. Run: pip install openai")
        except Exception as e:
            raise Exception(f"Failed to initialize OpenAI: {e}")

    def _init_anthropic(self, credentials: Dict):
        """Initialize Anthropic client"""
        try:
            import anthropic
            self.client = anthropic.Anthropic(api_key=credentials.get('api_key'))
            self.model = credentials.get('model', 'claude-3-5-sonnet-20241022')
            logger.info(f"Anthropic initialized with model: {self.model}")
        except ImportError:
            raise ImportError("anthropic package not installed. Run: pip install anthropic")
        except Exception as e:
            raise Exception(f"Failed to initialize Anthropic: {e}")

    @retry(tries=3, delay=2, backoff=2, logger=logger)
    def rewrite_content(self, original_text: str) -> Optional[str]:
        """
        Rewrite press release content in journalistic style

        Args:
            original_text: Original press release text

        Returns:
            Rewritten content or None if processing fails
        """
        try:
            logger.info("Rewriting content with AI...")

            if self.provider == "openai":
                return self._rewrite_with_openai(original_text)
            elif self.provider == "anthropic":
                return self._rewrite_with_anthropic(original_text)

        except Exception as e:
            logger.error(f"Error rewriting content: {e}")
            return None

    def _rewrite_with_openai(self, text: str) -> Optional[str]:
        """Rewrite using OpenAI"""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": f"Rewrite the following press release:\n\n{text}"}
                ],
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )

            rewritten = response.choices[0].message.content.strip()
            logger.info(f"Successfully rewrote content ({len(rewritten)} chars)")
            return rewritten

        except Exception as e:
            logger.error(f"OpenAI rewrite failed: {e}")
            raise

    def _rewrite_with_anthropic(self, text: str) -> Optional[str]:
        """Rewrite using Anthropic Claude"""
        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                system=self.system_prompt,
                messages=[
                    {
                        "role": "user",
                        "content": f"Rewrite the following press release:\n\n{text}"
                    }
                ]
            )

            rewritten = message.content[0].text.strip()
            logger.info(f"Successfully rewrote content ({len(rewritten)} chars)")
            return rewritten

        except Exception as e:
            logger.error(f"Anthropic rewrite failed: {e}")
            raise

    @retry(tries=3, delay=2, backoff=2, logger=logger)
    def generate_title(self, content: str) -> Optional[str]:
        """
        Generate article title from content

        Args:
            content: Article content

        Returns:
            Generated title or None if processing fails
        """
        try:
            logger.info("Generating title with AI...")

            prompt = f"{self.title_prompt}\n\nArticle content:\n{content[:1000]}"

            if self.provider == "openai":
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "You are a skilled headline writer."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.4,
                    max_tokens=100
                )
                title = response.choices[0].message.content.strip()

            elif self.provider == "anthropic":
                message = self.client.messages.create(
                    model=self.model,
                    max_tokens=100,
                    temperature=0.4,
                    system="You are a skilled headline writer.",
                    messages=[{"role": "user", "content": prompt}]
                )
                title = message.content[0].text.strip()

            # Remove quotes if AI added them
            title = title.strip('"\'')

            logger.info(f"Generated title: {title}")
            return title

        except Exception as e:
            logger.error(f"Error generating title: {e}")
            return None

    @retry(tries=3, delay=2, backoff=2, logger=logger)
    def generate_description(self, content: str) -> Optional[str]:
        """
        Generate meta description from content

        Args:
            content: Article content

        Returns:
            Generated description or None if processing fails
        """
        try:
            logger.info("Generating description with AI...")

            prompt = f"{self.description_prompt}\n\nArticle content:\n{content[:1000]}"

            if self.provider == "openai":
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "You are an SEO expert."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3,
                    max_tokens=100
                )
                description = response.choices[0].message.content.strip()

            elif self.provider == "anthropic":
                message = self.client.messages.create(
                    model=self.model,
                    max_tokens=100,
                    temperature=0.3,
                    system="You are an SEO expert.",
                    messages=[{"role": "user", "content": prompt}]
                )
                description = message.content[0].text.strip()

            # Remove quotes if AI added them
            description = description.strip('"\'')

            # Ensure it's within SEO limits (150-160 chars)
            if len(description) > 160:
                description = description[:157] + "..."

            logger.info(f"Generated description: {description}")
            return description

        except Exception as e:
            logger.error(f"Error generating description: {e}")
            return None

    def extract_keywords(self, content: str, max_keywords: int = 10) -> list:
        """
        Extract keywords/tags from content

        Args:
            content: Article content
            max_keywords: Maximum number of keywords to extract

        Returns:
            List of keywords
        """
        try:
            logger.info("Extracting keywords with AI...")

            prompt = f"""Extract {max_keywords} relevant keywords or tags from this article.
Return only the keywords as a comma-separated list, nothing else.

Article content:
{content[:1500]}"""

            if self.provider == "openai":
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "You are a content tagging expert."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.2,
                    max_tokens=100
                )
                keywords_text = response.choices[0].message.content.strip()

            elif self.provider == "anthropic":
                message = self.client.messages.create(
                    model=self.model,
                    max_tokens=100,
                    temperature=0.2,
                    system="You are a content tagging expert.",
                    messages=[{"role": "user", "content": prompt}]
                )
                keywords_text = message.content[0].text.strip()

            # Parse keywords
            keywords = [k.strip() for k in keywords_text.split(',')]
            keywords = [k for k in keywords if k and len(k) > 2][:max_keywords]

            logger.info(f"Extracted keywords: {keywords}")
            return keywords

        except Exception as e:
            logger.error(f"Error extracting keywords: {e}")
            return []

    def process_full_article(self, original_text: str) -> Optional[Dict]:
        """
        Complete processing: rewrite, generate title, description, and keywords

        Args:
            original_text: Original press release text

        Returns:
            Dictionary with all processed content
        """
        try:
            logger.info("Starting full article processing...")

            # Rewrite content
            rewritten_content = self.rewrite_content(original_text)
            if not rewritten_content:
                logger.error("Failed to rewrite content")
                return None

            # Small delay to avoid rate limits
            time.sleep(0.5)

            # Generate title
            title = self.generate_title(rewritten_content)
            if not title:
                title = "Untitled Article"
                logger.warning("Using fallback title")

            # Small delay
            time.sleep(0.5)

            # Generate description
            description = self.generate_description(rewritten_content)
            if not description:
                description = rewritten_content[:160]
                logger.warning("Using fallback description")

            # Small delay
            time.sleep(0.5)

            # Extract keywords
            keywords = self.extract_keywords(rewritten_content)

            result = {
                'title': title,
                'content': rewritten_content,
                'description': description,
                'keywords': keywords,
                'original_text': original_text,
                'word_count': len(rewritten_content.split()),
                'char_count': len(rewritten_content)
            }

            logger.info("Successfully processed full article")
            return result

        except Exception as e:
            logger.error(f"Error in full article processing: {e}")
            return None
