import { getPrismicClient } from '../../services/prismic';
import { Document } from '@prismicio/client/types/documents';

export default async (req, res) => {
  const { token: ref, documentId } = req.query;

  function linkResolver(doc: Document): string {
    if (doc.type === 'posts') {
      return `/post/${doc.uid}`;
    }
    return '/';
  }

  const redirectUrl = await getPrismicClient(req).getPreviewResolver(ref, documentId).resolve(linkResolver, '/');
  
  if (!redirectUrl) {
    return res.status(401).json({ message: 'Invalid token' })
  }

  res.setPreviewData({ ref })

  // Redirect the user to the share endpoint from same origin. This is
  // necessary due to a Chrome bug:
  // https://bugs.chromium.org/p/chromium/issues/detail?id=696204
  res.write(
    `<!DOCTYPE html><html><head><meta http-equiv="Refresh" content="0; url=${redirectUrl}" />
    <script>window.location.href = '${redirectUrl}'</script>
    </head>`
  )
  res.end()
}