import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
import type { APIContext } from 'astro';

const parser = new MarkdownIt();

export async function GET(context: APIContext) {
  const episodes = await getCollection('episodes', ({ data }) => !data.draft);
  const sorted = episodes.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());

  return rss({
    xmlns: {
      itunes: 'http://www.itunes.com/dtds/podcast-1.0.dtd',
      podcast: 'https://podcastindex.org/namespace/1.0',
      content: 'http://purl.org/rss/1.0/modules/content/',
    },
    title: 'Inchunwa Project Podcast',
    description: 'A community-rooted Southeastern Tribal tattoo project and podcast promoting body sovereignty through Indigenous Mississippian identity, cultural tattooing practices, collective learning, and knowledge-sharing.',
    site: context.site!.toString(),
    customData: [
      '<language>en-us</language>',
      '<itunes:author>Inchunwa Project</itunes:author>',
      '<itunes:owner><itunes:name>Inchunwa Project</itunes:name><itunes:email>contact@inchunwa.org</itunes:email></itunes:owner>',
      '<itunes:image href="https://inchunwa.org/images/podcast-cover.jpg" />',
      '<itunes:category text="Society &amp; Culture"><itunes:category text="Documentary" /></itunes:category>',
      '<itunes:category text="History" />',
      '<itunes:explicit>false</itunes:explicit>',
      '<itunes:type>episodic</itunes:type>',
      '<podcast:locked>yes</podcast:locked>',
    ].join(''),
    items: sorted.map((episode) => {
      const body = episode.body || '';
      const htmlContent = sanitizeHtml(parser.render(body), {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
      });

      const customData = [
        `<itunes:duration>${episode.data.duration}</itunes:duration>`,
        `<itunes:explicit>${episode.data.explicit ? 'true' : 'false'}</itunes:explicit>`,
        `<itunes:episodeType>${episode.data.episodeType}</itunes:episodeType>`,
        episode.data.episodeNumber ? `<itunes:episode>${episode.data.episodeNumber}</itunes:episode>` : '',
        episode.data.seasonNumber ? `<itunes:season>${episode.data.seasonNumber}</itunes:season>` : '',
        episode.data.coverImage ? `<itunes:image href="${new URL(episode.data.coverImage, context.site).toString()}" />` : '',
        `<enclosure url="${episode.data.audioUrl}" length="${episode.data.audioLength || 0}" type="audio/mpeg" />`,
        htmlContent ? `<content:encoded><![CDATA[${htmlContent}]]></content:encoded>` : '',
      ].filter(Boolean).join('');

      return {
        title: episode.data.title,
        pubDate: episode.data.pubDate,
        description: episode.data.description,
        link: `/episodes/${episode.id}/`,
        customData,
      };
    }),
  });
}
