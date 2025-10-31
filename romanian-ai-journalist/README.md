# Romanian AI Journalist

Un plugin WordPress avansat care funcționează ca un jurnalist AI, descoperind și procesând automat cele mai importante știri din peisajul media românesc.

## 🎯 Caracteristici Principale

- **Descoperire Automată de Știri**: Agregează știri din principalele surse media românești
- **Rescriere Inteligentă cu AI**: Folosește OpenAI GPT-4 sau Anthropic Claude pentru a rescrie știrile într-un format narativ detaliat
- **Verificare Duplicate**: Evită publicarea de conținut duplicat
- **Găsire Automată de Imagini**: Caută și descarcă imagini relevante de pe Unsplash sau Pexels
- **Generare Conținut Social Media**: Creează automat conținut pentru Instagram, LinkedIn și X (Twitter)
- **Notificări Email**: Trimite draft-uri către editor cu conținut social media gata de publicare
- **Automatizare Completă**: Poate rula automat pe bază de program (hourly, daily, etc.)

## 📋 Cerințe

- WordPress 5.8 sau mai recent
- PHP 7.4 sau mai recent
- Cheie API OpenAI sau Anthropic (necesar)
- Cheie API NewsAPI.org (opțional, dar recomandat)
- Cheie API Unsplash sau Pexels (opțional, pentru imagini)

## 🚀 Instalare

### Metoda 1: Instalare Manuală

1. Descărcați sau clonați acest repository
2. Copiați directorul `romanian-ai-journalist` în `/wp-content/plugins/`
3. Activați plugin-ul din panoul de administrare WordPress
4. Accesați **AI Journalist** → **Settings** pentru configurare

### Metoda 2: Upload ZIP

1. Creați un arhivă ZIP a directorului `romanian-ai-journalist`
2. În WordPress, mergeți la **Plugins** → **Add New** → **Upload Plugin**
3. Încărcați fișierul ZIP și activați plugin-ul
4. Configurați setările din **AI Journalist** → **Settings**

## ⚙️ Configurare

### 1. API Settings

#### AI Provider (Necesar)

Alegeți între OpenAI sau Anthropic:

**OpenAI (GPT-4)**
- Obțineți cheie API de la: https://platform.openai.com/api-keys
- Model folosit: GPT-4
- Recomandat pentru: Conținut creativ și detaliat

**Anthropic (Claude)**
- Obțineți cheie API de la: https://console.anthropic.com/
- Model folosit: Claude 3 Opus
- Recomandat pentru: Analiză detaliată și contextualizare

#### News API (Opțional dar Recomandat)

- Obțineți cheie gratuită de la: https://newsapi.org/
- Permite accesul la un flux mai larg de știri
- Plan gratuit: 100 cereri/zi

#### Image APIs (Opțional)

**Unsplash**
- Obțineți cheie de la: https://unsplash.com/developers
- Imagini de calitate înaltă, gratuite
- Credit automat către fotograf

**Pexels**
- Obțineți cheie de la: https://www.pexels.com/api/
- Alternativă la Unsplash
- Credit automat către fotograf

### 2. News Discovery Settings

- **Number of Stories**: Câte știri să descopere per rulare (1-50)
- **Time Range**: Consideră doar știrile din ultimele X ore (default: 48)
- **Romanian News Sources**: Listă de domenii media românești (câte unul pe linie)
  ```
  digi24.ro
  hotnews.ro
  g4media.ro
  libertatea.ro
  adevarul.ro
  recorder.ro
  protv.ro
  stirileprotv.ro
  ```
- **Excluded Keywords**: Cuvinte cheie pentru filtrarea știrilor nedorite

### 3. Content Settings

- **Post Status**: Draft, Pending Review sau Published
- **Default Category**: Categoria WordPress pentru postări
- **Auto-tag**: Adaugă automat tag-uri din cuvintele cheie
- **Featured Image Required**: Necesită imagine pentru publicare

### 4. Social Media Settings

Activați generarea de conținut pentru:
- ✅ Instagram Reel Script (~150 cuvinte)
- ✅ LinkedIn Post (80-120 cuvinte)
- ✅ X (Twitter) Thread (5-7 tweet-uri)

**Email Notifications**:
- Email editor: Adresa unde se trimit notificările
- Subject: Subiectul email-ului
- Individual emails: Trimite câte un email per știre (în loc de unul cumulative)

### 5. Automation Settings

- **Enable Automatic Discovery**: Activează rularea automată
- **Run Frequency**:
  - Every Hour
  - Twice Daily
  - Once Daily (recomandat)
  - Once Weekly

## 📖 Utilizare

### Rulare Manuală

1. Accesați **AI Journalist** → **Dashboard**
2. Click pe **Run News Discovery Now**
3. Așteptați procesarea (poate dura câteva minute)
4. Verificați draft-urile create în **Posts** → **Drafts**
5. Primiți email cu toate știrile și conținutul social media

### Rulare Automată

După activarea automării în Settings:
1. Plugin-ul va rula automat conform programului setat
2. Veți primi email-uri automate cu noile draft-uri
3. Verificați statusul din **Dashboard** → **System Status**

### Gestionare Știri Descoperite

- Accesați **AI Journalist** → **Discovered Stories**
- Vedeți toate știrile găsite și statusul lor
- Ștergeți știrile irelevante
- Click pe link-uri pentru a vedea sursa originală sau postarea WordPress

## 🎨 Conținut Social Media Generat

### Instagram Reel Script
```
**🚨 BREAKING: [Titlu captivant]**

[Ce s-a întâmplat - 2-3 rânduri]

[De ce contează - 2-3 rânduri]

[Cum afectează publicul - 1-2 rânduri]

[Call to action final]
```

### LinkedIn Post
```
[Hook puternic pentru curiozitate]

[3-5 rânduri scurte cu rezumat]

Key takeaways:
• [Punct cheie 1]
• [Punct cheie 2]

[Întrebare pentru engagement]
```

### X (Twitter) Thread
```
1/7 **[Hook îngroșat pentru atenție]**

2/7 [Explicație ce s-a întâmplat]

3/7 [Detalii suplimentare]

4/7 [De ce contează]

5/7 [Impact în lumea reală]

6/7 [Sfaturi practice pentru public]

7/7 [CTA - Follow pentru updates]
```

## 📧 Format Email către Editor

Fiecare email conține:
- Titlul și sursa fiecărei știri
- Link către draft-ul WordPress pentru editare
- Imaginea de copertă (dacă există)
- Preview al conținutului
- **Secțiune Social Media** cu conținut gata de copiat pentru:
  - Instagram
  - LinkedIn
  - X (Twitter)

## 🔍 Procesul Complet

1. **Discovery**:
   - Caută știri din sursele configurate
   - Folosește NewsAPI, Google News RSS și feed-uri directe
   - Scorează și clasează după relevanță, recență și credibilitate

2. **Filtering**:
   - Verifică duplicate (URL, titlu similar, conținut similar)
   - Filtrează după cuvinte cheie excluse
   - Selectează top N știri

3. **Content Generation**:
   - Extrage conținutul complet al articolului
   - Trimite către AI pentru rescriere
   - Generează titlu nou, meta-descriere și cuvinte cheie

4. **Image Processing**:
   - Caută imagine relevantă pe Unsplash/Pexels
   - Descarcă în WordPress Media Library
   - Adaugă credit fotograf cu link

5. **Social Media Creation**:
   - Generează script Instagram Reel
   - Creează post LinkedIn
   - Construiește thread X/Twitter

6. **WordPress Publishing**:
   - Creează post ca draft
   - Adaugă toate meta-data
   - Setează featured image
   - Salvează conținut social media

7. **Notification**:
   - Trimite email către editor
   - Include toate informațiile și conținutul social media

## 🛠️ Dezvoltare și Debugging

### Activare Debug Mode

În **Settings** → **Advanced**:
- Bifați "Enable debug logging"
- Logurile se scriu în PHP error log

### Verificare Logs

```php
// În wp-config.php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);

// Logs în: /wp-content/debug.log
```

### Test API Connections

Din Settings, folosiți butoanele **Test Connection** pentru:
- OpenAI API
- Anthropic API
- NewsAPI
- Unsplash API
- Pexels API

## 📊 Structura Bazei de Date

Plugin-ul creează tabelul `wp_raj_discovered_stories`:

```sql
- id: ID unic
- story_url: URL sursă
- story_title: Titlul original
- source_name: Numele sursei
- source_url: URL sursa
- discovered_date: Data descoperirii
- published_date: Data publicării
- status: pending|processed|failed
- wordpress_post_id: ID post WordPress
- content_hash: Hash pentru detectare duplicate
- metadata: JSON cu info adițională
```

## 🔐 Securitate și Best Practices

1. **Nu expuneți API keys** - Acestea sunt stocate în WordPress options
2. **Backup regulat** - Include și tabelul custom
3. **Verificați draft-urile** - Întotdeauna revizuiți înainte de publicare
4. **Rate Limits** - Respectați limitele API-urilor folosite
5. **GDPR Compliance** - Verificați dacă email-urile editorilor sunt conforme

## 🐛 Troubleshooting

### Plugin-ul nu descoperă știri

- Verificați API keys în Settings
- Testați conexiunile API
- Verificați că sursele românești sunt accesibile
- Activați Debug Mode și verificați logs

### Email-urile nu sosesc

- Verificați adresa de email în Settings
- Testați funcția wp_mail() din WordPress
- Instalați un plugin SMTP (ex: WP Mail SMTP)

### Imagini nu se descarcă

- Verificați API keys pentru Unsplash/Pexels
- Verificați permisiunile directorului wp-content/uploads
- Verificați limitele API-urilor pentru imagini

### Conținut de slabă calitate

- Încercați un AI provider diferit
- Ajustați lungimea conținutului în Settings
- Verificați că știrile surse conțin suficient conținut

## 📝 To-Do / Dezvoltări Viitoare

- [ ] Suport pentru mai multe limbi
- [ ] Integrare cu Google Trends pentru relevanță
- [ ] Export conținut social media ca imagini
- [ ] Publicare automată pe social media
- [ ] Analytics și raportare
- [ ] Integrare cu Telegram/WhatsApp pentru notificări

## 📄 Licență

GPL v2 or later

## 🤝 Contribuții

Contribuțiile sunt binevenite! Pentru modificări majore:
1. Fork repository-ul
2. Creați un branch pentru feature-ul dvs.
3. Commit modificările
4. Push către branch
5. Deschideți un Pull Request

## 📧 Support

Pentru probleme și întrebări:
- Verificați secțiunea Troubleshooting
- Activați Debug Mode și verificați logs
- Creați un issue pe GitHub

## 👏 Credits

Dezvoltat pentru automatizarea jurnalismului digital în România.

**APIs folosite:**
- OpenAI / Anthropic - Pentru generare conținut
- NewsAPI.org - Pentru agregare știri
- Unsplash / Pexels - Pentru imagini
- Google News RSS - Pentru feed-uri de știri

---

**Note**: Acest plugin folosește AI pentru generarea de conținut. Întotdeauna verificați și editați conținutul generat înainte de publicare pentru acuratețe și relevanță.
