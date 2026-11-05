# Kaïna — Dans ma tête

Site de pré-save et d’écoute exclusive, avec un espace admin sécurisé par Supabase.

## Créer et relier le projet Supabase

1. Crée un projet sur [supabase.com](https://supabase.com/) et attends la fin de sa création.
2. Dans **Authentication > Users**, crée ton compte admin avec ton adresse e-mail et un mot de passe fort. Ne crée pas d’autres comptes admin.
3. Dans **Project Settings > API**, récupère l’URL du projet et la clé publique **anon** (ou **publishable**). Ne copie jamais la clé `service_role` dans le site.
4. Dans **SQL Editor**, ouvre une nouvelle requête, copie le contenu de [`supabase/admin_setup.sql`](./supabase/admin_setup.sql), puis exécute-le.
5. Toujours dans le SQL Editor, exécute cette requête en remplaçant l’UUID par celui de ton compte visible dans **Authentication > Users** :

   ```sql
   insert into public.site_admins (user_id)
   values ('34703ded-e810-4116-aefa-eaabe2b2c8c1')
   on conflict (user_id) do nothing;
   ```

   C’est cette liste d’autorisation, contrôlée aussi par les règles RLS de la base, qui réserve la modification du site à ton compte.
6. Dans le dossier du projet (le dossier qui contient `package.json`), crée un fichier nommé exactement `.env.local`. Tu peux copier `.env.example` pour partir du bon modèle. Ouvre `.env.local` avec VS Code et remplace les exemples par les deux valeurs de **Project Settings > API** :

   ```env
   VITE_SUPABASE_URL=https://ton-projet.supabase.co
   VITE_SUPABASE_ANON_KEY=ta-cle-publique-anon-ou-publishable
   ```

   Garde les guillemets absents et ne laisse pas les valeurs d’exemple. Enregistre le fichier, puis arrête et relance le serveur local (`npm run dev`). L’URL et la clé publique peuvent être utilisées dans le navigateur ; la clé `service_role`, elle, ne doit jamais être exposée.
7. Pour le site en ligne sur Netlify, ajoute les mêmes variables dans **Site configuration > Environment variables**, puis relance un déploiement.
8. Ouvre le site, clique sur le cadenas admin et connecte-toi avec le compte créé à l’étape 2. Les paramètres du site et les fichiers envoyés seront alors enregistrés dans Supabase et visibles par les visiteurs.

Le formulaire public enregistre les adresses e-mail dans `fan_signups`. Seul le compte admin autorisé peut consulter, modifier ou supprimer ces inscriptions. La configuration du site est lisible par les visiteurs pour afficher la page, mais seule la personne autorisée peut la modifier. Les fichiers des buckets `covers` et `audio` sont servis publiquement pour que le site puisse les afficher et les lire ; une URL audio peut donc être partagée. Ce système de pré-écoute ne remplace pas une protection DRM ou un service de diffusion privé.

## Lancer le site en local

```bash
npm install --legacy-peer-deps
npm run dev
```

Sans les variables Supabase, le site s’affiche avec sa configuration locale, mais la connexion admin et la synchronisation partagée sont désactivées.
