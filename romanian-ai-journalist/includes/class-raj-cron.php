<?php
/**
 * Cron Job Management Class
 *
 * Handles scheduled automation for news discovery and processing
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class RAJ_Cron {

    /**
     * Single instance
     */
    private static $instance = null;

    /**
     * Cron hook name
     */
    const CRON_HOOK = 'raj_run_discovery';

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
        add_action(self::CRON_HOOK, array($this, 'run_discovery_process'));
    }

    /**
     * Schedule cron events
     */
    public static function schedule_events() {
        // Clear existing schedules
        self::unschedule_events();

        // Schedule new event if auto-run is enabled
        if (RAJ_Settings::get('auto_run_enabled', false)) {
            $frequency = RAJ_Settings::get('run_frequency', 'daily');

            // Add custom cron schedule if needed
            add_filter('cron_schedules', array(__CLASS__, 'add_custom_cron_schedules'));

            // Schedule the event
            if (!wp_next_scheduled(self::CRON_HOOK)) {
                wp_schedule_event(time(), $frequency, self::CRON_HOOK);

                error_log('[RAJ Cron] Scheduled discovery to run ' . $frequency);
            }
        }
    }

    /**
     * Unschedule cron events
     */
    public static function unschedule_events() {
        $timestamp = wp_next_scheduled(self::CRON_HOOK);
        if ($timestamp) {
            wp_unschedule_event($timestamp, self::CRON_HOOK);
            error_log('[RAJ Cron] Unscheduled discovery events');
        }
    }

    /**
     * Add custom cron schedules
     *
     * @param array $schedules Existing schedules
     * @return array Modified schedules
     */
    public static function add_custom_cron_schedules($schedules) {
        if (!isset($schedules['hourly'])) {
            $schedules['hourly'] = array(
                'interval' => 3600,
                'display' => __('Once Hourly', 'romanian-ai-journalist'),
            );
        }

        if (!isset($schedules['twicedaily'])) {
            $schedules['twicedaily'] = array(
                'interval' => 43200,
                'display' => __('Twice Daily', 'romanian-ai-journalist'),
            );
        }

        if (!isset($schedules['weekly'])) {
            $schedules['weekly'] = array(
                'interval' => 604800,
                'display' => __('Once Weekly', 'romanian-ai-journalist'),
            );
        }

        return $schedules;
    }

    /**
     * Run the full discovery and processing workflow
     */
    public function run_discovery_process() {
        $this->log('Starting scheduled discovery process...');

        try {
            // Step 1: Discover news stories
            $aggregator = new RAJ_News_Aggregator();
            $stories = $aggregator->discover_stories();

            if (empty($stories)) {
                $this->log('No stories discovered');
                return;
            }

            $this->log('Discovered ' . count($stories) . ' stories');

            // Step 2: Process each story
            $processed_posts = array();

            foreach ($stories as $story) {
                try {
                    $post_id = $this->process_story($story);
                    if ($post_id) {
                        $processed_posts[] = $post_id;
                    }
                } catch (Exception $e) {
                    $this->log('Error processing story: ' . $e->getMessage());
                    continue;
                }
            }

            $this->log('Processed ' . count($processed_posts) . ' stories');

            // Step 3: Send email notification
            if (!empty($processed_posts)) {
                $email_sender = new RAJ_Email_Sender();

                if (RAJ_Settings::get('send_individual_emails', false)) {
                    // Send individual emails for each story
                    foreach ($processed_posts as $post_id) {
                        $email_sender->send_individual_email($post_id);
                    }
                } else {
                    // Send one batch email
                    $email_sender->send_batch_email($processed_posts);
                }
            }

            $this->log('Discovery process completed successfully');

        } catch (Exception $e) {
            $this->log('Discovery process failed: ' . $e->getMessage());
        }
    }

    /**
     * Process a single story
     *
     * @param array $story Story data
     * @return int|false Post ID or false on failure
     */
    private function process_story($story) {
        // Check for duplicates
        $duplicate_checker = new RAJ_Duplicate_Checker();
        if ($duplicate_checker->is_duplicate($story)) {
            $this->log('Story is duplicate, skipping: ' . $story['title']);
            return false;
        }

        // Rewrite content
        $rewriter = new RAJ_Content_Rewriter();
        $rewritten = $rewriter->rewrite_story($story);

        // Find and download image
        $image_finder = new RAJ_Image_Finder();
        $image_data = null;
        $attachment_id = null;

        if (!empty($rewritten['main_keyword'])) {
            $image_data = $image_finder->find_image($rewritten['main_keyword'], $rewritten['title']);
        }

        // Create WordPress post
        $post_data = array(
            'post_title' => $rewritten['title'],
            'post_content' => $rewritten['content'],
            'post_status' => RAJ_Settings::get('post_status', 'draft'),
            'post_type' => 'post',
            'post_category' => array(RAJ_Settings::get('default_category', 1)),
        );

        $post_id = wp_insert_post($post_data);

        if (is_wp_error($post_id)) {
            throw new Exception('Failed to create post: ' . $post_id->get_error_message());
        }

        // Add post meta
        update_post_meta($post_id, 'raj_source_url', $story['url']);
        update_post_meta($post_id, 'raj_source_name', $story['source_name']);
        update_post_meta($post_id, 'raj_keywords', implode(', ', $rewritten['keywords']));

        // Set featured image
        if ($image_data) {
            $attachment_id = $image_finder->download_and_attach($image_data, $post_id);
            if ($attachment_id) {
                set_post_thumbnail($post_id, $attachment_id);

                $image_credit = sprintf(
                    'Photo by <a href="%s" target="_blank">%s</a> on <a href="%s" target="_blank">%s</a>',
                    $image_data['photographer_url'],
                    $image_data['photographer'],
                    $image_data['source_url'],
                    $image_data['source']
                );
                update_post_meta($post_id, 'raj_image_source', $image_credit);
            }
        }

        // Generate social media content
        $social_generator = new RAJ_Social_Media_Generator();
        $social_content = $social_generator->generate_all(
            $rewritten['title'],
            $rewritten['content'],
            get_permalink($post_id)
        );

        // Save social media content
        if (!empty($social_content['instagram'])) {
            update_post_meta($post_id, 'raj_social_instagram', $social_content['instagram']);
        }
        if (!empty($social_content['linkedin'])) {
            update_post_meta($post_id, 'raj_social_linkedin', $social_content['linkedin']);
        }
        if (!empty($social_content['x_thread'])) {
            update_post_meta($post_id, 'raj_social_x_thread', $social_content['x_thread']);
        }

        // Add tags if enabled
        if (RAJ_Settings::get('auto_tag', true) && !empty($rewritten['keywords'])) {
            wp_set_post_tags($post_id, $rewritten['keywords'], true);
        }

        // Update Yoast SEO meta if plugin is active
        if (defined('WPSEO_VERSION')) {
            update_post_meta($post_id, '_yoast_wpseo_metadesc', $rewritten['meta_description']);
            update_post_meta($post_id, '_yoast_wpseo_focuskw', $rewritten['main_keyword']);
        }

        $this->log('Story processed and saved as post ID: ' . $post_id);

        return $post_id;
    }

    /**
     * Log message
     *
     * @param string $message Message to log
     */
    private function log($message) {
        error_log('[RAJ Cron] ' . $message);
    }
}
