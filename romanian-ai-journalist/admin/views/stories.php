<?php
/**
 * Discovered Stories View
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

global $wpdb;
$table_name = $wpdb->prefix . 'raj_discovered_stories';

// Pagination
$per_page = 20;
$paged = isset($_GET['paged']) ? max(1, intval($_GET['paged'])) : 1;
$offset = ($paged - 1) * $per_page;

// Get total count
$total_stories = $wpdb->get_var("SELECT COUNT(*) FROM $table_name");
$total_pages = ceil($total_stories / $per_page);

// Get stories
$stories = $wpdb->get_results($wpdb->prepare(
    "SELECT * FROM $table_name ORDER BY discovered_date DESC LIMIT %d OFFSET %d",
    $per_page,
    $offset
));

?>

<div class="wrap raj-stories">
    <h1><?php _e('Discovered Stories', 'romanian-ai-journalist'); ?></h1>

    <div class="raj-stories-header">
        <p><?php printf(__('Showing %d-%d of %d stories', 'romanian-ai-journalist'),
            $offset + 1,
            min($offset + $per_page, $total_stories),
            $total_stories
        ); ?></p>
    </div>

    <?php if (!empty($stories)): ?>
        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th width="50%"><?php _e('Title', 'romanian-ai-journalist'); ?></th>
                    <th><?php _e('Source', 'romanian-ai-journalist'); ?></th>
                    <th><?php _e('Discovered', 'romanian-ai-journalist'); ?></th>
                    <th><?php _e('Status', 'romanian-ai-journalist'); ?></th>
                    <th><?php _e('Actions', 'romanian-ai-journalist'); ?></th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($stories as $story): ?>
                    <tr>
                        <td>
                            <strong>
                                <a href="<?php echo esc_url($story->story_url); ?>" target="_blank">
                                    <?php echo esc_html($story->story_title); ?>
                                </a>
                            </strong>
                            <?php if ($story->wordpress_post_id): ?>
                                <br>
                                <small>
                                    <a href="<?php echo get_edit_post_link($story->wordpress_post_id); ?>">
                                        <?php _e('View WordPress Post', 'romanian-ai-journalist'); ?> →
                                    </a>
                                </small>
                            <?php endif; ?>
                        </td>
                        <td><?php echo esc_html($story->source_name); ?></td>
                        <td><?php echo human_time_diff(strtotime($story->discovered_date), current_time('timestamp')) . ' ago'; ?></td>
                        <td>
                            <?php
                            $status_classes = array(
                                'pending' => 'raj-status-pending',
                                'processed' => 'raj-status-processed',
                                'failed' => 'raj-status-failed',
                            );
                            $status_class = $status_classes[$story->status] ?? '';
                            ?>
                            <span class="<?php echo esc_attr($status_class); ?>">
                                <?php echo esc_html(ucfirst($story->status)); ?>
                            </span>
                        </td>
                        <td>
                            <button class="button button-small raj-delete-story" data-story-id="<?php echo esc_attr($story->id); ?>">
                                <?php _e('Delete', 'romanian-ai-journalist'); ?>
                            </button>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>

        <?php if ($total_pages > 1): ?>
            <div class="tablenav">
                <div class="tablenav-pages">
                    <?php
                    echo paginate_links(array(
                        'base' => add_query_arg('paged', '%#%'),
                        'format' => '',
                        'prev_text' => '&laquo;',
                        'next_text' => '&raquo;',
                        'total' => $total_pages,
                        'current' => $paged,
                    ));
                    ?>
                </div>
            </div>
        <?php endif; ?>

    <?php else: ?>
        <div class="raj-no-stories">
            <p><?php _e('No stories discovered yet.', 'romanian-ai-journalist'); ?></p>
            <p><a href="<?php echo admin_url('admin.php?page=romanian-ai-journalist'); ?>" class="button button-primary"><?php _e('Go to Dashboard', 'romanian-ai-journalist'); ?></a></p>
        </div>
    <?php endif; ?>
</div>

<script>
jQuery(document).ready(function($) {
    $('.raj-delete-story').on('click', function() {
        if (!confirm(rajAdmin.strings.confirm_delete)) {
            return;
        }

        var $button = $(this);
        var storyId = $button.data('story-id');

        $button.prop('disabled', true);

        $.ajax({
            url: rajAdmin.ajaxUrl,
            type: 'POST',
            data: {
                action: 'raj_delete_story',
                story_id: storyId,
                nonce: rajAdmin.nonce
            },
            success: function(response) {
                if (response.success) {
                    $button.closest('tr').fadeOut(function() {
                        $(this).remove();
                    });
                } else {
                    alert(response.data.message);
                    $button.prop('disabled', false);
                }
            },
            error: function() {
                alert(rajAdmin.strings.error);
                $button.prop('disabled', false);
            }
        });
    });
});
</script>
