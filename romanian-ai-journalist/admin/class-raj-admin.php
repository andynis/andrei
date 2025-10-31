<?php
/**
 * Admin Interface Class
 *
 * Handles admin menu, settings pages, and AJAX actions
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class RAJ_Admin {

    /**
     * Single instance
     */
    private static $instance = null;

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
     * Constructor
     */
    private function __construct() {
        $this->init_hooks();
    }

    /**
     * Initialize hooks
     */
    private function init_hooks() {
        // Admin menu
        add_action('admin_menu', array($this, 'add_admin_menu'));

        // Register settings
        add_action('admin_init', array($this, 'register_settings'));

        // Enqueue admin assets
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_assets'));

        // AJAX actions
        add_action('wp_ajax_raj_run_discovery', array($this, 'ajax_run_discovery'));
        add_action('wp_ajax_raj_test_api', array($this, 'ajax_test_api'));
        add_action('wp_ajax_raj_delete_story', array($this, 'ajax_delete_story'));
    }

    /**
     * Add admin menu pages
     */
    public function add_admin_menu() {
        // Main menu
        add_menu_page(
            __('AI Journalist', 'romanian-ai-journalist'),
            __('AI Journalist', 'romanian-ai-journalist'),
            'manage_options',
            'romanian-ai-journalist',
            array($this, 'render_dashboard_page'),
            'dashicons-edit-large',
            30
        );

        // Dashboard submenu
        add_submenu_page(
            'romanian-ai-journalist',
            __('Dashboard', 'romanian-ai-journalist'),
            __('Dashboard', 'romanian-ai-journalist'),
            'manage_options',
            'romanian-ai-journalist',
            array($this, 'render_dashboard_page')
        );

        // Settings submenu
        add_submenu_page(
            'romanian-ai-journalist',
            __('Settings', 'romanian-ai-journalist'),
            __('Settings', 'romanian-ai-journalist'),
            'manage_options',
            'raj-settings',
            array($this, 'render_settings_page')
        );

        // Discovered Stories submenu
        add_submenu_page(
            'romanian-ai-journalist',
            __('Discovered Stories', 'romanian-ai-journalist'),
            __('Discovered Stories', 'romanian-ai-journalist'),
            'manage_options',
            'raj-stories',
            array($this, 'render_stories_page')
        );
    }

    /**
     * Register plugin settings
     */
    public function register_settings() {
        // Register setting groups
        register_setting('raj_api_settings', 'raj_api_settings', array($this, 'sanitize_settings'));
        register_setting('raj_news_settings', 'raj_news_settings', array($this, 'sanitize_settings'));
        register_setting('raj_content_settings', 'raj_content_settings', array($this, 'sanitize_settings'));
        register_setting('raj_social_settings', 'raj_social_settings', array($this, 'sanitize_settings'));
        register_setting('raj_automation_settings', 'raj_automation_settings', array($this, 'sanitize_settings'));
    }

    /**
     * Sanitize settings
     */
    public function sanitize_settings($input) {
        return RAJ_Settings::sanitize($input);
    }

    /**
     * Enqueue admin assets
     */
    public function enqueue_admin_assets($hook) {
        // Only load on our plugin pages
        if (strpos($hook, 'romanian-ai-journalist') === false && strpos($hook, 'raj-') === false) {
            return;
        }

        // Enqueue CSS
        wp_enqueue_style(
            'raj-admin-styles',
            RAJ_PLUGIN_URL . 'assets/css/admin-styles.css',
            array(),
            RAJ_VERSION
        );

        // Enqueue JS
        wp_enqueue_script(
            'raj-admin-scripts',
            RAJ_PLUGIN_URL . 'assets/js/admin-scripts.js',
            array('jquery'),
            RAJ_VERSION,
            true
        );

        // Localize script
        wp_localize_script('raj-admin-scripts', 'rajAdmin', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('raj_admin_nonce'),
            'strings' => array(
                'running' => __('Running...', 'romanian-ai-journalist'),
                'success' => __('Success!', 'romanian-ai-journalist'),
                'error' => __('Error occurred', 'romanian-ai-journalist'),
                'confirm_delete' => __('Are you sure you want to delete this story?', 'romanian-ai-journalist'),
            ),
        ));
    }

    /**
     * Render dashboard page
     */
    public function render_dashboard_page() {
        require_once RAJ_PLUGIN_DIR . 'admin/views/dashboard.php';
    }

    /**
     * Render settings page
     */
    public function render_settings_page() {
        require_once RAJ_PLUGIN_DIR . 'admin/views/settings.php';
    }

    /**
     * Render stories page
     */
    public function render_stories_page() {
        require_once RAJ_PLUGIN_DIR . 'admin/views/stories.php';
    }

    /**
     * AJAX: Run news discovery
     */
    public function ajax_run_discovery() {
        check_ajax_referer('raj_admin_nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('Insufficient permissions', 'romanian-ai-journalist')));
        }

        try {
            // Initialize the news aggregator
            $aggregator = new RAJ_News_Aggregator();
            $stories = $aggregator->discover_stories();

            wp_send_json_success(array(
                'message' => sprintf(__('Found %d stories', 'romanian-ai-journalist'), count($stories)),
                'stories' => $stories,
            ));
        } catch (Exception $e) {
            wp_send_json_error(array('message' => $e->getMessage()));
        }
    }

    /**
     * AJAX: Test API connection
     */
    public function ajax_test_api() {
        check_ajax_referer('raj_admin_nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('Insufficient permissions', 'romanian-ai-journalist')));
        }

        $api_type = isset($_POST['api_type']) ? sanitize_text_field($_POST['api_type']) : '';

        try {
            $result = $this->test_api_connection($api_type);
            wp_send_json_success($result);
        } catch (Exception $e) {
            wp_send_json_error(array('message' => $e->getMessage()));
        }
    }

    /**
     * Test API connection
     */
    private function test_api_connection($api_type) {
        switch ($api_type) {
            case 'openai':
                return $this->test_openai_api();
            case 'anthropic':
                return $this->test_anthropic_api();
            case 'newsapi':
                return $this->test_newsapi();
            case 'unsplash':
                return $this->test_unsplash_api();
            case 'pexels':
                return $this->test_pexels_api();
            default:
                throw new Exception(__('Unknown API type', 'romanian-ai-journalist'));
        }
    }

    /**
     * Test OpenAI API
     */
    private function test_openai_api() {
        $api_key = RAJ_Settings::get('openai_api_key');
        if (empty($api_key)) {
            throw new Exception(__('OpenAI API key not configured', 'romanian-ai-journalist'));
        }

        $response = wp_remote_post('https://api.openai.com/v1/chat/completions', array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $api_key,
                'Content-Type' => 'application/json',
            ),
            'body' => json_encode(array(
                'model' => 'gpt-3.5-turbo',
                'messages' => array(
                    array('role' => 'user', 'content' => 'Test')
                ),
                'max_tokens' => 5,
            )),
            'timeout' => 30,
        ));

        if (is_wp_error($response)) {
            throw new Exception($response->get_error_message());
        }

        $code = wp_remote_retrieve_response_code($response);
        if ($code !== 200) {
            throw new Exception(__('OpenAI API test failed with code: ', 'romanian-ai-journalist') . $code);
        }

        return array('message' => __('OpenAI API connection successful!', 'romanian-ai-journalist'));
    }

    /**
     * Test Anthropic API
     */
    private function test_anthropic_api() {
        $api_key = RAJ_Settings::get('anthropic_api_key');
        if (empty($api_key)) {
            throw new Exception(__('Anthropic API key not configured', 'romanian-ai-journalist'));
        }

        $response = wp_remote_post('https://api.anthropic.com/v1/messages', array(
            'headers' => array(
                'x-api-key' => $api_key,
                'Content-Type' => 'application/json',
                'anthropic-version' => '2023-06-01',
            ),
            'body' => json_encode(array(
                'model' => 'claude-3-haiku-20240307',
                'messages' => array(
                    array('role' => 'user', 'content' => 'Test')
                ),
                'max_tokens' => 10,
            )),
            'timeout' => 30,
        ));

        if (is_wp_error($response)) {
            throw new Exception($response->get_error_message());
        }

        $code = wp_remote_retrieve_response_code($response);
        if ($code !== 200) {
            throw new Exception(__('Anthropic API test failed with code: ', 'romanian-ai-journalist') . $code);
        }

        return array('message' => __('Anthropic API connection successful!', 'romanian-ai-journalist'));
    }

    /**
     * Test NewsAPI
     */
    private function test_newsapi() {
        $api_key = RAJ_Settings::get('newsapi_key');
        if (empty($api_key)) {
            throw new Exception(__('NewsAPI key not configured', 'romanian-ai-journalist'));
        }

        $response = wp_remote_get('https://newsapi.org/v2/top-headlines?country=ro&pageSize=1&apiKey=' . $api_key);

        if (is_wp_error($response)) {
            throw new Exception($response->get_error_message());
        }

        $code = wp_remote_retrieve_response_code($response);
        if ($code !== 200) {
            throw new Exception(__('NewsAPI test failed with code: ', 'romanian-ai-journalist') . $code);
        }

        return array('message' => __('NewsAPI connection successful!', 'romanian-ai-journalist'));
    }

    /**
     * Test Unsplash API
     */
    private function test_unsplash_api() {
        $api_key = RAJ_Settings::get('unsplash_api_key');
        if (empty($api_key)) {
            throw new Exception(__('Unsplash API key not configured', 'romanian-ai-journalist'));
        }

        $response = wp_remote_get('https://api.unsplash.com/photos/random?query=test', array(
            'headers' => array(
                'Authorization' => 'Client-ID ' . $api_key,
            ),
        ));

        if (is_wp_error($response)) {
            throw new Exception($response->get_error_message());
        }

        $code = wp_remote_retrieve_response_code($response);
        if ($code !== 200) {
            throw new Exception(__('Unsplash API test failed with code: ', 'romanian-ai-journalist') . $code);
        }

        return array('message' => __('Unsplash API connection successful!', 'romanian-ai-journalist'));
    }

    /**
     * Test Pexels API
     */
    private function test_pexels_api() {
        $api_key = RAJ_Settings::get('pexels_api_key');
        if (empty($api_key)) {
            throw new Exception(__('Pexels API key not configured', 'romanian-ai-journalist'));
        }

        $response = wp_remote_get('https://api.pexels.com/v1/search?query=test&per_page=1', array(
            'headers' => array(
                'Authorization' => $api_key,
            ),
        ));

        if (is_wp_error($response)) {
            throw new Exception($response->get_error_message());
        }

        $code = wp_remote_retrieve_response_code($response);
        if ($code !== 200) {
            throw new Exception(__('Pexels API test failed with code: ', 'romanian-ai-journalist') . $code);
        }

        return array('message' => __('Pexels API connection successful!', 'romanian-ai-journalist'));
    }

    /**
     * AJAX: Delete story
     */
    public function ajax_delete_story() {
        check_ajax_referer('raj_admin_nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('Insufficient permissions', 'romanian-ai-journalist')));
        }

        $story_id = isset($_POST['story_id']) ? intval($_POST['story_id']) : 0;

        if (!$story_id) {
            wp_send_json_error(array('message' => __('Invalid story ID', 'romanian-ai-journalist')));
        }

        global $wpdb;
        $table_name = $wpdb->prefix . 'raj_discovered_stories';

        $deleted = $wpdb->delete($table_name, array('id' => $story_id), array('%d'));

        if ($deleted) {
            wp_send_json_success(array('message' => __('Story deleted successfully', 'romanian-ai-journalist')));
        } else {
            wp_send_json_error(array('message' => __('Failed to delete story', 'romanian-ai-journalist')));
        }
    }
}
