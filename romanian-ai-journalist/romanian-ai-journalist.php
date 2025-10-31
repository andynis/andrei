<?php
/**
 * Plugin Name: Romanian AI Journalist
 * Plugin URI: https://github.com/yourusername/romanian-ai-journalist
 * Description: An AI-powered journalist that discovers, rewrites, and publishes the most important Romanian news stories with social media content generation.
 * Version: 1.0.0
 * Author: Your Name
 * Author URI: https://yourwebsite.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: romanian-ai-journalist
 * Domain Path: /languages
 * Requires at least: 5.8
 * Requires PHP: 7.4
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('RAJ_VERSION', '1.0.0');
define('RAJ_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('RAJ_PLUGIN_URL', plugin_dir_url(__FILE__));
define('RAJ_PLUGIN_BASENAME', plugin_basename(__FILE__));

/**
 * Main Romanian AI Journalist Class
 */
class Romanian_AI_Journalist {

    /**
     * Single instance of the class
     */
    private static $instance = null;

    /**
     * Get single instance
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
        $this->load_dependencies();
        $this->init_hooks();
    }

    /**
     * Load required dependencies
     */
    private function load_dependencies() {
        // Core classes
        require_once RAJ_PLUGIN_DIR . 'includes/class-raj-settings.php';
        require_once RAJ_PLUGIN_DIR . 'includes/class-raj-news-aggregator.php';
        require_once RAJ_PLUGIN_DIR . 'includes/class-raj-content-rewriter.php';
        require_once RAJ_PLUGIN_DIR . 'includes/class-raj-image-finder.php';
        require_once RAJ_PLUGIN_DIR . 'includes/class-raj-duplicate-checker.php';
        require_once RAJ_PLUGIN_DIR . 'includes/class-raj-social-media-generator.php';
        require_once RAJ_PLUGIN_DIR . 'includes/class-raj-email-sender.php';
        require_once RAJ_PLUGIN_DIR . 'includes/class-raj-cron.php';

        // Admin classes
        if (is_admin()) {
            require_once RAJ_PLUGIN_DIR . 'admin/class-raj-admin.php';
            require_once RAJ_PLUGIN_DIR . 'admin/class-raj-dashboard.php';
        }
    }

    /**
     * Initialize hooks
     */
    private function init_hooks() {
        // Activation and deactivation hooks
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));

        // Initialize admin interface
        if (is_admin()) {
            add_action('plugins_loaded', array($this, 'init_admin'));
        }

        // Initialize cron jobs
        add_action('plugins_loaded', array($this, 'init_cron'));

        // Register custom post meta
        add_action('init', array($this, 'register_post_meta'));
    }

    /**
     * Plugin activation
     */
    public function activate() {
        // Create custom database tables if needed
        $this->create_tables();

        // Set default options
        $this->set_default_options();

        // Schedule cron jobs
        RAJ_Cron::schedule_events();

        // Flush rewrite rules
        flush_rewrite_rules();
    }

    /**
     * Plugin deactivation
     */
    public function deactivate() {
        // Unschedule cron jobs
        RAJ_Cron::unschedule_events();

        // Flush rewrite rules
        flush_rewrite_rules();
    }

    /**
     * Create custom database tables
     */
    private function create_tables() {
        global $wpdb;

        $charset_collate = $wpdb->get_charset_collate();
        $table_name = $wpdb->prefix . 'raj_discovered_stories';

        $sql = "CREATE TABLE IF NOT EXISTS $table_name (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            story_url varchar(500) NOT NULL,
            story_title text NOT NULL,
            source_name varchar(255) NOT NULL,
            source_url varchar(500) NOT NULL,
            discovered_date datetime DEFAULT CURRENT_TIMESTAMP,
            published_date datetime,
            status varchar(50) DEFAULT 'pending',
            wordpress_post_id bigint(20),
            content_hash varchar(64),
            metadata longtext,
            PRIMARY KEY  (id),
            UNIQUE KEY story_url (story_url),
            KEY status (status),
            KEY discovered_date (discovered_date)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }

    /**
     * Set default plugin options
     */
    private function set_default_options() {
        $default_settings = array(
            'raj_api_provider' => 'openai',
            'raj_news_count' => 10,
            'raj_hours_lookback' => 48,
            'raj_auto_run_enabled' => false,
            'raj_run_frequency' => 'daily',
            'raj_editor_email' => get_option('admin_email'),
            'raj_default_category' => 1,
            'raj_post_status' => 'draft',
            'raj_romanian_sources' => implode("\n", array(
                'digi24.ro',
                'hotnews.ro',
                'g4media.ro',
                'libertatea.ro',
                'adevarul.ro',
                'romaniatv.net',
                'protv.ro',
                'stirileprotv.ro',
                'antena3.ro',
                'mediafax.ro',
                'news.ro',
                'recorder.ro',
                'spotmedia.ro',
                'contributor.ro',
            )),
        );

        foreach ($default_settings as $key => $value) {
            if (get_option($key) === false) {
                add_option($key, $value);
            }
        }
    }

    /**
     * Initialize admin interface
     */
    public function init_admin() {
        RAJ_Admin::get_instance();
    }

    /**
     * Initialize cron system
     */
    public function init_cron() {
        RAJ_Cron::get_instance();
    }

    /**
     * Register custom post meta for storing social media content
     */
    public function register_post_meta() {
        register_post_meta('post', 'raj_social_instagram', array(
            'type' => 'string',
            'description' => 'Instagram Reel script generated by AI',
            'single' => true,
            'show_in_rest' => true,
        ));

        register_post_meta('post', 'raj_social_linkedin', array(
            'type' => 'string',
            'description' => 'LinkedIn post generated by AI',
            'single' => true,
            'show_in_rest' => true,
        ));

        register_post_meta('post', 'raj_social_x_thread', array(
            'type' => 'string',
            'description' => 'X (Twitter) thread generated by AI',
            'single' => true,
            'show_in_rest' => true,
        ));

        register_post_meta('post', 'raj_source_url', array(
            'type' => 'string',
            'description' => 'Original news source URL',
            'single' => true,
            'show_in_rest' => true,
        ));

        register_post_meta('post', 'raj_source_name', array(
            'type' => 'string',
            'description' => 'Original news source name',
            'single' => true,
            'show_in_rest' => true,
        ));

        register_post_meta('post', 'raj_image_source', array(
            'type' => 'string',
            'description' => 'Image source URL and credit',
            'single' => true,
            'show_in_rest' => true,
        ));

        register_post_meta('post', 'raj_keywords', array(
            'type' => 'string',
            'description' => 'Extracted keywords for visual generation',
            'single' => true,
            'show_in_rest' => true,
        ));
    }
}

/**
 * Initialize the plugin
 */
function raj_init() {
    return Romanian_AI_Journalist::get_instance();
}

// Start the plugin
add_action('plugins_loaded', 'raj_init');
