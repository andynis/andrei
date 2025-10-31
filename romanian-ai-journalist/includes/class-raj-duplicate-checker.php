<?php
/**
 * Duplicate Checker Class
 *
 * Checks if a story already exists on the WordPress site
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class RAJ_Duplicate_Checker {

    /**
     * Check if story already exists
     *
     * @param array $story Story data
     * @return bool True if duplicate, false if unique
     */
    public function is_duplicate($story) {
        // Check by source URL
        if ($this->exists_by_source_url($story['url'])) {
            return true;
        }

        // Check by title similarity
        if ($this->exists_by_similar_title($story['title'])) {
            return true;
        }

        // Check by content similarity
        if (!empty($story['content']) && $this->exists_by_similar_content($story['content'])) {
            return true;
        }

        return false;
    }

    /**
     * Check if post exists with same source URL
     *
     * @param string $url Source URL
     * @return bool True if exists
     */
    private function exists_by_source_url($url) {
        $args = array(
            'post_type' => 'post',
            'post_status' => array('publish', 'draft', 'pending'),
            'meta_query' => array(
                array(
                    'key' => 'raj_source_url',
                    'value' => $url,
                    'compare' => '=',
                ),
            ),
            'fields' => 'ids',
            'posts_per_page' => 1,
        );

        $query = new WP_Query($args);

        return $query->have_posts();
    }

    /**
     * Check if post exists with similar title
     *
     * @param string $title Title to check
     * @return bool True if similar exists
     */
    private function exists_by_similar_title($title) {
        global $wpdb;

        // Get all post titles from last 7 days
        $seven_days_ago = date('Y-m-d H:i:s', strtotime('-7 days'));

        $existing_titles = $wpdb->get_col($wpdb->prepare(
            "SELECT post_title FROM {$wpdb->posts}
            WHERE post_type = 'post'
            AND post_status IN ('publish', 'draft', 'pending')
            AND post_date >= %s",
            $seven_days_ago
        ));

        if (empty($existing_titles)) {
            return false;
        }

        // Check similarity
        foreach ($existing_titles as $existing_title) {
            similar_text(
                strtolower($this->normalize_text($title)),
                strtolower($this->normalize_text($existing_title)),
                $percent
            );

            if ($percent > 70) {
                $this->log("Found similar title: {$existing_title} ({$percent}% similar)");
                return true;
            }
        }

        return false;
    }

    /**
     * Check if post exists with similar content
     *
     * @param string $content Content to check
     * @return bool True if similar exists
     */
    private function exists_by_similar_content($content) {
        global $wpdb;

        // Get post content from last 3 days
        $three_days_ago = date('Y-m-d H:i:s', strtotime('-3 days'));

        $existing_posts = $wpdb->get_results($wpdb->prepare(
            "SELECT ID, post_content FROM {$wpdb->posts}
            WHERE post_type = 'post'
            AND post_status IN ('publish', 'draft', 'pending')
            AND post_date >= %s
            LIMIT 50",
            $three_days_ago
        ));

        if (empty($existing_posts)) {
            return false;
        }

        $normalized_content = $this->normalize_text($content);

        foreach ($existing_posts as $post) {
            $existing_content = $this->normalize_text($post->post_content);

            similar_text(
                strtolower($normalized_content),
                strtolower($existing_content),
                $percent
            );

            if ($percent > 60) {
                $this->log("Found similar content in post ID {$post->ID} ({$percent}% similar)");
                return true;
            }
        }

        return false;
    }

    /**
     * Normalize text for comparison
     *
     * @param string $text Text to normalize
     * @return string Normalized text
     */
    private function normalize_text($text) {
        // Remove HTML tags
        $text = strip_tags($text);

        // Remove extra whitespace
        $text = preg_replace('/\s+/', ' ', $text);

        // Remove punctuation
        $text = preg_replace('/[^\w\s]/', '', $text);

        // Trim
        $text = trim($text);

        // Lowercase
        $text = strtolower($text);

        return $text;
    }

    /**
     * Get content hash for quick comparison
     *
     * @param string $content Content to hash
     * @return string Hash
     */
    public function get_content_hash($content) {
        return hash('sha256', $this->normalize_text($content));
    }

    /**
     * Log message
     *
     * @param string $message Message to log
     */
    private function log($message) {
        if (RAJ_Settings::get('debug_mode', false)) {
            error_log('[RAJ Duplicate Checker] ' . $message);
        }
    }
}
