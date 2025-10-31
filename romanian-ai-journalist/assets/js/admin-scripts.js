/**
 * Romanian AI Journalist - Admin Scripts
 */

(function($) {
    'use strict';

    /**
     * Initialize when DOM is ready
     */
    $(document).ready(function() {
        RAJ_Admin.init();
    });

    /**
     * Main Admin Object
     */
    var RAJ_Admin = {

        /**
         * Initialize
         */
        init: function() {
            this.handleTabSwitching();
            this.handleAPITesting();
            this.handleDiscovery();
            this.handleStoryDeletion();
        },

        /**
         * Handle tab switching in settings
         */
        handleTabSwitching: function() {
            $('.nav-tab').on('click', function(e) {
                e.preventDefault();
                var target = $(this).attr('href');

                $('.nav-tab').removeClass('nav-tab-active');
                $(this).addClass('nav-tab-active');

                $('.raj-tab-content').hide();
                $(target).show();

                // Save active tab to localStorage
                localStorage.setItem('raj_active_tab', target);
            });

            // Restore active tab from localStorage
            var activeTab = localStorage.getItem('raj_active_tab');
            if (activeTab) {
                $('.nav-tab[href="' + activeTab + '"]').click();
            }
        },

        /**
         * Handle API connection testing
         */
        handleAPITesting: function() {
            $('.raj-test-api').on('click', function() {
                var $button = $(this);
                var apiType = $button.data('api');
                var originalText = $button.text();

                $button.prop('disabled', true)
                    .addClass('loading')
                    .text(rajAdmin.strings.running || 'Testing...');

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
                            RAJ_Admin.showNotice('success', response.data.message);
                        } else {
                            RAJ_Admin.showNotice('error', response.data.message);
                        }
                    },
                    error: function(xhr, status, error) {
                        RAJ_Admin.showNotice('error', 'Connection test failed: ' + error);
                    },
                    complete: function() {
                        $button.prop('disabled', false)
                            .removeClass('loading')
                            .text(originalText);
                    }
                });
            });
        },

        /**
         * Handle news discovery
         */
        handleDiscovery: function() {
            $('#raj-run-discovery').on('click', function() {
                var $button = $(this);
                var $results = $('#raj-discovery-results');

                if ($button.prop('disabled')) {
                    return;
                }

                $button.prop('disabled', true);
                $results.show().html(
                    '<div class="raj-loading">' +
                    '<span class="spinner is-active"></span>' +
                    '<p>' + (rajAdmin.strings.running || 'Discovering and processing stories... This may take a few minutes.') + '</p>' +
                    '</div>'
                );

                $.ajax({
                    url: rajAdmin.ajaxUrl,
                    type: 'POST',
                    data: {
                        action: 'raj_run_discovery',
                        nonce: rajAdmin.nonce
                    },
                    timeout: 300000, // 5 minutes timeout
                    success: function(response) {
                        if (response.success) {
                            $results.html(
                                '<div class="notice notice-success inline">' +
                                '<p><strong>' + rajAdmin.strings.success + '</strong> ' + response.data.message + '</p>' +
                                '</div>'
                            );

                            // Reload page after 3 seconds to show new stats
                            setTimeout(function() {
                                location.reload();
                            }, 3000);
                        } else {
                            $results.html(
                                '<div class="notice notice-error inline">' +
                                '<p><strong>Error:</strong> ' + response.data.message + '</p>' +
                                '</div>'
                            );
                            $button.prop('disabled', false);
                        }
                    },
                    error: function(xhr, status, error) {
                        var errorMsg = 'An error occurred';
                        if (status === 'timeout') {
                            errorMsg = 'The request timed out. The discovery may still be running in the background.';
                        } else if (xhr.responseJSON && xhr.responseJSON.data && xhr.responseJSON.data.message) {
                            errorMsg = xhr.responseJSON.data.message;
                        }

                        $results.html(
                            '<div class="notice notice-error inline">' +
                            '<p><strong>Error:</strong> ' + errorMsg + '</p>' +
                            '</div>'
                        );
                        $button.prop('disabled', false);
                    }
                });
            });
        },

        /**
         * Handle story deletion
         */
        handleStoryDeletion: function() {
            $(document).on('click', '.raj-delete-story', function() {
                if (!confirm(rajAdmin.strings.confirm_delete || 'Are you sure you want to delete this story?')) {
                    return;
                }

                var $button = $(this);
                var $row = $button.closest('tr');
                var storyId = $button.data('story-id');

                $button.prop('disabled', true).addClass('loading');

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
                            $row.fadeOut(400, function() {
                                $(this).remove();

                                // Check if table is now empty
                                if ($('tbody tr').length === 0) {
                                    location.reload();
                                }
                            });
                        } else {
                            alert(response.data.message || rajAdmin.strings.error);
                            $button.prop('disabled', false).removeClass('loading');
                        }
                    },
                    error: function() {
                        alert(rajAdmin.strings.error || 'An error occurred');
                        $button.prop('disabled', false).removeClass('loading');
                    }
                });
            });
        },

        /**
         * Show admin notice
         */
        showNotice: function(type, message) {
            var noticeClass = 'notice-' + type;
            var $notice = $('<div class="notice ' + noticeClass + ' is-dismissible"><p>' + message + '</p></div>');

            $('.wrap h1').after($notice);

            // Auto-dismiss after 5 seconds
            setTimeout(function() {
                $notice.fadeOut(function() {
                    $(this).remove();
                });
            }, 5000);

            // Make dismissible
            $notice.on('click', '.notice-dismiss', function() {
                $notice.fadeOut(function() {
                    $(this).remove();
                });
            });

            // Add dismiss button functionality
            $notice.append('<button type="button" class="notice-dismiss"><span class="screen-reader-text">Dismiss</span></button>');
        }
    };

})(jQuery);
