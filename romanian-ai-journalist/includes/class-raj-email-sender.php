<?php
/**
 * Email Sender Class
 *
 * Sends email notifications to the editor with discovered stories and social media content
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class RAJ_Email_Sender {

    /**
     * Send batch email with all discovered stories
     *
     * @param array $posts Array of post IDs
     * @return bool Success status
     */
    public function send_batch_email($posts) {
        $editor_email = RAJ_Settings::get('editor_email', get_option('admin_email'));
        $subject = RAJ_Settings::get('email_subject', '[AI Journalist] New Stories Ready for Review');

        $message = $this->build_batch_email_html($posts);

        $headers = array(
            'Content-Type: text/html; charset=UTF-8',
            'From: ' . get_bloginfo('name') . ' <' . get_option('admin_email') . '>',
        );

        $sent = wp_mail($editor_email, $subject, $message, $headers);

        if ($sent) {
            $this->log("Batch email sent to {$editor_email} with " . count($posts) . " stories");
        } else {
            $this->log("Failed to send batch email to {$editor_email}");
        }

        return $sent;
    }

    /**
     * Send individual email for a single story
     *
     * @param int $post_id Post ID
     * @return bool Success status
     */
    public function send_individual_email($post_id) {
        $editor_email = RAJ_Settings::get('editor_email', get_option('admin_email'));
        $post = get_post($post_id);

        if (!$post) {
            return false;
        }

        $subject = '[AI Journalist] New Story: ' . get_the_title($post_id);
        $message = $this->build_individual_email_html($post_id);

        $headers = array(
            'Content-Type: text/html; charset=UTF-8',
            'From: ' . get_bloginfo('name') . ' <' . get_option('admin_email') . '>',
        );

        $sent = wp_mail($editor_email, $subject, $message, $headers);

        if ($sent) {
            $this->log("Individual email sent for post {$post_id}");
        } else {
            $this->log("Failed to send email for post {$post_id}");
        }

        return $sent;
    }

    /**
     * Build batch email HTML
     *
     * @param array $post_ids Post IDs
     * @return string HTML content
     */
    private function build_batch_email_html($post_ids) {
        ob_start();
        ?>
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #0073aa; color: white; padding: 20px; text-align: center; }
                .story { border: 1px solid #ddd; margin: 20px 0; padding: 15px; border-radius: 5px; }
                .story h2 { margin-top: 0; color: #0073aa; }
                .meta { color: #666; font-size: 14px; margin: 10px 0; }
                .button { display: inline-block; background: #0073aa; color: white; padding: 10px 20px;
                          text-decoration: none; border-radius: 3px; margin: 10px 0; }
                .social { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 3px; }
                .social h4 { margin-top: 0; }
                .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🗞️ AI Journalist Report</h1>
                    <p><?php echo date('l, F j, Y'); ?></p>
                </div>

                <p>Hello,</p>
                <p>The AI Journalist has discovered and prepared <strong><?php echo count($post_ids); ?> new stories</strong> for review.</p>

                <?php foreach ($post_ids as $post_id): ?>
                    <?php $this->render_story_in_email($post_id); ?>
                <?php endforeach; ?>

                <div class="footer">
                    <p>This email was sent automatically by Romanian AI Journalist plugin.</p>
                    <p><?php echo get_bloginfo('name'); ?> | <?php echo get_bloginfo('url'); ?></p>
                </div>
            </div>
        </body>
        </html>
        <?php
        return ob_get_clean();
    }

    /**
     * Build individual email HTML
     *
     * @param int $post_id Post ID
     * @return string HTML content
     */
    private function build_individual_email_html($post_id) {
        ob_start();
        ?>
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #0073aa; color: white; padding: 20px; text-align: center; }
                .story { border: 1px solid #ddd; margin: 20px 0; padding: 15px; border-radius: 5px; }
                .story h2 { margin-top: 0; color: #0073aa; }
                .meta { color: #666; font-size: 14px; margin: 10px 0; }
                .button { display: inline-block; background: #0073aa; color: white; padding: 10px 20px;
                          text-decoration: none; border-radius: 3px; margin: 10px 0; }
                .social { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 3px; }
                .social h4 { margin-top: 0; }
                .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🗞️ New Story Ready</h1>
                    <p><?php echo date('l, F j, Y'); ?></p>
                </div>

                <p>Hello,</p>
                <p>A new story has been discovered and prepared for your review:</p>

                <?php $this->render_story_in_email($post_id); ?>

                <div class="footer">
                    <p>This email was sent automatically by Romanian AI Journalist plugin.</p>
                    <p><?php echo get_bloginfo('name'); ?> | <?php echo get_bloginfo('url'); ?></p>
                </div>
            </div>
        </body>
        </html>
        <?php
        return ob_get_clean();
    }

    /**
     * Render a story in email
     *
     * @param int $post_id Post ID
     */
    private function render_story_in_email($post_id) {
        $post = get_post($post_id);
        $edit_url = get_edit_post_link($post_id, '');
        $source_url = get_post_meta($post_id, 'raj_source_url', true);
        $source_name = get_post_meta($post_id, 'raj_source_name', true);
        $instagram = get_post_meta($post_id, 'raj_social_instagram', true);
        $linkedin = get_post_meta($post_id, 'raj_social_linkedin', true);
        $x_thread = get_post_meta($post_id, 'raj_social_x_thread', true);

        ?>
        <div class="story">
            <h2><?php echo esc_html($post->post_title); ?></h2>

            <div class="meta">
                <strong>Source:</strong>
                <?php if ($source_url): ?>
                    <a href="<?php echo esc_url($source_url); ?>"><?php echo esc_html($source_name); ?></a>
                <?php else: ?>
                    <?php echo esc_html($source_name); ?>
                <?php endif; ?>
            </div>

            <div class="meta">
                <strong>Status:</strong> Draft |
                <strong>Created:</strong> <?php echo get_the_date('', $post_id); ?>
            </div>

            <?php if (has_post_thumbnail($post_id)): ?>
                <div style="margin: 15px 0;">
                    <?php echo get_the_post_thumbnail($post_id, 'medium'); ?>
                </div>
            <?php endif; ?>

            <p><?php echo wp_trim_words(strip_tags($post->post_content), 50); ?></p>

            <a href="<?php echo esc_url($edit_url); ?>" class="button">Review & Edit in WordPress →</a>

            <div class="social">
                <h4>📱 Social Media Content</h4>

                <?php if ($instagram): ?>
                    <div style="margin: 15px 0;">
                        <strong>Instagram Reel Script:</strong>
                        <div style="margin-top: 10px; white-space: pre-wrap;"><?php echo esc_html($instagram); ?></div>
                    </div>
                <?php endif; ?>

                <?php if ($linkedin): ?>
                    <div style="margin: 15px 0;">
                        <strong>LinkedIn Post:</strong>
                        <div style="margin-top: 10px; white-space: pre-wrap;"><?php echo esc_html($linkedin); ?></div>
                    </div>
                <?php endif; ?>

                <?php if ($x_thread): ?>
                    <div style="margin: 15px 0;">
                        <strong>X (Twitter) Thread:</strong>
                        <div style="margin-top: 10px; white-space: pre-wrap;"><?php echo esc_html($x_thread); ?></div>
                    </div>
                <?php endif; ?>
            </div>
        </div>
        <?php
    }

    /**
     * Log message
     *
     * @param string $message Message to log
     */
    private function log($message) {
        if (RAJ_Settings::get('debug_mode', false)) {
            error_log('[RAJ Email Sender] ' . $message);
        }
    }
}
