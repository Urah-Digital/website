(function () {
    const contentPath = 'content/site-content.json';
    const dateFormatter = new Intl.DateTimeFormat('en-NG', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    function element(tagName, className, text) {
        const node = document.createElement(tagName);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function setMessage(container, message, isError) {
        container.replaceChildren(document.createTextNode(message));
        container.setAttribute('role', isError ? 'alert' : 'status');
        container.dataset.state = isError ? 'error' : 'empty';
    }

    function formatDate(value) {
        const date = new Date(value + 'T00:00:00');
        return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
    }

    function validDate(value) {
        if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
        const date = new Date(value + 'T00:00:00Z');
        return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
    }

    function validArticle(article) {
        return article
            && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug)
            && typeof article.category === 'string' && article.category.trim()
            && typeof article.title === 'string' && article.title.trim()
            && typeof article.excerpt === 'string' && article.excerpt.trim()
            && typeof article.readTime === 'string' && article.readTime.trim()
            && validDate(article.publishedAt)
            && Array.isArray(article.sections)
            && article.sections.length > 0
            && article.sections.every(section =>
                typeof section.heading === 'string' && section.heading.trim()
                && Array.isArray(section.paragraphs)
                && section.paragraphs.every(paragraph => typeof paragraph === 'string' && paragraph.trim())
            );
    }

    function sortedArticles(content) {
        if (!Array.isArray(content.articles)) {
            throw new Error('The articles field must be an array.');
        }

        const slugs = new Set();
        content.articles.forEach((article, index) => {
            if (!validArticle(article)) {
                throw new Error('Article ' + (index + 1) + ' does not match the expected format.');
            }
            if (slugs.has(article.slug)) {
                throw new Error('Article slugs must be unique: ' + article.slug + '.');
            }
            slugs.add(article.slug);
        });

        return content.articles.slice()
            .sort((first, second) => second.publishedAt.localeCompare(first.publishedAt));
    }

    function validateContent(content) {
        if (!Array.isArray(content.announcements) || !Array.isArray(content.testimonials)) {
            throw new Error('Announcements and testimonials must be arrays.');
        }

        content.announcements.forEach((item, index) => {
            if (
                !item
                || typeof item.title !== 'string' || !item.title.trim()
                || typeof item.message !== 'string' || !item.message.trim()
                || (item.startsAt && !validDate(item.startsAt))
                || (item.endsAt && !validDate(item.endsAt))
                || (item.startsAt && item.endsAt && item.startsAt > item.endsAt)
                || (item.href && typeof item.href !== 'string')
                || (item.href && !isInternalHref(item.href))
                || (item.linkLabel && typeof item.linkLabel !== 'string')
                || Boolean(item.href) !== Boolean(item.linkLabel)
            ) {
                throw new Error('Announcement ' + (index + 1) + ' does not match the expected format.');
            }
        });

        content.testimonials.forEach((item, index) => {
            if (
                !item
                || typeof item.quote !== 'string' || !item.quote.trim()
                || typeof item.name !== 'string' || !item.name.trim()
                || typeof item.role !== 'string' || !item.role.trim()
                || typeof item.organization !== 'string' || !item.organization.trim()
            ) {
                throw new Error('Testimonial ' + (index + 1) + ' does not match the expected format.');
            }
        });
    }

    function articleLink(article, darkSurface) {
        const link = element(
            'a',
            'group inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider transition-colors ' + (
                darkSurface
                    ? 'text-brass-light hover:text-white'
                    : 'text-zinc-700 hover:text-obsidian-base'
            )
        );
        link.href = 'article.html?slug=' + encodeURIComponent(article.slug);
        link.append(
            element('span', '', 'Read Article'),
            element('span', 'text-brass transition-transform group-hover:translate-x-1', '→')
        );
        return link;
    }

    function articleCard(article, darkSurface) {
        const card = element(
            'article',
            'interactive-card flex h-full flex-col border-t pt-5 ' + (
                darkSurface ? 'border-obsidian-border' : 'border-offwhite-border'
            )
        );
        const metadata = element('div', 'mb-5 flex flex-wrap items-center justify-between gap-3');
        metadata.append(
            element(
                'span',
                'inline-flex border px-2 py-1 font-mono text-[10px] uppercase tracking-wider ' + (
                    darkSurface
                        ? 'border-brass/30 bg-brass/10 text-brass'
                        : 'border-brass/40 bg-brass/10 text-zinc-700'
                ),
                article.category
            ),
            element(
                'span',
                'font-mono text-[10px] uppercase tracking-wider ' + (
                    darkSurface ? 'text-zinc-500' : 'text-zinc-500'
                ),
                article.readTime
            )
        );
        card.append(metadata);
        const title = element(
            'h3',
            'mb-3 font-serif text-xl font-semibold leading-snug ' + (
                darkSurface ? 'text-white' : 'text-offwhite-textDark'
            )
        );
        const titleLink = element(
            'a',
            'transition-colors ' + (darkSurface ? 'hover:text-brass-light' : 'hover:text-zinc-600'),
            article.title
        );
        titleLink.href = 'article.html?slug=' + encodeURIComponent(article.slug);
        title.append(titleLink);
        card.append(
            title,
            element(
                'p',
                'mb-6 flex-1 text-sm leading-relaxed ' + (
                    darkSurface ? 'text-zinc-400' : 'text-offwhite-textMuted'
                ),
                article.excerpt
            ),
            articleLink(article, darkSurface)
        );
        return card;
    }

    function renderArticleGrid(container, articles, darkSurface, emptyMessage) {
        if (articles.length === 0) {
            setMessage(container, emptyMessage, false);
            return;
        }

        const grid = element(
            'div',
            'grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3'
        );
        articles.forEach(article => grid.append(articleCard(article, darkSurface)));
        container.replaceChildren(grid);
        container.removeAttribute('role');
        delete container.dataset.state;
    }

    function isInternalHref(href) {
        try {
            const target = new URL(href, window.location.href);
            return (target.protocol === 'http:' || target.protocol === 'https:')
                && target.origin === window.location.origin;
        } catch (error) {
            return false;
        }
    }

    function renderAnnouncements(announcements) {
        const container = document.getElementById('announcement-container');
        if (!container) return;

        const now = new Date();
        const active = (Array.isArray(announcements) ? announcements : []).find(item => {
            if (!item || typeof item.title !== 'string' || typeof item.message !== 'string') return false;
            const startsAt = item.startsAt ? new Date(item.startsAt + 'T00:00:00') : null;
            const endsAt = item.endsAt ? new Date(item.endsAt + 'T23:59:59') : null;
            return (!startsAt || (!Number.isNaN(startsAt.getTime()) && startsAt <= now))
                && (!endsAt || (!Number.isNaN(endsAt.getTime()) && endsAt >= now));
        });

        if (!active) return;

        const banner = element('div', 'border-b border-brass/30 bg-brass/10');
        const inner = element(
            'div',
            'mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8'
        );
        const copy = element('p', 'text-zinc-200');
        copy.append(
            element('strong', 'mr-2 font-semibold text-brass-light', active.title),
            document.createTextNode(active.message)
        );
        inner.append(copy);

        if (
            typeof active.linkLabel === 'string'
            && typeof active.href === 'string'
            && isInternalHref(active.href)
        ) {
            const link = element(
                'a',
                'shrink-0 font-mono text-xs uppercase tracking-wider text-brass-light underline underline-offset-4 hover:text-white',
                active.linkLabel
            );
            link.href = active.href;
            inner.append(link);
        }

        banner.append(inner);
        container.replaceChildren(banner);
        container.hidden = false;
    }

    function renderTestimonials(testimonials) {
        const section = document.getElementById('testimonials-section');
        const container = document.getElementById('testimonials-list');
        if (!section || !container) return;

        const valid = (Array.isArray(testimonials) ? testimonials : []).filter(item =>
            item
            && typeof item.quote === 'string'
            && typeof item.name === 'string'
            && typeof item.role === 'string'
            && typeof item.organization === 'string'
        );
        if (valid.length === 0) return;

        const list = element('div', 'grid gap-8 md:grid-cols-2');
        valid.forEach(testimonial => {
            const quote = element('figure', 'flex h-full flex-col border-t border-obsidian-border pt-6');
            quote.append(
                element('blockquote', 'flex-1 font-serif text-xl leading-relaxed text-zinc-200', '“' + testimonial.quote + '”')
            );
            const attribution = element('figcaption', 'mt-6 border-t border-obsidian-border pt-4');
            attribution.append(
                element('span', 'block text-sm font-semibold text-white', testimonial.name),
                element('span', 'mt-1 block font-mono text-[10px] uppercase tracking-wider text-zinc-500', testimonial.role + ' · ' + testimonial.organization)
            );
            quote.append(attribution);
            list.append(quote);
        });

        container.replaceChildren(list);
        section.hidden = false;
    }

    function renderBlogPage(articles) {
        const container = document.getElementById('blog-articles');
        if (!container) return;
        renderArticleGrid(container, articles, true, 'New insights will appear here soon.');
    }

    function renderArticlePage(articles) {
        const container = document.getElementById('article-content');
        if (!container) return;

        const slug = new URLSearchParams(window.location.search).get('slug');
        const article = articles.find(item => item.slug === slug);
        if (!article) {
            setMessage(container, 'This article is unavailable. Browse all insights to find another article.', true);
            return;
        }

        const header = element('header', 'mb-12 border-b border-obsidian-border pb-8');
        header.append(
            element('p', 'mb-4 font-mono text-xs uppercase tracking-widest text-brass', article.category),
            element('h1', 'mb-6 font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl', article.title)
        );
        const metadata = element('div', 'flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] uppercase tracking-wider text-zinc-500');
        const time = element('time', '');
        time.dateTime = article.publishedAt;
        time.textContent = formatDate(article.publishedAt);
        metadata.append(time, element('span', '', article.readTime));
        header.append(metadata);

        const lead = element('p', 'mb-10 font-serif text-xl leading-relaxed text-zinc-300 sm:text-2xl', article.excerpt);
        const body = element('div', 'space-y-10');
        article.sections.forEach(section => {
            const sectionNode = element('section', 'space-y-4');
            sectionNode.append(
                element('h2', 'font-serif text-2xl font-semibold text-white', section.heading)
            );
            section.paragraphs.forEach(paragraph => {
                sectionNode.append(element('p', 'text-base leading-8 text-zinc-300', paragraph));
            });
            body.append(sectionNode);
        });

        const contact = element('aside', 'mt-14 border-t border-obsidian-border pt-8');
        contact.append(
            element('h2', 'font-serif text-2xl font-semibold text-white', 'Planning a website project?'),
            element('p', 'mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400', 'Talk through your goals and scope with the URAH DIGITAL team.'),
        );
        const contactLink = element(
            'a',
            'mt-5 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-brass-light hover:text-white',
            'Start a conversation'
        );
        contactLink.href = 'https://wa.me/2348126793813';
        contactLink.target = '_blank';
        contactLink.rel = 'noopener noreferrer';
        contact.append(contactLink);

        container.replaceChildren(header, lead, body, contact);
        container.removeAttribute('role');
        delete container.dataset.state;
        document.title = article.title + ' — URAH DIGITAL Insights';
        const description = document.querySelector('meta[name="description"]');
        if (description) description.content = article.excerpt;
    }

    function showLoadError(error) {
        console.error('Unable to load published site content from ' + contentPath + '.', error);
        ['home-articles', 'blog-articles', 'article-content'].forEach(id => {
            const container = document.getElementById(id);
            if (container) {
                setMessage(
                    container,
                    'Published content could not be loaded. Please refresh the page or contact info@urah.com.ng.',
                    true
                );
            }
        });
    }

    async function init() {
        try {
            const response = await fetch(contentPath, { headers: { Accept: 'application/json' } });
            if (!response.ok) {
                throw new Error('Content request failed with status ' + response.status + '.');
            }

            const content = await response.json();
            if (!content || typeof content !== 'object' || !Array.isArray(content.articles)) {
                throw new Error('The content file does not match the expected format.');
            }

            validateContent(content);
            const articles = sortedArticles(content);
            const homeArticles = document.getElementById('home-articles');
            if (homeArticles) {
                renderArticleGrid(
                    homeArticles,
                    articles.slice(0, 3),
                    false,
                    'New insights will appear here soon.'
                );
            }
            renderAnnouncements(content.announcements);
            renderTestimonials(content.testimonials);
            renderBlogPage(articles);
            renderArticlePage(articles);
        } catch (error) {
            showLoadError(error);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
