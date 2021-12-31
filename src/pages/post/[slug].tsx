import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RichText } from 'prismic-dom';
import { PostComment } from '../../components/PostComment';
import Link from 'next/link';
import { PreviewButton } from '../../components/previewButton';

interface Post {
  uid?: string;
  first_publication_date?: string | null;
  last_publication_date?: string | null;
  data?: {
    title?: string;
    subtitle?: string;
    banner?: {
      url: string;
    };
    author?: string;
    content?: {
      heading?: string;
      body?: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  preview: boolean;
  previousPost?: Post;
  nextPost?: Post;
}

export default function Post({ post, preview, nextPost, previousPost }: PostProps) {
  debugger
  const router = useRouter();
  if (router.isFallback) {
    return <p>Carregando...</p>;
  }

  const totalWords = Math.round(
    post.data.content.reduce(
      (acc, contentItem) =>
        acc +
        contentItem.heading.split(' ').length +
        contentItem.body.reduce(
          (acc2, bodyItem) => acc2 + bodyItem.text.split(' ').length,
          0
        ),
      0
    )
  );

  const readingTime = Math.ceil(totalWords / 200);

  return (
    <>
       <Head>
        <title>{post.data.title} | spacetraveling</title>
      </Head>
      <main className={` ${styles.container}`}>
        <img
          className={styles.banner}
          src={post.data.banner.url}
          alt="Post banner"
        />
        <article className={commonStyles.container}>
          <h1>{post.data.title}</h1>
          <div className={styles.details}>
            <div>
              <time><FiCalendar size="20" /> {format(new Date(post.first_publication_date),	"dd MMM yyyy", {
                  locale: ptBR})}
              </time>
              <p><FiUser size="20" /> {post.data.author}</p>
              <time><FiClock size="20" /> {readingTime} min</time>
            </div>
            <p>* editado em {format(new Date(post.last_publication_date),	"dd MMM yyyy, 'às' HH:mm", {
                  locale: ptBR})}</p>
          </div>
          {
            post.data.content.map(item => (
              <div  key={item.heading} className={styles.content} >
              <h2 >{item.heading}</h2>
              <div 
                  className={styles.body}
                  dangerouslySetInnerHTML={{ __html: RichText.asHtml(item.body)}} 
              />
              </div>
            ))
          }
        </article>
      </main>
      <footer className={commonStyles.container} >
        <div className={commonStyles.divider} ></div>
        <div className={styles.navigationPost}>
          {
            previousPost &&
            <div>
              <Link href={`/post/${previousPost.uid}`}>
                <a className={styles.buttonNavigation} >
                  <p>{previousPost.data.title}</p>
                  <p>Post anterior</p>
                </a>
              </Link>
            </div>
          }
          {
            nextPost &&
            <div>
              <Link href={`/post/${nextPost.uid}`}>
                <a className={styles.buttonNavigation}>
                <p>{previousPost.data.title}</p>
                  <p>Próximo post</p>
                </a>
              </Link>
            </div>
          }
        </div>
        <PostComment />
        {preview && (
          <PreviewButton />
		    )}
      </footer>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {

  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')], {
    fetch: ['posts.slug'],
    pageSize: 100
  });

  
  return {
    paths: posts.results.map(post => ({
      params: {
        slug: post.uid,
      }
    })),
    fallback: true
  }
  
};

export const getStaticProps: GetStaticProps<PostProps> = async ({
  params, preview = false, previewData = {}
}) => {

  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  });

  if (!response) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  const previousResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['post.title'],
      after: response.id,
      orderings: '[document.first_publication_date desc]',
      pageSize: 1,
      ref: previewData?.ref ?? null,
    }
  );
  
  const nextResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['post.title'],
      after: response.id,
      orderings: '[document.first_publication_date]',
      pageSize: 1,
      ref: previewData?.ref ?? null,
    }
  );


  const post: Post = {
    uid: response.uid,
    data: {
      title: response.data.title,
      author: response.data.author,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content
    },
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date
  }

  const previousPost: Post = {
    uid: previousResponse.results[0].uid,
    data: {
      title: previousResponse.results[0].data.title,
    }
  }

  const nextPost: Post = {
    uid: previousResponse.results[0].uid,
    data: {
      title: previousResponse.results[0].data.title,
    }
  }

  return {
    props: {
      post,
      previousPost: previousResponse.results.length ? previousPost : null,
      nextPost: nextResponse.results.length ? nextPost : null,
      preview
    },
    revalidate: 60 * 5
  }
};
