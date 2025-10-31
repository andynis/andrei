<?php
/**
 * Settings Management Class
 *
 * Handles all plugin settings and configuration options
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class RAJ_Settings {

    /**
     * Single instance
     */
    private static $instance = null;

    /**
     * Settings option name
     */
    const OPTION_GROUP = 'raj_settings';

    /**
     * Get instance
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Get a setting value
     *
     * @param string $key Setting key
     * @param mixed $default Default value if not found
     * @return mixed Setting value
     */
    public static function get($key, $default = '') {
        return get_option('raj_' . $key, $default);
    }

    /**
     * Update a setting value
     *
     * @param string $key Setting key
     * @param mixed $value Setting value
     * @return bool True on success, false on failure
     */
    public static function update($key, $value) {
        return update_option('raj_' . $key, $value);
    }

    /**
     * Delete a setting
     *
     * @param string $key Setting key
     * @return bool True on success, false on failure
     */
    public static function delete($key) {
        return delete_option('raj_' . $key);
    }

    /**
     * Get all settings as an array
     *
     * @return array All settings
     */
    public static function get_all() {
        return array(
            // API Settings
            'api_provider' => self::get('api_provider', 'openai'),
            'openai_api_key' => self::get('openai_api_key', ''),
            'anthropic_api_key' => self::get('anthropic_api_key', ''),
            'newsapi_key' => self::get('newsapi_key', ''),
            'unsplash_api_key' => self::get('unsplash_api_key', ''),
            'pexels_api_key' => self::get('pexels_api_key', ''),

            // News Discovery Settings
            'news_count' => self::get('news_count', 10),
            'hours_lookback' => self::get('hours_lookback', 48),
            'romanian_sources' => self::get('romanian_sources', ''),
            'keywords_to_exclude' => self::get('keywords_to_exclude', ''),
            'min_engagement_score' => self::get('min_engagement_score', 0),

            // Content Settings
            'rewrite_style' => self::get('rewrite_style', 'narrative'),
            'content_length' => self::get('content_length', 'detailed'),
            'include_quotes' => self::get('include_quotes', true),
            'add_context' => self::get('add_context', true),

            // WordPress Settings
            'post_status' => self::get('post_status', 'draft'),
            'default_category' => self::get('default_category', 1),
            'auto_tag' => self::get('auto_tag', true),
            'featured_image_required' => self::get('featured_image_required', true),

            // Social Media Settings
            'generate_instagram' => self::get('generate_instagram', true),
            'generate_linkedin' => self::get('generate_linkedin', true),
            'generate_x_thread' => self::get('generate_x_thread', true),

            // Email Settings
            'editor_email' => self::get('editor_email', get_option('admin_email')),
            'email_subject' => self::get('email_subject', '[AI Journalist] New Stories Ready for Review'),
            'send_individual_emails' => self::get('send_individual_emails', false),

            // Automation Settings
            'auto_run_enabled' => self::get('auto_run_enabled', false),
            'run_frequency' => self::get('run_frequency', 'daily'),
            'run_time' => self::get('run_time', '08:00'),

            // Advanced Settings
            'debug_mode' => self::get('debug_mode', false),
            'log_level' => self::get('log_level', 'info'),
            'max_retries' => self::get('max_retries', 3),
            'timeout' => self::get('timeout', 30),
        );
    }

    /**
     * Validate and sanitize settings
     *
     * @param array $settings Settings to validate
     * @return array Sanitized settings
     */
    public static function sanitize($settings) {
        $sanitized = array();

        // Sanitize text fields
        $text_fields = array(
            'api_provider', 'openai_api_key', 'anthropic_api_key', 'newsapi_key',
            'unsplash_api_key', 'pexels_api_key', 'rewrite_style', 'content_length',
            'post_status', 'editor_email', 'email_subject', 'run_frequency', 'run_time', 'log_level'
        );

        foreach ($text_fields as $field) {
            if (isset($settings[$field])) {
                $sanitized[$field] = sanitize_text_field($settings[$field]);
            }
        }

        // Sanitize textarea fields
        $textarea_fields = array('romanian_sources', 'keywords_to_exclude');
        foreach ($textarea_fields as $field) {
            if (isset($settings[$field])) {
                $sanitized[$field] = sanitize_textarea_field($settings[$field]);
            }
        }

        // Sanitize numeric fields
        $numeric_fields = array(
            'news_count', 'hours_lookback', 'default_category',
            'min_engagement_score', 'max_retries', 'timeout'
        );
        foreach ($numeric_fields as $field) {
            if (isset($settings[$field])) {
                $sanitized[$field] = intval($settings[$field]);
            }
        }

        // Sanitize boolean fields
        $boolean_fields = array(
            'include_quotes', 'add_context', 'auto_tag', 'featured_image_required',
            'generate_instagram', 'generate_linkedin', 'generate_x_thread',
            'send_individual_emails', 'auto_run_enabled', 'debug_mode'
        );
        foreach ($boolean_fields as $field) {
            $sanitized[$field] = isset($settings[$field]) && $settings[$field] ? true : false;
        }

        return $sanitized;
    }

    /**
     * Get Romanian news sources as array
     *
     * @return array List of news sources
     */
    public static function get_romanian_sources() {
        $sources = self::get('romanian_sources', '');
        if (empty($sources)) {
            return array();
        }

        $sources_array = explode("\n", $sources);
        return array_map('trim', array_filter($sources_array));
    }

    /**
     * Get excluded keywords as array
     *
     * @return array List of excluded keywords
     */
    public static function get_excluded_keywords() {
        $keywords = self::get('keywords_to_exclude', '');
        if (empty($keywords)) {
            return array();
        }

        $keywords_array = explode("\n", $keywords);
        return array_map('trim', array_filter($keywords_array));
    }

    /**
     * Check if API is configured
     *
     * @return bool True if API is ready to use
     */
    public static function is_api_configured() {
        $provider = self::get('api_provider', 'openai');

        if ($provider === 'openai') {
            return !empty(self::get('openai_api_key'));
        } elseif ($provider === 'anthropic') {
            return !empty(self::get('anthropic_api_key'));
        }

        return false;
    }

    /**
     * Check if news API is configured
     *
     * @return bool True if news API is configured
     */
    public static function is_news_api_configured() {
        return !empty(self::get('newsapi_key'));
    }

    /**
     * Check if image API is configured
     *
     * @return bool True if at least one image API is configured
     */
    public static function is_image_api_configured() {
        return !empty(self::get('unsplash_api_key')) || !empty(self::get('pexels_api_key'));
    }

    /**
     * Get AI provider configuration
     *
     * @return array Provider configuration
     */
    public static function get_ai_config() {
        $provider = self::get('api_provider', 'openai');

        return array(
            'provider' => $provider,
            'api_key' => $provider === 'openai'
                ? self::get('openai_api_key')
                : self::get('anthropic_api_key'),
            'model' => $provider === 'openai' ? 'gpt-4' : 'claude-3-opus-20240229',
            'temperature' => 0.7,
            'max_tokens' => 4000,
        );
    }
}
