<?php
/**
 * Content Rewriter Class
 *
 * Uses AI to rewrite news stories in narrative, detailed format
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class RAJ_Content_Rewriter {

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
     * Rewrite a news story
     *
     * @param array $story Original story data
     * @return array Rewritten content
     */
    public function rewrite_story($story) {
        $this->log('Rewriting story: ' . $story['title']);

        // Fetch full article content if only description is available
        $full_content = $this->fetch_article_content($story['url']);

        if (!$full_content) {
            $full_content = $story['content'] ?? $story['description'] ?? '';
        }

        // Generate rewrite prompt
        $prompt = $this->build_rewrite_prompt($story, $full_content);

        // Call AI API
        $rewritten = $this->call_ai_api($prompt);

        if (!$rewritten) {
            throw new Exception('Failed to rewrite story');
        }

        // Parse the AI response
        $parsed = $this->parse_ai_response($rewritten);

        $this->log('Story rewritten successfully');

        return $parsed;
    }

    /**
     * Build rewrite prompt
     *
     * @param array $story Story data
     * @param string $content Original content
     * @return string Prompt
     */
    private function build_rewrite_prompt($story, $content) {
        $prompt = "Ești un jurnalist profesionist român. Ai primit sarcina de a rescrie următoarea știre într-un format narativ, detaliat și captivant pentru cititorii români.\n\n";
        $prompt .= "ȘTIREA ORIGINALĂ:\n";
        $prompt .= "Titlu: " . $story['title'] . "\n";
        $prompt .= "Sursă: " . $story['source_name'] . "\n";
        $prompt .= "Conținut:\n" . $content . "\n\n";

        $prompt .= "CERINȚE PENTRU RESCRIERE:\n";
        $prompt .= "1. Rescrie știrea într-un stil narativ, detaliat și profesionist\n";
        $prompt .= "2. Păstrează toate faptele și informațiile importante din original\n";
        $prompt .= "3. Adaugă context și explicații pentru cititori care nu sunt familiarizați cu subiectul\n";
        $prompt .= "4. Folosește un limbaj clar, accesibil, fără jargon excesiv\n";
        $prompt .= "5. Structurează textul în paragrafe clare (3-5 paragrafe)\n";
        $prompt .= "6. Include citate din articolul original dacă există\n";
        $prompt .= "7. Lungimea: minimum 400 cuvinte, maximum 800 cuvinte\n";
        $prompt .= "8. Creează un titlu nou, captivant și informativ (max 80 caractere)\n";
        $prompt .= "9. Creează o meta-descriere pentru SEO (max 160 caractere)\n";
        $prompt .= "10. Extrage 5-8 cuvinte cheie relevante\n\n";

        $prompt .= "IMPORTANT: Răspunde DOAR în format JSON cu următoarea structură:\n";
        $prompt .= "{\n";
        $prompt .= '  "title": "Titlul nou",';
        $prompt .= "\n";
        $prompt .= '  "meta_description": "Meta descrierea pentru SEO",';
        $prompt .= "\n";
        $prompt .= '  "content": "Conținutul rescris în format HTML (folosește <p>, <strong>, <em> după necesitate)",';
        $prompt .= "\n";
        $prompt .= '  "keywords": ["keyword1", "keyword2", "keyword3", ...],';
        $prompt .= "\n";
        $prompt .= '  "main_keyword": "cuvântul cheie principal pentru imagini"';
        $prompt .= "\n";
        $prompt .= "}\n";

        return $prompt;
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

        throw new Exception('Invalid AI provider');
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
                        'content' => 'Ești un jurnalist profesionist român specializat în rescrierea știrilor într-un format narativ și detaliat.'
                    ),
                    array(
                        'role' => 'user',
                        'content' => $prompt
                    )
                ),
                'temperature' => 0.7,
                'max_tokens' => 4000,
            )),
            'timeout' => 60,
        ));

        if (is_wp_error($response)) {
            $this->log('OpenAI API error: ' . $response->get_error_message());
            return false;
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if (!isset($data['choices'][0]['message']['content'])) {
            $this->log('OpenAI API returned invalid response');
            return false;
        }

        return $data['choices'][0]['message']['content'];
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
                'max_tokens' => 4000,
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
            return false;
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if (!isset($data['content'][0]['text'])) {
            $this->log('Anthropic API returned invalid response');
            return false;
        }

        return $data['content'][0]['text'];
    }

    /**
     * Parse AI response
     *
     * @param string $response AI response
     * @return array Parsed data
     */
    private function parse_ai_response($response) {
        // Try to extract JSON from the response
        preg_match('/\{[\s\S]*\}/', $response, $matches);

        if (empty($matches)) {
            $this->log('Failed to extract JSON from AI response');
            throw new Exception('Invalid AI response format');
        }

        $json = json_decode($matches[0], true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            $this->log('Failed to parse JSON: ' . json_last_error_msg());
            throw new Exception('Failed to parse AI response');
        }

        return array(
            'title' => $json['title'] ?? '',
            'meta_description' => $json['meta_description'] ?? '',
            'content' => $json['content'] ?? '',
            'keywords' => $json['keywords'] ?? array(),
            'main_keyword' => $json['main_keyword'] ?? '',
        );
    }

    /**
     * Fetch full article content from URL
     *
     * @param string $url Article URL
     * @return string Article content
     */
    private function fetch_article_content($url) {
        // Use a simple scraper to extract article content
        $response = wp_remote_get($url, array(
            'timeout' => 30,
            'user-agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ));

        if (is_wp_error($response)) {
            $this->log('Failed to fetch article: ' . $response->get_error_message());
            return '';
        }

        $html = wp_remote_retrieve_body($response);

        // Basic content extraction (this can be improved with dedicated libraries)
        $content = $this->extract_article_content($html);

        return $content;
    }

    /**
     * Extract article content from HTML
     *
     * @param string $html HTML content
     * @return string Extracted text
     */
    private function extract_article_content($html) {
        // Remove scripts and styles
        $html = preg_replace('/<script\b[^>]*>(.*?)<\/script>/is', '', $html);
        $html = preg_replace('/<style\b[^>]*>(.*?)<\/style>/is', '', $html);

        // Look for common article containers
        $patterns = array(
            '/<article[^>]*>(.*?)<\/article>/is',
            '/<div[^>]*class="[^"]*article[^"]*"[^>]*>(.*?)<\/div>/is',
            '/<div[^>]*class="[^"]*content[^"]*"[^>]*>(.*?)<\/div>/is',
            '/<div[^>]*id="[^"]*article[^"]*"[^>]*>(.*?)<\/div>/is',
        );

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $html, $matches)) {
                $content = $matches[1];
                // Strip remaining tags and clean up
                $content = strip_tags($content, '<p><br><strong><em><h1><h2><h3>');
                $content = html_entity_decode($content);
                $content = preg_replace('/\s+/', ' ', $content);
                return trim($content);
            }
        }

        // Fallback: extract all paragraph text
        preg_match_all('/<p[^>]*>(.*?)<\/p>/is', $html, $paragraphs);
        if (!empty($paragraphs[1])) {
            $content = implode("\n\n", $paragraphs[1]);
            $content = strip_tags($content);
            $content = html_entity_decode($content);
            return trim($content);
        }

        return '';
    }

    /**
     * Log message
     *
     * @param string $message Message to log
     */
    private function log($message) {
        if (RAJ_Settings::get('debug_mode', false)) {
            error_log('[RAJ Content Rewriter] ' . $message);
        }
    }
}
