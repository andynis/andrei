# Ghid Complet de Instalare - Romanian AI Journalist

## Cuprins
1. [Pregătire](#pregătire)
2. [Instalare Plugin](#instalare-plugin)
3. [Configurare API-uri](#configurare-api-uri)
4. [Configurare Inițială](#configurare-inițială)
5. [Testare](#testare)
6. [Automatizare](#automatizare)

## Pregătire

### Verificare Cerințe Sistem

```php
// Adăugați în wp-config.php pentru debugging
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

**Cerințe:**
- WordPress 5.8+
- PHP 7.4+ (recomandat PHP 8.0+)
- MySQL 5.6+ sau MariaDB 10.0+
- Permisiuni write în wp-content/uploads

### Verificare PHP Extensions

Asigurați-vă că aveți activate:
- `curl`
- `json`
- `mbstring`
- `xml`
- `simplexml`

Verificare:
```bash
php -m | grep -E 'curl|json|mbstring|xml|simplexml'
```

## Instalare Plugin

### Opțiunea 1: Upload Manual

1. Descărcați pluginul:
```bash
git clone https://github.com/yourusername/romanian-ai-journalist.git
cd romanian-ai-journalist
```

2. Creați arhivă ZIP:
```bash
zip -r romanian-ai-journalist.zip romanian-ai-journalist/
```

3. În WordPress:
   - Mergeți la **Plugins** → **Add New** → **Upload Plugin**
   - Selectați `romanian-ai-journalist.zip`
   - Click **Install Now**
   - Click **Activate**

### Opțiunea 2: FTP/SFTP

1. Conectați-vă la serverul WordPress via FTP/SFTP
2. Navigați la `/wp-content/plugins/`
3. Încărcați directorul `romanian-ai-journalist`
4. În WordPress, mergeți la **Plugins** și activați

### Opțiunea 3: SSH (pentru utilizatori avansați)

```bash
cd /path/to/wordpress/wp-content/plugins/
git clone https://github.com/yourusername/romanian-ai-journalist.git
chown -R www-data:www-data romanian-ai-journalist
```

Apoi activați din WordPress admin.

## Configurare API-uri

### 1. OpenAI (Recomandat pentru început)

**Pas 1: Creare Cont**
1. Accesați https://platform.openai.com/
2. Creați cont sau autentificați-vă
3. Adăugați metodă de plată (necesită card)

**Pas 2: Generare API Key**
1. Mergeți la https://platform.openai.com/api-keys
2. Click **Create new secret key**
3. Denumiți cheia (ex: "WordPress AI Journalist")
4. Copiați cheia (va fi afișată o singură dată!)

**Pas 3: Configurare în Plugin**
1. În WordPress: **AI Journalist** → **Settings** → **API Settings**
2. Selectați **OpenAI** ca AI Provider
3. Lipiți API key în câmpul **OpenAI API Key**
4. Click **Test Connection**
5. Salvați setările

**Costuri estimate:**
- GPT-4: ~$0.03 per 1K tokens input, ~$0.06 per 1K tokens output
- Per articol: ~$0.20 - $0.50
- 10 articole/zi: ~$2 - $5/zi

### 2. Anthropic Claude (Alternativă)

**Pas 1: Creare Cont**
1. Accesați https://console.anthropic.com/
2. Creați cont
3. Verificați email-ul

**Pas 2: Generare API Key**
1. În Console, mergeți la **API Keys**
2. Click **Create Key**
3. Denumiți cheia
4. Copiați cheia

**Pas 3: Configurare**
1. În WordPress: **AI Journalist** → **Settings** → **API Settings**
2. Selectați **Anthropic** ca AI Provider
3. Lipiți API key
4. Testați conexiunea

**Costuri estimate:**
- Claude 3 Opus: Similar cu GPT-4
- Claude 3 Sonnet: Mai ieftin, calitate bună

### 3. NewsAPI.org (Opțional dar Recomandat)

**Obținere API Key Gratuit:**
1. Accesați https://newsapi.org/
2. Click **Get API Key**
3. Completați formularul (plan gratuit disponibil)
4. Verificați email-ul
5. Copiați API key

**Limitări Plan Gratuit:**
- 100 requests/zi
- Știri din ultimele 30 zile
- Suficient pentru început

**Configurare:**
1. În WordPress: **Settings** → **API Settings**
2. Lipiți key în **NewsAPI Key**
3. Testați conexiunea

### 4. Unsplash (Pentru Imagini)

**Obținere API Key:**
1. Accesați https://unsplash.com/developers
2. Creați cont dezvoltator
3. Creați **New Application**
4. Acceptați termenii
5. Copiați **Access Key**

**Limitări:**
- 50 requests/oră (Demo)
- 5000 requests/oră (Production - după aprobare)

**Configurare:**
1. **Settings** → **API Settings**
2. Lipiți key în **Unsplash API Key**
3. Testați

### 5. Pexels (Alternativă Imagini)

**Obținere API Key:**
1. Accesați https://www.pexels.com/api/
2. Creați cont
3. Generați API key
4. Copiați cheia

**Configurare:**
- Similar cu Unsplash
- Fără limită de requests (cu ratelimit rezonabil)

## Configurare Inițială

### Pas 1: News Discovery Settings

1. Mergeți la **Settings** → **News Discovery**

2. **Number of Stories**: Start cu `5` pentru testare

3. **Time Range**: `48` ore (default)

4. **Romanian News Sources**:
```
digi24.ro
hotnews.ro
g4media.ro
libertatea.ro
adevarul.ro
recorder.ro
protv.ro
stirileprotv.ro
antena3.ro
mediafax.ro
news.ro
spotmedia.ro
```

5. **Excluded Keywords** (opțional):
```
horoscop
clickbait
reclama
```

### Pas 2: Content Settings

1. **Post Status**: Alegeți `Draft` (recomandat pentru început)
2. **Default Category**: Creați o categorie nouă "AI Generated" sau "Știri"
3. Bifați:
   - ✅ Auto-tag
   - ✅ Featured image required

### Pas 3: Social Media Settings

1. Bifați:
   - ✅ Instagram Reel Script
   - ✅ LinkedIn Post
   - ✅ X (Twitter) Thread

2. **Editor Email**: Introduceți email-ul dvs.

3. **Email Subject**: Personalizați (ex: "🗞️ Știri noi pentru review")

### Pas 4: Salvare

Click **Save Settings**

## Testare

### Test 1: Verificare API-uri

Din **Settings** → **API Settings**, testați fiecare API:
1. Click **Test Connection** lângă fiecare API key
2. Ar trebui să primiți mesaj de succes
3. Dacă primți eroare, verificați key-ul

### Test 2: Rulare Manuală

1. Mergeți la **AI Journalist** → **Dashboard**
2. Click **Run News Discovery Now**
3. Așteptați 2-5 minute (în funcție de numărul de știri)
4. Verificați rezultatele

**Ce ar trebui să se întâmple:**
- Mesaj de succes cu numărul de știri găsite
- Statisticile se actualizează
- Primiți un email

### Test 3: Verificare Draft-uri

1. Mergeți la **Posts** → **Drafts**
2. Ar trebui să vedeți articolele generate
3. Deschideți unul pentru verificare:
   - Are titlu nou
   - Are conținut rescris
   - Are featured image
   - Are tag-uri
   - Verificați custom fields pentru conținut social media

### Test 4: Verificare Email

Verificați inbox-ul pentru email de la plugin:
- Conține lista de articole
- Are link-uri către draft-uri
- Include conținut social media pentru fiecare articol

## Automatizare

### Activare Auto-Run

1. **Settings** → **Automation**
2. Bifați **Enable automatic news discovery**
3. Selectați **Run Frequency**:
   - **Once Daily** - Recomandat pentru început (8:00 AM)
   - **Twice Daily** - Pentru site-uri active
   - **Every Hour** - Doar dacă aveți buget API mare

4. Salvați setările

### Verificare Cron

WordPress folosește WP-Cron pentru automatizare.

**Verificare Status:**
1. În **Dashboard** → **System Status**
2. Căutați **Next Run**
3. Ar trebui să vedeți când va rula următoarea descoperire

**Troubleshooting WP-Cron:**

Dacă WP-Cron nu funcționează:

```php
// În wp-config.php
define('DISABLE_WP_CRON', true);
```

Apoi adăugați în crontab real:
```bash
*/30 * * * * wget -q -O - https://your-site.com/wp-cron.php?doing_wp_cron >/dev/null 2>&1
```

Sau folosiți un plugin: **WP Crontrol**

## Optimizări Post-Instalare

### 1. Configurare Email SMTP

Pentru email-uri mai fiabile:

**Plugin Recomandat: WP Mail SMTP**
1. Instalați **WP Mail SMTP**
2. Configurați cu Gmail, SendGrid, sau Mailgun
3. Testați email-ul

### 2. Configurare Cache

Dacă folosiți cache (WP Super Cache, W3 Total Cache):
- Excludeți paginile admin ale plugin-ului
- Nu cache-uiți AJAX requests

### 3. Backup

**Backup Database:**
Include tabelul `wp_raj_discovered_stories`:

```bash
mysqldump -u user -p wordpress wp_raj_discovered_stories > raj_backup.sql
```

**Backup Automat:**
Folosiți UpdraftPlus sau similar și includeți:
- Database
- Plugins
- Uploads (pentru imagini)

### 4. Monitorizare

**Verificați Regulat:**
- **Dashboard** pentru statistici
- **Discovered Stories** pentru status
- **System Status** pentru probleme
- Logs dacă aveți Debug Mode activat

### 5. Securitate

**Best Practices:**
1. Nu partajați API keys
2. Folosiți HTTPS pentru site
3. Mențineți WordPress actualizat
4. Faceți backup regulat
5. Limitați accesul la plugin doar pentru editori de încredere

## Depanare Probleme Comune

### "No stories discovered"

**Soluție:**
1. Verificați NewsAPI key
2. Verificați că sursele românești sunt active
3. Măriti Time Range la 72 ore
4. Verificați Excluded Keywords - pot fi prea restrictive

### "API test failed"

**Soluție:**
1. Verificați API key (copiere incompletă?)
2. Verificați conexiunea internet a serverului
3. Verificați firewall-ul
4. Încercați un API provider diferit

### "Email not received"

**Soluție:**
1. Verificați spam folder
2. Instalați WP Mail SMTP
3. Testați wp_mail() cu WP Mail Tester plugin
4. Verificați adresa de email în Settings

### "Images not downloading"

**Soluție:**
1. Verificați permisiunile wp-content/uploads
2. Verificați Unsplash/Pexels API keys
3. Verificați limita de requests
4. Verificați spațiul de stocare

### "Plugin slow"

**Soluție:**
1. Reduceți Number of Stories
2. Rulați mai rar (daily în loc de hourly)
3. Verificați resursele serverului
4. Considerați upgrade plan hosting

## Suport și Documentație

**Resurse:**
- README.md - Documentație completă
- GitHub Issues - Pentru probleme
- WordPress.org Forums - Suport comunitate

**Contact:**
- Email: your-email@example.com
- GitHub: https://github.com/yourusername/romanian-ai-journalist

---

**Instalare reușită!** 🎉

Acum aveți un jurnalist AI funcțional care vă ajută să descoperiți și să publicați știri importante din România.
