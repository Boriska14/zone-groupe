/**
 * SERVEUR UNIQUEMENT. Ne JAMAIS écrire la clé secrète dans ce fichier : GitHub bloque le push, et toute
 * personne qui lit le dépôt aurait un accès administrateur total à la base.
 * La clé se fournit uniquement par la variable d'environnement SUPABASE_SERVICE_ROLE_KEY (Vercel).
 * Sans elle, le site reste utilisable : commande par WhatsApp, négociation désactivée.
 */
export const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || undefined;
export const HAS_SERVER_KEY = !!SERVICE_ROLE_KEY;
