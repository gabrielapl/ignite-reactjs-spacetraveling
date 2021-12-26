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

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle?: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
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
            <time><FiCalendar size="20" /> {format(new Date(post.first_publication_date),	"dd MMM yyyy", {
                locale: ptBR})}
            </time>
            <p><FiUser size="20" /> {post.data.author}</p>
            <time><FiClock size="20" /> {readingTime} min</time>
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

export const getStaticProps: GetStaticProps<PostProps> = async context => {

  const { slug } = context.params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

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
  }

  return {
    props: {
      post
    },
    revalidate: 60 * 5
  }
};
