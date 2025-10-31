<?php
/**
 * Dashboard Class
 *
 * Handles the main dashboard functionality
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class RAJ_Dashboard {

    /**
     * Get dashboard statistics
     *
     * @return array Statistics
     */
    public static function get_statistics() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'raj_discovered_stories';

        // Total discovered stories
        $total_discovered = $wpdb->get_var("SELECT COUNT(*) FROM $table_name");

        // Stories by status
        $pending = $wpdb->get_var("SELECT COUNT(*) FROM $table_name WHERE status = 'pending'");
        $processed = $wpdb->get_var("SELECT COUNT(*) FROM $table_name WHERE status = 'processed'");
        $failed = $wpdb->get_var("SELECT COUNT(*) FROM $table_name WHERE status = 'failed'");

        // Published posts (from WordPress)
        $published_posts = wp_count_posts('post');

        // Stories discovered today
        $today = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $table_name WHERE DATE(discovered_date) = %s",
            current_time('Y-m-d')
        ));

        // Stories discovered this week
        $week_ago = date('Y-m-d H:i:s', strtotime('-7 days'));
        $this_week = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $table_name WHERE discovered_date >= %s",
            $week_ago
        ));

        return array(
            'total_discovered' => intval($total_discovered),
            'pending' => intval($pending),
            'processed' => intval($processed),
            'failed' => intval($failed),
            'published_posts' => intval($published_posts->publish),
            'draft_posts' => intval($published_posts->draft),
            'today' => intval($today),
            'this_week' => intval($this_week),
        );
    }

    /**
     * Get recent stories
     *
     * @param int $limit Number of stories to retrieve
     * @return array Recent stories
     */
    public static function get_recent_stories($limit = 10) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'raj_discovered_stories';

        $stories = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table_name ORDER BY discovered_date DESC LIMIT %d",
            $limit
        ));

        return $stories;
    }

    /**
     * Get system status
     *
     * @return array System status information
     */
    public static function get_system_status() {
        return array(
            'ai_configured' => RAJ_Settings::is_api_configured(),
            'news_api_configured' => RAJ_Settings::is_news_api_configured(),
            'image_api_configured' => RAJ_Settings::is_image_api_configured(),
            'auto_run_enabled' => RAJ_Settings::get('auto_run_enabled', false),
            'next_scheduled_run' => wp_next_scheduled(RAJ_Cron::CRON_HOOK),
            'php_version' => phpversion(),
            'wordpress_version' => get_bloginfo('version'),
            'plugin_version' => RAJ_VERSION,
        );
    }
}
