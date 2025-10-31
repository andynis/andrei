# 🚀 Quick Start - Test Romanian AI Journalist

## 📦 Fișier de Instalare

**Nume fișier:** `romanian-ai-journalist.zip`
**Versiune:** 1.0.1
**Mărime:** 48 KB
**Locație:** `/home/user/andrei/romanian-ai-journalist.zip`

## ⚡ Instalare Rapidă (3 minute)

### Pasul 1: Descarcă ZIP-ul

Fișierul este gata de instalare la:
```
/home/user/andrei/romanian-ai-journalist.zip
```

### Pasul 2: Instalare în WordPress

**Metoda 1: Upload prin WordPress Admin (RECOMANDAT pentru test)**

1. **Login în WordPress:**
   - Accesează `https://your-site.com/wp-admin`
   - Autentifică-te cu user admin

2. **Navighează la Plugins:**
   - Click pe **Plugins** în sidebar
   - Click pe **Add New**
   - Click pe **Upload Plugin** (butonul din partea de sus)

3. **Upload ZIP:**
   - Click **Choose File**
   - Selectează `romanian-ai-journalist.zip`
   - Click **Install Now**
   - Așteaptă să se finalizeze upload-ul și instalarea

4. **Activează Plugin-ul:**
   - Click **Activate Plugin**
   - Vei fi redirecționat către pagina Plugins

5. **Verifică Instalarea:**
   - Caută în sidebar-ul WordPress pentru **AI Journalist** (iconița 📝)
   - Ar trebui să apară după "Comments" și înainte de "Appearance"

**Metoda 2: Upload prin FTP/SFTP**

```bash
# 1. Dezarhivează local
unzip romanian-ai-journalist.zip

# 2. Upload prin FTP la:
/wp-content/plugins/romanian-ai-journalist/

# 3. Activează din WordPress Admin → Plugins
```

## ✅ Verificare Post-Instalare

După activare, verifică că ai acces la:

### 1. Meniul Principal
```
În sidebar WordPress ar trebui să vezi:

📝 AI Journalist
   ├─ Dashboard
   ├─ Settings
   └─ Discovered Stories
```

### 2. Dashboard (Click pe "AI Journalist")
Ar trebui să vezi:
- ✅ 4 statistici (Total Discovered, Draft Posts, Published Posts, Discovered Today)
- ✅ Buton mare albastru "Run News Discovery Now"
- ✅ System Status (va arăta că API-urile NU sunt configurate)
- ✅ Quick Links

### 3. Settings (Click pe "Settings")
Ar trebui să vezi:
- ✅ 6 tab-uri: API Settings, News Discovery, Content, Social Media, Automation, Advanced
- ✅ Formulare pentru configurare

## 🔧 Configurare Minimă pentru Test (5 minute)

Pentru a testa plugin-ul, ai nevoie de **minim un API key pentru AI**.

### Opțiunea 1: OpenAI (Recomandat pentru test)

1. **Obține API Key:**
   - Mergi la https://platform.openai.com/api-keys
   - Creează cont sau login
   - Click **Create new secret key**
   - Copiază cheia (se afișează o singură dată!)

2. **Configurează în Plugin:**
   - În WordPress: **AI Journalist** → **Settings** → **API Settings**
   - Selectează **OpenAI** din dropdown "AI Provider"
   - Lipește cheia în **OpenAI API Key**
   - Click **Test Connection** (ar trebui să apară "success")
   - Scroll jos și click **Save Settings**

### Opțiunea 2: Anthropic Claude

1. **Obține API Key:**
   - Mergi la https://console.anthropic.com/
   - Creează cont
   - Generează API key

2. **Configurează în Plugin:**
   - Selectează **Anthropic** din dropdown
   - Lipește cheia în **Anthropic API Key**
   - Test și salvează

### API-uri Opționale (pentru funcționalitate completă)

**NewsAPI** (recomandat, are plan gratuit):
- https://newsapi.org/
- 100 requests/zi gratuit
- Adaugă în **Settings** → **API Settings** → **NewsAPI Key**

**Unsplash** (pentru imagini):
- https://unsplash.com/developers
- 50 requests/oră demo
- Adaugă în **Unsplash API Key**

## 🧪 Test Rulare (Prima Descoperire)

### Pasul 1: Configurare Inițială

1. **Settings** → **News Discovery**
   - **Number of Stories:** setează la `3` (pentru test rapid)
   - **Time Range:** lasă la `48` ore
   - Verifică că sursele românești sunt listate
   - **Save Settings**

2. **Settings** → **Content**
   - **Post Status:** alege `Draft` (recomandat pentru test)
   - **Default Category:** alege o categorie existentă
   - **Save Settings**

### Pasul 2: Rulare Manuală

1. **Mergi la Dashboard:**
   - **AI Journalist** → **Dashboard**

2. **Click pe "Run News Discovery Now":**
   - Butonul mare albastru
   - Ar trebui să apară mesaj "Running... This may take a few minutes"
   - Așteaptă 2-5 minute (depinde de numărul de știri)

3. **Verifică Rezultatul:**
   - Ar trebui să vezi mesaj de success: "Found X stories"
   - Statisticile se vor actualiza
   - Vei primi un email (verifică și spam!)

### Pasul 3: Verificare Draft-uri

1. **Mergi la Posts** → **Drafts:**
   - Ar trebui să vezi 3 articole noi (sau câte ai configurat)

2. **Deschide un articol:**
   - Are titlu nou (rescris de AI)
   - Are conținut detaliat (400-800 cuvinte)
   - Are featured image (dacă ai Unsplash/Pexels configurat)
   - Are tag-uri

3. **Verifică Custom Fields:**
   - Scroll jos în editor
   - Caută secțiunea "Custom Fields"
   - Ar trebui să vezi:
     - `raj_social_instagram` - Script pentru Instagram Reel
     - `raj_social_linkedin` - Post LinkedIn
     - `raj_social_x_thread` - Thread Twitter/X
     - `raj_source_url` - Link către sursa originală
     - `raj_source_name` - Numele sursei

### Pasul 4: Verificare Email

1. **Check inbox-ul configurat:**
   - Subiect: "[AI Journalist] New Stories Ready for Review"
   - Conține:
     - Lista de articole cu link-uri
     - Preview conținut
     - **Conținut social media gata de copiat:**
       - Instagram Reel Script
       - LinkedIn Post
       - X/Twitter Thread

## 📊 Verificare Discovered Stories

1. **Mergi la:** **AI Journalist** → **Discovered Stories**
2. Ar trebui să vezi:
   - Lista cu toate știrile găsite
   - Sursa fiecărei știri
   - Status (processed)
   - Link către WordPress post
   - Opțiune de delete

## ⚠️ Troubleshooting Rapid

### "Meniul AI Journalist nu apare"

**Soluție:**
1. Dezactivează plugin-ul din **Plugins**
2. Activează din nou
3. Verifică că versiunea este 1.0.1 (în lista de plugins)
4. Clear cache browser (Ctrl+F5)

### "Run Discovery nu funcționează"

**Verificări:**
1. **Settings** → **API Settings** → Test fiecare API
2. Verifică că ai OpenAI sau Anthropic configurat
3. Verifică consola browser pentru erori (F12)
4. Activează **Debug Mode** în **Settings** → **Advanced**
5. Verifică logs în `/wp-content/debug.log`

### "No stories discovered"

**Soluții:**
1. Mărește **Time Range** la 72 ore
2. Verifică că sursele românești sunt accesibile
3. Adaugă NewsAPI key (îmbunătățește descoperirea)
4. Verifică **Excluded Keywords** - nu fie prea restrictive

### "Images not downloading"

**Soluții:**
1. Verifică Unsplash/Pexels API key
2. Verifică permisiunile `wp-content/uploads` (755)
3. Verifică spațiul de stocare
4. Temporar dezactivează "Featured image required" din Settings

### "Email not received"

**Soluții:**
1. Verifică spam/junk folder
2. Verifică adresa în **Settings** → **Social Media** → **Editor Email**
3. Testează `wp_mail()` cu plugin "Check Email"
4. Instalează "WP Mail SMTP" pentru email-uri mai fiabile

## 🎯 Ce Să Testezi

### Test 1: Descoperire Manuală ✅
- [ ] Run News Discovery funcționează
- [ ] Găsește și procesează știri
- [ ] Creează draft-uri în WordPress
- [ ] Trimite email către editor

### Test 2: Conținut Generat ✅
- [ ] Titlurile sunt noi și captivante
- [ ] Conținutul este detaliat (400-800 cuvinte)
- [ ] Are imagini de copertă
- [ ] Are tag-uri automate
- [ ] Sursele sunt citate cu link

### Test 3: Social Media ✅
- [ ] Instagram Reel Script (~150 cuvinte)
- [ ] LinkedIn Post (80-120 cuvinte, profesional)
- [ ] X Thread (5-7 tweets, ≤280 caractere)
- [ ] Toate sunt în email

### Test 4: Duplicate Detection ✅
- [ ] Rulează discovery de 2 ori
- [ ] Verifică că nu creează duplicate
- [ ] Check în **Discovered Stories** pentru status

### Test 5: Admin Interface ✅
- [ ] Dashboard arată statistici corecte
- [ ] Settings salvează corect
- [ ] Discovered Stories afișează lista
- [ ] AJAX functions (Test API, Delete Story)

## 📝 Raportare Probleme

Dacă întâmpini probleme:

1. **Activează Debug Mode:**
   - **Settings** → **Advanced** → bifează **Debug Mode**
   - Salvează setările

2. **Verifică Logs:**
   - SSH în server
   - `tail -f /path/to/wordpress/wp-content/debug.log`

3. **Info Necesare pentru Raportare:**
   - Versiune WordPress
   - Versiune PHP
   - Mesaj eroare exact
   - Steps to reproduce
   - Screenshots (dacă este cazul)

## 🎉 Test Complet

Dacă toate testele de mai sus funcționează, plugin-ul este **complet funcțional**!

Următorii pași:
1. **Configurează Automation** (Settings → Automation) pentru rulare zilnică
2. **Ajustează Settings** după preferințe
3. **Monitorizează** din Dashboard
4. **Publică** articolele după review

---

**Versiune:** 1.0.1
**Data:** 31 Octombrie 2025
**Support:** Verifică README.md și INSTALLATION.md pentru detalii complete
