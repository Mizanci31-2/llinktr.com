# llinktr - Project TODO

## DB & Backend
- [x] DB schema: bio_pages, bio_blocks, short_links tabloları
- [x] DB migration SQL çalıştır
- [x] server/db.ts: bio pages CRUD sorguları
- [x] server/db.ts: bio blocks CRUD sorguları
- [x] server/db.ts: short links CRUD sorguları
- [x] tRPC router: bioPages (list, create, update, delete, getBySlug, checkSlug)
- [x] tRPC router: bioBlocks (list, add, update, delete, reorder, bulkSave)
- [x] tRPC router: shortLinks (create, resolve)
- [x] Slug benzersizlik kontrolü
- [x] Short link redirect endpoint /r/:code

## Frontend - Global
- [x] Dark tema CSS değişkenleri (neon lime #DFFF00 vurgu)
- [x] Space Grotesk + Inter font entegrasyonu
- [x] Navbar bileşeni (logo, nav linkleri, login/logout)
- [x] Footer bileşeni (gizlilik, iletişim vb.)
- [x] App.tsx route yapısı

## Frontend - Ana Sayfa
- [x] Hero bölümü (başlık, CTA butonları, telefon önizleme)
- [x] Özellik kartları (Bio Link, Link Kısaltıcı, QR Oluşturucu, Temalar)
- [x] Tema showcase bölümü
- [x] SSS accordion bölümü

## Frontend - Auth & Dashboard
- [x] Giriş yönlendirme (korumalı rotalar)
- [x] Dashboard: bio sayfaları listesi
- [x] Dashboard: yeni bio sayfası oluşturma modal
- [x] Dashboard: düzenle / sil / görüntüle aksiyonları

## Frontend - Bio Link Builder
- [x] 2 kolonlu layout (sol: düzenleme, sağ: telefon önizleme)
- [x] Profil detayları paneli (slug, başlık, profil resmi)
- [x] Blok ekleme menüsü (7 blok tipi)
- [x] Blok: Başlık (heading)
- [x] Blok: Açıklama (description)
- [x] Blok: Metin (text)
- [x] Blok: Link butonu
- [x] Blok: Sosyal link (15 platform)
- [x] Blok: Ayırıcı (divider)
- [x] Blok: Profil resmi
- [x] 50 öğe sınırı sayacı (X/50)
- [x] Blok enable/disable toggle
- [x] Canlı telefon önizleme
- [x] Kaydet butonu

## Frontend - Tema Sistemi
- [x] 10 hazır tema
- [x] Özel vurgu rengi seçici
- [x] Anında önizlemeye yansıma

## Frontend - Public Bio Sayfası
- [x] /p/:slug route (public)
- [x] Profil resmi, başlık, açıklama
- [x] Link blokları render
- [x] Sosyal link ikonları
- [x] Tema uygulaması

## Frontend - Link Kısaltma
- [x] URL girişi + Kısalt butonu
- [x] Kısa link sonucu gösterimi
- [x] Kopyala butonu
- [x] /r/:code redirect endpoint

## Frontend - QR Oluşturucu
- [x] Tip seçimi (URL, telefon, email, metin, WhatsApp)
- [x] İçerik girişi
- [x] Canlı QR önizleme
- [x] PNG indirme

## Footer Sayfaları
- [x] Gizlilik Politikası sayfası
- [x] İletişim sayfası
- [x] Hakkımızda sayfası

## Test & Kalite
- [x] tRPC router unit testleri (7 test, tümü geçti)
- [x] TypeScript 0 hata
