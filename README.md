# Sanjeevani Group website

This is a Next.js website with a MongoDB-backed business directory and a protected admin CMS for managing its records. The API routes are part of the Next.js app; there is no separate backend service.

## Run locally

1. Install Node.js 20.9 or newer.
2. In MongoDB Atlas, rotate the database user's password because the previous URI was shared in a workspace. Allow your IP address in Atlas Network Access and ensure the database user can read and write the selected database.
3. Copy `frontend/.env.local.example` to `frontend/.env.local`. Replace the URI with the new Atlas connection string; URL-encode any special characters in the password. Set a unique admin password of at least 12 characters and a random session secret of at least 32 characters (for example, generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`). Do not commit `.env.local` or share any secrets.
4. Open a terminal in `frontend` and run `npm install`.
5. Run `npm run dev` and open `http://localhost:3000`.

The MongoDB database name is `Sanjeevani_group_of_companies`; spaces in MongoDB database namespaces are invalid, so underscores are used instead. Its `businesses` collection is initialized from `frontend/src/data/businesses.ts` when empty. The seed uses insert-only upserts, so it won't overwrite existing company details.

Open `/admin` to sign in to the CMS. Admins can add, edit, publish, unpublish, and delete businesses. The admin password and signing secret are read only from server environment variables; sessions use a signed, HTTP-only, same-site cookie and expire after eight hours. Configure a strong password and secret before deploying.

The main navigation links to dedicated pages for About Us, Businesses, Media, Investors, Community, and Careers. The Businesses page includes the searchable company directory and A–Z filters.

The supplied business list contains 18 names, although the brief mentions 17; all 18 supplied names are included.
