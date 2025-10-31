<?php
/**
 * Plugin Name: Romanian AI Journalist
 * Plugin URI: https://github.com/yourusername/romanian-ai-journalist
 * Description: An AI-powered journalist that discovers, rewrites, and publishes the most important Romanian news stories with social media content generation.
 * Version: 1.0.2
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
if (!defined('RAJ_VERSION')) {
    define('RAJ_VERSION', '1.0.2');
}
if (!defined('RAJ_PLUGIN_DIR')) {
    define('RAJ_PLUGIN_DIR', plugin_dir_path(__FILE__));
}
if (!defined('RAJ_PLUGIN_URL')) {
    define('RAJ_PLUGIN_URL', plugin_dir_url(__FILE__));
}
if (!defined('RAJ_PLUGIN_BASENAME')) {
    define('RAJ_PLUGIN_BASENAME', plugin_basename(__FILE__));
}

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

        // Initialize admin interface immediately
        if (is_admin()) {
            $this->init_admin();
        }

        // Initialize cron jobs
        $this->init_cron();

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
        if (class_exists('RAJ_Cron')) {
            RAJ_Cron::schedule_events();
        }

        // Flush rewrite rules
        flush_rewrite_rules();
    }

    /**
     * Plugin deactivation
     */
    public function deactivate() {
        // Unschedule cron jobs
        if (class_exists('RAJ_Cron')) {
            RAJ_Cron::unschedule_events();
        }

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
            // API Settings
            'raj_api_provider' => 'openai',
            'raj_openai_api_key' => '',
            'raj_anthropic_api_key' => '',
            'raj_newsapi_key' => '',
            'raj_unsplash_api_key' => '',
            'raj_pexels_api_key' => '',

            // News Discovery
            'raj_news_count' => 10,
            'raj_hours_lookback' => 48,
            'raj_min_engagement_score' => 0,
            'raj_keywords_to_exclude' => '',
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

            // Content Settings
            'raj_rewrite_style' => 'narrative',
            'raj_content_length' => 'detailed',
            'raj_include_quotes' => true,
            'raj_add_context' => true,
            'raj_post_status' => 'draft',
            'raj_default_category' => 1,
            'raj_auto_tag' => true,
            'raj_featured_image_required' => true,

            // Social Media
            'raj_generate_instagram' => true,
            'raj_generate_linkedin' => true,
            'raj_generate_x_thread' => true,

            // Email
            'raj_editor_email' => get_option('admin_email'),
            'raj_email_subject' => '[AI Journalist] New Stories Ready for Review',
            'raj_send_individual_emails' => false,

            // Automation
            'raj_auto_run_enabled' => false,
            'raj_run_frequency' => 'daily',
            'raj_run_time' => '08:00',

            // Advanced
            'raj_debug_mode' => false,
            'raj_log_level' => 'info',
            'raj_max_retries' => 3,
            'raj_timeout' => 30,
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
        if (class_exists('RAJ_Admin')) {
            RAJ_Admin::get_instance();
        }
    }

    /**
     * Initialize cron system
     */
    public function init_cron() {
        if (class_exists('RAJ_Cron')) {
            RAJ_Cron::get_instance();
        }
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
function romanian_ai_journalist_init() {
    return Romanian_AI_Journalist::get_instance();
}

// Start the plugin immediately
romanian_ai_journalist_init();
