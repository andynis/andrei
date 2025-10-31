<?php
/**
 * Image Finder Class
 *
 * Finds relevant images for articles using Unsplash or Pexels APIs
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class RAJ_Image_Finder {

    /**
     * Find and download an image for a story
     *
     * @param string $keyword Main keyword for image search
     * @param string $title Story title for additional context
     * @return array|false Image data or false on failure
     */
    public function find_image($keyword, $title = '') {
        $this->log("Searching for image with keyword: {$keyword}");

        // Try Unsplash first
        if (!empty(RAJ_Settings::get('unsplash_api_key'))) {
            $image = $this->search_unsplash($keyword);
            if ($image) {
                return $image;
            }
        }

        // Try Pexels as fallback
        if (!empty(RAJ_Settings::get('pexels_api_key'))) {
            $image = $this->search_pexels($keyword);
            if ($image) {
                return $image;
            }
        }

        $this->log('No image found');
        return false;
    }

    /**
     * Search Unsplash for images
     *
     * @param string $keyword Search keyword
     * @return array|false Image data
     */
    private function search_unsplash($keyword) {
        $api_key = RAJ_Settings::get('unsplash_api_key');

        $url = sprintf(
            'https://api.unsplash.com/search/photos?query=%s&per_page=1&orientation=landscape',
            urlencode($keyword)
        );

        $response = wp_remote_get($url, array(
            'headers' => array(
                'Authorization' => 'Client-ID ' . $api_key,
            ),
            'timeout' => 30,
        ));

        if (is_wp_error($response)) {
            $this->log('Unsplash API error: ' . $response->get_error_message());
            return false;
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if (empty($data['results'][0])) {
            return false;
        }

        $photo = $data['results'][0];

        return array(
            'url' => $photo['urls']['regular'],
            'download_url' => $photo['urls']['full'],
            'photographer' => $photo['user']['name'],
            'photographer_url' => $photo['user']['links']['html'],
            'source' => 'Unsplash',
            'source_url' => $photo['links']['html'],
            'alt_text' => $photo['alt_description'] ?? $keyword,
        );
    }

    /**
     * Search Pexels for images
     *
     * @param string $keyword Search keyword
     * @return array|false Image data
     */
    private function search_pexels($keyword) {
        $api_key = RAJ_Settings::get('pexels_api_key');

        $url = sprintf(
            'https://api.pexels.com/v1/search?query=%s&per_page=1&orientation=landscape',
            urlencode($keyword)
        );

        $response = wp_remote_get($url, array(
            'headers' => array(
                'Authorization' => $api_key,
            ),
            'timeout' => 30,
        ));

        if (is_wp_error($response)) {
            $this->log('Pexels API error: ' . $response->get_error_message());
            return false;
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if (empty($data['photos'][0])) {
            return false;
        }

        $photo = $data['photos'][0];

        return array(
            'url' => $photo['src']['large'],
            'download_url' => $photo['src']['original'],
            'photographer' => $photo['photographer'],
            'photographer_url' => $photo['photographer_url'],
            'source' => 'Pexels',
            'source_url' => $photo['url'],
            'alt_text' => $keyword,
        );
    }

    /**
     * Download and attach image to WordPress
     *
     * @param array $image_data Image data from find_image()
     * @param int $post_id Post ID to attach to
     * @return int|false Attachment ID or false
     */
    public function download_and_attach($image_data, $post_id) {
        if (!function_exists('media_sideload_image')) {
            require_once(ABSPATH . 'wp-admin/includes/media.php');
            require_once(ABSPATH . 'wp-admin/includes/file.php');
            require_once(ABSPATH . 'wp-admin/includes/image.php');
        }

        $image_url = $image_data['download_url'];

        // Download image
        $tmp = download_url($image_url);

        if (is_wp_error($tmp)) {
            $this->log('Failed to download image: ' . $tmp->get_error_message());
            return false;
        }

        // Prepare file array
        $file_array = array(
            'name' => basename($image_url) . '.jpg',
            'tmp_name' => $tmp,
        );

        // Upload to media library
        $attachment_id = media_handle_sideload($file_array, $post_id, $image_data['alt_text']);

        // Clean up temp file
        if (file_exists($tmp)) {
            @unlink($tmp);
        }

        if (is_wp_error($attachment_id)) {
            $this->log('Failed to create attachment: ' . $attachment_id->get_error_message());
            return false;
        }

        // Set alt text
        update_post_meta($attachment_id, '_wp_attachment_image_alt', $image_data['alt_text']);

        // Add image credit to description
        $credit = sprintf(
            'Photo by <a href="%s" target="_blank">%s</a> on <a href="%s" target="_blank">%s</a>',
            $image_data['photographer_url'],
            $image_data['photographer'],
            $image_data['source_url'],
            $image_data['source']
        );

        wp_update_post(array(
            'ID' => $attachment_id,
            'post_content' => $credit,
        ));

        $this->log("Image downloaded and attached: {$attachment_id}");

        return $attachment_id;
    }

    /**
     * Log message
     *
     * @param string $message Message to log
     */
    private function log($message) {
        if (RAJ_Settings::get('debug_mode', false)) {
            error_log('[RAJ Image Finder] ' . $message);
        }
    }
}
