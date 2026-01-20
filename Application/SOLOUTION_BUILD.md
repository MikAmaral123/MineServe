# Erreur de Build Windows (winCodeSign)

L'erreur que vous rencontrez (`Cannot create symbolic link`) est une restriction de sécurité de Windows qui empêche la création de liens symboliques nécessaires pour les outils de signature de code (winCodeSign) utilisés par `electron-builder`.

## Solutions

### Option 1 : Exécuter en tant qu'administrateur (Recommandé)
1. Ouvrez votre terminal (PowerShell ou CMD) en faisant **Clic droit > Exécuter en tant qu'administrateur**.
2. Naviguez vers le dossier du projet :
   ```powershell
   cd C:\Users\micka\Desktop\DevProjects\MineServe
   ```
3. Relancez la commande de build :
   ```powershell
   npm run build
   ```

### Option 2 : Activer le mode Développeur
1. Allez dans les **Paramètres Windows** > **Système** > **Espace développeurs** (ou "Mise à jour et sécurité" > "Espace développeurs" sur Windows 10).
2. Activez le **Mode développeur**.
3. Cela autorise la création de liens symboliques sans droits d'administrateur.
4. Relancez `npm run build` dans votre terminal habituel.

Une fois le build terminé avec succès, l'installateur `.exe` sera disponible dans le dossier `release`.
