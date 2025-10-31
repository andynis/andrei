<?php
/**
 * Social Media Content Generator Class
 *
 * Generates platform-specific social media content for Instagram, LinkedIn, and X (Twitter)
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class RAJ_Social_Media_Generator {

    /**
     * AI provider
     */
    private $provider;

    /**
     * API key
     */
    private $api_key;

    /**
     * Constructor
     */
    public function __construct() {
        $config = RAJ_Settings::get_ai_config();
        $this->provider = $config['provider'];
        $this->api_key = $config['api_key'];
    }

    /**
     * Generate all social media content
     *
     * @param string $title Article title
     * @param string $content Article content
     * @param string $url Article URL
     * @return array Social media content
     */
    public function generate_all($title, $content, $url = '') {
        $this->log('Generating social media content...');

        $social_content = array();

        // Generate Instagram Reel script
        if (RAJ_Settings::get('generate_instagram', true)) {
            $social_content['instagram'] = $this->generate_instagram_reel($title, $content, $url);
        }

        // Generate LinkedIn post
        if (RAJ_Settings::get('generate_linkedin', true)) {
            $social_content['linkedin'] = $this->generate_linkedin_post($title, $content, $url);
        }

        // Generate X thread
        if (RAJ_Settings::get('generate_x_thread', true)) {
            $social_content['x_thread'] = $this->generate_x_thread($title, $content, $url);
        }

        $this->log('Social media content generated successfully');

        return $social_content;
    }

    /**
     * Generate Instagram Reel script
     *
     * @param string $title Title
     * @param string $content Content
     * @param string $url URL
     * @return string Instagram script
     */
    private function generate_instagram_reel($title, $content, $url) {
        $prompt = "Generate an Instagram Reel script based on this news article.\n\n";
        $prompt .= "Title: {$title}\n";
        $prompt .= "Content: " . $this->truncate_content($content, 500) . "\n\n";

        $prompt .= "REQUIREMENTS:\n";
        $prompt .= "- Length: ~150 words\n";
        $prompt .= "- Style: Clear, casual, slightly dramatic, conversational English\n";
        $prompt .= "- Structure:\n";
        $prompt .= "  * Strong CTA opening (1 line, bold)\n";
        $prompt .= "  * What happened (2-3 lines)\n";
        $prompt .= "  * Why it matters (2-3 lines)\n";
        $prompt .= "  * How it affects the audience (1-2 lines)\n";
        $prompt .= "  * End with a short CTA\n\n";

        $prompt .= "Return ONLY the script text, formatted with line breaks. Use **text** for bold.";

        return $this->call_ai_api($prompt);
    }

    /**
     * Generate LinkedIn post
     *
     * @param string $title Title
     * @param string $content Content
     * @param string $url URL
     * @return string LinkedIn post
     */
    private function generate_linkedin_post($title, $content, $url) {
        $prompt = "Generate a LinkedIn post based on this news article.\n\n";
        $prompt .= "Title: {$title}\n";
        $prompt .= "Content: " . $this->truncate_content($content, 500) . "\n\n";

        $prompt .= "REQUIREMENTS:\n";
        $prompt .= "- Length: 80-120 words\n";
        $prompt .= "- Strong curiosity hook on the first line\n";
        $prompt .= "- 3-5 short lines summarizing the news in simple terms\n";
        $prompt .= "- 2 key points with practical takeaways\n";
        $prompt .= "- End with a thoughtful question\n";
        $prompt .= "- NO emojis or hashtags\n";
        $prompt .= "- Professional but accessible tone\n\n";

        $prompt .= "Return ONLY the post text with appropriate line breaks.";

        return $this->call_ai_api($prompt);
    }

    /**
     * Generate X (Twitter) thread
     *
     * @param string $title Title
     * @param string $content Content
     * @param string $url URL
     * @return string X thread (formatted as numbered tweets)
     */
    private function generate_x_thread($title, $content, $url) {
        $prompt = "Generate an X (Twitter) thread (5-7 tweets) based on this news article.\n\n";
        $prompt .= "Title: {$title}\n";
        $prompt .= "Content: " . $this->truncate_content($content, 500) . "\n\n";

        $prompt .= "REQUIREMENTS:\n";
        $prompt .= "- Tweet 1: Attention-grabbing hook (bold)\n";
        $prompt .= "- Tweets 2-3: Explain what happened\n";
        $prompt .= "- Tweets 4-5: Why it matters / Real-world impact\n";
        $prompt .= "- Tweet 6: Practical tips or perspectives for audience\n";
        $prompt .= "- Tweet 7: CTA to follow for more updates\n";
        $prompt .= "- Each tweet MUST be ≤280 characters\n";
        $prompt .= "- No hashtags except maybe at the end of the last tweet\n";
        $prompt .= "- Number each tweet (1/7, 2/7, etc.)\n\n";

        $prompt .= "Return the thread with each tweet on a separate line, numbered. Use **text** for bold.";

        return $this->call_ai_api($prompt);
    }

    /**
     * Call AI API
     *
     * @param string $prompt Prompt
     * @return string AI response
     */
    private function call_ai_api($prompt) {
        if ($this->provider === 'openai') {
            return $this->call_openai_api($prompt);
        } elseif ($this->provider === 'anthropic') {
            return $this->call_anthropic_api($prompt);
        }

        return '';
    }

    /**
     * Call OpenAI API
     *
     * @param string $prompt Prompt
     * @return string Response
     */
    private function call_openai_api($prompt) {
        $response = wp_remote_post('https://api.openai.com/v1/chat/completions', array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $this->api_key,
                'Content-Type' => 'application/json',
            ),
            'body' => json_encode(array(
                'model' => 'gpt-4',
                'messages' => array(
                    array(
                        'role' => 'system',
                        'content' => 'You are a professional social media content creator specializing in engaging, platform-specific content.'
                    ),
                    array(
                        'role' => 'user',
                        'content' => $prompt
                    )
                ),
                'temperature' => 0.8,
                'max_tokens' => 1000,
            )),
            'timeout' => 60,
        ));

        if (is_wp_error($response)) {
            $this->log('OpenAI API error: ' . $response->get_error_message());
            return '';
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if (!isset($data['choices'][0]['message']['content'])) {
            $this->log('OpenAI API returned invalid response');
            return '';
        }

        return trim($data['choices'][0]['message']['content']);
    }

    /**
     * Call Anthropic API
     *
     * @param string $prompt Prompt
     * @return string Response
     */
    private function call_anthropic_api($prompt) {
        $response = wp_remote_post('https://api.anthropic.com/v1/messages', array(
            'headers' => array(
                'x-api-key' => $this->api_key,
                'Content-Type' => 'application/json',
                'anthropic-version' => '2023-06-01',
            ),
            'body' => json_encode(array(
                'model' => 'claude-3-opus-20240229',
                'max_tokens' => 1000,
                'messages' => array(
                    array(
                        'role' => 'user',
                        'content' => $prompt
                    )
                ),
            )),
            'timeout' => 60,
        ));

        if (is_wp_error($response)) {
            $this->log('Anthropic API error: ' . $response->get_error_message());
            return '';
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if (!isset($data['content'][0]['text'])) {
            $this->log('Anthropic API returned invalid response');
            return '';
        }

        return trim($data['content'][0]['text']);
    }

    /**
     * Truncate content for prompt
     *
     * @param string $content Content to truncate
     * @param int $max_words Maximum words
     * @return string Truncated content
     */
    private function truncate_content($content, $max_words) {
        $content = strip_tags($content);
        $words = explode(' ', $content);

        if (count($words) > $max_words) {
            $words = array_slice($words, 0, $max_words);
            return implode(' ', $words) . '...';
        }

        return $content;
    }

    /**
     * Log message
     *
     * @param string $message Message to log
     */
    private function log($message) {
        if (RAJ_Settings::get('debug_mode', false)) {
            error_log('[RAJ Social Media Generator] ' . $message);
        }
    }
}
