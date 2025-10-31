<?php
/**
 * News Aggregator Class
 *
 * Discovers and collects the most important Romanian news stories
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class RAJ_News_Aggregator {

    /**
     * Discovered stories
     */
    private $stories = array();

    /**
     * API endpoints for Romanian news
     */
    private $news_sources = array();

    /**
     * Constructor
     */
    public function __construct() {
        $this->news_sources = RAJ_Settings::get_romanian_sources();
    }

    /**
     * Discover top news stories
     *
     * @return array Discovered stories
     */
    public function discover_stories() {
        $this->log('Starting news discovery...');

        // Method 1: Use NewsAPI.org for Romanian news
        $newsapi_stories = $this->fetch_from_newsapi();

        // Method 2: Use Google News RSS for Romanian sources
        $google_news_stories = $this->fetch_from_google_news();

        // Method 3: Scrape popular Romanian news sites
        $scraped_stories = $this->scrape_romanian_sources();

        // Combine all stories
        $all_stories = array_merge($newsapi_stories, $google_news_stories, $scraped_stories);

        // Remove duplicates
        $all_stories = $this->remove_duplicates($all_stories);

        // Filter by date (last 48 hours)
        $all_stories = $this->filter_by_date($all_stories);

        // Filter by keywords (exclude unwanted topics)
        $all_stories = $this->filter_by_keywords($all_stories);

        // Score and rank stories
        $all_stories = $this->score_stories($all_stories);

        // Select top N stories
        $news_count = RAJ_Settings::get('news_count', 10);
        $top_stories = array_slice($all_stories, 0, $news_count);

        // Save to database
        $this->save_stories($top_stories);

        $this->log(sprintf('Discovery complete. Found %d stories.', count($top_stories)));

        return $top_stories;
    }

    /**
     * Fetch stories from NewsAPI.org
     *
     * @return array Stories from NewsAPI
     */
    private function fetch_from_newsapi() {
        $api_key = RAJ_Settings::get('newsapi_key');
        if (empty($api_key)) {
            $this->log('NewsAPI key not configured, skipping...');
            return array();
        }

        $this->log('Fetching from NewsAPI...');

        $hours_back = RAJ_Settings::get('hours_lookback', 48);
        $from_date = date('Y-m-d', strtotime("-{$hours_back} hours"));

        // Fetch top headlines from Romania
        $url = sprintf(
            'https://newsapi.org/v2/top-headlines?country=ro&from=%s&pageSize=50&apiKey=%s',
            $from_date,
            $api_key
        );

        $response = wp_remote_get($url, array('timeout' => 30));

        if (is_wp_error($response)) {
            $this->log('NewsAPI error: ' . $response->get_error_message());
            return array();
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if (!isset($data['articles']) || !is_array($data['articles'])) {
            $this->log('NewsAPI returned no articles');
            return array();
        }

        $stories = array();
        foreach ($data['articles'] as $article) {
            $stories[] = array(
                'title' => $article['title'] ?? '',
                'description' => $article['description'] ?? '',
                'url' => $article['url'] ?? '',
                'source_name' => $article['source']['name'] ?? 'Unknown',
                'source_url' => $article['url'] ?? '',
                'published_at' => $article['publishedAt'] ?? '',
                'image_url' => $article['urlToImage'] ?? '',
                'content' => $article['content'] ?? '',
                'author' => $article['author'] ?? '',
            );
        }

        $this->log(sprintf('NewsAPI found %d articles', count($stories)));

        return $stories;
    }

    /**
     * Fetch stories from Google News RSS
     *
     * @return array Stories from Google News
     */
    private function fetch_from_google_news() {
        $this->log('Fetching from Google News RSS...');

        // Google News RSS for Romania
        $rss_url = 'https://news.google.com/rss?hl=ro&gl=RO&ceid=RO:ro';

        $response = wp_remote_get($rss_url, array('timeout' => 30));

        if (is_wp_error($response)) {
            $this->log('Google News RSS error: ' . $response->get_error_message());
            return array();
        }

        $body = wp_remote_retrieve_body($response);

        // Parse RSS feed
        libxml_use_internal_errors(true);
        $xml = simplexml_load_string($body);

        if ($xml === false) {
            $this->log('Failed to parse Google News RSS');
            return array();
        }

        $stories = array();
        foreach ($xml->channel->item as $item) {
            $stories[] = array(
                'title' => (string) $item->title,
                'description' => (string) $item->description,
                'url' => (string) $item->link,
                'source_name' => 'Google News',
                'source_url' => (string) $item->link,
                'published_at' => (string) $item->pubDate,
                'image_url' => '',
                'content' => (string) $item->description,
                'author' => '',
            );
        }

        $this->log(sprintf('Google News found %d articles', count($stories)));

        return $stories;
    }

    /**
     * Scrape Romanian news sources
     *
     * @return array Scraped stories
     */
    private function scrape_romanian_sources() {
        $this->log('Scraping Romanian news sources...');

        $stories = array();

        // Major Romanian news sites with RSS feeds
        $rss_feeds = array(
            'https://www.digi24.ro/rss' => 'Digi24',
            'https://www.hotnews.ro/rss' => 'HotNews',
            'https://www.g4media.ro/feed' => 'G4Media',
            'https://www.libertatea.ro/rss' => 'Libertatea',
            'https://adevarul.ro/feed/' => 'Adevărul',
            'https://stirileprotv.ro/rss' => 'Pro TV',
        );

        foreach ($rss_feeds as $feed_url => $source_name) {
            $feed_stories = $this->parse_rss_feed($feed_url, $source_name);
            $stories = array_merge($stories, $feed_stories);
        }

        $this->log(sprintf('Scraped %d articles from Romanian sources', count($stories)));

        return $stories;
    }

    /**
     * Parse RSS feed
     *
     * @param string $feed_url RSS feed URL
     * @param string $source_name Source name
     * @return array Parsed stories
     */
    private function parse_rss_feed($feed_url, $source_name) {
        $response = wp_remote_get($feed_url, array('timeout' => 30));

        if (is_wp_error($response)) {
            $this->log("RSS error for {$source_name}: " . $response->get_error_message());
            return array();
        }

        $body = wp_remote_retrieve_body($response);

        libxml_use_internal_errors(true);
        $xml = simplexml_load_string($body);

        if ($xml === false) {
            $this->log("Failed to parse RSS for {$source_name}");
            return array();
        }

        $stories = array();

        // Handle both RSS 2.0 and Atom feeds
        if (isset($xml->channel->item)) {
            // RSS 2.0
            foreach ($xml->channel->item as $item) {
                $stories[] = array(
                    'title' => (string) $item->title,
                    'description' => (string) ($item->description ?? $item->summary ?? ''),
                    'url' => (string) $item->link,
                    'source_name' => $source_name,
                    'source_url' => (string) $item->link,
                    'published_at' => (string) $item->pubDate,
                    'image_url' => $this->extract_image_from_rss_item($item),
                    'content' => (string) ($item->description ?? ''),
                    'author' => (string) ($item->author ?? $item->creator ?? ''),
                );
            }
        } elseif (isset($xml->entry)) {
            // Atom feed
            foreach ($xml->entry as $entry) {
                $stories[] = array(
                    'title' => (string) $entry->title,
                    'description' => (string) ($entry->summary ?? $entry->content ?? ''),
                    'url' => (string) $entry->link['href'],
                    'source_name' => $source_name,
                    'source_url' => (string) $entry->link['href'],
                    'published_at' => (string) $entry->published,
                    'image_url' => '',
                    'content' => (string) ($entry->content ?? $entry->summary ?? ''),
                    'author' => (string) ($entry->author->name ?? ''),
                );
            }
        }

        return $stories;
    }

    /**
     * Extract image URL from RSS item
     *
     * @param SimpleXMLElement $item RSS item
     * @return string Image URL
     */
    private function extract_image_from_rss_item($item) {
        // Try media:content
        if (isset($item->children('media', true)->content)) {
            return (string) $item->children('media', true)->content->attributes()['url'];
        }

        // Try enclosure
        if (isset($item->enclosure)) {
            $type = (string) $item->enclosure->attributes()['type'];
            if (strpos($type, 'image') !== false) {
                return (string) $item->enclosure->attributes()['url'];
            }
        }

        // Try to extract from description
        if (isset($item->description)) {
            $description = (string) $item->description;
            preg_match('/<img[^>]+src=["\']([^"\']+)["\']/', $description, $matches);
            if (isset($matches[1])) {
                return $matches[1];
            }
        }

        return '';
    }

    /**
     * Remove duplicate stories
     *
     * @param array $stories Stories to deduplicate
     * @return array Unique stories
     */
    private function remove_duplicates($stories) {
        $unique = array();
        $seen_urls = array();
        $seen_titles = array();

        foreach ($stories as $story) {
            $url = $story['url'] ?? '';
            $title = $story['title'] ?? '';

            // Skip if URL or similar title already seen
            if (in_array($url, $seen_urls) || $this->is_similar_title($title, $seen_titles)) {
                continue;
            }

            $seen_urls[] = $url;
            $seen_titles[] = $title;
            $unique[] = $story;
        }

        return $unique;
    }

    /**
     * Check if title is similar to existing titles
     *
     * @param string $title Title to check
     * @param array $existing_titles Existing titles
     * @return bool True if similar
     */
    private function is_similar_title($title, $existing_titles) {
        foreach ($existing_titles as $existing) {
            similar_text(strtolower($title), strtolower($existing), $percent);
            if ($percent > 80) {
                return true;
            }
        }
        return false;
    }

    /**
     * Filter stories by date
     *
     * @param array $stories Stories to filter
     * @return array Filtered stories
     */
    private function filter_by_date($stories) {
        $hours_back = RAJ_Settings::get('hours_lookback', 48);
        $cutoff = strtotime("-{$hours_back} hours");

        return array_filter($stories, function($story) use ($cutoff) {
            $published = strtotime($story['published_at'] ?? '');
            return $published && $published >= $cutoff;
        });
    }

    /**
     * Filter stories by keywords
     *
     * @param array $stories Stories to filter
     * @return array Filtered stories
     */
    private function filter_by_keywords($stories) {
        $excluded_keywords = RAJ_Settings::get_excluded_keywords();

        if (empty($excluded_keywords)) {
            return $stories;
        }

        return array_filter($stories, function($story) use ($excluded_keywords) {
            $text = strtolower($story['title'] . ' ' . $story['description']);

            foreach ($excluded_keywords as $keyword) {
                if (stripos($text, strtolower($keyword)) !== false) {
                    return false;
                }
            }

            return true;
        });
    }

    /**
     * Score and rank stories by importance
     *
     * @param array $stories Stories to score
     * @return array Sorted stories
     */
    private function score_stories($stories) {
        foreach ($stories as &$story) {
            $score = 0;

            // Recency score (0-40 points)
            $published = strtotime($story['published_at'] ?? '');
            if ($published) {
                $hours_ago = (time() - $published) / 3600;
                $score += max(0, 40 - ($hours_ago * 0.5));
            }

            // Source credibility (0-30 points)
            $credible_sources = array('digi24', 'hotnews', 'g4media', 'recorder', 'adevarul');
            foreach ($credible_sources as $source) {
                if (stripos($story['source_name'], $source) !== false) {
                    $score += 30;
                    break;
                }
            }

            // Content quality (0-30 points)
            if (!empty($story['description']) && strlen($story['description']) > 100) {
                $score += 15;
            }
            if (!empty($story['image_url'])) {
                $score += 10;
            }
            if (!empty($story['author'])) {
                $score += 5;
            }

            $story['score'] = $score;
        }

        // Sort by score descending
        usort($stories, function($a, $b) {
            return ($b['score'] ?? 0) <=> ($a['score'] ?? 0);
        });

        return $stories;
    }

    /**
     * Save stories to database
     *
     * @param array $stories Stories to save
     */
    private function save_stories($stories) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'raj_discovered_stories';

        foreach ($stories as $story) {
            $existing = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM $table_name WHERE story_url = %s",
                $story['url']
            ));

            if ($existing) {
                continue;
            }

            $wpdb->insert($table_name, array(
                'story_url' => $story['url'],
                'story_title' => $story['title'],
                'source_name' => $story['source_name'],
                'source_url' => $story['source_url'],
                'discovered_date' => current_time('mysql'),
                'status' => 'pending',
                'metadata' => json_encode($story),
            ));
        }
    }

    /**
     * Log message
     *
     * @param string $message Message to log
     */
    private function log($message) {
        if (RAJ_Settings::get('debug_mode', false)) {
            error_log('[RAJ News Aggregator] ' . $message);
        }
    }
}
