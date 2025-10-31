<?php
/**
 * Settings Page View
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Handle form submission
if (isset($_POST['raj_settings_submit']) && check_admin_referer('raj_settings_save', 'raj_settings_nonce')) {
    $settings = array();

    // Collect all form fields
    $fields = array(
        'api_provider', 'openai_api_key', 'anthropic_api_key', 'newsapi_key',
        'unsplash_api_key', 'pexels_api_key', 'news_count', 'hours_lookback',
        'romanian_sources', 'keywords_to_exclude', 'min_engagement_score',
        'rewrite_style', 'content_length', 'post_status', 'default_category',
        'editor_email', 'email_subject', 'run_frequency', 'run_time',
        'debug_mode', 'log_level', 'max_retries', 'timeout'
    );

    foreach ($fields as $field) {
        if (isset($_POST[$field])) {
            $settings[$field] = $_POST[$field];
        }
    }

    // Handle checkboxes
    $checkboxes = array(
        'include_quotes', 'add_context', 'auto_tag', 'featured_image_required',
        'generate_instagram', 'generate_linkedin', 'generate_x_thread',
        'send_individual_emails', 'auto_run_enabled'
    );

    foreach ($checkboxes as $checkbox) {
        $settings[$checkbox] = isset($_POST[$checkbox]) ? true : false;
    }

    // Sanitize and save
    $sanitized = RAJ_Settings::sanitize($settings);

    foreach ($sanitized as $key => $value) {
        RAJ_Settings::update($key, $value);
    }

    // Reschedule cron if settings changed
    RAJ_Cron::schedule_events();

    echo '<div class="notice notice-success"><p>' . __('Settings saved successfully!', 'romanian-ai-journalist') . '</p></div>';
}

$settings = RAJ_Settings::get_all();

?>

<div class="wrap raj-settings">
    <h1><?php _e('Romanian AI Journalist Settings', 'romanian-ai-journalist'); ?></h1>

    <form method="post" action="">
        <?php wp_nonce_field('raj_settings_save', 'raj_settings_nonce'); ?>

        <div class="raj-settings-tabs">
            <h2 class="nav-tab-wrapper">
                <a href="#tab-api" class="nav-tab nav-tab-active"><?php _e('API Settings', 'romanian-ai-journalist'); ?></a>
                <a href="#tab-news" class="nav-tab"><?php _e('News Discovery', 'romanian-ai-journalist'); ?></a>
                <a href="#tab-content" class="nav-tab"><?php _e('Content', 'romanian-ai-journalist'); ?></a>
                <a href="#tab-social" class="nav-tab"><?php _e('Social Media', 'romanian-ai-journalist'); ?></a>
                <a href="#tab-automation" class="nav-tab"><?php _e('Automation', 'romanian-ai-journalist'); ?></a>
                <a href="#tab-advanced" class="nav-tab"><?php _e('Advanced', 'romanian-ai-journalist'); ?></a>
            </h2>

            <!-- API Settings Tab -->
            <div id="tab-api" class="raj-tab-content">
                <table class="form-table">
                    <tr>
                        <th scope="row"><label for="api_provider"><?php _e('AI Provider', 'romanian-ai-journalist'); ?></label></th>
                        <td>
                            <select name="api_provider" id="api_provider">
                                <option value="openai" <?php selected($settings['api_provider'], 'openai'); ?>>OpenAI (GPT-4)</option>
                                <option value="anthropic" <?php selected($settings['api_provider'], 'anthropic'); ?>>Anthropic (Claude)</option>
                            </select>
                            <p class="description"><?php _e('Choose which AI provider to use for content generation.', 'romanian-ai-journalist'); ?></p>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="openai_api_key"><?php _e('OpenAI API Key', 'romanian-ai-journalist'); ?></label></th>
                        <td>
                            <input type="password" name="openai_api_key" id="openai_api_key" value="<?php echo esc_attr($settings['openai_api_key']); ?>" class="regular-text">
                            <button type="button" class="button raj-test-api" data-api="openai"><?php _e('Test Connection', 'romanian-ai-journalist'); ?></button>
                            <p class="description"><?php _e('Get your API key from', 'romanian-ai-journalist'); ?> <a href="https://platform.openai.com/api-keys" target="_blank">OpenAI Platform</a></p>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="anthropic_api_key"><?php _e('Anthropic API Key', 'romanian-ai-journalist'); ?></label></th>
                        <td>
                            <input type="password" name="anthropic_api_key" id="anthropic_api_key" value="<?php echo esc_attr($settings['anthropic_api_key']); ?>" class="regular-text">
                            <button type="button" class="button raj-test-api" data-api="anthropic"><?php _e('Test Connection', 'romanian-ai-journalist'); ?></button>
                            <p class="description"><?php _e('Get your API key from', 'romanian-ai-journalist'); ?> <a href="https://console.anthropic.com/" target="_blank">Anthropic Console</a></p>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="newsapi_key"><?php _e('NewsAPI Key', 'romanian-ai-journalist'); ?></label></th>
                        <td>
                            <input type="text" name="newsapi_key" id="newsapi_key" value="<?php echo esc_attr($settings['newsapi_key']); ?>" class="regular-text">
                            <button type="button" class="button raj-test-api" data-api="newsapi"><?php _e('Test Connection', 'romanian-ai-journalist'); ?></button>
                            <p class="description"><?php _e('Optional. Get your API key from', 'romanian-ai-journalist'); ?> <a href="https://newsapi.org/" target="_blank">NewsAPI.org</a></p>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="unsplash_api_key"><?php _e('Unsplash API Key', 'romanian-ai-journalist'); ?></label></th>
                        <td>
                            <input type="text" name="unsplash_api_key" id="unsplash_api_key" value="<?php echo esc_attr($settings['unsplash_api_key']); ?>" class="regular-text">
                            <button type="button" class="button raj-test-api" data-api="unsplash"><?php _e('Test Connection', 'romanian-ai-journalist'); ?></button>
                            <p class="description"><?php _e('Optional. Get your API key from', 'romanian-ai-journalist'); ?> <a href="https://unsplash.com/developers" target="_blank">Unsplash Developers</a></p>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="pexels_api_key"><?php _e('Pexels API Key', 'romanian-ai-journalist'); ?></label></th>
                        <td>
                            <input type="text" name="pexels_api_key" id="pexels_api_key" value="<?php echo esc_attr($settings['pexels_api_key']); ?>" class="regular-text">
                            <button type="button" class="button raj-test-api" data-api="pexels"><?php _e('Test Connection', 'romanian-ai-journalist'); ?></button>
                            <p class="description"><?php _e('Optional. Get your API key from', 'romanian-ai-journalist'); ?> <a href="https://www.pexels.com/api/" target="_blank">Pexels API</a></p>
                        </td>
                    </tr>
                </table>
            </div>

            <!-- News Discovery Tab -->
            <div id="tab-news" class="raj-tab-content" style="display: none;">
                <table class="form-table">
                    <tr>
                        <th scope="row"><label for="news_count"><?php _e('Number of Stories', 'romanian-ai-journalist'); ?></label></th>
                        <td>
                            <input type="number" name="news_count" id="news_count" value="<?php echo esc_attr($settings['news_count']); ?>" min="1" max="50">
                            <p class="description"><?php _e('How many stories to discover per run (1-50).', 'romanian-ai-journalist'); ?></p>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="hours_lookback"><?php _e('Time Range (Hours)', 'romanian-ai-journalist'); ?></label></th>
                        <td>
                            <input type="number" name="hours_lookback" id="hours_lookback" value="<?php echo esc_attr($settings['hours_lookback']); ?>" min="1" max="168">
                            <p class="description"><?php _e('Only include stories published within this many hours (default: 48).', 'romanian-ai-journalist'); ?></p>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="romanian_sources"><?php _e('Romanian News Sources', 'romanian-ai-journalist'); ?></label></th>
                        <td>
                            <textarea name="romanian_sources" id="romanian_sources" rows="10" class="large-text"><?php echo esc_textarea($settings['romanian_sources']); ?></textarea>
                            <p class="description"><?php _e('One source domain per line (e.g., digi24.ro)', 'romanian-ai-journalist'); ?></p>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="keywords_to_exclude"><?php _e('Excluded Keywords', 'romanian-ai-journalist'); ?></label></th>
                        <td>
                            <textarea name="keywords_to_exclude" id="keywords_to_exclude" rows="5" class="large-text"><?php echo esc_textarea($settings['keywords_to_exclude']); ?></textarea>
                            <p class="description"><?php _e('One keyword per line. Stories containing these will be filtered out.', 'romanian-ai-journalist'); ?></p>
                        </td>
                    </tr>
                </table>
            </div>

            <!-- Content Tab -->
            <div id="tab-content" class="raj-tab-content" style="display: none;">
                <table class="form-table">
                    <tr>
                        <th scope="row"><label for="post_status"><?php _e('Post Status', 'romanian-ai-journalist'); ?></label></th>
                        <td>
                            <select name="post_status" id="post_status">
                                <option value="draft" <?php selected($settings['post_status'], 'draft'); ?>><?php _e('Draft', 'romanian-ai-journalist'); ?></option>
                                <option value="pending" <?php selected($settings['post_status'], 'pending'); ?>><?php _e('Pending Review', 'romanian-ai-journalist'); ?></option>
                                <option value="publish" <?php selected($settings['post_status'], 'publish'); ?>><?php _e('Published', 'romanian-ai-journalist'); ?></option>
                            </select>
                            <p class="description"><?php _e('Status for newly created posts.', 'romanian-ai-journalist'); ?></p>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="default_category"><?php _e('Default Category', 'romanian-ai-journalist'); ?></label></th>
                        <td>
                            <?php wp_dropdown_categories(array(
                                'name' => 'default_category',
                                'id' => 'default_category',
                                'selected' => $settings['default_category'],
                                'show_option_none' => __('Select Category', 'romanian-ai-journalist'),
                                'hide_empty' => false,
                            )); ?>
                            <p class="description"><?php _e('Default category for new posts.', 'romanian-ai-journalist'); ?></p>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><?php _e('Options', 'romanian-ai-journalist'); ?></th>
                        <td>
                            <label>
                                <input type="checkbox" name="auto_tag" value="1" <?php checked($settings['auto_tag'], true); ?>>
                                <?php _e('Automatically add tags from keywords', 'romanian-ai-journalist'); ?>
                            </label><br>

                            <label>
                                <input type="checkbox" name="featured_image_required" value="1" <?php checked($settings['featured_image_required'], true); ?>>
                                <?php _e('Require featured image', 'romanian-ai-journalist'); ?>
                            </label>
                        </td>
                    </tr>
                </table>
            </div>

            <!-- Social Media Tab -->
            <div id="tab-social" class="raj-tab-content" style="display: none;">
                <table class="form-table">
                    <tr>
                        <th scope="row"><?php _e('Generate Content For', 'romanian-ai-journalist'); ?></th>
                        <td>
                            <label>
                                <input type="checkbox" name="generate_instagram" value="1" <?php checked($settings['generate_instagram'], true); ?>>
                                <?php _e('Instagram Reel Script', 'romanian-ai-journalist'); ?>
                            </label><br>

                            <label>
                                <input type="checkbox" name="generate_linkedin" value="1" <?php checked($settings['generate_linkedin'], true); ?>>
                                <?php _e('LinkedIn Post', 'romanian-ai-journalist'); ?>
                            </label><br>

                            <label>
                                <input type="checkbox" name="generate_x_thread" value="1" <?php checked($settings['generate_x_thread'], true); ?>>
                                <?php _e('X (Twitter) Thread', 'romanian-ai-journalist'); ?>
                            </label>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="editor_email"><?php _e('Editor Email', 'romanian-ai-journalist'); ?></label></th>
                        <td>
                            <input type="email" name="editor_email" id="editor_email" value="<?php echo esc_attr($settings['editor_email']); ?>" class="regular-text">
                            <p class="description"><?php _e('Email address to send notifications to.', 'romanian-ai-journalist'); ?></p>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="email_subject"><?php _e('Email Subject', 'romanian-ai-journalist'); ?></label></th>
                        <td>
                            <input type="text" name="email_subject" id="email_subject" value="<?php echo esc_attr($settings['email_subject']); ?>" class="regular-text">
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><?php _e('Email Options', 'romanian-ai-journalist'); ?></th>
                        <td>
                            <label>
                                <input type="checkbox" name="send_individual_emails" value="1" <?php checked($settings['send_individual_emails'], true); ?>>
                                <?php _e('Send individual email for each story (instead of one batch email)', 'romanian-ai-journalist'); ?>
                            </label>
                        </td>
                    </tr>
                </table>
            </div>

            <!-- Automation Tab -->
            <div id="tab-automation" class="raj-tab-content" style="display: none;">
                <table class="form-table">
                    <tr>
                        <th scope="row"><?php _e('Automated Discovery', 'romanian-ai-journalist'); ?></th>
                        <td>
                            <label>
                                <input type="checkbox" name="auto_run_enabled" value="1" <?php checked($settings['auto_run_enabled'], true); ?>>
                                <?php _e('Enable automatic news discovery', 'romanian-ai-journalist'); ?>
                            </label>
                            <p class="description"><?php _e('When enabled, the plugin will automatically discover and process news stories.', 'romanian-ai-journalist'); ?></p>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="run_frequency"><?php _e('Run Frequency', 'romanian-ai-journalist'); ?></label></th>
                        <td>
                            <select name="run_frequency" id="run_frequency">
                                <option value="hourly" <?php selected($settings['run_frequency'], 'hourly'); ?>><?php _e('Every Hour', 'romanian-ai-journalist'); ?></option>
                                <option value="twicedaily" <?php selected($settings['run_frequency'], 'twicedaily'); ?>><?php _e('Twice Daily', 'romanian-ai-journalist'); ?></option>
                                <option value="daily" <?php selected($settings['run_frequency'], 'daily'); ?>><?php _e('Once Daily', 'romanian-ai-journalist'); ?></option>
                                <option value="weekly" <?php selected($settings['run_frequency'], 'weekly'); ?>><?php _e('Once Weekly', 'romanian-ai-journalist'); ?></option>
                            </select>
                        </td>
                    </tr>
                </table>
            </div>

            <!-- Advanced Tab -->
            <div id="tab-advanced" class="raj-tab-content" style="display: none;">
                <table class="form-table">
                    <tr>
                        <th scope="row"><?php _e('Debug Mode', 'romanian-ai-journalist'); ?></th>
                        <td>
                            <label>
                                <input type="checkbox" name="debug_mode" value="1" <?php checked($settings['debug_mode'], true); ?>>
                                <?php _e('Enable debug logging', 'romanian-ai-journalist'); ?>
                            </label>
                            <p class="description"><?php _e('Logs will be written to PHP error log.', 'romanian-ai-journalist'); ?></p>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="timeout"><?php _e('API Timeout (seconds)', 'romanian-ai-journalist'); ?></label></th>
                        <td>
                            <input type="number" name="timeout" id="timeout" value="<?php echo esc_attr($settings['timeout']); ?>" min="10" max="120">
                            <p class="description"><?php _e('Maximum time to wait for API responses.', 'romanian-ai-journalist'); ?></p>
                        </td>
                    </tr>
                </table>
            </div>
        </div>

        <p class="submit">
            <input type="submit" name="raj_settings_submit" class="button button-primary" value="<?php _e('Save Settings', 'romanian-ai-journalist'); ?>">
        </p>
    </form>
</div>

<script>
jQuery(document).ready(function($) {
    // Tab switching
    $('.nav-tab').on('click', function(e) {
        e.preventDefault();
        var target = $(this).attr('href');

        $('.nav-tab').removeClass('nav-tab-active');
        $(this).addClass('nav-tab-active');

        $('.raj-tab-content').hide();
        $(target).show();
    });

    // Test API connections
    $('.raj-test-api').on('click', function() {
        var $button = $(this);
        var apiType = $button.data('api');

        $button.prop('disabled', true).text('Testing...');

        $.ajax({
            url: rajAdmin.ajaxUrl,
            type: 'POST',
            data: {
                action: 'raj_test_api',
                api_type: apiType,
                nonce: rajAdmin.nonce
            },
            success: function(response) {
                if (response.success) {
                    alert(response.data.message);
                } else {
                    alert('Error: ' + response.data.message);
                }
                $button.prop('disabled', false).text('Test Connection');
            },
            error: function() {
                alert('Connection test failed');
                $button.prop('disabled', false).text('Test Connection');
            }
        });
    });
});
</script>
