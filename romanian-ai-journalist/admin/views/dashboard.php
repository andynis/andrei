<?php
/**
 * Dashboard View
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

$stats = RAJ_Dashboard::get_statistics();
$system_status = RAJ_Dashboard::get_system_status();
$recent_stories = RAJ_Dashboard::get_recent_stories(5);

?>

<div class="wrap raj-dashboard">
    <h1><?php _e('Romanian AI Journalist Dashboard', 'romanian-ai-journalist'); ?></h1>

    <?php if (!$system_status['ai_configured']): ?>
        <div class="notice notice-error">
            <p><strong><?php _e('AI API Not Configured!', 'romanian-ai-journalist'); ?></strong></p>
            <p><?php _e('Please configure your OpenAI or Anthropic API key in settings to start using the plugin.', 'romanian-ai-journalist'); ?></p>
            <p><a href="<?php echo admin_url('admin.php?page=raj-settings'); ?>" class="button button-primary"><?php _e('Go to Settings', 'romanian-ai-journalist'); ?></a></p>
        </div>
    <?php endif; ?>

    <div class="raj-stats-grid">
        <div class="raj-stat-card">
            <div class="raj-stat-icon">📊</div>
            <div class="raj-stat-content">
                <div class="raj-stat-value"><?php echo $stats['total_discovered']; ?></div>
                <div class="raj-stat-label"><?php _e('Total Discovered', 'romanian-ai-journalist'); ?></div>
            </div>
        </div>

        <div class="raj-stat-card">
            <div class="raj-stat-icon">📝</div>
            <div class="raj-stat-content">
                <div class="raj-stat-value"><?php echo $stats['draft_posts']; ?></div>
                <div class="raj-stat-label"><?php _e('Draft Posts', 'romanian-ai-journalist'); ?></div>
            </div>
        </div>

        <div class="raj-stat-card">
            <div class="raj-stat-icon">✅</div>
            <div class="raj-stat-content">
                <div class="raj-stat-value"><?php echo $stats['published_posts']; ?></div>
                <div class="raj-stat-label"><?php _e('Published Posts', 'romanian-ai-journalist'); ?></div>
            </div>
        </div>

        <div class="raj-stat-card">
            <div class="raj-stat-icon">📅</div>
            <div class="raj-stat-content">
                <div class="raj-stat-value"><?php echo $stats['today']; ?></div>
                <div class="raj-stat-label"><?php _e('Discovered Today', 'romanian-ai-journalist'); ?></div>
            </div>
        </div>
    </div>

    <div class="raj-two-column">
        <div class="raj-column raj-main-column">
            <div class="raj-card">
                <h2><?php _e('Quick Actions', 'romanian-ai-journalist'); ?></h2>

                <div class="raj-action-buttons">
                    <button id="raj-run-discovery" class="button button-primary button-hero">
                        <span class="dashicons dashicons-search"></span>
                        <?php _e('Run News Discovery Now', 'romanian-ai-journalist'); ?>
                    </button>

                    <p class="description">
                        <?php _e('Discover and process the top Romanian news stories right now.', 'romanian-ai-journalist'); ?>
                    </p>
                </div>

                <div id="raj-discovery-results" style="display: none; margin-top: 20px;">
                    <div class="raj-loading">
                        <span class="spinner is-active"></span>
                        <p><?php _e('Discovering and processing stories... This may take a few minutes.', 'romanian-ai-journalist'); ?></p>
                    </div>
                </div>
            </div>

            <div class="raj-card">
                <h2><?php _e('Recent Stories', 'romanian-ai-journalist'); ?></h2>

                <?php if (!empty($recent_stories)): ?>
                    <table class="wp-list-table widefat fixed striped">
                        <thead>
                            <tr>
                                <th><?php _e('Title', 'romanian-ai-journalist'); ?></th>
                                <th><?php _e('Source', 'romanian-ai-journalist'); ?></th>
                                <th><?php _e('Discovered', 'romanian-ai-journalist'); ?></th>
                                <th><?php _e('Status', 'romanian-ai-journalist'); ?></th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($recent_stories as $story): ?>
                                <tr>
                                    <td>
                                        <strong>
                                            <a href="<?php echo esc_url($story->story_url); ?>" target="_blank">
                                                <?php echo esc_html($story->story_title); ?>
                                            </a>
                                        </strong>
                                    </td>
                                    <td><?php echo esc_html($story->source_name); ?></td>
                                    <td><?php echo human_time_diff(strtotime($story->discovered_date), current_time('timestamp')) . ' ago'; ?></td>
                                    <td>
                                        <?php
                                        $status_labels = array(
                                            'pending' => '<span class="raj-status-pending">Pending</span>',
                                            'processed' => '<span class="raj-status-processed">Processed</span>',
                                            'failed' => '<span class="raj-status-failed">Failed</span>',
                                        );
                                        echo $status_labels[$story->status] ?? $story->status;
                                        ?>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>

                    <p style="margin-top: 15px;">
                        <a href="<?php echo admin_url('admin.php?page=raj-stories'); ?>" class="button">
                            <?php _e('View All Stories', 'romanian-ai-journalist'); ?>
                        </a>
                    </p>
                <?php else: ?>
                    <p><?php _e('No stories discovered yet. Run the discovery process to get started!', 'romanian-ai-journalist'); ?></p>
                <?php endif; ?>
            </div>
        </div>

        <div class="raj-column raj-sidebar-column">
            <div class="raj-card">
                <h2><?php _e('System Status', 'romanian-ai-journalist'); ?></h2>

                <div class="raj-status-list">
                    <div class="raj-status-item">
                        <span class="raj-status-label"><?php _e('AI API:', 'romanian-ai-journalist'); ?></span>
                        <span class="<?php echo $system_status['ai_configured'] ? 'raj-status-ok' : 'raj-status-error'; ?>">
                            <?php echo $system_status['ai_configured'] ? '✓ Configured' : '✗ Not Configured'; ?>
                        </span>
                    </div>

                    <div class="raj-status-item">
                        <span class="raj-status-label"><?php _e('News API:', 'romanian-ai-journalist'); ?></span>
                        <span class="<?php echo $system_status['news_api_configured'] ? 'raj-status-ok' : 'raj-status-warning'; ?>">
                            <?php echo $system_status['news_api_configured'] ? '✓ Configured' : '○ Optional'; ?>
                        </span>
                    </div>

                    <div class="raj-status-item">
                        <span class="raj-status-label"><?php _e('Image API:', 'romanian-ai-journalist'); ?></span>
                        <span class="<?php echo $system_status['image_api_configured'] ? 'raj-status-ok' : 'raj-status-warning'; ?>">
                            <?php echo $system_status['image_api_configured'] ? '✓ Configured' : '○ Optional'; ?>
                        </span>
                    </div>

                    <div class="raj-status-item">
                        <span class="raj-status-label"><?php _e('Auto-Run:', 'romanian-ai-journalist'); ?></span>
                        <span class="<?php echo $system_status['auto_run_enabled'] ? 'raj-status-ok' : 'raj-status-inactive'; ?>">
                            <?php echo $system_status['auto_run_enabled'] ? '✓ Enabled' : '○ Disabled'; ?>
                        </span>
                    </div>

                    <?php if ($system_status['auto_run_enabled'] && $system_status['next_scheduled_run']): ?>
                        <div class="raj-status-item">
                            <span class="raj-status-label"><?php _e('Next Run:', 'romanian-ai-journalist'); ?></span>
                            <span><?php echo human_time_diff($system_status['next_scheduled_run'], current_time('timestamp')); ?></span>
                        </div>
                    <?php endif; ?>
                </div>
            </div>

            <div class="raj-card">
                <h2><?php _e('Quick Links', 'romanian-ai-journalist'); ?></h2>

                <ul class="raj-quick-links">
                    <li><a href="<?php echo admin_url('admin.php?page=raj-settings'); ?>">⚙️ <?php _e('Plugin Settings', 'romanian-ai-journalist'); ?></a></li>
                    <li><a href="<?php echo admin_url('edit.php?post_status=draft&post_type=post'); ?>">📝 <?php _e('View Draft Posts', 'romanian-ai-journalist'); ?></a></li>
                    <li><a href="<?php echo admin_url('admin.php?page=raj-stories'); ?>">📋 <?php _e('All Discovered Stories', 'romanian-ai-journalist'); ?></a></li>
                    <li><a href="<?php echo admin_url('edit.php?post_type=post'); ?>">📰 <?php _e('All Posts', 'romanian-ai-journalist'); ?></a></li>
                </ul>
            </div>

            <div class="raj-card">
                <h2><?php _e('About', 'romanian-ai-journalist'); ?></h2>

                <p><strong><?php _e('Version:', 'romanian-ai-journalist'); ?></strong> <?php echo RAJ_VERSION; ?></p>
                <p><strong><?php _e('WordPress:', 'romanian-ai-journalist'); ?></strong> <?php echo $system_status['wordpress_version']; ?></p>
                <p><strong><?php _e('PHP:', 'romanian-ai-journalist'); ?></strong> <?php echo $system_status['php_version']; ?></p>
            </div>
        </div>
    </div>
</div>

<script>
jQuery(document).ready(function($) {
    $('#raj-run-discovery').on('click', function() {
        var $button = $(this);
        var $results = $('#raj-discovery-results');

        $button.prop('disabled', true);
        $results.show();

        $.ajax({
            url: rajAdmin.ajaxUrl,
            type: 'POST',
            data: {
                action: 'raj_run_discovery',
                nonce: rajAdmin.nonce
            },
            success: function(response) {
                if (response.success) {
                    $results.html('<div class="notice notice-success"><p>' + response.data.message + '</p></div>');
                    setTimeout(function() {
                        location.reload();
                    }, 2000);
                } else {
                    $results.html('<div class="notice notice-error"><p>' + response.data.message + '</p></div>');
                    $button.prop('disabled', false);
                }
            },
            error: function() {
                $results.html('<div class="notice notice-error"><p>' + rajAdmin.strings.error + '</p></div>');
                $button.prop('disabled', false);
            }
        });
    });
});
</script>
