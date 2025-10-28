"""
WordPress Publisher Module
Publishes articles to WordPress as drafts
"""

import logging
from typing import Dict, Optional, List
import requests
from requests.auth import HTTPBasicAuth
from datetime import datetime
import json

logger = logging.getLogger(__name__)


class WordPressPublisher:
    """Publishes content to WordPress using REST API"""

    def __init__(
        self,
        site_url: str,
        username: str,
        app_password: str,
        default_category: str = "Uncategorized",
        default_tags: List[str] = None,
        post_status: str = "draft",
        author_id: int = 1
    ):
        """
        Initialize WordPress publisher

        Args:
            site_url: WordPress site URL (e.g., https://example.com)
            username: WordPress username
            app_password: WordPress application password
            default_category: Default category name
            default_tags: Default tags
            post_status: Post status (draft, publish, pending, private)
            author_id: Author user ID
        """
        self.site_url = site_url.rstrip('/')
        self.api_url = f"{self.site_url}/wp-json/wp/v2"
        self.auth = HTTPBasicAuth(username, app_password)
        self.default_category = default_category
        self.default_tags = default_tags or []
        self.post_status = post_status
        self.author_id = author_id

        # Cache for categories and tags
        self._category_cache = {}
        self._tag_cache = {}

        logger.info(f"Initialized WordPress publisher for {self.site_url}")

    def test_connection(self) -> bool:
        """Test WordPress API connection"""
        try:
            response = requests.get(
                f"{self.api_url}/users/me",
                auth=self.auth,
                timeout=10
            )
            response.raise_for_status()
            logger.info("WordPress connection successful")
            return True
        except Exception as e:
            logger.error(f"WordPress connection failed: {e}")
            return False

    def create_post(
        self,
        title: str,
        content: str,
        excerpt: str = "",
        categories: List[str] = None,
        tags: List[str] = None,
        featured_image_url: str = None
    ) -> Optional[Dict]:
        """
        Create a new WordPress post

        Args:
            title: Post title
            content: Post content (HTML or plain text)
            excerpt: Post excerpt/description
            categories: List of category names
            tags: List of tag names
            featured_image_url: URL to featured image

        Returns:
            Dictionary with post data including URL and ID
        """
        try:
            logger.info(f"Creating WordPress post: {title}")

            # Get or create category IDs
            category_ids = []
            if categories:
                for cat_name in categories:
                    cat_id = self._get_or_create_category(cat_name)
                    if cat_id:
                        category_ids.append(cat_id)

            # Add default category if none specified
            if not category_ids and self.default_category:
                cat_id = self._get_or_create_category(self.default_category)
                if cat_id:
                    category_ids.append(cat_id)

            # Get or create tag IDs
            tag_ids = []
            all_tags = (tags or []) + self.default_tags
            if all_tags:
                for tag_name in all_tags:
                    tag_id = self._get_or_create_tag(tag_name)
                    if tag_id:
                        tag_ids.append(tag_id)

            # Prepare post data
            post_data = {
                'title': title,
                'content': content,
                'excerpt': excerpt,
                'status': self.post_status,
                'author': self.author_id,
                'categories': category_ids,
                'tags': tag_ids,
                'comment_status': 'closed',
                'ping_status': 'closed'
            }

            # Create the post
            response = requests.post(
                f"{self.api_url}/posts",
                json=post_data,
                auth=self.auth,
                timeout=30
            )
            response.raise_for_status()

            post_info = response.json()

            result = {
                'id': post_info['id'],
                'url': post_info['link'],
                'edit_url': f"{self.site_url}/wp-admin/post.php?post={post_info['id']}&action=edit",
                'status': post_info['status'],
                'title': post_info['title']['rendered'],
                'created_at': post_info['date']
            }

            logger.info(f"Successfully created post ID {result['id']}: {result['url']}")

            # Set featured image if provided
            if featured_image_url:
                self._set_featured_image(post_info['id'], featured_image_url)

            return result

        except requests.exceptions.RequestException as e:
            logger.error(f"HTTP error creating post: {e}")
            if hasattr(e.response, 'text'):
                logger.error(f"Response: {e.response.text}")
            return None
        except Exception as e:
            logger.error(f"Error creating post: {e}")
            return None

    def _get_or_create_category(self, category_name: str) -> Optional[int]:
        """Get category ID or create if doesn't exist"""
        # Check cache
        if category_name in self._category_cache:
            return self._category_cache[category_name]

        try:
            # Search for existing category
            response = requests.get(
                f"{self.api_url}/categories",
                params={'search': category_name},
                auth=self.auth,
                timeout=10
            )
            response.raise_for_status()

            categories = response.json()

            # Check for exact match
            for cat in categories:
                if cat['name'].lower() == category_name.lower():
                    self._category_cache[category_name] = cat['id']
                    logger.debug(f"Found category '{category_name}' with ID {cat['id']}")
                    return cat['id']

            # Create new category
            logger.info(f"Creating new category: {category_name}")
            response = requests.post(
                f"{self.api_url}/categories",
                json={'name': category_name},
                auth=self.auth,
                timeout=10
            )
            response.raise_for_status()

            cat_data = response.json()
            self._category_cache[category_name] = cat_data['id']
            logger.info(f"Created category '{category_name}' with ID {cat_data['id']}")
            return cat_data['id']

        except Exception as e:
            logger.error(f"Error getting/creating category '{category_name}': {e}")
            return None

    def _get_or_create_tag(self, tag_name: str) -> Optional[int]:
        """Get tag ID or create if doesn't exist"""
        # Check cache
        if tag_name in self._tag_cache:
            return self._tag_cache[tag_name]

        try:
            # Search for existing tag
            response = requests.get(
                f"{self.api_url}/tags",
                params={'search': tag_name},
                auth=self.auth,
                timeout=10
            )
            response.raise_for_status()

            tags = response.json()

            # Check for exact match
            for tag in tags:
                if tag['name'].lower() == tag_name.lower():
                    self._tag_cache[tag_name] = tag['id']
                    logger.debug(f"Found tag '{tag_name}' with ID {tag['id']}")
                    return tag['id']

            # Create new tag
            logger.debug(f"Creating new tag: {tag_name}")
            response = requests.post(
                f"{self.api_url}/tags",
                json={'name': tag_name},
                auth=self.auth,
                timeout=10
            )
            response.raise_for_status()

            tag_data = response.json()
            self._tag_cache[tag_name] = tag_data['id']
            logger.debug(f"Created tag '{tag_name}' with ID {tag_data['id']}")
            return tag_data['id']

        except Exception as e:
            logger.error(f"Error getting/creating tag '{tag_name}': {e}")
            return None

    def _set_featured_image(self, post_id: int, image_url: str):
        """Set featured image for post (from URL)"""
        try:
            # Note: This requires uploading the image to WordPress media library
            # For simplicity, this is a placeholder - full implementation would
            # download the image and upload it via media endpoint

            logger.info(f"Featured image setting not fully implemented for post {post_id}")
            # TODO: Implement media upload if needed

        except Exception as e:
            logger.error(f"Error setting featured image: {e}")

    def update_post(self, post_id: int, **kwargs) -> Optional[Dict]:
        """Update existing post"""
        try:
            logger.info(f"Updating post {post_id}")

            response = requests.post(
                f"{self.api_url}/posts/{post_id}",
                json=kwargs,
                auth=self.auth,
                timeout=30
            )
            response.raise_for_status()

            post_info = response.json()
            logger.info(f"Successfully updated post {post_id}")

            return {
                'id': post_info['id'],
                'url': post_info['link'],
                'status': post_info['status']
            }

        except Exception as e:
            logger.error(f"Error updating post {post_id}: {e}")
            return None

    def delete_post(self, post_id: int, force: bool = False) -> bool:
        """Delete post"""
        try:
            logger.info(f"Deleting post {post_id}")

            response = requests.delete(
                f"{self.api_url}/posts/{post_id}",
                params={'force': force},
                auth=self.auth,
                timeout=10
            )
            response.raise_for_status()

            logger.info(f"Successfully deleted post {post_id}")
            return True

        except Exception as e:
            logger.error(f"Error deleting post {post_id}: {e}")
            return False

    def get_categories(self) -> List[Dict]:
        """Get all categories"""
        try:
            response = requests.get(
                f"{self.api_url}/categories",
                params={'per_page': 100},
                auth=self.auth,
                timeout=10
            )
            response.raise_for_status()
            return response.json()

        except Exception as e:
            logger.error(f"Error getting categories: {e}")
            return []

    def get_tags(self) -> List[Dict]:
        """Get all tags"""
        try:
            response = requests.get(
                f"{self.api_url}/tags",
                params={'per_page': 100},
                auth=self.auth,
                timeout=10
            )
            response.raise_for_status()
            return response.json()

        except Exception as e:
            logger.error(f"Error getting tags: {e}")
            return []
