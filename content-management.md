# Publishing website content

The site is static HTML hosted on Cloudflare Pages. Its public editorial content lives in [`content/site-content.json`](content/site-content.json); the website reads that file without an application server or admin credentials.

## Who can publish

Use GitHub repository permissions to restrict who can change the content file. For a reviewable publishing process, protect the production branch and require a pull request before changes are merged. Cloudflare Pages deploys the merged repository content through the existing static-site deployment.

There is intentionally no public `/admin` login or browser-only editor: a static page cannot securely authenticate writers or safely write back to the repository. Do not put GitHub tokens, passwords, or private drafts in website files. The JSON file is public and should contain publish-ready material only.

For local preview, serve the repository over HTTP (for example, `python -m http.server 8000` from the project root) and open the local URL. Opening the HTML directly with a `file://` URL prevents browsers from fetching the JSON content file.

## Add an article

1. Edit `content/site-content.json` in GitHub or in a local branch.
2. Add an object to `articles`, following the existing entries:

   ```json
   {
     "slug": "a-short-lowercase-hyphenated-url",
     "category": "Digital trust",
     "title": "A clear article title",
     "excerpt": "A concise summary for the homepage and insights listing.",
     "readTime": "4 min read",
     "publishedAt": "2026-10-21",
     "sections": [
       {
         "heading": "A section heading",
         "paragraphs": [
           "A paragraph of approved article copy."
         ]
       }
     ]
   }
   ```

3. Keep slugs unique and use the `YYYY-MM-DD` date format. Estimate reading time from the article body at roughly 200–250 words per minute, rounded up. Write article copy as plain text; the site renders it as text rather than interpreting HTML.
4. Preview the pull request deployment, check the Insights page and article, then merge to publish.

The three most recent valid articles appear on the homepage. All valid articles appear on the Insights listing. Article pages are opened with their slug in the query string.

## Add an announcement or promotion

Add an item to `announcements` with a `title` and `message`. Optional `startsAt` and `endsAt` dates use `YYYY-MM-DD`. An optional `href` must be an internal site path, and `linkLabel` supplies its visible text. Only active announcements display on the homepage. Keep offers accurate and within their stated dates.

   ```json
   {
     "title": "A short announcement",
     "message": "A clear sentence describing the update.",
     "startsAt": "2026-10-21",
     "endsAt": "2026-11-30",
     "href": "index.html#contact",
     "linkLabel": "Discuss a project"
   }
   ```

## Add a client testimonial

Add an item to `testimonials` with `quote`, `name`, `role`, and `organization`. Publish only a genuine quote that the client has approved for public use. Testimonials are omitted from the homepage until at least one complete entry exists.

   ```json
   {
     "quote": "A client-approved quote, published with permission.",
     "name": "Client name",
     "role": "Client role",
     "organization": "Client organization"
   }
   ```
